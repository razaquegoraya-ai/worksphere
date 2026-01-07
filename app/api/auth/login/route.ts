import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/server/prisma'
import { signJwt, jsonError } from '@/lib/server/auth'

const loginSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(8) 
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('BAD_REQUEST', parsed.error.message, 400)
    }
    
    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return jsonError('UNAUTHORIZED', 'Invalid credentials', 401)
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return jsonError('UNAUTHORIZED', 'Invalid credentials', 401)
    }

    const token = await signJwt(user.id)
    return Response.json({ token, user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('Login error:', error)
    return jsonError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
