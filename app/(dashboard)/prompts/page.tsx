"use client"

import { useEffect, useState } from "react"
import {
  Sparkles,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserId, userHeaders } from "@/hooks/useUserId"
import { toast } from "sonner"

interface Template {
  _id: string
  name: string
  description?: string
  style: string
  promptTemplate?: string
  isDefault: boolean
}

interface TemplateFormState {
  name: string
  description: string
  style: string
  promptTemplate: string
}

const emptyForm: TemplateFormState = {
  name: "",
  description: "",
  style: "custom",
  promptTemplate: "",
}

export default function PromptsPage() {
  const userId = useUserId()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<TemplateFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editForm, setEditForm] = useState<TemplateFormState>(emptyForm)
  const [isEditing, setIsEditing] = useState(false)

  const fetchTemplates = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch("/api/templates", { headers: userHeaders(userId) })
      const data = await res.json()
      if (data.templates) setTemplates(data.templates)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [userId])

  const handleCreate = async () => {
    if (!createForm.name.trim() || !userId) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: userHeaders(userId),
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          style: createForm.style.trim() || "custom",
          promptTemplate: createForm.promptTemplate.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create template")
        return
      }
      setTemplates((prev) => [...prev, data.template])
      setCreateForm(emptyForm)
      setIsCreateOpen(false)
      toast.success("Template created")
    } catch {
      toast.error("Failed to create template")
    } finally {
      setIsSaving(false)
    }
  }

  const openEdit = (template: Template) => {
    setEditingTemplate(template)
    setEditForm({
      name: template.name,
      description: template.description ?? "",
      style: template.style,
      promptTemplate: template.promptTemplate ?? "",
    })
  }

  const handleEdit = async () => {
    if (!editingTemplate || !userId) return
    setIsEditing(true)
    try {
      const res = await fetch(`/api/templates/${editingTemplate._id}`, {
        method: "PATCH",
        headers: userHeaders(userId),
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          style: editForm.style.trim(),
          promptTemplate: editForm.promptTemplate.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update template")
        return
      }
      setTemplates((prev) =>
        prev.map((t) => (t._id === editingTemplate._id ? data.template : t))
      )
      setEditingTemplate(null)
      toast.success("Template updated")
    } catch {
      toast.error("Failed to update template")
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!userId) return
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        headers: userHeaders(userId),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to delete template")
        return
      }
      setTemplates((prev) => prev.filter((t) => t._id !== id))
      toast.success("Template deleted")
    } catch {
      toast.error("Failed to delete template")
    }
  }

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const defaultTemplates = filtered.filter((t) => t.isDefault)
  const customTemplates = filtered.filter((t) => !t.isDefault)

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Custom Prompts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage your AI prompt templates
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <Plus className="h-4 w-4" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Custom Prompt</DialogTitle>
              <DialogDescription>
                Create a reusable prompt template for generating cover letters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Prompt Name</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g., Creative Agency Style"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Input
                  id="create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Brief description of this prompt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-style">Style Tag</Label>
                <Input
                  id="create-style"
                  value={createForm.style}
                  onChange={(e) => setCreateForm({ ...createForm, style: e.target.value })}
                  placeholder="e.g., creative, formal, technical"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-template">Prompt Template</Label>
                <Textarea
                  id="create-template"
                  value={createForm.promptTemplate}
                  onChange={(e) => setCreateForm({ ...createForm, promptTemplate: e.target.value })}
                  placeholder="Write the prompt instructions for the AI..."
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!createForm.name.trim() || isSaving}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
              >
                {isSaving ? "Creating..." : "Create Prompt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-card pl-10"
        />
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
      ) : (
        <>
          {defaultTemplates.length > 0 && (
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Default Templates
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {defaultTemplates.map((template) => (
                  <TemplateCard
                    key={template._id}
                    template={template}
                    readOnly
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {customTemplates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                {defaultTemplates.length > 0 ? "Custom Templates" : "All Templates"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {customTemplates.map((template) => (
                  <TemplateCard
                    key={template._id}
                    template={template}
                    readOnly={false}
                    onEdit={() => openEdit(template)}
                    onDelete={() => handleDelete(template._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No prompts found</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query."
                  : "Create your first custom prompt to get started."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null) }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your custom prompt template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Prompt Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="e.g., Creative Agency Style"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Brief description of this prompt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-style">Style Tag</Label>
              <Input
                id="edit-style"
                value={editForm.style}
                onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                placeholder="e.g., creative, formal, technical"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-template">Prompt Template</Label>
              <Textarea
                id="edit-template"
                value={editForm.promptTemplate}
                onChange={(e) => setEditForm({ ...editForm, promptTemplate: e.target.value })}
                placeholder="Write the prompt instructions for the AI..."
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editForm.name.trim() || isEditing}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateCard({
  template,
  readOnly,
  onEdit,
  onDelete,
}: {
  template: Template
  readOnly: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex gap-1">
            {readOnly ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
            ) : (
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
                  <DropdownMenuItem className="gap-2" onClick={onEdit}>
                    <Edit2 className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-foreground">{template.name}</h3>
          {template.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {template.style}
          </span>
          {readOnly && (
            <span className="text-xs text-muted-foreground">Default</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
