import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { badRequest, getUserId, sanitize, serverError, unauthorized } from "@/lib/apiHelpers"
import { generateCoverLetter } from "@/services/generateService"
import { checkUsageLimit, incrementUsage, resetMonthlyLimits } from "@/services/usageService"
import { ALL_ALLOWED_MODELS } from "@/lib/openai"
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
    const modelChoice: string = (body.modelChoice ?? "gpt-4o").toString().trim()

    // Validate required fields
    if (!jobTitle) return badRequest("Job title is required")
    if (!jobDescription || jobDescription.length < 20)
      return badRequest("Job description must be at least 20 characters")

    // Validate model name is known before hitting the DB
    if (!ALL_ALLOWED_MODELS.has(modelChoice)) {
      return badRequest(
        `Unknown model "${modelChoice}". Allowed: ${[...ALL_ALLOWED_MODELS].join(", ")}`
      )
    }

    await connectDB()

    // Seed default templates if none exist
    const templateCount = await Template.countDocuments({ isDefault: true })
    if (templateCount === 0) {
      // @ts-expect-error statics
      await Template.seedDefaults()
    }

    // Run the 1st-of-month reset for this user (no-op on any other day)
    await resetMonthlyLimits(userId)

    // Check usage limit (also performs lazy calendar-month reset as a fallback)
    const usage = await checkUsageLimit(userId)

    // Quota exhausted — only applies to platform-key (non-BYOK) users
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error:
            "Monthly generation limit reached. Add your own OpenAI API key for unlimited usage.",
          usageCount: usage.usageCount,
          remaining: 0,
          unlimited: false,
        },
        { status: 429 }
      )
    }

    // Generate the cover letter.
    // generateCoverLetter internally calls getLlmClient(user) and validateModelChoice,
    // so BYOK / model-compatibility errors surface here as thrown exceptions.
    const result = await generateCoverLetter({
      userId,
      jobTitle,
      jobDescription,
      templateId,
      modelChoice,
    })

    // isByok comes directly from generateCoverLetter — authoritative source of truth.
    const isByok = result.isByok

    // Increment platform-key quota only; BYOK users are skipped inside incrementUsage.
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

    // BUG FIX: usageCount in the response must NOT reflect an increment for BYOK users.
    // - isByok = true  → usageCount stays at its current value (no quota consumed)
    // - isByok = false → usageCount + 1 (optimistic update mirroring the DB increment)
    const responseUsageCount = isByok ? usage.usageCount : usage.usageCount + 1
    const responseRemaining = isByok ? null : Math.max(0, usage.remaining - 1)

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
        usageCount: responseUsageCount,
        remaining: responseRemaining,
        unlimited: isByok,
      },
    })
  } catch (err) {
    return serverError(err)
  }
}
