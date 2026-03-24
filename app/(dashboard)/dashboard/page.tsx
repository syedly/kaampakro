"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Wand2,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressGauge } from "@/components/progress-gauge"
import { CreditsWidget } from "@/components/credits-widget"
import { useAuth } from "@/hooks/useAuth"
import { getProfileCompletion } from "@/lib/profileCompletion"

interface Letter {
  _id: string
  title: string
  company?: string
  isDraft: boolean
  createdAt: string
}

interface UsageData {
  usageCount: number
  remaining: number | null
  limit: number
  unlimited: boolean
  totalLetters: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? "Yesterday" : `${days} days ago`
}

const quickActions = [
  {
    title: "Generate New Letter",
    description: "Create an AI-powered cover letter",
    icon: Wand2,
    href: "/generate",
    primary: true,
  },
  {
    title: "View My Letters",
    description: "Access your saved letters",
    icon: FileText,
    href: "/letters",
    primary: false,
  },
  {
    title: "Custom Prompts",
    description: "Manage your AI templates",
    icon: Sparkles,
    href: "/prompts",
    primary: false,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentLetters, setRecentLetters] = useState<Letter[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [profilePct, setProfilePct] = useState(0)

  useEffect(() => {
    // Fetch recent letters and usage in parallel
    Promise.all([
      fetch("/api/letters?limit=3", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/usage", { credentials: "include" }).then((r) => r.json()),
    ]).then(([letterData, usageData]) => {
      if (letterData.letters) setRecentLetters(letterData.letters.slice(0, 3))
      if (usageData.usageCount !== undefined) setUsage(usageData)
    })
  }, [])

  // Calculate profile completion
  useEffect(() => {
    if (!user) return
    fetch("/api/profile", { credentials: "include" })
      .then((r) => r.json())
      .then(({ user: profile }) => {
        if (!profile) return
        setProfilePct(getProfileCompletion(profile).percent)
      })
  }, [user])

  const creditsUsed = usage?.usageCount ?? 0
  const creditsTotal = usage?.limit ?? 5

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      {/* Welcome Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ready to craft your next winning cover letter?
          </p>
        </div>
        <Link href="/generate">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Wand2 className="h-4 w-4" />
            Generate Letter
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Profile Completion */}
        <Card className="col-span-1 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profile Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center pb-6">
            <ProgressGauge
              value={profilePct}
              max={100}
              label="Complete"
              sublabel={profilePct < 100 ? "Update profile" : "All done!"}
            />
          </CardContent>
        </Card>

        {/* Credits / unlimited (own API key) */}
        <Card className="col-span-1 border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {usage?.unlimited ? "AI generations" : "Monthly credits"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreditsWidget
              used={creditsUsed}
              total={creditsTotal}
              unlimited={usage?.unlimited ?? false}
            />
          </CardContent>
        </Card>

        {/* Total Letters */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Letters Generated
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {usage?.totalLetters ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Total all time</p>
          </CardContent>
        </Card>

        {/* Avg Time */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Generation Time
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">8s</div>
            <p className="text-xs text-muted-foreground">Powered by AI</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Letters */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-muted/50">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      action.primary
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Letters */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Letters</CardTitle>
            <CardDescription>Your latest generated cover letters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLetters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No letters yet</p>
                <Link href="/generate" className="mt-3">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Wand2 className="h-3 w-3" />
                    Generate your first
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {recentLetters.map((letter) => (
                  <div
                    key={letter._id}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-medium text-foreground">
                        {letter.title}
                        {letter.company ? ` at ${letter.company}` : ""}
                      </h3>
                      <p className="text-sm text-muted-foreground">{timeAgo(letter.createdAt)}</p>
                    </div>
                    {letter.isDraft ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
                <Link href="/letters">
                  <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
                    View all letters
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
