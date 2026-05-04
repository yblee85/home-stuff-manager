export type { AppRouter } from './trpc.js'

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './trpc.js'
import { runMigrations } from './db/migrate.js'

const server = Fastify({ logger: true })

async function main() {
  await runMigrations()

  await server.register(cors, { origin: true })

  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter },
  })

  server.get('/health', async () => ({ status: 'ok' }))

  await server.listen({ port: 3001, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
