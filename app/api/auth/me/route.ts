import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, serverError, unauthorized } from "@/lib/apiHelpers"
import User from "@/models/User"

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()
    const user = await User.findById(userId).select("-password -apiKey").lean()
    if (!user) return unauthorized()

    return NextResponse.json({ user })
  } catch (err) {
    return serverError(err)
  }
}
