import { getLlmClient, validateModelChoice } from "@/lib/openai"
import Template from "@/models/Template"
import User from "@/models/User"
import { Types } from "mongoose"

/** Default model used when the caller does not specify one. */
const DEFAULT_MODEL = "gpt-4o"

interface GenerateInput {
  userId: string
  jobTitle: string
  jobDescription: string
  templateId?: string
  modelChoice?: string
}

interface GenerateResult {
  text: string
  wordCount: number
  templateName: string
  isByok: boolean
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

function sanitizeInput(value: string): string {
  return value
    .replace(/\0/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/ignore\s+(all\s+)?previous\s+instructions?/gi, "[removed]")
    .replace(/forget\s+(all\s+)?previous\s+instructions?/gi, "[removed]")
    .replace(/you\s+are\s+now\s+/gi, "[removed] ")
    .replace(/act\s+as\s+(a\s+)?(?:different|new|another)/gi, "[removed]")
    .replace(/system\s*:\s*/gi, "")
    .replace(/\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>/gi, "")
    .trim()
}

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

function fillTemplate(
  templateContent: string,
  data: {
    userName: string
    companyName: string
    jobTitle: string
    jobDescription: string
    userSkills: string
    userExperience: string
    userEducation: string
    userProjects: string
  }
): string {
  return templateContent
    .replace(/\{\{user_name\}\}/g, sanitizeInput(data.userName))
    .replace(/\{\{company_name\}\}/g, sanitizeInput(data.companyName))
    .replace(/\{\{job_title\}\}/g, sanitizeInput(data.jobTitle))
    .replace(/\{\{job_description\}\}/g, sanitizeInput(data.jobDescription))
    .replace(/\{\{user_skills\}\}/g, sanitizeInput(data.userSkills))
    .replace(/\{\{user_experience\}\}/g, sanitizeInput(data.userExperience))
    .replace(/\{\{user_education\}\}/g, sanitizeInput(data.userEducation))
    .replace(/\{\{user_projects\}\}/g, sanitizeInput(data.userProjects))
}

/**
 * Build the final system + user prompt.
 *
 * The system prompt is engineered to make the AI write from the reader's
 * perspective — a time-pressed hiring manager who has already read 200 letters.
 */
function buildPrompt(filledTemplate: string): { system: string; user: string } {
  const system = `You are a world-class cover letter writer with 20 years of experience placing candidates at Google, McKinsey, Stripe, and Y Combinator-backed startups.

Your mental model while writing: The hiring manager reading this letter is time-pressed, skeptical, and has already rejected 200 generic letters today. They are scanning for three things in the first 10 seconds:
1. Does this person understand exactly what we need?
2. Have they actually done this before?
3. Do they communicate clearly?

Your writing principles:
- Every sentence must pass the "so what?" test — if it doesn't prove value, cut it
- SHOW don't TELL: "increased pipeline by 40%" beats "results-driven professional"
- Mirror the exact language and keywords from the job description
- The hook (first sentence) must be specific to this company or role — never generic enthusiasm
- Write in a confident, direct voice — not desperate, not arrogant
- The letter adds context the resume cannot — it is NOT a summary of the resume
- Active voice throughout. Short sentences when making key points.
- Output ONLY the cover letter text. No subject line, no labels, no markdown, no explanations.`

  return { system, user: filledTemplate }
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

export async function generateCoverLetter(input: GenerateInput): Promise<GenerateResult> {
  const { userId, jobTitle, jobDescription, templateId, modelChoice } = input

  // 1. Load full user profile
  const user = await User.findById(userId).select(
    "name skills experience education projects summary apiKey"
  )
  if (!user) throw new Error("User not found")

  // 2. Determine client + BYOK status
  const { client, isByok } = getLlmClient(user)

  // 3. Resolve and validate model choice
  const model = modelChoice?.trim() || DEFAULT_MODEL
  validateModelChoice(model, isByok)

  // 4. Extract company name from job title (e.g. "Engineer at Stripe" → "Stripe")
  const companyMatch = jobTitle.match(/\bat\s+(.+)$/i)
  const companyName = companyMatch ? companyMatch[1].trim() : ""
  const cleanJobTitle = companyName
    ? jobTitle.replace(/\bat\s+.+$/i, "").trim()
    : jobTitle

  // 5. Build rich profile context
  const userName = user.name || "the candidate"

  const userSkills =
    user.skills.length > 0
      ? user.skills.join(", ")
      : ""

  const userExperience =
    user.experience.length > 0
      ? user.experience
          .map((e) => {
            const period = `${e.startDate}–${e.endDate || "Present"}`
            return `${e.title} at ${e.company}${e.location ? `, ${e.location}` : ""} (${period})\n  ${e.description}`
          })
          .join("\n\n")
      : user.summary || ""

  const userEducation =
    user.education.length > 0
      ? user.education
          .map((e) => {
            const years = e.endYear ? `${e.startYear}–${e.endYear}` : e.startYear
            return `${e.degree} in ${e.field}, ${e.institution} (${years})`
          })
          .join("\n")
      : ""

  const userProjects =
    user.projects.length > 0
      ? user.projects
          .map((p) => {
            const tech = p.technologies ? ` [${p.technologies}]` : ""
            const url = p.url ? ` — ${p.url}` : ""
            return `${p.name}${tech}: ${p.description}${url}`
          })
          .join("\n")
      : ""

  // 6. Resolve template
  let template = null
  let templateName = "Modern"

  if (templateId && Types.ObjectId.isValid(templateId)) {
    template = await Template.findOne({
      _id: templateId,
      $or: [{ isDefault: true }, { userId }],
    })
  }

  if (!template) {
    template = await Template.findOne({ isDefault: true, style: "modern" })
  }

  if (!template) throw new Error("No template found")
  templateName = template.name

  // 7. Fill template placeholders (all values sanitized inside fillTemplate)
  const filledTemplate = fillTemplate(template.content, {
    userName,
    companyName: companyName || "the company",
    jobTitle: cleanJobTitle,
    jobDescription,
    userSkills,
    userExperience,
    userEducation,
    userProjects,
  })

  // 8. Build final prompt
  const { system, user: userPrompt } = buildPrompt(filledTemplate)

  // 9. Call OpenAI
  // temperature 0.7: consistent quality without being robotic
  // max_tokens 900: enough room for a rich 200-250 word letter
  // frequency_penalty 0.4: discourages repetitive phrasing
  // presence_penalty 0.2: nudges toward varied vocabulary
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 900,
    frequency_penalty: 0.4,
    presence_penalty: 0.2,
  })

  const text = completion.choices[0]?.message?.content?.trim() ?? ""
  if (!text) throw new Error("OpenAI returned an empty response")

  // 10. Validate output quality
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 80) throw new Error("Generated letter is too short — please retry")

  return { text, wordCount, templateName, isByok }
}
