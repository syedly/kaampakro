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
      description: "Clean, high-impact style for tech, startup, and professional roles",
      style: "modern",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

═══ JOB DESCRIPTION ═══
{{job_description}}

═══ CANDIDATE DATA (use these facts — do not invent) ═══
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

Projects:
{{user_projects}}

═══ YOUR TASK ═══
Write a cover letter that makes the hiring manager at {{company_name}} stop scrolling and schedule an interview. The letter must feel like it was written by someone who already understands the role — not someone who mass-applied to 50 jobs.

STRUCTURE (flowing prose, no labels or headers):

OPENING (2-3 sentences):
Read the job description carefully. Identify the #1 problem or goal this role exists to solve. Open by showing you have ALREADY solved a similar problem — cite a specific project, metric, or outcome from the candidate's experience. Do NOT open with "I am writing to apply..." or any form of generic enthusiasm. The first sentence should make the reader think: "This person gets it."

EVIDENCE PARAGRAPH (3-5 sentences):
Choose the most relevant role or project from the candidate's experience. Tell it as: Challenge → What you built/did → Measurable result. Use EXACT numbers from the profile (users, revenue, performance improvements, team size). Then connect it directly to what {{company_name}} needs — use the same words the job description uses. If the JD says "React and TypeScript," say "React and TypeScript," not "modern frontend frameworks."

STRATEGIC FIT (2-3 sentences):
Show you have thought about the role beyond the job listing. Combine 2-3 specific skills from the candidate's profile that map to requirements in the JD. Frame them as: "The combination of [skill A] and [skill B] is what makes me effective at [specific thing the role requires]." This paragraph should make the reader think you have already imagined yourself in the role.

CLOSE (1-2 sentences):
Forward-looking and confident. State what you want to discuss further. No "thank you for your consideration." No "I hope to hear from you." End with energy, not gratitude.

WORD COUNT: 220-280 words. Dense with evidence. Zero filler.

