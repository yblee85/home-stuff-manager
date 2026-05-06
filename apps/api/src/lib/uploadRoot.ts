import fs from 'node:fs'
import path from 'node:path'

/** Directory on disk where item photos are stored (Docker volume in production). */
export function getUploadRoot(): string {
  const raw = process.env.UPLOAD_DIR
  if (raw && raw.trim()) return path.resolve(raw.trim())
  return path.resolve(process.cwd(), 'data', 'uploads')
}

export function ensureUploadRoot(): void {
  fs.mkdirSync(getUploadRoot(), { recursive: true })
}
