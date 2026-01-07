import { createMiddleware } from 'hono/factory'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from '../prisma'
import { env } from '../env'
import type { AuthUser } from '../context'

const secret = new TextEncoder().encode(env.jwtSecret)

export const authMiddleware = createMiddleware(async (c, next) => {
  const auth = c.req.header('authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHENTICATED', message: 'Missing or invalid authorization header' } }, 401)
  }
  const token = auth.substring('Bearer '.length)
  try {
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub as string | undefined
    if (!userId) throw new Error('No sub in token')
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
    if (!user) {
      return c.json({ error: { code: 'UNAUTHENTICATED', message: 'User no longer exists' } }, 401)
    }
    // attach to context
    // @ts-ignore hono custom var
    c.set('user', user as AuthUser)
    await next()
  } catch (e: any) {
    return c.json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } }, 401)
  }
})

export async function signJwt(userId: string) {
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}
