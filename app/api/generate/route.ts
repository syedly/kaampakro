import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { badRequest, getUserId, sanitize, serverError, unauthorized } from "@/lib/apiHelpers"
import { generateCoverLetter } from "@/services/generateService"
import { checkUsageLimit, incrementUsage, resolveApiKey } from "@/services/usageService"
import CoverLetter from "@/models/CoverLetter"
import Template from "@/models/Template"

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    const body = await req.json()
    const jobTitle: string = sanitize(body.jobTitle ?? "")
    const jobDescription: string = sanitize(body.jobDescription ?? "")
    const templateId: string | undefined = body.templateId
    const saveDraft: boolean = body.saveDraft ?? false

    // Validate required fields
    if (!jobTitle) return badRequest("Job title is required")
    if (!jobDescription || jobDescription.length < 20)
      return badRequest("Job description must be at least 20 characters")

    await connectDB()

    // Seed default templates if none exist
    const templateCount = await Template.countDocuments({ isDefault: true })
    if (templateCount === 0) {
      // @ts-expect-error statics
      await Template.seedDefaults()
    }

    // Check usage limit
    const usage = await checkUsageLimit(userId)
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Monthly generation limit reached. Add your own OpenAI API key for unlimited usage.",
          usageCount: usage.usageCount,
          remaining: 0,
        },
        { status: 429 }
      )
    }

    // Resolve which API key to use
    const apiKey = await resolveApiKey(userId)

    // Generate the cover letter
    const result = await generateCoverLetter({
      userId,
      jobTitle,
      jobDescription,
      templateId,
      apiKey,
    })

    // Count only platform-key generations toward the monthly limit
    await incrementUsage(userId)

    // Extract company from job title if provided as "Role at Company"
    const companyMatch = jobTitle.match(/\bat\s+(.+)$/i)
    const company = companyMatch ? companyMatch[1].trim() : undefined
    const cleanTitle = company ? jobTitle.replace(/\bat\s+.+$/i, "").trim() : jobTitle

    // Save to DB
    const letter = await CoverLetter.create({
      userId,
      title: cleanTitle,
      company,
      jobDescription,
      generatedText: result.text,
      templateId: templateId ?? null,
      templateName: result.templateName,
      isDraft: saveDraft,
      wordCount: result.wordCount,
    })

    return NextResponse.json({
      success: true,
      letter: {
        id: letter._id,
        title: letter.title,
        company: letter.company,
        generatedText: letter.generatedText,
        wordCount: letter.wordCount,
        templateName: letter.templateName,
        isDraft: letter.isDraft,
        createdAt: letter.createdAt,
      },
      usage: {
        usageCount: usage.unlimited ? usage.usageCount : usage.usageCount + 1,
        remaining: usage.unlimited ? null : Math.max(0, usage.remaining - 1),
        unlimited: usage.unlimited,
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
