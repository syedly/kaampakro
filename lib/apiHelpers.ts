import { NextRequest, NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth"

export async function getUserId(req: NextRequest): Promise<string | null> {
  return getAuthUserId(req)
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : "Internal server error"
  console.error("[API Error]", err)
  return NextResponse.json({ error: message }, { status: 500 })
}

/** Sanitize string: trim and strip dangerous HTML/script patterns */
export function sanitize(value: string): string {
  return value
    .trim()
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
}
