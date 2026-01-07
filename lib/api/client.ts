// Lightweight API client for WorkSphere backend
// Uses fetch with JWT and active workspace headers

// Minimal local types to avoid duplication with UI-only types
type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
type AuthUser = { id: string; email: string }
type Workspace = { id: string; name: string }
type AuthOutput = { token: string; user: AuthUser; defaultWorkspace?: Workspace }
type ListWorkspacesOutput = { workspaces: Array<Workspace & { role: Role }> }
type Expense = {
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

type NoteVisibility = 'PUBLIC' | 'PRIVATE' | 'MEMBERS'
type Note = {
  id: string
  workspaceId: string
  userId: string
  title: string
  content: string
  visibility: NoteVisibility
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  user?: { id: string; email: string }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ws_token')
}

function getActiveWorkspaceId() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ws_active_workspace_id')
}

async function request<T>(path: string, opts: RequestInit & { workspace?: boolean } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (opts.workspace) {
    const ws = getActiveWorkspaceId()
    if (ws) headers['x-workspace-id'] = ws
  }
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

export const api = {
  // Auth
  signup: async (email: string, password: string, workspaceName: string): Promise<AuthOutput> => {
    const out = await request<AuthOutput>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, workspaceName }),
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_token', out.token)
      if (out.defaultWorkspace) localStorage.setItem('ws_active_workspace_id', out.defaultWorkspace.id)
    }
    return out
  },
  login: async (email: string, password: string): Promise<AuthOutput> => {
    const out = await request<AuthOutput>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('ws_token', out.token)
    }
    return out
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ws_token')
      localStorage.removeItem('ws_active_workspace_id')
      localStorage.removeItem('ws_user')
    }
  },

  // Workspaces
  listWorkspaces: async (): Promise<ListWorkspacesOutput> => request('/workspaces'),
  createWorkspace: async (name: string) => request<{ workspace: Workspace }>('/workspaces', { method: 'POST', body: JSON.stringify({ name }) }),
  switchWorkspace: async (workspaceId: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('ws_active_workspace_id', workspaceId)
    return request<{ activeWorkspace: Workspace }>('/workspaces/switch', { method: 'POST', workspace: true })
  },

  // Members
  listMembers: async (): Promise<{ members: Array<{ id: string; role: 'OWNER'|'ADMIN'|'MEMBER'|'VIEWER'; status: string; userId: string; createdAt: string; user: { id: string; email: string } }> }> => request('/members', { workspace: true }),
  inviteMember: async (email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'VIEWER') =>
    request('/members/invite', { method: 'POST', body: JSON.stringify({ email, role }), workspace: true }),
  decideMember: async (userId: string, decision: 'APPROVE' | 'REJECT') =>
    request('/members/decision', { method: 'POST', body: JSON.stringify({ userId, decision }), workspace: true }),
  removeMember: async (userId: string) => request(`/members/${userId}`, { method: 'DELETE', workspace: true }),

  // Expenses
  listExpenses: async (): Promise<{ expenses: Expense[] }> => request('/expenses', { workspace: true }),
  createExpense: async (payload: { title: string; amountCents: number; currency?: string; occurredAt: string }) =>
    request<{ expense: Expense }>('/expenses', { method: 'POST', body: JSON.stringify(payload), workspace: true }),
  updateExpense: async (id: string, patch: Partial<Expense>) => request<{ expense: Expense }>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(patch), workspace: true }),
  deleteExpense: async (id: string) => request<{ expense: Expense }>(`/expenses/${id}`, { method: 'DELETE', workspace: true }),

  // Notes
  listNotes: async (): Promise<{ notes: Note[] }> => request('/notes', { workspace: true }),
  getNote: async (id: string): Promise<{ note: Note }> => request(`/notes/${id}`, { workspace: true }),
  createNote: async (payload: { title: string; content: string; visibility?: NoteVisibility }) =>
    request<{ note: Note }>('/notes', { method: 'POST', body: JSON.stringify(payload), workspace: true }),
  updateNote: async (id: string, patch: { title?: string; content?: string; visibility?: NoteVisibility }) =>
    request<{ note: Note }>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(patch), workspace: true }),
  deleteNote: async (id: string) => request<{ note: Note }>(`/notes/${id}`, { method: 'DELETE', workspace: true }),
}
