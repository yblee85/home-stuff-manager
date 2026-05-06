import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { runMigrations } from './db/migrate.js'
import { authRoutes } from './routers/auth.js'
import { authGuard } from './plugins/authGuard.js'
import { itemRoutes } from './routers/items.js'
import { locationRoutes } from './routers/locations.js'
import { ensureUploadRoot, getUploadRoot } from './lib/uploadRoot.js'

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

  ensureUploadRoot()
  await server.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  })
  await server.register(fastifyStatic, {
    root: getUploadRoot(),
    prefix: '/files/',
    decorateReply: false,
  })

  await server.register(cors, { origin: true, credentials: true })
  await server.register(cookie)
  await server.register(authGuard)

  server.get('/health', async () => ({ status: 'ok' }))
  await server.register(authRoutes, { prefix: '/auth' })
  await server.register(locationRoutes)
  await server.register(itemRoutes)

  return server
}
