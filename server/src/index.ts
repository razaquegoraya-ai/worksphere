import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { env } from './env'
import { createBaseContext } from './context'
import { authRouter } from './routes/auth'
import { workspaceRouter } from './routes/workspaces'
import { memberRouter } from './routes/members'
import { expenseRouter } from './routes/expenses'
import { noteRouter } from './routes/notes'
import { authMiddleware } from './middlewares/auth'
import { workspaceMiddleware } from './middlewares/workspace'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())

// Health
app.get('/health', (c) => c.json({ ok: true, service: 'worksphere-api' }))

// Public note view (no auth required)
app.get('/public/notes/:id', async (c) => {
  const { prisma } = await import('./prisma')
  const noteId = c.req.param('id')
  
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
    return c.json({ error: { code: 'NOT_FOUND', message: 'Note not found or not public' } }, 404)
  }
  
  return c.json({ note })
})

// Public auth endpoints
app.route('/auth', authRouter)

// Authenticated endpoints (no workspace context needed)
// Workspaces: list/create don't need workspace context, only auth
const authOnlyWorkspaces = new Hono()
authOnlyWorkspaces.use('*', authMiddleware)
authOnlyWorkspaces.route('/', workspaceRouter)
app.route('/workspaces', authOnlyWorkspaces)

// Authenticated + workspace context endpoints
const wsScoped = new Hono()
wsScoped.use('*', authMiddleware, workspaceMiddleware)
wsScoped.route('/members', memberRouter)
wsScoped.route('/expenses', expenseRouter)
wsScoped.route('/notes', noteRouter)
app.route('/', wsScoped)

const port = env.port
console.log(`WorkSphere API listening on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
