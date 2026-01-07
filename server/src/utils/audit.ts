import { prisma } from '../prisma'
import type { Prisma, PrismaClient } from '@prisma/client'

export async function logAudit(
  params: {
    workspaceId?: string | null
    userId?: string | null
    action: string
    entity?: string | null
    entityId?: string | null
    meta?: any
  },
  client: PrismaClient | Prisma.TransactionClient = prisma
) {
  // Both PrismaClient and TransactionClient expose the same model APIs we use here
  await (client as PrismaClient).auditLog.create({
    data: {
      workspaceId: params.workspaceId || null,
      userId: params.userId || null,
      action: params.action,
      entity: params.entity || null,
      entityId: params.entityId || null,
      meta: params.meta ?? undefined,
    },
  })
}
