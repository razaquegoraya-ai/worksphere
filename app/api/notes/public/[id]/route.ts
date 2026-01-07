import { NextRequest } from 'next/server'
import { prisma } from '@/lib/server/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      content: true,
      visibility: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  })

  if (!note || note.visibility !== 'PUBLIC') {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'Note not found or not public' } },
      { status: 404 }
    )
  }

  return Response.json({ note })
}
