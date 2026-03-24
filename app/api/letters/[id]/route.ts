import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, unauthorized, notFound, serverError, sanitize } from "@/lib/apiHelpers"
import CoverLetter from "@/models/CoverLetter"

// GET /api/letters/[id] — get single letter with full text
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()
    const { id } = await params

    const letter = await CoverLetter.findOne({ _id: id, userId }).lean()
    if (!letter) return notFound("Letter not found")

    return NextResponse.json({ letter })
  } catch (err) {
    return serverError(err)
  }
}

// PATCH /api/letters/[id] — update title, generatedText, isDraft
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const allowed = ["title", "company", "generatedText", "isDraft"] as const
    type AllowedKey = (typeof allowed)[number]
    const updates: Partial<Record<AllowedKey, unknown>> = {}

    for (const key of allowed) {
      if (key in body) {
        updates[key] =
          typeof body[key] === "string" ? sanitize(body[key] as string) : body[key]
      }
    }

    // Recalculate word count if text was updated
    if (updates.generatedText && typeof updates.generatedText === "string") {
      (updates as Record<string, unknown>).wordCount = updates.generatedText
        .split(/\s+/)
        .filter(Boolean).length
    }

    const letter = await CoverLetter.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true }
    )
    if (!letter) return notFound("Letter not found")

    return NextResponse.json({ letter })
  } catch (err) {
    return serverError(err)
  }
}

// DELETE /api/letters/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()
    const { id } = await params

    const letter = await CoverLetter.findOneAndDelete({ _id: id, userId })
    if (!letter) return notFound("Letter not found")

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err)
  }
}
