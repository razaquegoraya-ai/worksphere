"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import type { Workspace } from "@/lib/types"
import { api } from "@/lib/api/client"

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  isLoading: boolean
  setCurrentWorkspace: (workspace: Workspace) => void
  createWorkspace: (name: string) => Promise<Workspace>
  refreshWorkspaces: () => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

function mapWorkspace(w: { id: string; name: string }): Workspace {
  return {
    id: w.id,
    name: w.name,
    slug: w.name.toLowerCase().replace(/\s+/g, "-"),
    ownerId: "",
    createdAt: new Date().toISOString(),
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.listWorkspaces()
      const mapped = res.workspaces.map(mapWorkspace)
      setWorkspaces(mapped)
      
      const activeId = typeof window !== 'undefined' ? localStorage.getItem('ws_active_workspace_id') : null
      if (activeId) {
        const found = mapped.find((w) => w.id === activeId)
        if (found) {
          setCurrentWorkspace(found)
        } else if (mapped[0]) {
          setCurrentWorkspace(mapped[0])
          localStorage.setItem('ws_active_workspace_id', mapped[0].id)
        }
      } else if (mapped[0]) {
        setCurrentWorkspace(mapped[0])
        localStorage.setItem('ws_active_workspace_id', mapped[0].id)
      }
    } catch (e) {
      // ignore
    }
    setIsLoading(false)
  }, [])

  // Load workspaces from API on mount
  useEffect(() => {
    refreshWorkspaces()
  }, [refreshWorkspaces])

  const handleSetCurrentWorkspace = useCallback((workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    localStorage.setItem('ws_active_workspace_id', workspace.id)
  }, [])

  const createWorkspace = useCallback(async (name: string): Promise<Workspace> => {
    const res = await api.createWorkspace(name)
    const newWs = mapWorkspace(res.workspace)
    setWorkspaces((prev) => [...prev, newWs])
    return newWs
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        isLoading,
        setCurrentWorkspace: handleSetCurrentWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
