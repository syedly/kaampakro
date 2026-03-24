import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth/login", "/api/auth/register"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

  const token = req.cookies.get("token")?.value
  const userId = token ? await verifyToken(token) : null

  // Authenticated user hitting login/signup → redirect to dashboard
  if (userId && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Unauthenticated user hitting protected route → redirect to login
  if (!isPublic && !userId) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*|.*\\.png|.*\\.svg).*)",
  ],
}
