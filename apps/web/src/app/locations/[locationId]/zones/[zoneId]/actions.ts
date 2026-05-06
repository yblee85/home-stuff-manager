'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export async function createItemAction(locationId: string, zoneId: string, formData: FormData) {
  const cookieHeader = await getRequestCookieHeader()
  await api.items.createFromForm(cookieHeader, locationId, zoneId, formData)
  redirect(`/locations/${locationId}/zones/${zoneId}`)
}