QUALITY CHECK — before outputting, verify:
□ Does every paragraph reference something specific from the candidate's actual data?
□ Could this letter be sent to a different company? If yes, rewrite.
□ Are there at least 3 concrete details (numbers, tech names, project names)?
□ Would a hiring manager learn something new from this that the resume alone wouldn't show?`,
    },
    {
      name: "Executive",
      description: "Authoritative peer-to-peer tone for senior and leadership positions",
      style: "executive",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

═══ JOB DESCRIPTION ═══
{{job_description}}

═══ CANDIDATE DATA (use these facts — do not invent) ═══
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

═══ YOUR TASK ═══
Write a cover letter from one business leader to another. This is NOT an application from a subordinate — it is a peer proposing a partnership. The candidate is not asking for a chance; they are offering a track record.

STRUCTURE (flowing prose, no labels):

OPENING (2-3 sentences):
Lead with the candidate's single most impressive business outcome — revenue generated, teams built, markets entered, turnarounds led. Frame it in terms of the challenge {{company_name}} is likely facing at their current stage. The reader should immediately think: "This person operates at our level."

LEADERSHIP EVIDENCE (3-4 sentences):
Demonstrate scope: team size managed, budget owned, cross-functional initiatives led, or organizational change driven. Be specific — "led a 40-person engineering org through a platform migration" not "experienced leader." Connect the scale of past work to the scale this role demands. Pull real data from the candidate's experience.

STRATEGIC VISION (2-3 sentences):
Show understanding of {{company_name}}'s position — their market, their growth stage, their challenges. Connect the candidate's specific experience to a strategic opportunity or problem. This paragraph must feel like the candidate has done genuine research, not just read the JD.

CLOSE (2 sentences):
State a specific priority for the first 90 days. Invite a conversation as an equal — "I would welcome a conversation about [specific strategic topic]."

WORD COUNT: 200-260 words.

TONE: Boardroom confidence without corporate jargon. Write the way a strong VP or C-level speaks in a strategic meeting — direct, evidence-backed, forward-looking.`,
    },
    {
      name: "Technical",
      description: "Evidence-heavy style for engineering, data, and technical roles",
      style: "technical",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

═══ JOB DESCRIPTION ═══
{{job_description}}

═══ CANDIDATE DATA (use these facts — do not invent) ═══
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

Projects:
{{user_projects}}

═══ YOUR TASK ═══
Write a cover letter for an engineering/technical role. The reader is an engineering manager who cares about one thing: can this person ship production code that solves our problems?

STRUCTURE (pure prose, no headers or bullets):

OPENING (2-3 sentences):
Identify the core technical challenge in the job description. Open by describing how you solved an identical or analogous problem — name the EXACT technology, the scale (req/sec, data volume, users, latency), and the outcome. This is not "I have experience with Node.js." This is "I built a Node.js event processing pipeline handling 50K events/sec with sub-200ms p99 latency."

DEEP DIVE (3-5 sentences):
Pick the most relevant project or role from the candidate's data. Walk through: What was the problem? What made it hard? What did you build? What stack did you use? What was the measurable result? Match technologies from the candidate's profile to technologies in the JD — use the EXACT same names. If the JD says "Kubernetes" and the candidate has K8s experience, say "Kubernetes." If the JD says "PostgreSQL" and the candidate knows it, say "PostgreSQL."

ARCHITECTURE THINKING (2-3 sentences):
Show systems-level thinking. Identify a design challenge implied by the JD (scale, reliability, performance, data modeling) and briefly describe how you have approached similar challenges. This shows you think beyond code — you think about systems.

CLOSE (1-2 sentences):
Direct and technical. "Happy to walk through the architecture of [specific project] or discuss how I would approach [specific JD challenge]."

WORD COUNT: 200-260 words.

REQUIREMENTS:
- Must reference at least 4 specific technologies by name
- Must include at least 2 measurable outcomes (numbers)
- Must demonstrate stack overlap with the job description
- Zero soft claims — only verifiable technical facts`,
    },
    {
      name: "Creative",
      description: "Distinctive voice for design, marketing, content, and creative roles",
      style: "creative",
      isDefault: true,
      content: `CANDIDATE: {{user_name}}
APPLYING FOR: {{job_title}} at {{company_name}}

═══ JOB DESCRIPTION ═══
{{job_description}}

═══ CANDIDATE DATA (use these facts — do not invent) ═══
Skills: {{user_skills}}

Experience:
{{user_experience}}

Education:
{{user_education}}

Projects:
{{user_projects}}

═══ YOUR TASK ═══
Write a cover letter that IS a creative sample. For creative roles, the letter itself demonstrates the candidate's voice, taste, and ability to communicate. A generic cover letter for a creative role is an instant rejection. This letter must have personality.

STRUCTURE (flowing, distinctive prose — no labels):

OPENING (2-3 sentences):
Do NOT open with "I'm a passionate creative..." or anything about yourself. Open with an observation — something specific about {{company_name}}'s brand, a recent campaign, a design choice, or a market shift that this role exists to address. Show that you see things other candidates miss. Then connect it to something specific from your experience. The reader should think: "This person has taste and pays attention."

CREATIVE PROOF (3-5 sentences):
Your best work, told as a story: What was the brief or challenge? What was YOUR insight — the thing that made the work different? What did you create? What happened? (engagement numbers, conversion lift, audience growth, awards, or qualitative impact). Pull from the candidate's actual projects. Give texture — the reader should be able to visualize the work.

BRAND CONNECTION (2-3 sentences):
Show you have studied {{company_name}} specifically. Reference their visual language, voice, recent work, or strategic direction. Then connect YOUR creative approach to THEIR needs. This must feel like a genuine observation, not flattery.

CLOSE (1-2 sentences):
Warm but confident. Creative people close with personality, not corporate formality. Reference a specific conversation you want to have about the work.

WORD COUNT: 220-280 words.

THE PERSONALITY TEST: Read the letter back. If it sounds like it could have been written by any applicant, rewrite it. The voice must feel human, specific, and alive.`,
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
