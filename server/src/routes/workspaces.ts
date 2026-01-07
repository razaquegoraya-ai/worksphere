import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../prisma'
import { logAudit } from '../utils/audit'
import { canManageWorkspace } from '../utils/permissions'

export const workspaceRouter = new Hono()

// Create workspace
workspaceRouter.post('/', async (c) => {
  // @ts-ignore
  const user = c.get('user') as { id: string }
  const body = await c.req.json()
  const parsed = z.object({ name: z.string().min(1) }).safeParse(body)
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  const { name } = parsed.data

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({ data: { name, ownerId: user.id } })
    await tx.workspaceMember.create({ data: { userId: user.id, workspaceId: ws.id, role: 'OWNER', status: 'APPROVED' } })
    await logAudit({ workspaceId: ws.id, userId: user.id, action: 'WORKSPACE_CREATE', entity: 'Workspace', entityId: ws.id })
    return ws
  })

  return c.json({ workspace })
})

// List workspaces for user
workspaceRouter.get('/', async (c) => {
  // @ts-ignore
  const user = c.get('user') as { id: string }
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id, status: 'APPROVED', workspace: { deletedAt: null } },
    select: { role: true, workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ workspaces: memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name, role: m.role })) })
})

// Switch workspace - just validation here; client supplies x-workspace-id per request
workspaceRouter.post('/switch', async (c) => {
  // Validation happens in workspace middleware, here we just echo back
  // @ts-ignore
  const active = c.get('activeWorkspace') as { id: string; name: string } | undefined
  if (!active) return c.json({ error: { code: 'NO_WORKSPACE', message: 'Workspace not active' } }, 400)
  return c.json({ activeWorkspace: active })
})

// Soft delete workspace (OWNER only)
workspaceRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | undefined

  const member = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId: id } } })
  if (!member || member.role !== 'OWNER') return c.json({ error: { code: 'FORBIDDEN', message: 'Only owner can delete workspace' } }, 403)

  const ws = await prisma.workspace.findUnique({ where: { id } })
  if (!ws || ws.deletedAt) return c.json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } }, 404)

  const deleted = await prisma.workspace.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit({ workspaceId: id, userId: user.id, action: 'WORKSPACE_SOFT_DELETE', entity: 'Workspace', entityId: id })
  return c.json({ workspace: deleted })
})
