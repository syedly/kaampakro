"use client"

/**
 * Auth is now fully cookie-based (httpOnly JWT).
 * API routes read the cookie server-side — no userId needed in client headers.
 * These helpers are kept for backwards compatibility with page components.
 */

/** No-op: cookies are sent automatically by the browser */
export function useUserId(): null {
  return null
}

/** Headers for API calls — credentials:include ensures cookies are sent */
export function userHeaders(_userId?: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
  }
}
