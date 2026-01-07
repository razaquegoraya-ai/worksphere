import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, verifyWorkspace, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'

const expenseBody = z.object({
  title: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).default('USD'),
  occurredAt: z.coerce.date(),
})

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  const expenses = await prisma.expense.findMany({
    where: { workspaceId: wsContext.workspace.id, deletedAt: null },
    orderBy: { occurredAt: 'desc' },
  })
  
  return Response.json({ expenses })
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  if (wsContext.role === 'VIEWER') {
    return jsonError('FORBIDDEN', 'Insufficient role', 403)
  }

  try {
    const body = await request.json()
    const parsed = expenseBody.safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }

    const created = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: { ...parsed.data, workspaceId: wsContext.workspace.id, userId: user.id },
      })
      await logAudit({ 
        workspaceId: wsContext.workspace.id, 
        userId: user.id, 
        action: 'EXPENSE_CREATE', 
        entity: 'Expense', 
        entityId: exp.id 
      })
      return exp
    })
    
    return Response.json({ expense: created })
  } catch (error) {
    console.error('Create expense error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
