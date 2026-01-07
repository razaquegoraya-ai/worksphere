import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/server/prisma'
import { verifyAuth, verifyWorkspace, jsonError } from '@/lib/server/auth'
import { logAudit } from '@/lib/server/audit'

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'MEMBERS']).optional(),
})

export async function GET(
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

  const { id: noteId } = await params

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      content: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      workspaceId: true,
      user: { select: { id: true, email: true } },
    },
  })

  if (!note || note.workspaceId !== wsContext.workspace.id) {
    return jsonError('NOT_FOUND', 'Note not found', 404)
  }

  if (note.visibility === 'PRIVATE' && note.userId !== user.id) {
    return jsonError('FORBIDDEN', 'Access denied', 403)
  }

  return Response.json({ note })
}

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

  const { id: noteId } = await params

  const existing = await prisma.note.findUnique({ where: { id: noteId } })
  if (!existing || existing.workspaceId !== wsContext.workspace.id || existing.deletedAt) {
    return jsonError('NOT_FOUND', 'Note not found', 404)
  }

  if (existing.userId !== user.id) {
    return jsonError('FORBIDDEN', 'Only the owner can update this note', 403)
  }

  try {
    const body = await request.json()
    const parsed = updateNoteSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: parsed.data,
      include: {
        user: { select: { id: true, email: true } },
      },
    })

    await logAudit({
      workspaceId: wsContext.workspace.id,
      userId: user.id,
      action: 'NOTE_UPDATE',
      entity: 'Note',
      entityId: note.id,
      meta: parsed.data,
    })

    return Response.json({ note })
  } catch (error) {
    console.error('Update note error:', error)
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

  const { id: noteId } = await params

  const existing = await prisma.note.findUnique({ where: { id: noteId } })
  if (!existing || existing.workspaceId !== wsContext.workspace.id || existing.deletedAt) {
    return jsonError('NOT_FOUND', 'Note not found', 404)
  }

  if (existing.userId !== user.id) {
    return jsonError('FORBIDDEN', 'Only the owner can delete this note', 403)
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    workspaceId: wsContext.workspace.id,
    userId: user.id,
    action: 'NOTE_DELETE',
    entity: 'Note',
    entityId: note.id,
  })

  return Response.json({ note })
}
