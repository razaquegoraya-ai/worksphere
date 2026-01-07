import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../prisma'
import { logAudit } from '../utils/audit'
import { canApprove, canRemove } from '../utils/permissions'

export const memberRouter = new Hono()

// List members for active workspace
memberRouter.get('/', async (c) => {
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: ws.id },
    select: {
      id: true,
      role: true,
      status: true,
      userId: true,
      createdAt: true,
      user: { select: { id: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return c.json({ members })
})

// Invite user to workspace (OWNER/ADMIN)
memberRouter.post('/invite', async (c) => {
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  if (!canApprove(role)) return c.json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403)

  const parsed = z.object({ email: z.string().email(), role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('VIEWER') }).safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  const { email, role: targetRole } = parsed.data

  const targetUser = await prisma.user.findUnique({ where: { email } })
  if (!targetUser) return c.json({ error: { code: 'NOT_FOUND', message: 'User must sign up before invite' } }, 404)

  const member = await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: targetUser.id, workspaceId: ws.id } },
    create: { userId: targetUser.id, workspaceId: ws.id, role: targetRole, status: 'PENDING' },
    update: { role: targetRole, status: 'PENDING', removedAt: null },
  })

  await logAudit({ workspaceId: ws.id, userId: user.id, action: 'MEMBER_INVITE', entity: 'WorkspaceMember', entityId: member.id, meta: { targetUserId: targetUser.id, role: targetRole } })
  return c.json({ member })
})

// Approve or reject invitation (OWNER/ADMIN)
memberRouter.post('/decision', async (c) => {
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  if (!canApprove(role)) return c.json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403)

  const parsed = z.object({ userId: z.string(), decision: z.enum(['APPROVE', 'REJECT']) }).safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  const { userId, decision } = parsed.data

  const member = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId, workspaceId: ws.id } } })
  if (!member) return c.json({ error: { code: 'NOT_FOUND', message: 'Member not found' } }, 404)

  const updated = await prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId, workspaceId: ws.id } },
    data: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
  })

  await logAudit({ workspaceId: ws.id, userId: user.id, action: `MEMBER_${decision}`, entity: 'WorkspaceMember', entityId: updated.id, meta: { targetUserId: userId } })
  return c.json({ member: updated })
})

// Remove member (OWNER/ADMIN with constraints)
memberRouter.delete('/:userId', async (c) => {
  const targetUserId = c.req.param('userId')
  // @ts-ignore
  const requester = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }

  const target = await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: targetUserId, workspaceId: ws.id } } })
  if (!target) return c.json({ error: { code: 'NOT_FOUND', message: 'Member not found' } }, 404)
  if (!canRemove(role, target.role)) return c.json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403)

  const removed = await prisma.workspaceMember.update({ where: { id: target.id }, data: { removedAt: new Date(), status: 'REJECTED' } })
  await logAudit({ workspaceId: ws.id, userId: requester.id, action: 'MEMBER_REMOVE', entity: 'WorkspaceMember', entityId: removed.id, meta: { targetUserId } })
  return c.json({ member: removed })
})
