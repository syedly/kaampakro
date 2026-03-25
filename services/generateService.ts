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

type TemplateStyle = "creative" | "executive" | "technical" | "modern" | "custom"

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
    userHeadline: string
    userLinkedin: string
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
    .replace(/\{\{user_headline\}\}/g, sanitizeInput(data.userHeadline))
    .replace(/\{\{user_linkedin\}\}/g, sanitizeInput(data.userLinkedin))
    .replace(/\{\{company_name\}\}/g, sanitizeInput(data.companyName))
    .replace(/\{\{job_title\}\}/g, sanitizeInput(data.jobTitle))
    .replace(/\{\{job_description\}\}/g, sanitizeInput(data.jobDescription))
    .replace(/\{\{user_skills\}\}/g, sanitizeInput(data.userSkills))
    .replace(/\{\{user_experience\}\}/g, sanitizeInput(data.userExperience))
    .replace(/\{\{user_education\}\}/g, sanitizeInput(data.userEducation))
    .replace(/\{\{user_projects\}\}/g, sanitizeInput(data.userProjects))
}

function getTemplateStylePlaybook(templateStyle: TemplateStyle): string {
  switch (templateStyle) {
    case "technical":
      return `TECHNICAL PLAYBOOK:
- Sound like a senior engineer diagnosing a production system, not a freelancer pitching for access.
- Name the first risk, choke point, or audit path you would inspect.
- Prefer concrete technical opinions: RLS drift, auth gaps, queue backpressure, N+1 queries, cache invalidation, prompt injection surfaces, schema sprawl, or observability blind spots.
- Each bullet should combine a technical action, why it matters, and proof from the candidate's background.`
    case "executive":
      return `EXECUTIVE PLAYBOOK:
- Sound like an operator who sees where the business could stall, leak margin, or miss the next inflection point.
- Tie each point to priorities, sequencing, accountability, and measurable business impact.
- Avoid inspirational leadership language; write like a peer proposing a sharper operating plan.`
    case "creative":
      return `CREATIVE PLAYBOOK:
- Sound perceptive, commercially aware, and creatively opinionated.
- Open with an observation about audience tension, positioning, channel performance, or brand clarity.
- Each bullet should connect creative judgment to execution and measurable response.`
    case "modern":
    case "custom":
    default:
      return `MODERN PLAYBOOK:
- Sound like a high-agency operator who sees the work, the bottleneck, and the likely win condition quickly.
- Blend strategic judgment with tactical credibility.
- Each bullet should feel like: here is what I would attack first, why it matters, and why you can trust me to do it.`
  }
}

/**
 * Build the final system + user prompt.
 *
 * The system prompt uses a "ghost-writer" framing - the AI is a senior
 * strategist who writes applications that win contracts and jobs by making
 * the reader feel like the candidate already understands their problem.
 */
