import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ITemplate extends Document {
  userId: Types.ObjectId | null
  name: string
  description?: string
  content: string
  isDefault: boolean
  style: "creative" | "executive" | "technical" | "modern" | "custom"
  createdAt: Date
  updatedAt: Date
}

const TemplateSchema = new Schema<ITemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    content: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    style: {
      type: String,
      enum: ["creative", "executive", "technical", "modern", "custom"],
      default: "custom",
    },
  },
  { timestamps: true }
)

// Seed (or update) default templates using upsert so existing databases
// always receive the latest prompt improvements.
TemplateSchema.statics.seedDefaults = async function () {
  const defaults = [
    {
      name: "Modern",
      description: "Polished consultant-style proposal for product, startup, and modern tech roles",
      style: "modern",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

=== JOB DESCRIPTION ===
{{job_description}}

=== CANDIDATE DATA ===
Name: {{user_name}}
Headline: {{user_headline}}
LinkedIn: {{user_linkedin}}
{{user_experience}}
{{user_projects}}
{{user_skills}}

=== YOUR TASK ===
Write an award-winning modern proposal. It should read like a sharp operator already thinking in execution terms, not like a generic applicant.

OUTPUT CONTRACT:
1. GREETING: The first non-empty line must be exactly "Hello," or "Hi {{company_name}} team,".
2. HOOK: Write 2-3 sharp sentences that open on the company's likely challenge, market moment, or execution bottleneck, then connect that to the candidate's strongest matching result.
3. EXECUTION PLAN: Write 3-4 bullet points using "- ". Each bullet must sound like a proof-backed action plan tied to real outcomes from the candidate data.
4. CLARIFYING QUESTIONS: Write 2-3 smart bullet questions using "- " that show product, ownership, and delivery awareness.
5. CLOSE: Write 1-2 confident lines that move naturally toward next steps.
6. SIGN-OFF: After the close, end with:
{{user_name}}
{{user_headline}}
{{user_linkedin}}

--------------------
RELATED PROJECTS
--------------------
List 2-3 relevant projects pulled only from {{user_projects}} or {{user_experience}}.
Each project must be one bullet in this exact style:
- Project name - one-line proof with technology, scope, or measurable result. Relevant Skills: keyword, keyword, keyword

STYLE RULES:
- Proposal format only, never essay format
- Start with a greeting and a hook before the bullets
- Use bullet points in both the execution plan and clarifying questions
- Keep the tone commercially aware, specific, and high-agency
- Avoid long paragraph blocks after the hook
- End with RELATED PROJECTS as the final section
- Do not invent project names, results, titles, or URLs

WORD COUNT: 260-380 words.`,
    },
    {
      name: "Executive",
      description: "Boardroom-ready proposal for senior, leadership, and strategic roles",
      style: "executive",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

=== JOB DESCRIPTION ===
{{job_description}}

=== CANDIDATE DATA ===
Name: {{user_name}}
Headline: {{user_headline}}
LinkedIn: {{user_linkedin}}
{{user_experience}}
{{user_projects}}
{{user_skills}}

=== YOUR TASK ===
Write an executive-level award-winning proposal. It should sound like one senior leader speaking to another about where the business can win or stall.

OUTPUT CONTRACT:
1. GREETING: The first non-empty line must be exactly "Hello," or "Hi {{company_name}} team,".
2. IMPACT HOOK: Write 2-3 sentences that frame the business challenge, transition point, or organizational leverage behind the role, then tie it to the candidate's strongest leadership result.
3. STRATEGIC PLAN: Write 3-4 bullet points using "- ". Each bullet should cover a priority such as revenue leverage, org design, execution discipline, or platform stability and connect it to a real outcome from the candidate data.
4. CLARIFYING QUESTIONS: Write 2-3 senior-level bullet questions using "- " that surface priorities, constraints, or the first 90 days.
5. CLOSE: Write 1-2 peer-level lines that invite a serious discussion on strategy and execution.
6. SIGN-OFF: After the close, end with:
{{user_name}}
{{user_headline}}
{{user_linkedin}}

--------------------
RELATED PROJECTS
--------------------
List 2-3 relevant initiatives or projects pulled only from {{user_projects}} or {{user_experience}}.
Each project must be one bullet in this exact style:
- Initiative or project name - one-line proof with scope, business impact, or measurable result. Relevant Skills: keyword, keyword, keyword

STYLE RULES:
- Proposal format only, never essay format
- Start with a greeting and an impact hook before the bullets
- Use bullet points in both the strategic plan and clarifying questions
- Sound peer-level, direct, and commercially sharp
- Avoid padded leadership language and long paragraphs
- End with RELATED PROJECTS as the final section
- Do not invent project names, results, titles, or URLs

WORD COUNT: 260-380 words.`,
    },
    {
      name: "Technical",
      description: "Proposal-style format for engineering, data, and technical roles",
      style: "technical",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

=== JOB DESCRIPTION ===
{{job_description}}

=== CANDIDATE DATA ===
Name: {{user_name}}
Headline: {{user_headline}}
LinkedIn: {{user_linkedin}}
{{user_experience}}
{{user_projects}}
{{user_skills}}

=== YOUR TASK ===
Write an award-winning technical proposal. The reader is an Engineering Manager who wants proof that the candidate can understand the system fast and ship reliable code.

OUTPUT CONTRACT:
1. GREETING: The first non-empty line must be exactly "Hello," or "Hi {{company_name}} team,".
2. HOOK: Write 2-3 punchy sentences that identify the exact engineering challenge, architecture risk, or scale constraint in the job description, then connect it to the candidate's strongest matching technical win.
3. PHASED APPROACH: Write 3-5 bullet points using "- ". Each bullet must feel like a tactical plan covering reliability, performance, security, architecture consistency, or delivery speed, and each bullet must cite real technologies, systems, or outcomes from the candidate data.
4. CLARIFYING QUESTIONS: Write 2-4 technical bullet questions using "- " that feel like senior consultant discovery questions, not admin questions.
5. CLOSE: Write 1-2 confident lines that signal ownership and readiness.
6. SIGN-OFF: After the close, end with:
{{user_name}}
{{user_headline}}
{{user_linkedin}}

--------------------
RELATED PROJECTS
--------------------
List 2-3 relevant projects pulled only from {{user_projects}} or {{user_experience}}.
Each project must be one bullet in this exact style:
- Project name - one-line proof with the stack, system scale, or measurable result. Relevant Skills: keyword, keyword, keyword

STYLE RULES:
- Proposal format only, never essay format
- Start with a greeting and a technical hook before the bullets
- Use bullet points in both the phased approach and clarifying questions
- Keep the tone like a senior engineer or consultant, not a passive job applicant
- Avoid long unbroken paragraphs after the hook
- End with RELATED PROJECTS as the final section
- Do not invent project names, results, titles, or URLs

WORD COUNT: 260-380 words.`,
    },
    {
      name: "Creative",
      description: "Proposal-style format for design, marketing, branding, and content roles",
      style: "creative",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

=== JOB DESCRIPTION ===
{{job_description}}

=== CANDIDATE DATA ===
Name: {{user_name}}
Headline: {{user_headline}}
LinkedIn: {{user_linkedin}}
{{user_experience}}
{{user_projects}}
{{user_skills}}

=== YOUR TASK ===
Write an award-winning creative proposal. It should feel observant, persuasive, and commercially sharp while staying easy to scan.

OUTPUT CONTRACT:
1. GREETING: The first non-empty line must be exactly "Hello," or "Hi {{company_name}} team,".
2. HOOK: Write 2-3 sharp sentences that open with a strong observation about the audience, brand, campaign, or creative direction implied by the role, then tie it to the candidate's strongest relevant outcome.
3. CREATIVE GAME PLAN: Write 3-4 bullet points using "- ". Each bullet should cover a different angle such as brand clarity, campaign execution, content systems, design quality, or conversion impact, anchored in real candidate proof.
4. CLARIFYING QUESTIONS: Write 2-3 thoughtful bullet questions using "- " that show creative strategy and execution awareness.
5. CLOSE: Write 1-2 warm but confident lines that invite next steps.
6. SIGN-OFF: After the close, end with:
{{user_name}}
{{user_headline}}
{{user_linkedin}}

--------------------
RELATED PROJECTS
--------------------
List 2-3 relevant creative projects pulled only from {{user_projects}} or {{user_experience}}.
Each project must be one bullet in this exact style:
- Project name - one-line proof with audience, channel, creative direction, or measurable result. Relevant Skills: keyword, keyword, keyword

STYLE RULES:
- Proposal format only, never essay format
- Start with a greeting and a hook before the bullets
- Use bullet points in both the game plan and clarifying questions
- Keep the voice distinctive, polished, and commercially grounded
- Avoid generic enthusiasm and long paragraph blocks
- End with RELATED PROJECTS as the final section
- Do not invent project names, results, titles, or URLs

WORD COUNT: 260-380 words.`,
    },
  ]

  for (const tpl of defaults) {
    await this.findOneAndUpdate(
      { isDefault: true, style: tpl.style },
      { $set: tpl },
      { upsert: true, new: true }
    )
  }
}

const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema)

export default Template
