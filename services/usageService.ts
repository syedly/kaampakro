import User from "@/models/User"

export const MONTHLY_LIMIT = 5

function hasStoredOpenAiKey(apiKey: string | null | undefined): boolean {
  return !!(apiKey && apiKey.startsWith("sk-"))
}

function sameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/**
 * Reset monthly usage counter for a user if today is the 1st of the month
 * and the stored resetDate is from a previous month.
 *
 * Safe to call on every request — it is a no-op unless both conditions hold.
 */
export async function resetMonthlyLimits(userId: string): Promise<void> {
  const now = new Date()

  // Only act on the 1st of the month
  if (now.getDate() !== 1) return

  const user = await User.findById(userId).select("usageCount resetDate")
  if (!user) return

  // Already reset this month — skip
  if (sameCalendarMonth(now, new Date(user.resetDate))) return

  user.usageCount = 0
  user.resetDate = now
  await user.save()
}

/**
 * Check if the user is allowed to generate.
 *
 * Side-effect: lazily resets the monthly counter whenever the calendar month
 * has rolled over since the last reset (covers cases where the 1st was missed).
 *
 * Returns:
 *   - allowed   – whether the user may proceed
 *   - remaining – generations left (Infinity for BYOK users)
 *   - unlimited – true when user has their own API key (BYOK)
 *   - isByok    – alias for `unlimited`, explicit flag used downstream
 *   - usageCount – current counter value (after any reset)
 */
export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  unlimited: boolean
  isByok: boolean
  usageCount: number
}> {
  const user = await User.findById(userId).select("apiKey usageCount resetDate")
  if (!user) throw new Error("User not found")

  // Lazy monthly reset: fires whenever the calendar month has changed
  const now = new Date()
  const reset = new Date(user.resetDate)
  if (!sameCalendarMonth(now, reset)) {
    user.usageCount = 0
    user.resetDate = now
    await user.save()
  }

  const isByok = hasStoredOpenAiKey(user.apiKey)

  if (isByok) {
    return {
      allowed: true,
      remaining: Infinity,
      unlimited: true,
      isByok: true,
      usageCount: user.usageCount,
    }
  }

  const remaining = MONTHLY_LIMIT - user.usageCount
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    unlimited: false,
    isByok: false,
    usageCount: user.usageCount,
  }
}

/**
 * Increment monthly usage — only when the user relies on the platform key.
 * Own-key (BYOK) users are unlimited and must not consume quota.
 */
export async function incrementUsage(userId: string): Promise<void> {
  const user = await User.findById(userId).select("apiKey")
  if (!user || hasStoredOpenAiKey(user.apiKey)) return
  await User.findByIdAndUpdate(userId, { $inc: { usageCount: 1 } })
}

/**
 * Resolve the effective OpenAI API key for this user.
 * Returns the user's own key if valid, otherwise the platform system key.
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
