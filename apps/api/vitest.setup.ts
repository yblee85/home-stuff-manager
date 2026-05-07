import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Integration tests use real Postgres — never point this at production.
 *
 * Default DB name matches CI (`homestuff_test`), separate from typical dev DB (`homestuff`).
 * If `DATABASE_URL` is unset, use DB `homestuff_test`. New `docker compose` Postgres runs
 * `docker/postgres/docker-entrypoint-initdb.d/` once (empty volume). Existing `pgdata` volumes:
 *   docker compose exec db psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE homestuff_test;"
 */
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5432/homestuff_test'
}

if (!process.env.UPLOAD_DIR) {
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'homestuff-api-upload-'))
}
