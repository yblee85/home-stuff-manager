import net from 'node:net'

const DEFAULT_DB = 'postgres://postgres:postgres@127.0.0.1:5432/homestuff_test'

function pgHostPort(connectionString: string): { host: string; port: number } {
  try {
    const u = new URL(connectionString.replace(/^postgres(ql)?:/i, 'http:'))
    return {
      host: u.hostname || '127.0.0.1',
      port: u.port ? Number(u.port) : 5432,
    }
  } catch {
    return { host: '127.0.0.1', port: 5432 }
  }
}

/** Runs once before integration tests; fails fast with a clear message if Postgres is down. */
export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? DEFAULT_DB
  const { host, port } = pgHostPort(url)

  try {
    await new Promise<void>((resolve, reject) => {
      const socket = net.connect({ host, port })
      const t = setTimeout(() => {
        socket.destroy()
        reject(new Error('ETIMEDOUT'))
      }, 8000)

      socket.once('connect', () => {
        clearTimeout(t)
        socket.end()
        resolve()
      })
      socket.once('error', (err) => {
        clearTimeout(t)
        reject(err)
      })
    })
  } catch (err) {
    const code =
      err instanceof Error && err.message === 'ETIMEDOUT'
        ? 'ETIMEDOUT'
        : err && typeof err === 'object' && 'code' in err
          ? String((err as NodeJS.ErrnoException).code)
          : 'unknown'
    throw new Error(
      `Postgres is not reachable at ${host}:${port} (${code}). ` +
        `Integration tests need a running database. Example: \`docker compose up -d db\` ` +
        `then create DB homestuff_test if needed, and run tests (default: ${DEFAULT_DB}).`,
    )
  }
}
