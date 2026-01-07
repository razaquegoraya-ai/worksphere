import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../prisma'
import { logAudit } from '../utils/audit'

export const expenseRouter = new Hono()

const expenseBody = z.object({
  title: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default('USD'),
  occurredAt: z.coerce.date(),
})

// List expenses for active workspace
expenseRouter.get('/', async (c) => {
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  const expenses = await prisma.expense.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    orderBy: { occurredAt: 'desc' },
  })
  return c.json({ expenses })
})

// Create expense (MEMBER+)
expenseRouter.post('/', async (c) => {
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  if (role === 'VIEWER') return c.json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403)

  const parsed = expenseBody.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)

  const created = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.create({
      data: { ...parsed.data, workspaceId: ws.id, userId: user.id },
    })
    await logAudit({ workspaceId: ws.id, userId: user.id, action: 'EXPENSE_CREATE', entity: 'Expense', entityId: exp.id })
    return exp
  })
  return c.json({ expense: created })
})

// Update expense (ADMIN+ or owner if MEMBER)
expenseRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

  const existing = await prisma.expense.findFirst({ where: { id, workspaceId: ws.id, deletedAt: null } })
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404)
  if (role === 'VIEWER') return c.json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403)
  if (role === 'MEMBER' && existing.userId !== user.id) return c.json({ error: { code: 'FORBIDDEN', message: 'Cannot modify others\' expenses' } }, 403)

  const parsed = expenseBody.partial().safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)

  const updated = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.update({ where: { id }, data: { ...parsed.data } })
    await logAudit({ workspaceId: ws.id, userId: user.id, action: 'EXPENSE_UPDATE', entity: 'Expense', entityId: exp.id })
    return exp
  })
  return c.json({ expense: updated })
})

// Soft delete expense (ADMIN+ or owner if MEMBER)
expenseRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const role = c.get('userRole') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

  const existing = await prisma.expense.findFirst({ where: { id, workspaceId: ws.id, deletedAt: null } })
  if (!existing) return c.json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404)
  if (role === 'VIEWER') return c.json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403)
  if (role === 'MEMBER' && existing.userId !== user.id) return c.json({ error: { code: 'FORBIDDEN', message: 'Cannot delete others\' expenses' } }, 403)

  const deleted = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.update({ where: { id }, data: { deletedAt: new Date() } })
    await logAudit({ workspaceId: ws.id, userId: user.id, action: 'EXPENSE_SOFT_DELETE', entity: 'Expense', entityId: exp.id })
    return exp
  })
  return c.json({ expense: deleted })
})
