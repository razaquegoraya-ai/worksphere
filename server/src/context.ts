import { PrismaClient } from '@prisma/client'
import { User, Workspace, Role, MembershipStatus } from '@prisma/client'
import { prisma } from './prisma'

export type AuthUser = Pick<User, 'id' | 'email'>

export type RequestContext = {
  prisma: PrismaClient
  user?: AuthUser
  activeWorkspace?: Pick<Workspace, 'id' | 'name'>
  userRole?: Role
}

export const createBaseContext = (): RequestContext => ({ prisma })
