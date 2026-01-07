import { z } from 'zod'

// Auth
export const signupInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(1).default('My Workspace'),
})
export type SignupInput = z.infer<typeof signupInput>

export const loginInput = z.object({ email: z.string().email(), password: z.string().min(8) })
export type LoginInput = z.infer<typeof loginInput>

export const authOutput = z.object({
  token: z.string(),
  user: z.object({ id: z.string(), email: z.string().email() }),
  defaultWorkspace: z.object({ id: z.string(), name: z.string() }).optional(),
})
export type AuthOutput = z.infer<typeof authOutput>

// Workspace
export const createWorkspaceInput = z.object({ name: z.string().min(1) })
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInput>

export const workspace = z.object({ id: z.string(), name: z.string() })
export type Workspace = z.infer<typeof workspace>

export const listWorkspacesOutput = z.object({
  workspaces: z.array(workspace.extend({ role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']) })),
})
export type ListWorkspacesOutput = z.infer<typeof listWorkspacesOutput>

export const switchWorkspaceOutput = z.object({ activeWorkspace: workspace })
export type SwitchWorkspaceOutput = z.infer<typeof switchWorkspaceOutput>

// Members
export const inviteMemberInput = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('VIEWER'),
})
export type InviteMemberInput = z.infer<typeof inviteMemberInput>

export const decisionInput = z.object({ userId: z.string(), decision: z.enum(['APPROVE', 'REJECT']) })
export type DecisionInput = z.infer<typeof decisionInput>

// Expenses
export const expense = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  title: z.string(),
  amountCents: z.number().int(),
  currency: z.string(),
  occurredAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
})
export type Expense = z.infer<typeof expense>

export const createExpenseInput = z.object({
  title: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default('USD'),
  occurredAt: z.coerce.date(),
})
export type CreateExpenseInput = z.infer<typeof createExpenseInput>

export const updateExpenseInput = createExpenseInput.partial()
export type UpdateExpenseInput = z.infer<typeof updateExpenseInput>

export const listExpensesOutput = z.object({ expenses: z.array(expense) })
export type ListExpensesOutput = z.infer<typeof listExpensesOutput>

// oRPC-like descriptor
export const api = {
  auth: {
    signup: { method: 'POST', path: '/auth/signup', input: signupInput, output: authOutput },
    login: { method: 'POST', path: '/auth/login', input: loginInput, output: authOutput.omit({ defaultWorkspace: true }) },
  },
  workspaces: {
    create: { method: 'POST', path: '/workspaces', input: createWorkspaceInput, output: z.object({ workspace }) },
    list: { method: 'GET', path: '/workspaces', input: z.void(), output: listWorkspacesOutput },
    switch: { method: 'POST', path: '/workspaces/switch', input: z.void(), output: switchWorkspaceOutput },
    delete: { method: 'DELETE', path: '/workspaces/:id', input: z.void(), output: z.object({ workspace }) },
  },
  members: {
    invite: { method: 'POST', path: '/members/invite', input: inviteMemberInput, output: z.object({}) },
    decision: { method: 'POST', path: '/members/decision', input: decisionInput, output: z.object({}) },
    remove: { method: 'DELETE', path: '/members/:userId', input: z.void(), output: z.object({}) },
  },
  expenses: {
    list: { method: 'GET', path: '/expenses', input: z.void(), output: listExpensesOutput },
    create: { method: 'POST', path: '/expenses', input: createExpenseInput, output: z.object({ expense }) },
    update: { method: 'PUT', path: '/expenses/:id', input: updateExpenseInput, output: z.object({ expense }) },
    delete: { method: 'DELETE', path: '/expenses/:id', input: z.void(), output: z.object({ expense }) },
  },
} as const

export type Api = typeof api
