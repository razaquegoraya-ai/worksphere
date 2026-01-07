import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../prisma'
import { signJwt } from '../middlewares/auth'
import bcrypt from 'bcryptjs'
import { logAudit } from '../utils/audit'

export const authRouter = new Hono()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(1).default('My Workspace')
})

authRouter.post('/signup', async (c) => {
  const parsed = signupSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  const { email, password, workspaceName } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return c.json({ error: { code: 'CONFLICT', message: 'Email already registered' } }, 409)

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
  return c.json({ token, user: { id: result.user.id, email: result.user.email }, defaultWorkspace: result.workspace })
})

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) })

authRouter.post('/login', async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: { code: 'BAD_REQUEST', message: parsed.error.message } }, 400)
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, 401)

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, 401)

  const token = await signJwt(user.id)
  return c.json({ token, user: { id: user.id, email: user.email } })
})