function buildPrompt(
  filledTemplate: string,
  allowStructuredProposal: boolean,
  templateStyle: TemplateStyle
): { system: string; user: string } {
  const system = `You are a senior proposal strategist and cover letter ghost-writer. Your clients have landed roles at Stripe, Google, Airbnb, and McKinsey - not because they had the best resumes, but because their letters made hiring managers feel understood.

YOUR CORE MISSION: Write a letter so specific to THIS job that it could not be sent to any other company. If any sentence could appear in a letter for a different role, rewrite it.

HOW A HIRING MANAGER READS (your mental model):
- They spend 8 seconds on the first paragraph. If it opens with generic enthusiasm, they stop reading.
- They are comparing 50+ candidates. Everyone "has strong experience." That phrase is invisible to them.
- They want to feel: "This person already understands our problem and has solved something like it before."
- They trust EVIDENCE over CLAIMS. "I reduced API latency from 800ms to 120ms by restructuring the query layer" lands. "I have strong backend skills" does not.

YOUR WRITING RULES - THESE ARE NON-NEGOTIABLE:

1. SPECIFICITY IS EVERYTHING
   - Every claim must include at least one concrete detail: a number, a technology name, a company name, a timeframe, or a measurable outcome.
   - Replace "I have experience with X" -> "I built X at [Company], which handled [scale/outcome]".
   - Replace "I can help with Y" -> "At [Company], I delivered Y by [specific method], resulting in [specific outcome]".

2. MIRROR THE JOB DESCRIPTION
   - Extract the top 3 requirements from the job description.
   - Address each one with a specific example from the candidate's background.
   - Use the exact terminology from the job description. If they say "microservices," do not say "distributed systems".

3. STRUCTURE FOR IMPACT
   - The first meaningful lines must carry diagnosis, not admiration.
   - The body must prove capability with evidence, not resume narration.
   - The close must feel confident and forward-moving, never grateful or needy.
   - Dense with value. Zero filler.

4. VOICE AND TONE
   - Write as a confident professional peer, not a supplicant asking for a chance.
   - Active voice only. No hedging like "I believe I could" or "I think I might".
   - Conversational but professional.
   - Sound human, sharp, and slightly opinionated. Never sound like a polite AI summary.

5. THE HYBRID CONSULTANT
   - Write as a high-value consultant, not an applicant.
   - Identify a likely bottleneck, trade-off, or pressure point in the brief and tie it to something the candidate has already solved.
   - Beat the average freelancer proposal by leading with diagnosis, proof, and point of view instead of availability, enthusiasm, or process filler.

6. TEMPLATE OVERRIDES
   - Follow the provided template structure exactly when it explicitly requires a greeting, bullet list, sign-off, or proof section.
   - When the template specifies a different structure, formatting style, or word count, the template-specific instruction overrides the generic default.
   - For any structured proposal template, the first non-empty line must be a greeting starting with "Hello" or "Hi".
   - When writing a structured proposal, use this exact flow: greeting -> 2-3 sentence hook -> 3-5 proof bullets -> 2-4 clarifying question bullets -> concise confident close -> sign-off -> ASCII separator -> RELATED PROJECTS.
   - The hook must do 3 jobs quickly: diagnose the pressure point, state a point of view, and bridge to relevant proof.
   - Every major bullet should combine what you would attack, why it matters, and what prior proof makes the claim believable.
   - Questions must be high-leverage. Ask only what would materially change the plan or priority order.
   - The RELATED PROJECTS section must be the final section and must list at least 2 relevant projects, each with a one-line proof statement and a "Relevant Skills:" phrase.
   - When the template asks for related projects, pull them only from the candidate's provided experience and projects data. Do not invent project names, metrics, or technologies.

7. NO PROPOSAL FILLER
   - Do NOT write like a freelancer pitch deck, agency proposal, or canned Upwork note.
   - No "I reviewed your project", no availability/process notes, no pricing language, and no invented portfolio appendix.
   - Never ask administrative questions about cadence, tooling, budget, or communication style unless the template explicitly requires it.
   - Ban these lazy transitions unless the brief makes them unavoidable: "The challenge of...", "This experience positions me...", "Below are my insights...", "To move forward...", "I am ready to commence...", "My track record...", "directly applicable", "well-positioned to", "robust solution", "significant challenge".

8. DIAGNOSTIC SHARPNESS
   - Make at least one non-obvious inference from the job description about where the system, team, funnel, or operation is likely to break, slow down, or become unsafe.
   - Name the first thing you would inspect, redesign, stabilize, or sharpen, and tie it to a concrete outcome from the candidate's background.
   - Prefer a precise opinion over a generic checklist.

9. WHAT MAKES A LETTER UNFORGETTABLE
   - It reads like the candidate already works there and is describing the first week of attack.
   - It connects the candidate's past work to the company's current pressure points.
   - It reveals insight about the role, not just eligibility for it.
   - It makes the reader curious to meet this person, not just check a box.

ABSOLUTE BLACKLIST - if any of these appear in your output, the letter has failed:
X "I am excited/thrilled/passionate to apply"
X "I am a fast learner" / "team player" / "hardworking" / "detail-oriented" / "results-driven"
X "I have strong experience with..." (vague capability claim)
X "I can help you with..." (offering without proof)
X "I believe I would be a great fit" (empty self-assessment)
X "Thank you for your consideration" / "I hope to hear from you" (submissive close)
X "leverage" / "synergize" / "ecosystem" / "thought leader" / "bring to the table"
X Any sentence that works for any job at any company
X Subject lines or meta-commentary
X "Dear Hiring Manager" - use the company name or role instead if no name is available
X Invented claims about reviewing a codebase, audit, or architecture that are not supported by the candidate data and job description
X "fixed-price" / "monthly retainer" / "Upwork messages" / "schedule a chat"
X Any invented project, metric, technology, client, or employer not present in the candidate data
X "The challenge of..." / "This experience positions me..." / "Below are my insights..." / "To move forward..." / "I am ready to commence..."
${allowStructuredProposal
    ? `X Missing greeting, missing hook, fewer than 3 bullet points, or missing RELATED PROJECTS section
X RELATED PROJECTS appearing anywhere except the end of the proposal
X Fewer than 2 project examples or missing "Relevant Skills:" in the related projects proof block
X A first paragraph that reads like a generic application instead of a sharp hook`
    : ""}
${allowStructuredProposal
    ? `X More than 4 clarifying questions`
    : `X Bullet points, headers, markdown, greeting lines, sign-off blocks, website URLs, or "Related Projects" sections`}

STYLE-SPECIFIC PLAYBOOK:
${getTemplateStylePlaybook(templateStyle)}

OUTPUT: The cover letter text only. Nothing else.`

  return { system, user: filledTemplate }
}

