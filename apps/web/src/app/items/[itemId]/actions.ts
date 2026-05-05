'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'
import { parseSpecsFromForm, parseTagsField } from '@/lib/itemForm'

export async function deleteItemAction(locationId: string, zoneId: string, itemId: string) {
  const cookieHeader = await getRequestCookieHeader()
  const res = await api.items.delete(cookieHeader, itemId)
  if (!res.ok) throw new Error('Failed to delete item')
  redirect(`/locations/${locationId}/zones/${zoneId}`)
}

export async function updateItemAction(
  locationId: string,
  zoneId: string,
  itemId: string,
  formData: FormData,
) {
  const cookieHeader = await getRequestCookieHeader()
  await api.items.update(cookieHeader, itemId, {
    name: (formData.get('name') as string).trim(),
    category: (formData.get('category') as string)?.trim() || null,
    tags: parseTagsField(formData.get('tags')),
    purchaseUrl: (formData.get('purchaseUrl') as string)?.trim() || null,
    specs: parseSpecsFromForm(formData),
    notes: (formData.get('notes') as string)?.trim() || null,
  })
  redirect(`/items/${itemId}`)
}
