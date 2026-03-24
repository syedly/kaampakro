"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Copy,
  Download,
  Trash2,
  Calendar,
  Wand2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useUserId, userHeaders } from "@/hooks/useUserId"
import { toast } from "sonner"

interface Letter {
  _id: string
  title: string
  company?: string
  templateName?: string
  isDraft: boolean
  wordCount: number
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function LettersPage() {
  const userId = useUserId()
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "draft">("all")

  const fetchLetters = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (searchQuery) params.set("q", searchQuery)

      const res = await fetch(`/api/letters?${params}`, { headers: userHeaders(userId) })
      const data = await res.json()
      if (data.letters) setLetters(data.letters)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLetters()
  }, [userId, filterStatus, searchQuery])

  const handleDelete = async (id: string) => {
    if (!userId) return
    try {
      await fetch(`/api/letters/${id}`, { method: "DELETE", headers: userHeaders(userId) })
      setLetters((prev) => prev.filter((l) => l._id !== id))
      toast.success("Letter deleted")
    } catch {
      toast.error("Failed to delete letter")
    }
  }

  const handleCopy = async (id: string) => {
    if (!userId) return
    try {
      const res = await fetch(`/api/letters/${id}`, { headers: userHeaders(userId) })
      const data = await res.json()
      if (data.letter?.generatedText) {
        await navigator.clipboard.writeText(data.letter.generatedText)
        toast.success("Copied to clipboard")
      }
    } catch {
      toast.error("Failed to copy letter")
    }
  }

  const handleDownload = async (id: string, title: string) => {
    if (!userId) return
    try {
      const res = await fetch(`/api/letters/${id}`, { headers: userHeaders(userId) })
      const data = await res.json()
      if (data.letter?.generatedText) {
        const blob = new Blob([data.letter.generatedText], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      toast.error("Failed to download letter")
    }
  }

  const completed = letters.filter((l) => !l.isDraft)
  const drafts = letters.filter((l) => l.isDraft)

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Letters</h1>
          <p className="mt-1 text-muted-foreground">View and manage your generated cover letters</p>
        </div>
        <Link href="/generate">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <Wand2 className="h-4 w-4" />
            Generate New
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {filterStatus === "all" ? "All Status" : filterStatus === "completed" ? "Completed" : "Drafts"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStatus("all")}>All Status</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("draft")}>Drafts</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{letters.length}</p>
              <p className="text-sm text-muted-foreground">Total Letters</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completed.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{drafts.length}</p>
              <p className="text-sm text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">No letters found</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search or filter." : "Generate your first cover letter to get started."}
          </p>
          {!searchQuery && (
            <Link href="/generate" className="mt-4">
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <Wand2 className="h-4 w-4" /> Generate Letter
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((letter) => (
            <Card
              key={letter._id}
              className="group border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => handleCopy(letter._id)}>
                        <Copy className="h-4 w-4" /> Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" onClick={() => handleDownload(letter._id, letter.title)}>
                        <Download className="h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        onClick={() => handleDelete(letter._id)}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-foreground">{letter.title}</h3>
                  {letter.company && (
                    <p className="mt-1 text-sm text-muted-foreground">{letter.company}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {timeAgo(letter.createdAt)}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    {letter.templateName && (
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        {letter.templateName}
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      {letter.wordCount}w
                    </span>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                      !letter.isDraft
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {!letter.isDraft ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {letter.isDraft ? "draft" : "completed"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
