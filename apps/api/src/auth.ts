import { and, eq, gt } from 'drizzle-orm'
import type { FastifyRequest } from 'fastify'
import { db } from './db/index.js'
import { sessions, users } from './db/schema.js'

export type AuthedUser = { id: string; email: string; name: string | null }

export function getSessionIdFromCookieHeader(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) return null
  const pairs = cookieHeader.split(';').map((part) => part.trim())
  const cookie = pairs.find((part) => part.startsWith(`${cookieName}=`))
  if (!cookie) return null
  return cookie.slice(`${cookieName}=`.length)
}

export async function getUserFromRequestSession(req: FastifyRequest, cookieName: string): Promise<AuthedUser | null> {
  const sessionId = getSessionIdFromCookieHeader(req.headers.cookie, cookieName)
  if (!sessionId) return null

  const now = new Date()
  const [row] = await db
    .select({
      userId: sessions.userId,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1)

  if (!row) return null
  return { id: row.userId, email: row.email, name: row.name }
}

