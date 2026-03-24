import User from "@/models/User"

export const MONTHLY_LIMIT = 5

function hasStoredOpenAiKey(apiKey: string | null | undefined): boolean {
  return !!(apiKey && apiKey.startsWith("sk-"))
}

function sameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/**
 * Check if user can generate. Returns remaining count.
 * If user has a valid API key, they have unlimited generations.
 */
export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  unlimited: boolean
  usageCount: number
}> {
  const user = await User.findById(userId).select("apiKey usageCount resetDate")
  if (!user) throw new Error("User not found")

  // Reset monthly counter when the calendar month changes (vs. last reset)
  const now = new Date()
  const reset = new Date(user.resetDate)
  if (!sameCalendarMonth(now, reset)) {
    user.usageCount = 0
    user.resetDate = now
    await user.save()
  }

  const hasOwnKey = hasStoredOpenAiKey(user.apiKey)

  if (hasOwnKey) {
    return { allowed: true, remaining: Infinity, unlimited: true, usageCount: user.usageCount }
  }

  const remaining = MONTHLY_LIMIT - user.usageCount
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    unlimited: false,
    usageCount: user.usageCount,
  }
}

/**
 * Increment monthly usage only when the user relies on the platform OpenAI key
 * (no own key stored). Own-key users are unlimited and do not consume quota.
 */
export async function incrementUsage(userId: string): Promise<void> {
  const user = await User.findById(userId).select("apiKey")
  if (!user || hasStoredOpenAiKey(user.apiKey)) return
  await User.findByIdAndUpdate(userId, { $inc: { usageCount: 1 } })
}

/**
 * Get the user's OpenAI API key (their own or the platform key).
 */
export async function resolveApiKey(userId: string): Promise<string> {
  const user = await User.findById(userId).select("apiKey")
  if (user?.apiKey && hasStoredOpenAiKey(user.apiKey)) {
    return user.apiKey
  }
  const platformKey = process.env.OPENAI_API_KEY
  if (!platformKey || !platformKey.startsWith("sk-")) {
    throw new Error("No valid OpenAI API key configured")
  }
  return platformKey
}
