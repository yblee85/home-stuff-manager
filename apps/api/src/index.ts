import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { runMigrations } from './db/migrate.js'
import { authRoutes } from './routers/auth.js'

const server = Fastify({ logger: true })

async function main() {
  await runMigrations()

  await server.register(cors, { origin: true, credentials: true })
  await server.register(cookie)

  server.get('/health', async () => ({ status: 'ok' }))
  await server.register(authRoutes, { prefix: '/auth' })

  await server.listen({ port: 3001, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
