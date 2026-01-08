import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id, status: 'APPROVED', workspace: { deletedAt: null } },
    select: { role: true, workspace: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  
  return Response.json({ 
    workspaces: memberships.map((m) => ({ 
      id: m.workspace.id, 
      name: m.workspace.name, 
      role: m.role 
    })) 
  })
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)
  if (!user) {
    return jsonError('UNAUTHENTICATED', 'Missing or invalid authorization', 401)
  }

  try {
    const body = await request.json()
    const parsed = z.object({ name: z.string().min(1) }).safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }
    
    const { name } = parsed.data

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({ data: { name, ownerId: user.id } })
      await tx.workspaceMember.create({ 
        data: { userId: user.id, workspaceId: ws.id, role: 'OWNER', status: 'APPROVED' } 
      })
      await logAudit({ 
        workspaceId: ws.id, 
        userId: user.id, 
        action: 'WORKSPACE_CREATE', 
        entity: 'Workspace', 
        entityId: ws.id 
      }, tx)
      return ws
    })

    return Response.json({ workspace })
  } catch (error) {
    console.error('Create workspace error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
