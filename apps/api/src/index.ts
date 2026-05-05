import { buildApp } from './app.js'

buildApp({ migrate: true, logger: true })
  .then(async (server) => {
    await server.listen({ port: 3001, host: '0.0.0.0' })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
