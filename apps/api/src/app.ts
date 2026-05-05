import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { runMigrations } from './db/migrate.js'
import { authRoutes } from './routers/auth.js'
import { authGuard } from './plugins/authGuard.js'
import { itemRoutes } from './routers/items.js'
import { locationRoutes } from './routers/locations.js'

export type BuildAppOptions = {
  /** Run Drizzle migrations (requires DATABASE_URL). */
  migrate?: boolean
  logger?: boolean
}

export async function buildApp(options: BuildAppOptions = {}) {
  const { migrate = false, logger = false } = options

  const server = Fastify({ logger })

  if (migrate) {
    await runMigrations()
  }

  await server.register(cors, { origin: true, credentials: true })
  await server.register(cookie)
  await server.register(authGuard)

  server.get('/health', async () => ({ status: 'ok' }))
  await server.register(authRoutes, { prefix: '/auth' })
  await server.register(locationRoutes)
  await server.register(itemRoutes)

  return server
}
