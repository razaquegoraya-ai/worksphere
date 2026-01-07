import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../prisma'
import { logAudit } from '../utils/audit'

export const noteRouter = new Hono()

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'MEMBERS']).default('PRIVATE'),
})

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'MEMBERS']).optional(),
})

// List notes visible to the current user in the workspace
noteRouter.get('/', async (c) => {
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }

  // User can see:
  // - All PUBLIC notes in the workspace
  // - All MEMBERS notes in the workspace (since they are a member)
  // - Their own PRIVATE notes
  const notes = await prisma.note.findMany({
    where: {
      workspaceId: ws.id,
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

  return c.json({ notes })
})

// Get a single note by ID (with visibility check)
noteRouter.get('/:id', async (c) => {
  const noteId = c.req.param('id')
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }

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

  if (!note || note.workspaceId !== ws.id) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Note not found' } }, 404)
  }

  // Check visibility
  if (note.visibility === 'PRIVATE' && note.userId !== user.id) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, 403)
  }

  // PUBLIC and MEMBERS are accessible to workspace members (already verified by middleware)
  return c.json({ note })
})

// Create a new note
noteRouter.post('/', async (c) => {
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }

  const parsed = createNoteSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  }

  const { title, content, visibility } = parsed.data

  const note = await prisma.note.create({
    data: {
      title,
      content,
      visibility,
      userId: user.id,
      workspaceId: ws.id,
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  })

  await logAudit({
    workspaceId: ws.id,
    userId: user.id,
    action: 'NOTE_CREATE',
    entity: 'Note',
    entityId: note.id,
    meta: { visibility },
  })

  return c.json({ note }, 201)
})

// Update a note (only owner can update)
noteRouter.put('/:id', async (c) => {
  const noteId = c.req.param('id')
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }

  const existing = await prisma.note.findUnique({ where: { id: noteId } })
  if (!existing || existing.workspaceId !== ws.id || existing.deletedAt) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Note not found' } }, 404)
  }

  if (existing.userId !== user.id) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the owner can update this note' } }, 403)
  }

  const parsed = updateNoteSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: parsed.data,
    include: {
      user: { select: { id: true, email: true } },
    },
  })

  await logAudit({
    workspaceId: ws.id,
    userId: user.id,
    action: 'NOTE_UPDATE',
    entity: 'Note',
    entityId: note.id,
    meta: parsed.data,
  })

  return c.json({ note })
})

// Delete a note (soft delete, only owner can delete)
noteRouter.delete('/:id', async (c) => {
  const noteId = c.req.param('id')
  // @ts-ignore
  const user = c.get('user') as { id: string }
  // @ts-ignore
  const ws = c.get('activeWorkspace') as { id: string }

  const existing = await prisma.note.findUnique({ where: { id: noteId } })
  if (!existing || existing.workspaceId !== ws.id || existing.deletedAt) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Note not found' } }, 404)
  }

  if (existing.userId !== user.id) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Only the owner can delete this note' } }, 403)
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    workspaceId: ws.id,
    userId: user.id,
    action: 'NOTE_DELETE',
    entity: 'Note',
    entityId: note.id,
  })

  return c.json({ note })
})
