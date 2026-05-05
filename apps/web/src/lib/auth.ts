import { cookies } from 'next/headers'
import { api } from './api'
import { getRequestCookieHeader } from './cookieHeader'
import { sessionCookieName } from './sessionCookie'

export type SessionUser = {
  id: string
  email: string
  name: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieHeader = await getRequestCookieHeader()
  if (!cookieHeader) return null
  try {
    const session = await api.auth.session(cookieHeader)
    return session.user
  } catch {
    return null
  }
}

export async function logout() {
  const cookieHeader = await getRequestCookieHeader()
  await api.auth.logout(cookieHeader)
  const jar = await cookies()
  jar.delete(sessionCookieName())
}
