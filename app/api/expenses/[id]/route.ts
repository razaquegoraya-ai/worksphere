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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  const { id } = await params

  const existing = await prisma.expense.findFirst({ 
    where: { id, workspaceId: wsContext.workspace.id, deletedAt: null } 
  })
  if (!existing) {
    return jsonError('NOT_FOUND', 'Expense not found', 404)
  }
  
  if (wsContext.role === 'VIEWER') {
    return jsonError('FORBIDDEN', 'Insufficient role', 403)
  }
  if (wsContext.role === 'MEMBER' && existing.userId !== user.id) {
    return jsonError('FORBIDDEN', "Cannot modify others' expenses", 403)
  }

  try {
    const body = await request.json()
    const parsed = expenseBody.partial().safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.update({ where: { id }, data: { ...parsed.data } })
      await logAudit({ 
        workspaceId: wsContext.workspace.id, 
        userId: user.id, 
        action: 'EXPENSE_UPDATE', 
        entity: 'Expense', 
        entityId: exp.id 
      })
      return exp
    })
    
    return Response.json({ expense: updated })
  } catch (error) {
    console.error('Update expense error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  const { id } = await params

  const existing = await prisma.expense.findFirst({ 
    where: { id, workspaceId: wsContext.workspace.id, deletedAt: null } 
  })
  if (!existing) {
    return jsonError('NOT_FOUND', 'Expense not found', 404)
  }
  
  if (wsContext.role === 'VIEWER') {
    return jsonError('FORBIDDEN', 'Insufficient role', 403)
  }
  if (wsContext.role === 'MEMBER' && existing.userId !== user.id) {
    return jsonError('FORBIDDEN', "Cannot delete others' expenses", 403)
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.update({ where: { id }, data: { deletedAt: new Date() } })
    await logAudit({ 
      workspaceId: wsContext.workspace.id, 
      userId: user.id, 
      action: 'EXPENSE_SOFT_DELETE', 
      entity: 'Expense', 
      entityId: exp.id 
    })
    return exp
  })
  
  return Response.json({ expense: deleted })
}
