import { NextRequest } from 'next/server'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, verifyWorkspace, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'
import { canRemove } from '@/lib/server/permissions'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  const { userId: targetUserId } = await params

  const target = await prisma.workspaceMember.findUnique({ 
    where: { userId_workspaceId: { userId: targetUserId, workspaceId: wsContext.workspace.id } } 
  })
  if (!target) {
    return jsonError('NOT_FOUND', 'Member not found', 404)
  }
  
  if (!canRemove(wsContext.role, target.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')) {
    return jsonError('FORBIDDEN', 'Insufficient role', 403)
  }

  const removed = await prisma.workspaceMember.update({ 
    where: { id: target.id }, 
    data: { removedAt: new Date(), status: 'REJECTED' } 
  })
  
  await logAudit({ 
    workspaceId: wsContext.workspace.id, 
    userId: user.id, 
    action: 'MEMBER_REMOVE', 
    entity: 'WorkspaceMember', 
    entityId: removed.id, 
    meta: { targetUserId } 
  })
  
  return Response.json({ member: removed })
}
