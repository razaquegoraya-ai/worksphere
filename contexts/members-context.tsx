"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import type { WorkspaceMember } from "@/lib/types"
import { api } from "@/lib/api/client"

interface MembersContextType {
  members: WorkspaceMember[]
  isLoading: boolean
  inviteMember: (email: string, role?: "admin" | "member" | "viewer") => Promise<void>
  removeMember: (userId: string) => Promise<void>
  approveMember: (userId: string) => Promise<void>
  refreshMembers: () => Promise<void>
}

export const MembersContext = createContext<MembersContextType | undefined>(undefined)

function mapMember(m: { id: string; role: string; status: string; userId: string; createdAt: string; user: { id: string; email: string } }): WorkspaceMember {
  return {
    id: m.id,
    workspaceId: "",
    userId: m.userId,
    role: (m.role.toLowerCase() as "owner" | "admin" | "member") ?? "member",
    status: m.status,
    joinedAt: m.createdAt,
    user: { id: m.user.id, email: m.user.email, name: m.user.email.split("@")[0] },
  }
}

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshMembers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.listMembers()
      setMembers(res.members.map(mapMember))
    } catch (_) {}
    setIsLoading(false)
  }, [])

  // load members from backend on mount
  useEffect(() => {
    refreshMembers()
  }, [refreshMembers])

  const inviteMember = useCallback(async (email: string, role: "admin" | "member" | "viewer" = "member") => {
    const serverRole = role.toUpperCase() as "ADMIN" | "MEMBER" | "VIEWER"
    await api.inviteMember(email, serverRole)
    await refreshMembers()
  }, [refreshMembers])

  const removeMember = useCallback(async (userId: string) => {
    await api.removeMember(userId)
    await refreshMembers()
  }, [refreshMembers])

  const approveMember = useCallback(async (userId: string) => {
    await api.decideMember(userId, "APPROVE")
    await refreshMembers()
  }, [refreshMembers])

  return (
    <MembersContext.Provider value={{ members, isLoading, inviteMember, removeMember, approveMember, refreshMembers }}>
      {children}
    </MembersContext.Provider>
  )
}
