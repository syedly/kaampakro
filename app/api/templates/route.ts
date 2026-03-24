import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, unauthorized, badRequest, serverError, sanitize } from "@/lib/apiHelpers"
import Template from "@/models/Template"

// GET /api/templates — list default + user's custom templates
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()

    // Seed defaults if empty
    const defaultCount = await Template.countDocuments({ isDefault: true })
    if (defaultCount === 0) {
      // @ts-expect-error statics
      await Template.seedDefaults()
    }

    const templates = await Template.find({
      $or: [{ isDefault: true }, { userId }],
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({ templates })
  } catch (err) {
    return serverError(err)
  }
}

// POST /api/templates — create a custom template
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    const body = await req.json()
    const name: string = sanitize(body.name ?? "")
    const content: string = sanitize(body.content ?? "")
    const description: string = sanitize(body.description ?? "")

    if (!name) return badRequest("Template name is required")

    await connectDB()

    const template = await Template.create({
      userId,
      name,
      description,
      content,
      isDefault: false,
      style: "custom",
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
