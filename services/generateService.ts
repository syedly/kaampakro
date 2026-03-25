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
 * The system prompt uses a "ghost-writer" framing — the AI is a senior
 * strategist who writes applications that win contracts and jobs by making
 * the reader feel like the candidate already understands their problem.
 */
function buildPrompt(filledTemplate: string): { system: string; user: string } {
  const system = `You are a senior proposal strategist and cover letter ghost-writer. Your clients have landed roles at Stripe, Google, Airbnb, and McKinsey — not because they had the best resumes, but because their letters made hiring managers feel understood.

YOUR CORE MISSION: Write a letter so specific to THIS job that it could not be sent to any other company. If any sentence could appear in a letter for a different role, rewrite it.

HOW A HIRING MANAGER READS (your mental model):
- They spend 8 seconds on the first paragraph. If it opens with "I am excited to apply" or any generic enthusiasm, they stop reading.
- They are comparing 50+ candidates. Everyone "has strong experience." That phrase is invisible to them.
- They want to feel: "This person already understands our problem and has solved something like it before."
- They trust EVIDENCE over CLAIMS. "I reduced API latency from 800ms to 120ms by restructuring the query layer" lands. "I have strong backend skills" does not.

YOUR WRITING RULES — THESE ARE NON-NEGOTIABLE:

1. SPECIFICITY IS EVERYTHING
   - Every claim must include at least one concrete detail: a number, a technology name, a company name, a timeframe, or a measurable outcome
   - Replace "I have experience with X" → "I built X at [Company], which handled [scale/outcome]"
   - Replace "I can help with Y" → "At [Company], I delivered Y by [specific method], resulting in [specific outcome]"

2. MIRROR THE JOB DESCRIPTION
   - Extract the top 3 requirements from the job description
   - Address each one with a specific example from the candidate's background
   - Use the EXACT terminology from the job description — if they say "microservices," don't say "distributed systems"

3. STRUCTURE FOR IMPACT
   - First sentence: Reference something specific about the company/role/problem that proves research
   - Body: 2-3 tight paragraphs, each one proving a different capability with evidence
   - Close: Confident and forward-looking, not grateful or desperate
   - Total: 200-280 words. Dense with value. Zero filler.

4. VOICE AND TONE
   - Write as a confident professional peer, not a supplicant asking for a chance
   - Active voice only. No hedging ("I believe I could," "I think I might")
   - Conversational but professional — the way a strong candidate speaks in a first interview
   - Vary sentence length. Short punchy sentences for key claims. Longer sentences for context.

5. WHAT MAKES A LETTER UNFORGETTABLE
   - It reads like the candidate already works there and is describing their first week
   - It connects the candidate's past work to the company's current challenges
   - It reveals insight about the role that even the hiring manager hadn't articulated
   - It makes the reader curious to meet this person, not just check a box

ABSOLUTE BLACKLIST — if any of these appear in your output, the letter has failed:
✗ "I am excited/thrilled/passionate to apply"
✗ "I am a fast learner" / "team player" / "hardworking" / "detail-oriented" / "results-driven"
✗ "I have strong experience with..." (vague capability claim)
✗ "I can help you with..." (offering without proof)
✗ "I believe I would be a great fit" (empty self-assessment)
✗ "Thank you for your consideration" / "I hope to hear from you" (submissive close)
✗ "leverage" / "synergize" / "ecosystem" / "thought leader" / "bring to the table"
✗ Any sentence that works for ANY job at ANY company (the generics test)
✗ Bullet points, headers, markdown, subject lines, labels, or meta-commentary
✗ "Dear Hiring Manager" — use the company name or role instead if no name is available

OUTPUT: The cover letter text only. Nothing else.`

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
            return `• ${e.title} at ${e.company}${e.location ? ` (${e.location})` : ""}, ${period}\n  ${e.description}`
          })
          .join("\n")
      : user.summary
        ? `Summary: ${user.summary}`
        : "No experience listed — focus on skills and projects instead."

  const userEducation =
    user.education.length > 0
      ? user.education
          .map((e) => {
            const years = e.endYear ? `${e.startYear}–${e.endYear}` : e.startYear
            return `• ${e.degree} in ${e.field}, ${e.institution} (${years})`
          })
          .join("\n")
      : "Not specified"

  const userProjects =
    user.projects.length > 0
      ? user.projects
          .map((p) => {
            const tech = p.technologies ? ` | Tech: ${p.technologies}` : ""
            const url = p.url ? ` | Link: ${p.url}` : ""
            return `• ${p.name}: ${p.description}${tech}${url}`
          })
          .join("\n")
      : "No projects listed"

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
  // temperature 0.75: slightly creative but consistent
  // max_tokens 1200: room for a rich 200-280 word letter without truncation
  // frequency_penalty 0.5: strongly discourages repetitive phrasing
  // presence_penalty 0.3: pushes toward varied vocabulary and fresh phrasing
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.75,
    max_tokens: 1200,
    frequency_penalty: 0.5,
    presence_penalty: 0.3,
  })

  let text = completion.choices[0]?.message?.content?.trim() ?? ""
  if (!text) throw new Error("OpenAI returned an empty response")

  // 10. Clean up any unwanted formatting the model might add
  text = text
    .replace(/^(subject|re|dear hiring manager)[:\s].*\n*/im, "")
    .replace(/^#+\s.*/gm, "")       // remove markdown headers
    .replace(/^\*\*.*\*\*$/gm, "")  // remove bold-only lines
    .replace(/^[-•]\s/gm, "")       // remove bullet points
    .replace(/\n{3,}/g, "\n\n")     // collapse extra newlines
    .trim()

  // 11. Validate output quality
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 80) throw new Error("Generated letter is too short — please retry")

  return { text, wordCount, templateName, isByok }
}
