import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not defined")
  return new TextEncoder().encode(secret)
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return (payload.sub as string) ?? null
  } catch {
    return null
  }
}

/** Extract userId from the JWT cookie in an API route handler */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("token")?.value
  if (!token) return null
  return verifyToken(token)
}

/** Extract userId from the cookie store in a Server Component */
export async function getServerUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  if (!token) return null
  return verifyToken(token)
}
