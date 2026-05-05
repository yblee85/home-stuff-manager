'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export async function createZoneAction(locationId: string, formData: FormData) {
  const name = formData.get('name') as string
  const cookieHeader = await getRequestCookieHeader()
  await api.locations.createZone(cookieHeader, locationId, { name })
  redirect(`/locations/${locationId}`)
}

export async function deleteZoneAction(locationId: string, zoneId: string) {
  const cookieHeader = await getRequestCookieHeader()
  await api.locations.deleteZone(cookieHeader, zoneId)
  redirect(`/locations/${locationId}`)
}

