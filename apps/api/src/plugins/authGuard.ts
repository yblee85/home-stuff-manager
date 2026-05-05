import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { getUserFromRequestSession, type AuthedUser } from '../auth.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthedUser
  }
}

const authGuardPlugin: FastifyPluginAsync = async (fastify) => {
  const cookieName = process.env.SESSION_COOKIE_NAME ?? 'session_id'

  fastify.decorateRequest('user', undefined)

  fastify.addHook('preHandler', async (req) => {
    // Populate req.user when session exists; routes decide whether to require it.
    req.user = (await getUserFromRequestSession(req, cookieName)) ?? undefined
  })
}

export const authGuard = fp(authGuardPlugin, {
  name: 'auth-guard',
})

