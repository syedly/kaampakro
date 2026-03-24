"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface AuthUser {
  _id: string
  name: string
  email: string
  skills: string[]
  usageCount: number
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

export function useAuth(): AuthState & { logout: () => Promise<void> } {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setState({ user: data?.user ?? null, loading: false }))
      .catch(() => setState({ user: null, loading: false }))
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/login")
    router.refresh()
  }, [router])

  return { ...state, logout }
}
