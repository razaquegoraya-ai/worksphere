"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/hooks/use-workspace"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Settings, X } from "lucide-react"
import type { Workspace } from "@/lib/types"

export default function WorkspacesPage() {
  const router = useRouter()
  const { workspaces, setCurrentWorkspace, createWorkspace, isLoading } = useWorkspace()
  const [isCreating, setIsCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) {
      setError("Workspace name is required")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")
      await createWorkspace(newWorkspaceName)
      setNewWorkspaceName("")
      setNewWorkspaceDesc("")
      setIsCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Workspaces</h1>
              <p className="text-muted-foreground">Manage and switch between your workspaces</p>
            </div>
            {!isCreating && (
              <Button onClick={() => setIsCreating(true)} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                New Workspace
              </Button>
            )}
          </div>

          {/* Create Workspace Form */}
          {isCreating && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Create a New Workspace</CardTitle>
                    <CardDescription>Set up a new workspace for your team</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false)
                      setError("")
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateWorkspace} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name *</Label>
                    <Input
                      id="workspace-name"
                      placeholder="e.g., Marketing Team"
                      value={newWorkspaceName}
                      onChange={(e) => {
                        setNewWorkspaceName(e.target.value)
                        setError("")
                      }}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace-desc">Description</Label>
                    <Input
                      id="workspace-desc"
                      placeholder="What is this workspace for?"
                      value={newWorkspaceDesc}
                      onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Workspace"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false)
                        setError("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Workspaces Grid */}
          {workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  onClick={() => handleSelectWorkspace(workspace)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span>{workspace.name}</span>
                      <Link href={`/settings?workspace=${workspace.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardTitle>
                    {workspace.description && <CardDescription>{workspace.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-transparent" variant="outline">
                      Select Workspace
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No workspaces yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
