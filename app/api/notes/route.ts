import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, verifyWorkspace, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'MEMBERS']).default('PRIVATE'),
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

  const notes = await prisma.note.findMany({
    where: {
      workspaceId: wsContext.workspace.id,
      deletedAt: null,
      OR: [
        { visibility: 'PUBLIC' },
        { visibility: 'MEMBERS' },
        { visibility: 'PRIVATE', userId: user.id },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      user: { select: { id: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ notes })
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

  try {
    const body = await request.json()
    const parsed = createNoteSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }

    const { title, content, visibility } = parsed.data

    const note = await prisma.note.create({
      data: {
        title,
        content,
        visibility,
        userId: user.id,
        workspaceId: wsContext.workspace.id,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    })

    await logAudit({
      workspaceId: wsContext.workspace.id,
      userId: user.id,
      action: 'NOTE_CREATE',
      entity: 'Note',
      entityId: note.id,
      meta: { visibility },
    })

    return Response.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
