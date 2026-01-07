import { createMiddleware } from 'hono/factory'
import { prisma } from '../prisma'
import type { Role } from '@prisma/client'

export const workspaceMiddleware = createMiddleware(async (c, next) => {
  const workspaceId = c.req.header('x-workspace-id') || c.req.query('workspace_id')
  if (!workspaceId) return c.json({ error: { code: 'NO_WORKSPACE', message: 'Active workspace not provided' } }, 400)

  // @ts-ignore
  const user = c.get('user') as { id: string } | undefined
  if (!user) return c.json({ error: { code: 'UNAUTHENTICATED', message: 'User not found in context' } }, 401)

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    select: { status: true, role: true, workspace: { select: { id: true, name: true, deletedAt: true } } },
  })
  if (!membership || membership.workspace.deletedAt) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Workspace not found' } }, 404)
  }
  if (membership.status !== 'APPROVED') {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Membership not approved' } }, 403)
  }

  // attach workspace and role
  // @ts-ignore
  c.set('activeWorkspace', { id: membership.workspace.id, name: membership.workspace.name })
  // @ts-ignore
  c.set('userRole', membership.role as Role)

  await next()
})
