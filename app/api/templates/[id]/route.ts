import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getUserId, unauthorized, notFound, badRequest, serverError, sanitize } from "@/lib/apiHelpers"
import Template from "@/models/Template"

// PATCH /api/templates/[id] — update a custom template (cannot edit defaults)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()
    const { id } = await params
    const body = await req.json()

    const template = await Template.findOne({ _id: id, userId, isDefault: false })
    if (!template) return notFound("Template not found or cannot be modified")

    if (body.name !== undefined) {
      const name = sanitize(body.name)
      if (!name) return badRequest("Template name cannot be empty")
      template.name = name
    }
    if (body.content !== undefined) {
      const content = sanitize(body.content)
      if (content.length < 20) return badRequest("Template content is too short")
      template.content = content
    }
    if (body.description !== undefined) {
      template.description = sanitize(body.description)
    }

    await template.save()
    return NextResponse.json({ template })
  } catch (err) {
    return serverError(err)
  }
}

// DELETE /api/templates/[id] — delete a custom template
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req)
    if (!userId) return unauthorized()

    await connectDB()
    const { id } = await params

    const template = await Template.findOneAndDelete({ _id: id, userId, isDefault: false })
    if (!template) return notFound("Template not found or cannot be deleted")

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err)
  }
}
