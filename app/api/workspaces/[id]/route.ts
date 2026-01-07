import { NextRequest } from 'next/server'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const { id } = await params

  const member = await prisma.workspaceMember.findUnique({ 
    where: { userId_workspaceId: { userId: user.id, workspaceId: id } } 
  })
  if (!member || member.role !== 'OWNER') {
    return jsonError('FORBIDDEN', 'Only owner can delete workspace', 403)
  }

  const ws = await prisma.workspace.findUnique({ where: { id } })
  if (!ws || ws.deletedAt) {
    return jsonError('NOT_FOUND', 'Workspace not found', 404)
  }

  const deleted = await prisma.workspace.update({ 
    where: { id }, 
    data: { deletedAt: new Date() } 
  })
  await logAudit({ 
    workspaceId: id, 
    userId: user.id, 
    action: 'WORKSPACE_SOFT_DELETE', 
    entity: 'Workspace', 
    entityId: id 
  })
  
  return Response.json({ workspace: deleted })
}
