"use client"

import { useWorkspace } from "@/hooks/use-workspace"

export function Header() {
  const { currentWorkspace } = useWorkspace()

  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">{currentWorkspace?.name}</h1>
      </div>
    </div>
  )
}
