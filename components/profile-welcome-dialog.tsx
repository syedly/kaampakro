"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ProgressGauge } from "@/components/progress-gauge"
import {
  getProfileCompletion,
  PROFILE_PROMPT_SESSION_KEY,
  type ProfileShape,
} from "@/lib/profileCompletion"

/**
 * One-shot after login/signup: sessionStorage flag set by auth pages.
 */
export function ProfileWelcomeDialog() {
  const [open, setOpen] = useState(false)
  const [percent, setPercent] = useState(0)
  const [missing, setMissing] = useState<{ id: string; label: string; hint: string }[]>([])

  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      if (sessionStorage.getItem(PROFILE_PROMPT_SESSION_KEY) !== "1") return
      sessionStorage.removeItem(PROFILE_PROMPT_SESSION_KEY)

      fetch("/api/profile", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const profile = data?.user as ProfileShape | undefined
          const { percent: p, missing: m } = getProfileCompletion(profile)
          setPercent(p)
          setMissing(m)
          if (p < 100) setOpen(true)
        })
        .catch(() => {})
    } catch {
      // sessionStorage blocked
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Let&apos;s sharpen your cover letters
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Your profile powers every generation. The more we know about you, the more specific and
            convincing your letters become.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 py-2">
          <ProgressGauge
            value={percent}
            max={100}
            size={120}
            strokeWidth={10}
            label="Profile complete"
            sublabel={percent >= 100 ? "You are all set" : `${100 - percent}% still to add`}
          />
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Tip for standout letters</p>
          <p className="mt-1 leading-relaxed">
            Fill in your experience, skills, and summary so the AI can mirror your real story —
            generic profiles tend to produce generic cover letters. A few minutes on your profile
            saves rewriting later.
          </p>
        </div>

        {missing.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Still missing ({missing.length})
            </p>
            <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
              {missing.map((item) => (
                <li key={item.id} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            I&apos;ll do this later
          </Button>
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <Link href="/profile" onClick={() => setOpen(false)}>
              Complete my profile
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
