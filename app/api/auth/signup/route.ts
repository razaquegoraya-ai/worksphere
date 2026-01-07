import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/server/prisma'
import { signJwt, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(1).default('My Workspace')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }
    
    const { email, password, workspaceName } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return jsonError('CONFLICT', 'Email already registered', 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } })
      const workspace = await tx.workspace.create({ data: { name: workspaceName, ownerId: user.id } })
      await tx.workspaceMember.create({
        data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER', status: 'APPROVED' }
      })
      await logAudit({ workspaceId: workspace.id, userId: user.id, action: 'WORKSPACE_CREATE', entity: 'Workspace', entityId: workspace.id }, tx)
      await logAudit({ workspaceId: workspace.id, userId: user.id, action: 'USER_SIGNUP', entity: 'User', entityId: user.id }, tx)
      return { user, workspace }
    })

    const token = await signJwt(result.user.id)
    return Response.json({ 
      token, 
      user: { id: result.user.id, email: result.user.email }, 
      defaultWorkspace: result.workspace 
    })
  } catch (error) {
    console.error('Signup error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
