import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, unauthorized, badRequest, serverError, sanitize } from "@/lib/apiHelpers"
import User from "@/models/User"

// GET /api/profile — fetch current user's profile
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()

    const user = await User.findById(userId).select("-password -apiKey").lean()
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json({ user })
  } catch (err) {
    return serverError(err)
  }
}

// PATCH /api/profile — update profile fields
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    const body = await req.json()
    await connectDB()

    const user = await User.findById(userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Scalar fields
    const scalarFields = ["name", "phone", "location", "linkedin", "summary"] as const
    for (const field of scalarFields) {
      if (body[field] !== undefined) {
        user[field] = sanitize(String(body[field]))
      }
    }

    // Skills array
    if (Array.isArray(body.skills)) {
      user.skills = body.skills
        .map((s: unknown) => sanitize(String(s)))
        .filter((s: string) => s.length > 0)
    }

    // Education array
    if (Array.isArray(body.education)) {
      user.education = body.education.map((e: Record<string, string>) => ({
        institution: sanitize(e.institution ?? ""),
        degree: sanitize(e.degree ?? ""),
        field: sanitize(e.field ?? ""),
        startYear: sanitize(e.startYear ?? ""),
        endYear: sanitize(e.endYear ?? ""),
      }))
    }

    // Experience array
    if (Array.isArray(body.experience)) {
      user.experience = body.experience.map((e: Record<string, string>) => ({
        company: sanitize(e.company ?? ""),
        title: sanitize(e.title ?? ""),
        location: sanitize(e.location ?? ""),
        startDate: sanitize(e.startDate ?? ""),
        endDate: sanitize(e.endDate ?? ""),
        description: sanitize(e.description ?? ""),
      }))
    }

    // Projects array
    if (Array.isArray(body.projects)) {
      user.projects = body.projects.map((p: Record<string, string>) => ({
        name: sanitize(p.name ?? ""),
        description: sanitize(p.description ?? ""),
        url: sanitize(p.url ?? ""),
        technologies: sanitize(p.technologies ?? ""),
      }))
    }

    // API key — validate format
    if (body.apiKey !== undefined) {
      const key = sanitize(String(body.apiKey)).trim()
      if (key && !key.startsWith("sk-")) {
        return badRequest("Invalid API key format. Must start with 'sk-'")
      }
      user.apiKey = key || undefined
    }

    await user.save()

    const updated = await User.findById(userId).select("-password -apiKey").lean()
    return NextResponse.json({ user: updated })
  } catch (err) {
    return serverError(err)
  }
}
