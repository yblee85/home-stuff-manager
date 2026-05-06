import { rm } from 'node:fs/promises'
import path from 'node:path'
import { getUploadRoot } from './uploadRoot.js'

/** Remove stored image directory for an item (`items/<id>/`). */
export async function removeStoredItemDir(storageRelative: string | null): Promise<void> {
  if (!storageRelative) return
  const root = getUploadRoot()
  const absFile = path.join(root, ...storageRelative.split('/'))
  await rm(path.dirname(absFile), { recursive: true, force: true }).catch(() => {})
}
