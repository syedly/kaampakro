"use client"

import { useEffect, useState } from "react"
import { Wand2, Copy, Check, Download, RotateCcw, Sparkles, Save, AlertCircle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Template { _id: string; name: string; style: string; isDefault: boolean }
interface UsageInfo { usageCount: number; remaining: number | null; limit: number; unlimited: boolean }

interface ModelOption {
  value: string
  label: string
  description: string
  premium: boolean
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: "gpt-4o",        label: "GPT-4o",          description: "Best quality · Fast",           premium: false },
  { value: "gpt-4o-mini",   label: "GPT-4o Mini",     description: "Fast · Cost-efficient",         premium: false },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo",   description: "Lightweight · Quick",           premium: false },
  { value: "gpt-4",         label: "GPT-4",           description: "High accuracy · Slower",        premium: true  },
  { value: "gpt-4-turbo",   label: "GPT-4 Turbo",     description: "GPT-4 speed boost",             premium: true  },
  { value: "o1",            label: "o1",               description: "Deep reasoning",                premium: true  },
  { value: "o1-preview",    label: "o1 Preview",       description: "Advanced reasoning · Preview",  premium: true  },
  { value: "o1-mini",       label: "o1 Mini",          description: "Compact reasoning model",       premium: true  },
]

export default function GeneratePage() {
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [templates, setTemplates] = useState<Template[]>([])
  const [generatedLetter, setGeneratedLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [letterId, setLetterId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/templates", { credentials: "include" }).then(r => r.json()),
      fetch("/api/usage", { credentials: "include" }).then(r => r.json()),
    ]).then(([tmplData, usageData]) => {
      if (tmplData.templates) {
        setTemplates(tmplData.templates)
        const def = tmplData.templates.find((t: Template) => t.isDefault && t.style === "modern")
        if (def) setSelectedTemplateId(def._id)
      }
      if (usageData.usageCount !== undefined) setUsage(usageData)
    }).catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) return
    setIsGenerating(true)
    setError(null)
    setGeneratedLetter("")
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          templateId: selectedTemplateId || undefined,
          modelChoice: selectedModel,
          saveDraft: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Generation failed. Please try again."); return }
      setGeneratedLetter(data.letter.generatedText)
      setLetterId(data.letter.id)
      if (data.usage) setUsage(data.usage)
      toast.success("Cover letter generated!")
    } catch { setError("Network error. Please try again.") }
    finally { setIsGenerating(false) }
  }

  const handleSaveDraft = async () => {
    if (!letterId) return
    try {
      await fetch(`/api/letters/${letterId}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDraft: true }) })
      toast.success("Saved as draft")
    } catch { toast.error("Failed to save draft") }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLetter)
    setCopied(true); toast.success("Copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `cover-letter-${jobTitle.replace(/\s+/g, "-").toLowerCase()}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const wordCount = generatedLetter.split(/\s+/).filter(Boolean).length
  const charCount = generatedLetter.length
  const limitReached = !usage?.unlimited && (usage?.remaining ?? 1) === 0
  const canGenerate = jobTitle.trim().length > 0 && jobDescription.trim().length >= 20 && !isGenerating && !limitReached

  const selectedModelOption = MODEL_OPTIONS.find(m => m.value === selectedModel)
  const isPremiumModelSelected = selectedModelOption?.premium ?? false

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Generate Cover Letter</h1>
          <p className="mt-1 text-muted-foreground">Create a professional, tailored cover letter in seconds</p>
        </div>
        {usage && (
          <div className="text-sm text-muted-foreground">
            {usage.unlimited ? (
              <span className="text-green-600 font-medium">Unlimited generations</span>
            ) : (
              <span><span className={cn("font-semibold", limitReached && "text-destructive")}>{usage.remaining}</span>/{usage.limit} credits remaining</span>
            )}
          </div>
        )}
      </div>

      {limitReached && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Monthly limit reached. Add your own OpenAI API key in Settings for unlimited access.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Job Details */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader><CardTitle className="text-foreground">Job Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" placeholder="e.g., Software Engineer at Google" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea id="jobDescription" placeholder="Paste the full job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="min-h-[160px] resize-none bg-background" />
                {jobDescription.length > 0 && jobDescription.length < 20 && <p className="text-xs text-destructive">Must be at least 20 characters</p>}
              </div>
            </CardContent>
          </Card>

          {/* Generation Settings — template + model in one card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader><CardTitle className="text-foreground">Generation Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">

              {/* Style Template */}
              <div className="space-y-2">
                <Label>Style Template</Label>
                {templates.length > 0 ? (
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select a template..." /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t._id} value={t._id}>{t.name}{t.isDefault ? " (Default)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                )}
              </div>

              {/* AI Model */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>AI Model</Label>
                  {isPremiumModelSelected && !usage?.unlimited && (
                    <Badge variant="destructive" className="gap-1 text-xs px-1.5 py-0">
                      <Lock className="h-3 w-3" /> Requires own API key
                    </Badge>
                  )}
                  {isPremiumModelSelected && usage?.unlimited && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">Premium</Badge>
                  )}
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Standard models */}
                    {MODEL_OPTIONS.filter(m => !m.premium).map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center justify-between gap-6 w-full">
                          <span>{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {/* Premium models */}
                    {MODEL_OPTIONS.filter(m => m.premium).map(m => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        disabled={!usage?.unlimited}
                        className={cn(!usage?.unlimited && "opacity-50 cursor-not-allowed")}
                      >
                        <div className="flex items-center justify-between gap-6 w-full">
                          <span className="flex items-center gap-1.5">
                            {!usage?.unlimited && <Lock className="h-3 w-3 text-muted-foreground" />}
                            {m.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{m.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!usage?.unlimited && (
                  <p className="text-xs text-muted-foreground">
                    Premium models (GPT-4, o1) require your own OpenAI API key. Add it in{" "}
                    <a href="/profile" className="underline underline-offset-2 hover:text-foreground">Profile settings</a>.
                  </p>
                )}
              </div>

            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full gap-2 bg-gradient-to-r from-primary to-accent py-6 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50">
            {isGenerating ? <><Sparkles className="h-5 w-5 animate-pulse" />Generating...</> : <><Wand2 className="h-5 w-5" />Generate Cover Letter</>}
          </Button>
        </div>

        {/* Preview panel — unchanged */}
        <Card className="flex flex-col border-border bg-card shadow-sm lg:h-[calc(100vh-200px)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle className="text-foreground">Preview</CardTitle>
            {generatedLetter && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setGeneratedLetter(""); setLetterId(null) }} className="gap-1"><RotateCcw className="h-4 w-4" /> Clear</Button>
                <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-1"><Save className="h-4 w-4" /> Save</Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? <><Check className="h-4 w-4 text-green-500" />Copied!</> : <><Copy className="h-4 w-4" />Copy</>}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1"><Download className="h-4 w-4" /> Export</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {isGenerating ? (
              <div className="flex h-full flex-col gap-4 p-8">
                <div className="mx-auto w-full max-w-[650px] space-y-4 rounded-lg border border-border bg-white p-8 shadow-lg">
                  {[80, 95, 88, 72, 90, 60].map((w, i) => <div key={i} className="h-4 animate-pulse rounded bg-gray-200" style={{ width: `${w}%` }} />)}
                  <div className="pt-2" />
                  {[85, 78, 92, 65].map((w, i) => <div key={i} className="h-4 animate-pulse rounded bg-gray-200" style={{ width: `${w}%` }} />)}
                </div>
              </div>
            ) : generatedLetter ? (
              <div className="relative h-full">
                <div className="h-full overflow-auto p-8">
                  <div className="mx-auto max-w-[650px] rounded-lg border border-border bg-white p-8 shadow-lg">
                    <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm">{generatedLetter}</div>
                  </div>
                </div>
                <button onClick={handleCopy} className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg transition-transform hover:scale-110">
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
                <div className="absolute bottom-6 left-6 flex gap-4 rounded-lg border border-border bg-card/90 px-4 py-2 text-sm backdrop-blur-sm">
                  <span className="text-muted-foreground"><span className="font-medium text-foreground">{wordCount}</span> words</span>
                  <span className="text-muted-foreground"><span className="font-medium text-foreground">{charCount}</span> chars</span>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Wand2 className="h-8 w-8 text-muted-foreground" /></div>
                <h3 className="mt-4 text-lg font-medium text-foreground">No letter generated yet</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Fill in the job details and click Generate Cover Letter to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
