import { getOpenAIClient } from "@/lib/openai"
import Template from "@/models/Template"
import User from "@/models/User"
import { Types } from "mongoose"

interface GenerateInput {
  userId: string
  jobTitle: string
  jobDescription: string
  templateId?: string
  apiKey: string
}

interface GenerateResult {
  text: string
  wordCount: number
  templateName: string
}

/**
 * Fill template placeholders with user and job data.
 */
function fillTemplate(
  templateContent: string,
  data: {
    userName: string
    jobTitle: string
    jobDescription: string
    userSkills: string
    userExperience: string
  }
): string {
  return templateContent
    .replace(/\{\{user_name\}\}/g, data.userName)
    .replace(/\{\{job_title\}\}/g, data.jobTitle)
    .replace(/\{\{job_description\}\}/g, data.jobDescription)
    .replace(/\{\{user_skills\}\}/g, data.userSkills)
    .replace(/\{\{user_experience\}\}/g, data.userExperience)
}

/**
 * Build the final system + user prompt from the template.
 */
function buildPrompt(filledTemplate: string): { system: string; user: string } {
  return {
    system:
      "You are an elite career strategist and award-winning copywriter. " +
      "Your cover letters are concise, high-conversion, and deeply personalized. " +
      "You never use generic phrases. You write for humans, not ATS bots. " +
      "Output only the cover letter text — no labels, no markdown, no explanations.",
    user: filledTemplate,
  }
}

/**
 * Core cover letter generation function.
 */
export async function generateCoverLetter(input: GenerateInput): Promise<GenerateResult> {
  const { userId, jobTitle, jobDescription, templateId, apiKey } = input

  // 1. Load user profile
  const user = await User.findById(userId).select(
    "name skills experience education projects summary"
  )
  if (!user) throw new Error("User not found")

  const userName = user.name || "the candidate"

  const userSkills =
    user.skills.length > 0
      ? user.skills.join(", ")
      : "See experience below"

  const userExperience =
    user.experience.length > 0
      ? user.experience
          .map(
            (e) =>
              `${e.title} at ${e.company} (${e.startDate}–${e.endDate}): ${e.description}`
          )
          .join("\n")
      : user.summary || "Experienced professional"

  // 2. Resolve template
  let template = null
  let templateName = "Modern"

  if (templateId && Types.ObjectId.isValid(templateId)) {
    template = await Template.findOne({
      _id: templateId,
      $or: [{ isDefault: true }, { userId }],
    })
  }

  if (!template) {
    // Fall back to default "Modern" template
    template = await Template.findOne({ isDefault: true, style: "modern" })
  }

  if (!template) throw new Error("No template found")
  templateName = template.name

  // 3. Fill template placeholders
  const filledTemplate = fillTemplate(template.content, {
    userName,
    jobTitle,
    jobDescription,
    userSkills,
    userExperience,
  })

  // 4. Build prompt and call OpenAI
  const { system, user: userPrompt } = buildPrompt(filledTemplate)
  const client = getOpenAIClient(apiKey)

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.75,
    max_tokens: 600,
  })

  const text = completion.choices[0]?.message?.content?.trim() ?? ""
  if (!text) throw new Error("OpenAI returned empty response")

  // 5. Validate output quality
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 80) throw new Error("Generated letter is too short — please retry")

  return { text, wordCount, templateName }
}
