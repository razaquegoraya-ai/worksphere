"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspace } from "@/hooks/use-workspace"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const { currentWorkspace } = useWorkspace()

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your workspace</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <WorkspaceSettingsForm />

          <Card>
            <CardHeader>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>Read-only information about your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentWorkspace && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Workspace ID</p>
                    <p className="text-sm text-foreground font-mono">{currentWorkspace.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Owner ID</p>
                    <p className="text-sm text-foreground font-mono">{currentWorkspace.ownerId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm text-foreground">
                      {new Date(currentWorkspace.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <CardTitle>Delete Workspace</CardTitle>
                  <CardDescription>This action cannot be undone. All data will be permanently deleted.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                Delete Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Coming soon: Backend integration required for deletion
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle>Leave Workspace</CardTitle>
              <CardDescription>Remove yourself from this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                Leave Workspace
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Coming soon: Backend integration required for member management
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