function isStructuredProposalTemplate(templateText: string): boolean {
  return /GREETING:|HOOK:|IMPACT HOOK:|PROOF PLAN:|STRATEGIC PLAN:|PHASED APPROACH:|CREATIVE GAME PLAN:|CLARIFYING QUESTIONS:|SIGN-OFF:|RELATED PROJECTS|proposal format|OUTPUT CONTRACT/i.test(
    templateText
  )
}

function getDraftQualityIssues(
  text: string,
  allowStructuredProposal: boolean,
  templateStyle: TemplateStyle
): string[] {
  const issues: string[] = []
  const normalized = text.trim()
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const firstLine = lines[0] || ""
  const bulletCount = (normalized.match(/^\s*[-*]\s/mg) || []).length
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
  const relatedProjectsIndex = lines.findIndex((line) => /related projects/i.test(line))
  const relatedProjectLines =
    relatedProjectsIndex >= 0
      ? lines
          .slice(relatedProjectsIndex + 1)
          .filter((line) => !/^[-=]{3,}$/.test(line))
      : []
  const relatedProjectBullets = relatedProjectLines.filter((line) => /^[-*]\s/.test(line))
  const relevantSkillsCount = relatedProjectLines.filter((line) => /relevant skills:/i.test(line)).length
  const fillerPattern =
    /\b(the challenge of|this experience positions me|below are my insights|to move forward|i am ready to commence|my track record|directly applicable|well-positioned to|robust solution|significant challenge)\b/i
  const diagnosticPattern =
    templateStyle === "creative"
      ? /\b(audience|brand|positioning|campaign|channel|conversion|message|creative|content|funnel|retention)\b/i
      : templateStyle === "executive"
        ? /\b(priority|margin|revenue|ownership|execution|operating|roadmap|risk|retention|growth|org)\b/i
        : /\b(risk|bottleneck|latency|audit|auth|security|reliability|performance|schema|cache|queue|prompt injection|observability)\b/i

  if (allowStructuredProposal && !/^(hello|hi)\b/i.test(firstLine)) {
    issues.push("must start with a proposal greeting like Hello or Hi")
  }

  if (!allowStructuredProposal && /^(hello|hi|greetings|dear)\b/i.test(normalized)) {
    issues.push("opens like an email or generic proposal")
  }

  if (allowStructuredProposal && !/^\s*[-*]\s/m.test(normalized)) {
    issues.push("must include a bullet-based proposal plan")
  }

  if (allowStructuredProposal && bulletCount < 3) {
    issues.push("must include at least 3 bullet points across the plan and question sections")
  }

  if (allowStructuredProposal && bulletCount > 9) {
    issues.push("uses too many bullets and loses punch")
  }

  if (!allowStructuredProposal && /^\s*[-*]\s/m.test(normalized)) {
    issues.push("contains bullet points instead of tight prose")
  }

  if (/portfolio|schedule a chat|upwork|fixed-price|monthly retainer/i.test(normalized)) {
    issues.push("contains freelancer proposal filler instead of diagnostic writing")
  }

  if (allowStructuredProposal && fillerPattern.test(normalized)) {
    issues.push("contains padded AI-style transition phrases instead of sharp proposal language")
  }

  if (allowStructuredProposal && !diagnosticPattern.test(normalized)) {
    issues.push("must name a concrete bottleneck, risk, priority, or market pressure point")
  }

  if (allowStructuredProposal && !/related projects/i.test(normalized)) {
    issues.push("must include a RELATED PROJECTS section at the end")
  }

  if (
    allowStructuredProposal &&
    relatedProjectsIndex >= 0 &&
    lines.slice(relatedProjectsIndex + 1).some((line) => /^(hello|hi)\b/i.test(line))
  ) {
    issues.push("RELATED PROJECTS must be the final section")
  }

  if (!allowStructuredProposal && /related projects|relevant skills/i.test(normalized)) {
    issues.push("contains a structured proof section the current template did not request")
  }

  if (allowStructuredProposal && !/relevant skills:/i.test(normalized)) {
    issues.push("related projects section must include Relevant Skills lines")
  }

  if (allowStructuredProposal && relatedProjectsIndex >= 0 && relatedProjectBullets.length < 2) {
    issues.push("RELATED PROJECTS must include at least 2 bullet-based project examples")
  }

  if (allowStructuredProposal && relatedProjectsIndex >= 0 && relevantSkillsCount < 2) {
    issues.push("RELATED PROJECTS must include Relevant Skills for each project")
  }

  if (allowStructuredProposal && blocks.length < 4) {
    issues.push("must include separate greeting, hook, body, and closing blocks")
  }

  if (!allowStructuredProposal && /https?:\/\/|www\./i.test(normalized)) {
    issues.push("contains links or portfolio-style add-ons")
  }

  if (!allowStructuredProposal && /below are my insights|to move forward|clarifying questions/i.test(normalized)) {
    issues.push("uses framing language instead of getting straight to the point")
  }

  const questionCount = (normalized.match(/\?/g) || []).length
  if (allowStructuredProposal && questionCount < 2) {
    issues.push("must include consultant-style clarifying questions")
  }

  if ((!allowStructuredProposal && questionCount > 2) || (allowStructuredProposal && questionCount > 4)) {
    issues.push("asks too many questions")
  }

  if (/\b(i am confident i can|i would be happy to|if you'd like to discuss)\b/i.test(normalized)) {
    issues.push("sounds like a generic service pitch")
  }

  if (!allowStructuredProposal && /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\s*$/m.test(normalized.split("\n").slice(-1)[0] ?? "")) {
    issues.push("ends with a signature block")
  }

  if (allowStructuredProposal && !/\n[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s*\n[^\n]{2,}/m.test(`\n${normalized}`)) {
    issues.push("must include a name/title sign-off")
  }

  return issues
}

async function reviseDraftIfNeeded(args: {
  client: ReturnType<typeof getLlmClient>["client"]
  model: string
  system: string
  filledTemplate: string
  draft: string
  allowStructuredProposal: boolean
  templateStyle: TemplateStyle
}): Promise<string> {
  let draft = args.draft

  for (let attempt = 0; attempt < 2; attempt++) {
    const issues = getDraftQualityIssues(
      draft,
      args.allowStructuredProposal,
      args.templateStyle
    )
    if (issues.length === 0) return draft

    const revisionSystem = `${args.system}

You are revising a weak draft into a sharper final version.
Repair every issue listed by the user.
Keep only verifiable facts from the candidate data and job description.
Cut any sentence that sounds padded, obvious, or AI-generated.
${args.allowStructuredProposal
    ? `Preserve the requested structured proposal format, including the greeting, hook, bullet plan, clarifying questions, sign-off, and related projects section. The first line must begin with Hello or Hi. The final section must be RELATED PROJECTS, introduced by an ASCII separator.`
    : `Return plain prose only. No greeting. No signature. No links. No bullets.`}`

    const revisionUser = `The draft below is too close to a generic proposal.

Issues to fix:
${issues.map((issue) => `- ${issue}`).join("\n")}

Original source context:
${args.filledTemplate}

Draft to rewrite:
${draft}

Rewrite it into a more authoritative, diagnostic, technically sharp response. Keep it concise, specific, and evidence-heavy.`

    const revision = await args.client.chat.completions.create({
      model: args.model,
      messages: [
        { role: "system", content: revisionSystem },
        { role: "user", content: revisionUser },
      ],
      temperature: 0.55,
      max_tokens: 1200,
      frequency_penalty: 0.4,
      presence_penalty: 0.2,
    })

    draft = revision.choices[0]?.message?.content?.trim() || draft
  }

  return draft
}

async function elevateDraftToTopTier(args: {
  client: ReturnType<typeof getLlmClient>["client"]
  model: string
  system: string
  filledTemplate: string
  draft: string
  allowStructuredProposal: boolean
  templateStyle: TemplateStyle
}): Promise<string> {
  if (!args.allowStructuredProposal) return args.draft

  const polishSystem = `${args.system}

You are performing a final elevation pass.
This is not a repair pass. This is a make-it-obviously-better-than-average pass.
Keep every fact truthful to the source context, but rewrite for sharper judgment, stronger rhythm, and more persuasive specificity.

TOP-TIER PROPOSAL STANDARD:
- The opening after the greeting must diagnose the pressure point immediately.
- Replace generic framing with a point of view.
- Each bullet should pull double duty: show what the candidate would do and why the candidate is believable.
- Cut resume narration, throat-clearing, and self-congratulation.
- Prefer crisp, high-signal sentences over polite filler.
- Keep questions lean and high-leverage.
- Make RELATED PROJECTS feel like proof, not a portfolio appendix.

DO NOT introduce any new employer, project, metric, tool, or claim that is not already supported by the source context.

STYLE-SPECIFIC PLAYBOOK:
${getTemplateStylePlaybook(args.templateStyle)}`

  const polishUser = `Source context:
${args.filledTemplate}

Current draft:
${args.draft}

Rewrite this into a more elite final proposal. It should clearly outperform a typical AI-generated or freelancer-style response while preserving the same factual boundaries and overall structure.`

  const polished = await args.client.chat.completions.create({
    model: args.model,
    messages: [
      { role: "system", content: polishSystem },
      { role: "user", content: polishUser },
    ],
    temperature: 0.45,
    max_tokens: 1200,
    frequency_penalty: 0.45,
    presence_penalty: 0.15,
  })

  return polished.choices[0]?.message?.content?.trim() || args.draft
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

export async function generateCoverLetter(input: GenerateInput): Promise<GenerateResult> {
  const { userId, jobTitle, jobDescription, templateId, modelChoice } = input

  // 1. Load full user profile
  const user = await User.findById(userId).select(
    "name linkedin skills experience education projects summary apiKey"
  )
  if (!user) throw new Error("User not found")

  // 2. Determine client + BYOK status
  const { client, isByok } = getLlmClient(user)

  // 3. Resolve and validate model choice
  const model = modelChoice?.trim() || DEFAULT_MODEL
  validateModelChoice(model, isByok)

  // 4. Extract company name from job title (e.g. "Engineer at Stripe" -> "Stripe")
  const companyMatch = jobTitle.match(/\bat\s+(.+)$/i)
  const companyName = companyMatch ? companyMatch[1].trim() : ""
  const cleanJobTitle = companyName
    ? jobTitle.replace(/\bat\s+.+$/i, "").trim()
    : jobTitle

  // 5. Build rich profile context
  const userName = user.name || "the candidate"
  const userHeadline =
    user.experience[0]?.title ||
    cleanJobTitle ||
    "Technical Consultant"
  const userLinkedin = user.linkedin || ""

  const userSkills =
    user.skills.length > 0
      ? user.skills.join(", ")
      : ""

  const userExperience =
    user.experience.length > 0
      ? user.experience
          .map((e) => {
            const period = `${e.startDate}-${e.endDate || "Present"}`
            return `- ${e.title} at ${e.company}${e.location ? ` (${e.location})` : ""}, ${period}\n  ${e.description}`
          })
          .join("\n")
      : user.summary
        ? `Summary: ${user.summary}`
        : "No experience listed - focus on skills and projects instead."

  const userEducation =
    user.education.length > 0
      ? user.education
          .map((e) => {
            const years = e.endYear ? `${e.startYear}-${e.endYear}` : e.startYear
            return `- ${e.degree} in ${e.field}, ${e.institution} (${years})`
          })
          .join("\n")
      : "Not specified"

  const userProjects =
    user.projects.length > 0
      ? user.projects
          .map((p) => {
            const tech = p.technologies ? ` | Tech: ${p.technologies}` : ""
            return `- ${p.name}: ${p.description}${tech}`
          })
          .join("\n")
      : "No projects listed"

  // 6. Resolve template
  let template = null
  let templateName = "Modern"
  let templateStyle: TemplateStyle = "modern"

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
  templateStyle = (template.style || "custom") as TemplateStyle

  // 7. Fill template placeholders (all values sanitized inside fillTemplate)
  const filledTemplate = fillTemplate(template.content, {
    userName,
    userHeadline,
    userLinkedin,
    companyName: companyName || "the company",
    jobTitle: cleanJobTitle,
    jobDescription,
    userSkills,
    userExperience,
    userEducation,
    userProjects,
  })
  const allowStructuredProposal = isStructuredProposalTemplate(template.content)

  // 8. Build final prompt
  const { system, user: userPrompt } = buildPrompt(
    filledTemplate,
    allowStructuredProposal,
    templateStyle
  )

  // 9. Call OpenAI
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.72,
    max_tokens: 1200,
    frequency_penalty: 0.55,
    presence_penalty: 0.25,
  })

  let text = completion.choices[0]?.message?.content?.trim() ?? ""
  if (!text) throw new Error("OpenAI returned an empty response")

  text = await reviseDraftIfNeeded({
    client,
    model,
    system,
    filledTemplate,
    draft: text,
    allowStructuredProposal,
    templateStyle,
  })

  text = await elevateDraftToTopTier({
    client,
    model,
    system,
    filledTemplate,
    draft: text,
    allowStructuredProposal,
    templateStyle,
  })

  // 10. Clean up any unwanted formatting the model might add
  text = text
    .replace(/^(subject|re|dear hiring manager)[:\s].*\n*/im, "")
    .replace(/^#+\s.*/gm, "")
    .replace(/^\*\*.*\*\*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  if (!allowStructuredProposal) {
    text = text
      .replace(/^(hello|hi|greetings)[:,\s].*\n*/im, "")
      .replace(/^(?:[-*]|•)\s/gm, "")
      .replace(/^related projects.*$/gim, "")
      .replace(/^relevant skills.*$/gim, "")
      .replace(/^https?:\/\/\S+$/gim, "")
      .trim()
  }

  // 11. Validate output quality
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount < 80) throw new Error("Generated letter is too short - please retry")

  return { text, wordCount, templateName, isByok }
}
