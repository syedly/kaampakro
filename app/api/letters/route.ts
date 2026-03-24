import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, unauthorized, serverError } from "@/lib/apiHelpers"
import CoverLetter from "@/models/CoverLetter"

// GET /api/letters — list all letters for user
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // "draft" | "completed" | null
    const q = searchParams.get("q")

    const query: Record<string, unknown> = { userId }
    if (status === "draft") query.isDraft = true
    if (status === "completed") query.isDraft = false
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
      ]
    }

    const letters = await CoverLetter.find(query)
      .sort({ createdAt: -1 })
      .select("-jobDescription -generatedText")
      .lean()

    return NextResponse.json({ letters })
  } catch (err) {
    return serverError(err)
  }
}
