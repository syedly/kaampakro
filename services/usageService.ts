import User from "@/models/User"

const MONTHLY_LIMIT = 5

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

  // Reset monthly counter if month has rolled over
  const now = new Date()
  const reset = new Date(user.resetDate)
  if (now.getFullYear() > reset.getFullYear() || now.getMonth() > reset.getMonth()) {
    user.usageCount = 0
    user.resetDate = now
    await user.save()
  }

  const hasOwnKey = !!(user.apiKey && user.apiKey.startsWith("sk-"))

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
 * Increment usage count after successful generation.
 */
export async function incrementUsage(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { usageCount: 1 } })
}

/**
 * Get the user's OpenAI API key (their own or the platform key).
 */
export async function resolveApiKey(userId: string): Promise<string> {
  const user = await User.findById(userId).select("apiKey")
  if (user?.apiKey && user.apiKey.startsWith("sk-")) {
    return user.apiKey
  }
  const platformKey = process.env.OPENAI_API_KEY
  if (!platformKey || !platformKey.startsWith("sk-")) {
    throw new Error("No valid OpenAI API key configured")
  }
  return platformKey
}
