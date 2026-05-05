'use server'

import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export async function createLocationAction(formData: FormData) {
  const name = formData.get('name') as string
  const cookieHeader = await getRequestCookieHeader()
  await api.locations.create(cookieHeader, { name })
  redirect('/locations')
}

