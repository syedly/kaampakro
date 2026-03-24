/**
 * Weights match the dashboard “Profile completion” widget (total 100).
 */
export interface ProfileCompletionField {
  id: string
  label: string
  /** Short tip shown in the welcome dialog */
  hint: string
  weight: number
  isComplete: (p: ProfileShape) => boolean
}

export type ProfileShape = {
  name?: string | null
  email?: string | null
  phone?: string | null
  location?: string | null
  summary?: string | null
  skills?: string[] | null
  experience?: { company?: string; title?: string }[] | null
  education?: { institution?: string }[] | null
}

export const PROFILE_COMPLETION_FIELDS: ProfileCompletionField[] = [
  {
    id: "name",
    label: "Full name",
    hint: "Used to personalize your letters.",
    weight: 20,
    isComplete: (p) => !!p.name?.trim(),
  },
  {
    id: "email",
    label: "Email",
    hint: "We already have this from your account if you signed up with it.",
    weight: 10,
    isComplete: (p) => !!p.email?.trim(),
  },
  {
    id: "phone",
    label: "Phone",
    hint: "Optional but helps for a complete header.",
    weight: 10,
    isComplete: (p) => !!p.phone?.trim(),
  },
  {
    id: "location",
    label: "Location",
    hint: "City or region you are targeting.",
    weight: 10,
    isComplete: (p) => !!p.location?.trim(),
  },
  {
    id: "summary",
    label: "Professional summary",
    hint: "A short bio the AI can draw from when you have little experience listed.",
    weight: 15,
    isComplete: (p) => !!p.summary?.trim(),
  },
  {
    id: "skills",
    label: "Skills",
    hint: "List strengths the model should emphasize.",
    weight: 15,
    isComplete: (p) => (p.skills?.length ?? 0) > 0,
  },
  {
    id: "experience",
    label: "Work experience",
    hint: "Roles and impact — the core of a strong letter.",
    weight: 10,
    isComplete: (p) => (p.experience?.length ?? 0) > 0,
  },
  {
    id: "education",
    label: "Education",
    hint: "Degrees and schools add credibility.",
    weight: 10,
    isComplete: (p) => (p.education?.length ?? 0) > 0,
  },
]

export function getProfileCompletion(profile: ProfileShape | null | undefined): {
  percent: number
  missing: { id: string; label: string; hint: string }[]
} {
  if (!profile) {
    return {
      percent: 0,
      missing: PROFILE_COMPLETION_FIELDS.map((f) => ({
        id: f.id,
        label: f.label,
        hint: f.hint,
      })),
    }
  }

  let score = 0
  const missing: { id: string; label: string; hint: string }[] = []

  for (const field of PROFILE_COMPLETION_FIELDS) {
    if (field.isComplete(profile)) {
      score += field.weight
    } else {
      missing.push({ id: field.id, label: field.label, hint: field.hint })
    }
  }

  return { percent: Math.min(100, score), missing }
}

export const PROFILE_PROMPT_SESSION_KEY = "kaampakro_show_profile_prompt"
