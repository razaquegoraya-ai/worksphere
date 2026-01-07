"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspace } from "@/hooks/use-workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function WorkspaceSettingsForm() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspace()
  const [name, setName] = useState(currentWorkspace?.name || "")
  const [description, setDescription] = useState(currentWorkspace?.description || "")
  const [slug, setSlug] = useState(currentWorkspace?.slug || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!name.trim()) {
      setError("Workspace name is required")
      return
    }

    if (!slug.trim()) {
      setError("Workspace slug is required")
      return
    }

    try {
      setIsLoading(true)

      if (currentWorkspace) {
        const updated = {
          ...currentWorkspace,
          name,
          description,
          slug,
        }
        setCurrentWorkspace(updated)
        setSuccess(true)
      }

      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
    setSlug(value)
  }

  if (!currentWorkspace) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
        <CardDescription>Manage your workspace details and configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-slug">Workspace Slug</Label>
            <Input
              id="workspace-slug"
              placeholder="my-workspace"
              value={slug}
              onChange={handleSlugChange}
              disabled={isLoading}
              description="URL-friendly identifier (lowercase, hyphens only)"
            />
            <p className="text-xs text-muted-foreground">Used in URLs and workspace identification</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Textarea
              id="workspace-description"
              placeholder="What is this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
          {success && <div className="text-sm text-green-600">Settings saved successfully!</div>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
