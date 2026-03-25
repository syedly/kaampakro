"use client"

import { useEffect, useState, useCallback } from "react"
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
  Pencil,
  Save,
  X,
  BookmarkMinus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
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

interface FullLetter extends Letter {
  generatedText: string
  jobDescription?: string
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
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "draft">("all")

  // View/Edit modal state
  const [viewOpen, setViewOpen] = useState(false)
  const [viewLetter, setViewLetter] = useState<FullLetter | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchLetters = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (searchQuery) params.set("q", searchQuery)

      const res = await fetch(`/api/letters?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.letters) setLetters(data.letters)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLetters()
  }, [filterStatus, searchQuery])

  const handleView = useCallback(async (id: string) => {
    setViewOpen(true)
    setViewLoading(true)
    setEditing(false)
    try {
      const res = await fetch(`/api/letters/${id}`, { credentials: "include" })
      const data = await res.json()
      if (data.letter) {
        setViewLetter(data.letter)
        setEditText(data.letter.generatedText)
        setEditTitle(data.letter.title)
      }
    } catch {
      toast.error("Failed to load letter")
      setViewOpen(false)
    } finally {
      setViewLoading(false)
    }
  }, [])

  const handleSave = async (asDraft: boolean) => {
    if (!viewLetter) return
    setSaving(true)
    try {
      const res = await fetch(`/api/letters/${viewLetter._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          generatedText: editText,
          isDraft: asDraft,
        }),
      })
      const data = await res.json()
      if (data.letter) {
        setViewLetter(data.letter)
        setEditing(false)
        // Update the letter in the list
        setLetters((prev) =>
          prev.map((l) =>
            l._id === data.letter._id
              ? {
                  ...l,
                  title: data.letter.title,
                  isDraft: data.letter.isDraft,
                  wordCount: data.letter.wordCount,
                }
              : l
          )
        )
        toast.success(asDraft ? "Saved as draft" : "Letter saved")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDraft = async (id: string, currentIsDraft: boolean) => {
    try {
      const res = await fetch(`/api/letters/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDraft: !currentIsDraft }),
      })
      const data = await res.json()
      if (data.letter) {
        setLetters((prev) =>
          prev.map((l) =>
            l._id === id ? { ...l, isDraft: data.letter.isDraft } : l
          )
        )
        toast.success(data.letter.isDraft ? "Moved to drafts" : "Marked as completed")
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/letters/${id}`, { method: "DELETE", credentials: "include" })
      setLetters((prev) => prev.filter((l) => l._id !== id))
      if (viewLetter?._id === id) setViewOpen(false)
      toast.success("Letter deleted")
    } catch {
      toast.error("Failed to delete letter")
    }
  }

  const handleCopy = async (id: string) => {
    try {
      const res = await fetch(`/api/letters/${id}`, { credentials: "include" })
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
    try {
      const res = await fetch(`/api/letters/${id}`, { credentials: "include" })
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
                      <DropdownMenuItem className="gap-2" onClick={() => handleView(letter._id)}>
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
                        className="gap-2"
                        onClick={() => handleToggleDraft(letter._id, letter.isDraft)}
                      >
                        {letter.isDraft ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> Mark Completed
                          </>
                        ) : (
                          <>
                            <BookmarkMinus className="h-4 w-4" /> Move to Draft
                          </>
                        )}
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

      {/* View / Edit Letter Dialog */}
      <Dialog open={viewOpen} onOpenChange={(open) => { setViewOpen(open); if (!open) setEditing(false) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            {viewLoading ? (
              <DialogTitle>Loading...</DialogTitle>
            ) : viewLetter ? (
              <div className="flex items-start justify-between gap-4 pr-6">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold"
                    />
                  ) : (
                    <DialogTitle className="text-lg">{viewLetter.title}</DialogTitle>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    {viewLetter.company && <span>{viewLetter.company}</span>}
                    {viewLetter.templateName && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {viewLetter.templateName}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        !viewLetter.isDraft ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {viewLetter.isDraft ? "Draft" : "Completed"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <DialogTitle>Letter not found</DialogTitle>
            )}
          </DialogHeader>

          {viewLoading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : viewLetter ? (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                {editing ? (
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[400px] resize-none font-mono text-sm leading-relaxed"
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {viewLetter.generatedText}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  {viewLetter.wordCount} words
                </p>

                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(false)
                          setEditText(viewLetter.generatedText)
                          setEditTitle(viewLetter.title)
                        }}
                        disabled={saving}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave(true)}
                        disabled={saving}
                      >
                        <BookmarkMinus className="mr-1 h-3.5 w-3.5" />
                        {saving ? "Saving..." : "Save as Draft"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(false)}
                        disabled={saving}
                        className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      >
                        <Save className="mr-1 h-3.5 w-3.5" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleToggleDraft(viewLetter._id, viewLetter.isDraft)
                          setViewLetter({ ...viewLetter, isDraft: !viewLetter.isDraft })
                        }}
                      >
                        {viewLetter.isDraft ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Completed
                          </>
                        ) : (
                          <>
                            <BookmarkMinus className="mr-1 h-3.5 w-3.5" /> Move to Draft
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(viewLetter._id)}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setEditing(true)}
                        className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
