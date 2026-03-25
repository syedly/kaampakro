"use client"

import { useEffect, useState } from "react"
import {
  User, GraduationCap, Briefcase, FolderOpen, Code2,
  Plus, Trash2, Save, ExternalLink, Loader2, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProgressGauge } from "@/components/progress-gauge"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Education { id: string; institution: string; degree: string; field: string; startYear: string; endYear: string }
interface Experience { id: string; company: string; title: string; location: string; startDate: string; endDate: string; description: string }
interface Project { id: string; name: string; description: string; url: string; technologies: string }

function calcProgress(data: { name: string; phone: string; location: string; summary: string; skills: string[]; experience: unknown[]; education: unknown[]; projects: unknown[] }) {
  let score = 0
  if (data.name) score += 15
  if (data.phone) score += 10
  if (data.location) score += 10
  if (data.summary) score += 15
  if (data.skills.length > 0) score += 20
  if (data.experience.length > 0) score += 15
  if (data.education.length > 0) score += 10
  if (data.projects.length > 0) score += 5
  return Math.min(score, 100)
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Personal
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [summary, setSummary] = useState("")

  // Skills
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")

  // Education
  const [education, setEducation] = useState<Education[]>([])

  // Experience
  const [experience, setExperience] = useState<Experience[]>([])

  // Projects
  const [projects, setProjects] = useState<Project[]>([])

  // Load profile on mount
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then(r => r.json())
      .then(({ user }) => {
        if (!user) return
        setName(user.name ?? "")
        setEmail(user.email ?? "")
        setPhone(user.phone ?? "")
        setLocation(user.location ?? "")
        setLinkedin(user.linkedin ?? "")
        setSummary(user.summary ?? "")
        setSkills(user.skills ?? [])
        setEducation((user.education ?? []).map((e: Record<string, string>, i: number) => ({ id: String(i), ...e })))
        setExperience((user.experience ?? []).map((e: Record<string, string>, i: number) => ({ id: String(i), ...e })))
        setProjects((user.projects ?? []).map((p: Record<string, string>, i: number) => ({ id: String(i), ...p })))
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  const progress = calcProgress({ name, phone, location, summary, skills, experience, education, projects })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, location, linkedin, summary, skills,
          education: education.map(({ id, ...rest }) => rest),
          experience: experience.map(({ id, ...rest }) => rest),
          projects: projects.map(({ id, ...rest }) => rest),
        }),
      })
      if (res.ok) { toast.success("Profile saved successfully!") }
      else { const d = await res.json(); toast.error(d.error ?? "Failed to save profile") }
    } catch { toast.error("Network error. Please try again.") }
    finally { setSaving(false) }
  }

  // Skills helpers
  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || skills.includes(s)) { setSkillInput(""); return }
    setSkills(prev => [...prev, s])
    setSkillInput("")
  }
  const removeSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill))

  // Education helpers
  const addEducation = () => setEducation(prev => [...prev, { id: Date.now().toString(), institution: "", degree: "", field: "", startYear: "", endYear: "" }])
  const removeEducation = (id: string) => setEducation(prev => prev.filter(e => e.id !== id))
  const updateEducation = (id: string, field: string, value: string) => setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))

  // Experience helpers
  const addExperience = () => setExperience(prev => [...prev, { id: Date.now().toString(), company: "", title: "", location: "", startDate: "", endDate: "", description: "" }])
  const removeExperience = (id: string) => setExperience(prev => prev.filter(e => e.id !== id))
  const updateExperience = (id: string, field: string, value: string) => setExperience(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))

  // Project helpers
  const addProject = () => setProjects(prev => [...prev, { id: Date.now().toString(), name: "", description: "", url: "", technologies: "" }])
  const removeProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id))
  const updateProject = (id: string, field: string, value: string) => setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))

  const initials = name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "??"

  const tabs = [
    { id: "personal", label: "Personal", icon: User },
    { id: "skills", label: "Skills", icon: Code2 },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: FolderOpen },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-16 lg:pt-0">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Setup</h1>
          <p className="mt-1 text-muted-foreground">Complete your profile to generate better cover letters</p>
        </div>
        <div className="flex items-center gap-4">
          {/* <ProgressGauge value={progress} max={100} size={72} strokeWidth={7} label="Complete" sublabel={progress < 100 ? "Fill more fields" : "All done!"} /> */}
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md shadow-primary/20">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted p-1">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Information</CardTitle>
              <CardDescription>Your basic contact information used in cover letters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 ring-4 ring-muted">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{name || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} disabled className="bg-muted/50 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco, CA" className="bg-background" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>LinkedIn URL</Label>
                  <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname" className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Professional Summary</Label>
                <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Write a compelling summary of your professional background, expertise, and what you bring to the table..." className="min-h-[120px] resize-none bg-background" />
                <p className="text-xs text-muted-foreground">{summary.length} characters — this is used directly in your cover letter generation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Skills</CardTitle>
              <CardDescription>Add your technical and professional skills — these are injected into every cover letter you generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }}
                  placeholder="e.g., React, TypeScript, Node.js..."
                  className="bg-background"
                />
                <Button onClick={addSkill} disabled={!skillInput.trim()} className="gap-1 shrink-0">
                  <Plus className="h-4 w-4" />Add
                </Button>
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-1 rounded-full hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
                  <Code2 className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">No skills added yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Type a skill above and press Enter or click Add</p>
                </div>
              )}
              {skills.length > 0 && <p className="text-xs text-muted-foreground">{skills.length} skill{skills.length !== 1 ? "s" : ""} added</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education" className="space-y-4">
          {education.map((edu, index) => (
            <Card key={edu.id} className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">Education {index + 1}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => removeEducation(edu.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input value={edu.institution} onChange={e => updateEducation(edu.id, "institution", e.target.value)} placeholder="e.g., MIT" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input value={edu.degree} onChange={e => updateEducation(edu.id, "degree", e.target.value)} placeholder="e.g., Bachelor of Science" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input value={edu.field} onChange={e => updateEducation(edu.id, "field", e.target.value)} placeholder="e.g., Computer Science" className="bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <Input value={edu.startYear} onChange={e => updateEducation(edu.id, "startYear", e.target.value)} placeholder="2018" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year</Label>
                      <Input value={edu.endYear} onChange={e => updateEducation(edu.id, "endYear", e.target.value)} placeholder="2022" className="bg-background" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addEducation} className="w-full gap-2 border-dashed">
            <Plus className="h-4 w-4" />Add Education
          </Button>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience" className="space-y-4">
          {experience.map((exp, index) => (
            <Card key={exp.id} className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">Experience {index + 1}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={exp.company} onChange={e => updateExperience(exp.id, "company", e.target.value)} placeholder="e.g., Google" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input value={exp.title} onChange={e => updateExperience(exp.id, "title", e.target.value)} placeholder="e.g., Senior Software Engineer" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={exp.location} onChange={e => updateExperience(exp.id, "location", e.target.value)} placeholder="e.g., Remote" className="bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input value={exp.startDate} onChange={e => updateExperience(exp.id, "startDate", e.target.value)} placeholder="Jan 2020" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input value={exp.endDate} onChange={e => updateExperience(exp.id, "endDate", e.target.value)} placeholder="Present" className="bg-background" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Key Achievements</Label>
                  <Textarea value={exp.description} onChange={e => updateExperience(exp.id, "description", e.target.value)} placeholder="Describe your key responsibilities and achievements. Include metrics where possible..." className="min-h-[80px] resize-none bg-background" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addExperience} className="w-full gap-2 border-dashed">
            <Plus className="h-4 w-4" />Add Experience
          </Button>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map(project => (
              <Card key={project.id} className="group border-border bg-card shadow-sm transition-all hover:border-primary/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                      <FolderOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeProject(project.id)} className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Input value={project.name} onChange={e => updateProject(project.id, "name", e.target.value)} placeholder="Project Name" className="bg-background font-medium" />
                    <Textarea value={project.description} onChange={e => updateProject(project.id, "description", e.target.value)} placeholder="Brief description..." className="min-h-[60px] resize-none bg-background text-sm" />
                    <Input value={project.technologies} onChange={e => updateProject(project.id, "technologies", e.target.value)} placeholder="Technologies: React, Node.js..." className="bg-background text-sm" />
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Input value={project.url} onChange={e => updateProject(project.id, "url", e.target.value)} placeholder="Project URL" className="bg-background text-sm" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card onClick={addProject} className="flex min-h-[260px] cursor-pointer items-center justify-center border-dashed border-border bg-card/50 transition-all hover:border-primary/50 hover:bg-card">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Plus className="h-6 w-6 text-muted-foreground" /></div>
                <p className="mt-3 font-medium text-foreground">Add Project</p>
                <p className="mt-1 text-sm text-muted-foreground">Showcase your work</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Save Button at bottom */}
      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md shadow-primary/20 px-8">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  )
}
