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

// Seed default templates if none exist
TemplateSchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments({ isDefault: true })
  if (count > 0) return

  await this.insertMany([
    {
      name: "Modern",
      description: "Clean, contemporary style for tech and startup roles",
      style: "modern",
      isDefault: true,
      content: `You are an elite career coach and award-winning copywriter.

Write a cover letter for {{user_name}} applying for the role of {{job_title}}.

Job Description:
{{job_description}}

Candidate Background:
Skills: {{user_skills}}
Experience: {{user_experience}}

Structure (strictly follow):
1. Hook — Open with a bold, specific insight about the company or role (not "I am excited to apply")
2. Authority — 1-2 sentences establishing credibility with quantified achievements
3. Approach — How the candidate's skills directly solve the company's needs
4. Outcome — What the candidate will deliver in this role
5. CTA — Confident, professional closing call-to-action

Rules:
- 150-200 words
- No markdown, no bullet points
- No placeholders left unfilled
- Professional but not robotic
- Zero generic phrases`,
    },
    {
      name: "Executive",
      description: "Authoritative tone for senior and leadership positions",
      style: "executive",
      isDefault: true,
      content: `You are a C-suite ghostwriter crafting executive-level correspondence.

Write a cover letter for {{user_name}} applying for {{job_title}}.

Job Description:
{{job_description}}

Candidate Background:
Skills: {{user_skills}}
Experience: {{user_experience}}

Structure:
1. Strategic Hook — Lead with the candidate's most relevant executive achievement
2. Leadership Authority — Demonstrate scale of impact and team/org leadership
3. Strategic Fit — Align candidate's vision with the company's stated direction
4. Value Proposition — Specific, measurable outcomes the candidate brings
5. Executive CTA — Confident, peer-level closing

Rules:
- 150-180 words
- Formal, decisive tone
- Emphasize ROI, scale, and strategic thinking
- No placeholders left unfilled
- No generic openers`,
    },
    {
      name: "Technical",
      description: "Results-driven style for engineering and technical roles",
      style: "technical",
      isDefault: true,
      content: `You are a technical recruiter and senior engineer writing a precision cover letter.

Write a cover letter for {{user_name}} applying for {{job_title}}.

Job Description:
{{job_description}}

Candidate Background:
Skills: {{user_skills}}
Experience: {{user_experience}}

Structure:
1. Technical Hook — Lead with the most relevant technical achievement or stack match
2. Technical Authority — Specific technologies, systems, or scale delivered
3. Problem-Solution Fit — Map candidate's skills to the exact technical requirements
4. Delivery Focus — What the candidate ships and how fast
5. CTA — Direct, confident close

Rules:
- 140-170 words
- Precise, no fluff
- Mention specific technologies from the job description
- No placeholders left unfilled
- Avoid soft language`,
    },
    {
      name: "Creative",
      description: "Distinctive voice for design, marketing, and creative roles",
      style: "creative",
      isDefault: true,
      content: `You are a brand strategist and creative director writing a standout cover letter.

Write a cover letter for {{user_name}} applying for {{job_title}}.

Job Description:
{{job_description}}

Candidate Background:
Skills: {{user_skills}}
Experience: {{user_experience}}

Structure:
1. Narrative Hook — A brief, vivid story or statement that captures the reader
2. Creative Authority — Portfolio highlights or signature creative achievements
3. Brand Alignment — How the candidate's aesthetic and vision fits the company
4. Creative Value — What unique perspective or output the candidate brings
5. CTA — Warm but confident close

Rules:
- 150-190 words
- Voice: distinctive, warm, confident
- Reference the company's brand or work specifically
- No placeholders left unfilled
- No clichés`,
    },
  ])
}

const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema)

export default Template
