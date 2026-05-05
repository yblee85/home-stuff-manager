import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { sessions, users } from '../db/schema.js'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'session_id'
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 24 * 7)

function getSessionId(rawCookieHeader: string | undefined) {
  if (!rawCookieHeader) return null
  const pairs = rawCookieHeader.split(';').map((part) => part.trim())
  const cookie = pairs.find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
  if (!cookie) return null
  return cookie.slice(`${SESSION_COOKIE_NAME}=`.length)
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', async (req, reply) => {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.data.email)).limit(1)
    if (existing.length > 0) return reply.status(409).send({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(body.data.password, 12)
    const [user] = await db
      .insert(users)
      .values({ email: body.data.email, name: body.data.name, passwordHash })
      .returning({ id: users.id, email: users.email, name: users.name })

    return reply.status(201).send(user)
  })

  fastify.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const [user] = await db.select().from(users).where(eq(users.email, body.data.email)).limit(1)
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(body.data.password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    })

    reply.setCookie(SESSION_COOKIE_NAME, sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
    })

    return { id: user.id, email: user.email, name: user.name }
  })

  fastify.get('/session', async (req, reply) => {
    const sessionId = getSessionId(req.headers.cookie)
    if (!sessionId) return reply.status(401).send({ error: 'Unauthenticated' })

    const now = new Date()
    const [session] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        email: users.email,
        name: users.name,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
      .limit(1)

    if (!session) {
      reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
      return reply.status(401).send({ error: 'Unauthenticated' })
    }

    return {
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
      },
    }
  })

  fastify.post('/logout', async (req, reply) => {
    const sessionId = getSessionId(req.headers.cookie)
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId))
    }
    reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
    return { ok: true }
  })
}
