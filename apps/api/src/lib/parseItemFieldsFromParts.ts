/** Mirrors `apps/web` `itemForm` field names for multipart create/update. */

function numField(get: (k: string) => string | undefined, key: string): number {
  const v = get(key)
  if (v === undefined || v === '') return NaN
  return Number(v)
}

export function parseTagsFromFormString(raw: string | undefined): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

export function parseSpecsFromFormMap(get: (k: string) => string | undefined) {
  const unit = get('dim_unit')?.trim()
  const w = numField(get, 'dim_w')
  const l = numField(get, 'dim_l')
  const h = numField(get, 'dim_h')

  let dimension: { w: number; l: number; h: number; unit: string } | undefined
  if (!Number.isNaN(w) && !Number.isNaN(l) && !Number.isNaN(h) && unit) {
    dimension = { w, l, h, unit }
  }

  const weightValue = numField(get, 'weight_value')
  const weightUnit = get('weight_unit')?.trim()
  let weight: { value: number; unit: string } | undefined
  if (!Number.isNaN(weightValue) && weightUnit) {
    weight = { value: weightValue, unit: weightUnit }
  }

  const info = get('specs_info')?.trim()

  if (!dimension && !weight && !info) return null

  return {
    ...(dimension ? { dimension } : {}),
    ...(weight ? { weight } : {}),
    ...(info ? { info } : {}),
  }
}

export function payloadFromFormFieldMap(map: Map<string, string>) {
  const get = (k: string) => map.get(k)
  const name = get('name')?.trim()
  if (!name) return { error: 'Invalid input' as const }

  return {
    ok: true as const,
    data: {
      name,
      category: get('category')?.trim() || null,
      tags: parseTagsFromFormString(get('tags')),
      purchaseUrl: get('purchaseUrl')?.trim() || null,
      specs: parseSpecsFromFormMap(get),
      notes: get('notes')?.trim() || null,
    },
  }
}
