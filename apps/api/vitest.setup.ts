/**
 * Local `pnpm test` uses docker-compose Postgres on localhost by default
 * (see .env.example). CI overrides DATABASE_URL via the workflow env.
 */
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5432/homestuff'
}
