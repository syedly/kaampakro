import OpenAI from "openai"

/**
 * Models that require a premium / org-level API key.
 * Users relying on the platform system key are restricted to standard models.
 * BYOK users may pass any of these.
 */
export const PREMIUM_MODELS = new Set([
  "o1",
  "o1-preview",
  "o1-mini",
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4-5",
])

/** Models available when using the platform system key. */
export const STANDARD_MODELS = new Set([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
])

export const ALL_ALLOWED_MODELS = new Set([...STANDARD_MODELS, ...PREMIUM_MODELS])

export interface LlmClientResult {
  client: OpenAI
  /** true = user supplied their own key; false = platform system key is used */
  isByok: boolean
}

/**
 * Resolve which OpenAI client to use for the given user.
 *
 * - If `user.apiKey` is a valid key (starts with "sk-"):
 *     → return a client backed by that key and set isByok = true
 * - Otherwise:
 *     → return a client backed by env.OPENAI_API_KEY and set isByok = false
 *
 * Throws if no valid key is available from either source.
 */
export function getLlmClient(user: { apiKey?: string | null }): LlmClientResult {
  if (user.apiKey && user.apiKey.startsWith("sk-")) {
    return {
      client: new OpenAI({ apiKey: user.apiKey }),
      isByok: true,
    }
  }

  const systemKey = process.env.OPENAI_API_KEY
  if (!systemKey || !systemKey.startsWith("sk-")) {
    throw new Error("No valid OpenAI API key configured on this platform")
  }

  return {
    client: new OpenAI({ apiKey: systemKey }),
    isByok: false,
  }
}

/**
 * Validate that a requested model is compatible with the key source.
 *
 * - BYOK users: any model in ALL_ALLOWED_MODELS is permitted.
 * - Platform-key users: only STANDARD_MODELS are permitted (no premium/o1/gpt-4 variants).
 *
 * Throws a descriptive error if the combination is invalid.
 */
export function validateModelChoice(modelChoice: string, isByok: boolean): void {
  if (!ALL_ALLOWED_MODELS.has(modelChoice)) {
    throw new Error(
      `Model "${modelChoice}" is not supported. Allowed models: ${[...ALL_ALLOWED_MODELS].join(", ")}`
    )
  }

  if (!isByok && PREMIUM_MODELS.has(modelChoice)) {
    throw new Error(
      `Model "${modelChoice}" requires your own OpenAI API key. ` +
        `Add your key in Profile settings to unlock premium models.`
    )
  }
}

/** @deprecated Use getLlmClient instead. Kept for internal backwards-compat. */
export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key || !key.startsWith("sk-")) {
    throw new Error("Invalid or missing OpenAI API key")
  }
  return new OpenAI({ apiKey: key })
}
