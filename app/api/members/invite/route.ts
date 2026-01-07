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
      email: z.string().email(), 
      role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('VIEWER') 
    }).safeParse(body)
    
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }
    
    const { email, role: targetRole } = parsed.data

    const targetUser = await prisma.user.findUnique({ where: { email } })
    if (!targetUser) {
      return jsonError('NOT_FOUND', 'User must sign up before invite', 404)
    }

    const member = await prisma.workspaceMember.upsert({
      where: { userId_workspaceId: { userId: targetUser.id, workspaceId: wsContext.workspace.id } },
      create: { userId: targetUser.id, workspaceId: wsContext.workspace.id, role: targetRole, status: 'PENDING' },
      update: { role: targetRole, status: 'PENDING', removedAt: null },
    })

    await logAudit({ 
      workspaceId: wsContext.workspace.id, 
      userId: user.id, 
      action: 'MEMBER_INVITE', 
      entity: 'WorkspaceMember', 
      entityId: member.id, 
      meta: { targetUserId: targetUser.id, role: targetRole } 
    })
    
    return Response.json({ member })
  } catch (error) {
    console.error('Invite member error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
