import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { signToken } from "@/lib/auth"
import { badRequest, sanitize, serverError } from "@/lib/apiHelpers"
import User from "@/models/User"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = sanitize(body.email ?? "").toLowerCase()
    const password: string = body.password ?? ""

    if (!email) return badRequest("Email is required")
    if (!password) return badRequest("Password is required")

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    const token = await signToken(String(user._id))

    const res = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    })

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
