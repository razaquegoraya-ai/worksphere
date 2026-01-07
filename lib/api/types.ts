export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export type AuthUser = { id: string; email: string }
export type Workspace = { id: string; name: string }

export type AuthOutput = {
  token: string
  user: AuthUser
  defaultWorkspace?: Workspace
}

export type ListWorkspacesOutput = {
  workspaces: Array<Workspace & { role: Role }>
}

export type Expense = {
  id: string
  workspaceId: string
  userId: string
  title: string
  amountCents: number
  currency: string
  occurredAt: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
