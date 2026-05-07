import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function isENOENT(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT'
}

export function imageMimeFromBuffer(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (buf.length >= 12 && buf.subarray(0, 4).equals(Buffer.from('RIFF')) && buf.subarray(8, 12).equals(Buffer.from('WEBP')))
    return 'image/webp'
  if (
    buf.length >= 6 &&
    (buf.subarray(0, 3).equals(Buffer.from('GIF87')) || buf.subarray(0, 3).equals(Buffer.from('GIF89')))
  )
    return 'image/gif'
  return null
}

function tempPath(prefix: string) {
  return path.join(os.tmpdir(), `${prefix}-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`)
}

/** Try several CLI shapes: IM7 `magick`, legacy `convert`, and output path variants for Alpine/IM6. */
async function runMagickResize(inputPath: string, outputJpg: string): Promise<void> {
  const common = ['-auto-orient', '-resize', '1200x1200>', '-strip', '-quality', '85'] as const
  const attempts: [string, string[]][] = [
    ['magick', [inputPath, ...common, `JPEG:${outputJpg}`]],
    ['magick', [inputPath, ...common, outputJpg]],
    ['convert', [inputPath, ...common, outputJpg]],
  ]

  let lastErr: unknown
  let sawENOENT = false

  for (const [cmd, args] of attempts) {
    try {
      await execFileAsync(cmd, args, { maxBuffer: 15 * 1024 * 1024 })
      return
    } catch (err) {
      lastErr = err
      if (isENOENT(err)) sawENOENT = true
    }
  }

  if (sawENOENT) {
    throw new Error('ImageMagick not found on PATH (install imagemagick or rebuild the API image)')
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

/**
 * Writes resized JPEG to `{uploadRoot}/items/{itemId}/photo.jpg`.
 * @returns storage-relative POSIX path `items/{itemId}/photo.jpg`
 */
export async function processUploadToItemPhoto(uploadRoot: string, itemId: string, inputBuffer: Buffer): Promise<string> {
  if (!imageMimeFromBuffer(inputBuffer)) throw new Error('Unsupported image format')

  const itemDir = path.join(uploadRoot, 'items', itemId)
  await fs.mkdir(itemDir, { recursive: true })

  // Input can live under /tmp; output must stay on the same FS as `photo.jpg` or `rename(2)` fails with EXDEV
  // when the upload dir is a Docker volume (different mount than /tmp).
  const tmpIn = tempPath('hs-raw')
  const tmpOut = path.join(itemDir, `_out_${Date.now()}_${Math.random().toString(16).slice(2)}.jpg`)
  const finalAbs = path.join(itemDir, 'photo.jpg')

  await fs.writeFile(tmpIn, inputBuffer)

  try {
    await runMagickResize(tmpIn, tmpOut)
    await fs.rename(tmpOut, finalAbs)
  } finally {
    await fs.rm(tmpIn, { force: true }).catch(() => {})
    await fs.rm(tmpOut, { force: true }).catch(() => {})
  }

  return path.posix.join('items', itemId, 'photo.jpg')
}
