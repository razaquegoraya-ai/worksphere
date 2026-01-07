import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, verifyWorkspace, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'
import { canApprove } from '@/lib/server/permissions'

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  if (!canApprove(wsContext.role)) {
    return jsonError('FORBIDDEN', 'Insufficient role', 403)
  }

  try {
    const body = await request.json()
    const parsed = z.object({ 
      userId: z.string(), 
      decision: z.enum(['APPROVE', 'REJECT']) 
    }).safeParse(body)
    
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }
    
    const { userId, decision } = parsed.data

    const member = await prisma.workspaceMember.findUnique({ 
      where: { userId_workspaceId: { userId, workspaceId: wsContext.workspace.id } } 
    })
    if (!member) {
      return jsonError('NOT_FOUND', 'Member not found', 404)
    }

    const updated = await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId, workspaceId: wsContext.workspace.id } },
      data: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    })

    await logAudit({ 
      workspaceId: wsContext.workspace.id, 
      userId: user.id, 
      action: `MEMBER_${decision}`, 
      entity: 'WorkspaceMember', 
      entityId: updated.id, 
      meta: { targetUserId: userId } 
    })
    
    return Response.json({ member: updated })
  } catch (error) {
    console.error('Member decision error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
