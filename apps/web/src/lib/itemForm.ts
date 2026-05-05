/** Build specs payload from shared new/edit item form fields. */

function numField(formData: FormData, key: string): number {
  const v = formData.get(key)
  if (v === null || v === '') return NaN
  return Number(v)
}

export function parseTagsField(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw.split(',').map((t) => t.trim()).filter(Boolean)
}

export function parseSpecsFromForm(formData: FormData) {
  const unit = (formData.get('dim_unit') as string)?.trim()
  const w = numField(formData, 'dim_w')
  const l = numField(formData, 'dim_l')
  const h = numField(formData, 'dim_h')

  let dimension: { w: number; l: number; h: number; unit: string } | undefined
  if (!Number.isNaN(w) && !Number.isNaN(l) && !Number.isNaN(h) && unit) {
    dimension = { w, l, h, unit }
  }

  const weightValue = numField(formData, 'weight_value')
  const weightUnit = (formData.get('weight_unit') as string)?.trim()
  let weight: { value: number; unit: string } | undefined
  if (!Number.isNaN(weightValue) && weightUnit) {
    weight = { value: weightValue, unit: weightUnit }
  }

  const info = (formData.get('specs_info') as string)?.trim()

  if (!dimension && !weight && !info) return null

  return {
    ...(dimension ? { dimension } : {}),
    ...(weight ? { weight } : {}),
    ...(info ? { info } : {}),
  }
}
