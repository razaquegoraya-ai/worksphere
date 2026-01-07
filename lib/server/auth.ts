import { jwtVerify, SignJWT } from 'jose'
import { prisma } from './prisma'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me')

export async function signJwt(userId: string) {
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyAuth(request: NextRequest): Promise<{ id: string; email: string } | null> {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return null
  }
  
  const token = auth.substring('Bearer '.length)
  try {
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub as string | undefined
    if (!userId) return null
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { id: true, email: true } 
    })
    return user
  } catch {
    return null
  }
}

export async function verifyWorkspace(
  request: NextRequest, 
  userId: string
): Promise<{ workspace: { id: string; name: string }; role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' } | null> {
  const workspaceId = request.headers.get('x-workspace-id')
  if (!workspaceId) return null

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { 
      status: true, 
      role: true, 
      workspace: { select: { id: true, name: true, deletedAt: true } } 
    },
  })
  
  if (!membership || membership.workspace.deletedAt) return null
  if (membership.status !== 'APPROVED') return null

  return {
    workspace: { id: membership.workspace.id, name: membership.workspace.name },
    role: membership.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  }
}

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status })
}
