"use client"

import { useWorkspace } from "@/hooks/use-workspace"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspace()

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          {currentWorkspace ? `Welcome to ${currentWorkspace.name}` : "Welcome back"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Total Expenses</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$0.00</div>
            <p className="text-xs text-muted-foreground mt-1">No expenses yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Team Members</span>
              <Users className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1</div>
            <p className="text-xs text-muted-foreground mt-1">Just you for now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Workspace Status</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to use</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium text-sm text-foreground">Add team members</p>
                <p className="text-xs text-muted-foreground">Invite your team to collaborate</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium text-sm text-foreground">Track expenses</p>
                <p className="text-xs text-muted-foreground">Record and manage business expenses</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="font-medium text-sm text-foreground">Configure settings</p>
                <p className="text-xs text-muted-foreground">Set up workspace preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Info</CardTitle>
            <CardDescription>{currentWorkspace?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentWorkspace && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-medium text-foreground">{currentWorkspace.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <p className="text-sm font-medium text-foreground">{currentWorkspace.slug}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
