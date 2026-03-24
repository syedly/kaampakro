import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, unauthorized, serverError } from "@/lib/apiHelpers"
import { checkUsageLimit } from "@/services/usageService"
import CoverLetter from "@/models/CoverLetter"

const MONTHLY_LIMIT = 5

// GET /api/usage — returns usage stats for the current user
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()

    const [usage, totalLetters] = await Promise.all([
      checkUsageLimit(userId),
      CoverLetter.countDocuments({ userId }),
    ])

    return NextResponse.json({
      usageCount: usage.usageCount,
      remaining: usage.unlimited ? null : usage.remaining,
      limit: MONTHLY_LIMIT,
      unlimited: usage.unlimited,
      totalLetters,
    })
  } catch (err) {
    return serverError(err)
  }
}
