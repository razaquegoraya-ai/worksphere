/* Type definitions for WorkSphere */

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  description?: string
  avatarUrl?: string
  ownerId: string
  createdAt: string
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: "owner" | "admin" | "member" | "viewer"
  status?: string
  joinedAt: string
  user?: User
}

export interface Expense {
  id: string
  workspaceId: string
  category: string
  amount: number
  description: string
  date: string
  createdBy: string
  createdAt: string
}
