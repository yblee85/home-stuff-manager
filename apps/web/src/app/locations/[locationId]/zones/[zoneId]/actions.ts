'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'
import { parseSpecsFromForm, parseTagsField } from '@/lib/itemForm'

export async function createItemAction(locationId: string, zoneId: string, formData: FormData) {
  const cookieHeader = await getRequestCookieHeader()
  await api.items.create(cookieHeader, locationId, zoneId, {
    name: (formData.get('name') as string).trim(),
    category: (formData.get('category') as string)?.trim() || null,
    tags: parseTagsField(formData.get('tags')),
    purchaseUrl: (formData.get('purchaseUrl') as string)?.trim() || null,
    specs: parseSpecsFromForm(formData),
    notes: (formData.get('notes') as string)?.trim() || null,
  })
  redirect(`/locations/${locationId}/zones/${zoneId}`)
}
