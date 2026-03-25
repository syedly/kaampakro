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
      description: "Clean, contemporary style for tech and startup roles",
      style: "modern",
      isDefault: true,
      content: `Write a cover letter for {{user_name}} applying for {{job_title}}${" "}
at {{company_name}}.

--- JOB DESCRIPTION ---
{{job_description}}

--- CANDIDATE PROFILE ---
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

Notable Projects:
{{user_projects}}

--- INSTRUCTIONS ---
Target reader: A startup founder or tech hiring manager who has read 200 cover letters this week and is looking for one reason to keep reading past the first sentence.

Write the letter in this exact structure — no section labels, just flowing prose:

PARAGRAPH 1 — THE HOOK (2-3 sentences)
Open with something specific about {{company_name}} or this exact role that shows you have done your homework. This is NOT "I am excited to apply for..." or "I have always admired your company." It IS a specific insight, observation, or shared mission that connects you to this role. If the job description mentions a specific problem, product challenge, or goal — lead with that and your direct experience solving it.

PARAGRAPH 2 — THE PROOF (3-4 sentences)
Pick the single most relevant achievement from the candidate's experience and tell it as a mini-story: situation → action → measurable result. Use real numbers if available. Then tie it directly to what {{company_name}} needs. The reader must think: "this person has already done what we need done."

PARAGRAPH 3 — THE FIT (2-3 sentences)
Show you understand the role beyond the job description. Mention one or two specific skills from the candidate's background that map to exact requirements in the job post. Be concrete — name the technology, the methodology, the market, or the specific challenge.

PARAGRAPH 4 — THE CLOSE (1-2 sentences)
Confident, not desperate. Express genuine interest and invite next steps without using phrases like "I hope to hear from you" or "Thank you for your consideration."

STRICT RULES — violating any of these will make the letter useless:
✗ Never open with "I am excited/thrilled/passionate to apply"
✗ Never say "I am a fast learner," "team player," "hardworking," "detail-oriented," or "results-driven"
✗ Never summarize the resume — the letter must ADD context the resume cannot show
✗ No bullet points, no headers, no markdown
✗ No placeholder text left in the output
✗ 180-220 words total
✗ Active voice throughout`,
    },
    {
      name: "Executive",
      description: "Authoritative tone for senior and leadership positions",
      style: "executive",
      isDefault: true,
      content: `Write a cover letter for {{user_name}} applying for {{job_title}} at {{company_name}}.

--- JOB DESCRIPTION ---
{{job_description}}

--- CANDIDATE PROFILE ---
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

--- INSTRUCTIONS ---
Target reader: A board member, CEO, or executive search committee. They are not hiring a doer — they are hiring a leader who will set direction, build culture, and deliver results at scale. They have no patience for vague claims or junior-level framing.

Write a peer-to-peer executive letter in this structure — no section labels, flowing prose:

PARAGRAPH 1 — STRATEGIC HOOK (2-3 sentences)
Open with the candidate's single most impressive leadership achievement — one that is directly relevant to {{company_name}}'s current stage, challenge, or strategic direction. Frame it in terms of business impact: revenue, growth, transformation, or market position. Not "I have 15 years of experience." Instead: what did you build, turn around, or scale?

PARAGRAPH 2 — LEADERSHIP PROOF (3-4 sentences)
Demonstrate scope and scale of leadership: team size, budget owned, P&L responsibility, or organizational transformation. Quantify wherever possible. Show that the candidate operates at the level this role demands — not just that they are capable of growing into it.

PARAGRAPH 3 — STRATEGIC ALIGNMENT (2-3 sentences)
Show that the candidate has thought about {{company_name}}'s strategic position. Reference a specific challenge, opportunity, or direction the company is facing and connect it to the candidate's relevant experience. This must feel researched, not templated.

PARAGRAPH 4 — VALUE PROPOSITION + CLOSE (2-3 sentences)
State clearly what the candidate will prioritize and deliver in the first 90 days or first year. Close as a peer inviting a conversation — confident and direct.

STRICT RULES:
✗ No corporate buzzwords: "synergize," "leverage," "thought leader," "ecosystem," "visionary"
✗ No weak qualifiers: "I believe," "I think," "I feel," "I hope"
✗ Formal but human — not stiff boardroom language
✗ No bullet points, no markdown
✗ 170-210 words total
✗ Every claim must be specific and verifiable`,
    },
    {
      name: "Technical",
      description: "Results-driven style for engineering and technical roles",
      style: "technical",
      isDefault: true,
      content: `Write a cover letter for {{user_name}} applying for {{job_title}} at {{company_name}}.

--- JOB DESCRIPTION ---
{{job_description}}

--- CANDIDATE PROFILE ---
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

Notable Projects:
{{user_projects}}

--- INSTRUCTIONS ---
Target reader: An engineering manager or senior engineer who is also interviewing 10 other candidates this week. They care about three things: Can you actually build it? Have you worked at this scale or with this stack? Will you slow the team down or speed it up?

Write the letter in this exact structure — no section labels, pure prose:

PARAGRAPH 1 — TECHNICAL HOOK (2-3 sentences)
Open with a technical achievement that directly mirrors the core requirement in the job description. Be precise: name the technology, the problem, the scale (requests/sec, users, data volume, latency targets — whatever is relevant). Never open with enthusiasm — open with capability.

PARAGRAPH 2 — TECHNICAL DEPTH (3-4 sentences)
Go deeper on the most relevant project or role from the candidate's background. What exactly did they build? What was the hard part? What did they ship and what was the measurable outcome? Pull specific technologies from {{user_skills}} and {{user_projects}} that map to the job description's requirements. Show stack overlap — if the job description mentions React, Redis, or Kubernetes, and the candidate has used them, say so specifically.

PARAGRAPH 3 — PROBLEM-SOLUTION FIT (2-3 sentences)
Read the job description and identify the core technical challenge this role is meant to solve. State it explicitly and explain how the candidate's specific background addresses it. This shows the candidate read the JD, understood it, and can think about the role from the engineering team's perspective.

PARAGRAPH 4 — CLOSE (1-2 sentences)
Direct, confident. No filler. Something like: ready to contribute from day one, happy to walk through technical details in a call.

STRICT RULES:
✗ No soft claims: "passionate about technology," "love solving problems," "quick learner"
✗ No vague claims: "worked on large-scale systems" — must specify the scale
✗ Must mention at least 2-3 specific technologies from the job description
✗ No bullet points, no markdown, no headers
✗ 160-200 words total
✗ Avoid adjectives — let the work speak`,
    },
    {
      name: "Creative",
      description: "Distinctive voice for design, marketing, and creative roles",
      style: "creative",
      isDefault: true,
      content: `Write a cover letter for {{user_name}} applying for {{job_title}} at {{company_name}}.

--- JOB DESCRIPTION ---
{{job_description}}

--- CANDIDATE PROFILE ---
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

Notable Projects:
{{user_projects}}

--- INSTRUCTIONS ---
Target reader: A creative director, brand lead, or marketing head who gets a dozen cover letters a week that all sound exactly the same. They are looking for evidence of taste, voice, and the ability to understand a brand. The cover letter itself is a writing sample — the way it is written IS part of the evaluation.

Write a letter with a genuinely distinctive voice in this structure — no labels, flowing prose:

PARAGRAPH 1 — THE NARRATIVE HOOK (2-3 sentences)
Open with something unexpected — a specific observation about {{company_name}}'s brand, a brief story from the candidate's experience that is directly relevant, or a precise insight about the industry problem this role is meant to solve. Avoid: "I have always been passionate about..." or "Your brand caught my attention." Instead, show that you see something others miss.

PARAGRAPH 2 — CREATIVE PROOF (3-4 sentences)
Highlight the candidate's most relevant creative achievement — a campaign that performed, a product that shipped, a brand that changed. Give it texture: what was the brief, what was the insight, what was the result? Numbers are great here if available (engagement rate, conversion lift, audience growth). Pull from {{user_projects}} if relevant.

PARAGRAPH 3 — BRAND ALIGNMENT (2-3 sentences)
Show that the candidate has studied {{company_name}}'s work specifically. Reference their visual identity, messaging, a recent campaign, or a product direction. Connect the candidate's aesthetic sensibility or strategic approach to what {{company_name}} is building. This paragraph must feel specific to this company — not generic.

PARAGRAPH 4 — CLOSE (2 sentences)
Warm, confident, and professional. Invite a conversation about the work. Avoid "I hope to hear from you."

STRICT RULES:
✗ No clichés: "thinking outside the box," "creative thinker," "passionate storyteller," "bring ideas to life"
✗ No passive voice — creative people write with energy
✗ The letter must have personality — if it could have been written by anyone, rewrite it
✗ No bullet points, no markdown
✗ 180-220 words total
✗ Must feel like it was written by a real creative person, not a template`,
    },
  ]

  // Use upsert so existing databases always receive updated prompt content
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
