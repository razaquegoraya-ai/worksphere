import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, verifyWorkspace, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'
import { canApprove } from '@/lib/server/permissions'

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const wsContext = await verifyWorkspace(request, user.id)
  if (!wsContext) {
    return jsonError('NO_WORKSPACE', 'Active workspace not provided or not accessible', 400)
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: wsContext.workspace.id },
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
  
  return Response.json({ members })
}
