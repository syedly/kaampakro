import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { signToken } from "@/lib/auth"
import { badRequest, sanitize, serverError } from "@/lib/apiHelpers"
import User from "@/models/User"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = sanitize(body.name ?? "")
    const email = sanitize(body.email ?? "").toLowerCase()
    const password: string = body.password ?? ""

    if (!name) return badRequest("Name is required")
    if (!email || !email.includes("@")) return badRequest("Valid email is required")
    if (!password || password.length < 6) return badRequest("Password must be at least 6 characters")

    await connectDB()

    const existing = await User.findOne({ email })
    if (existing) return badRequest("An account with this email already exists")

    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, password: hashed, usageCount: 0, resetDate: new Date() })

    const token = await signToken(String(user._id))

    const res = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    }, { status: 201 })

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    return res
  } catch (err) {
    return serverError(err)
  }
}
