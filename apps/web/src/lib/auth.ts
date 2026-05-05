import { api } from './api'
import { cookies } from 'next/headers'

export type SessionUser = {
  id: string
  email: string
  name: string | null
}

const SESSION_COOKIE_NAME = 'session_id'

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const cookieHeader = cookieStore.toString()
  if (!cookieHeader) return null
  try {
    const session = await api.auth.session(cookieHeader)
    return session.user
  } catch {
    return null
  }
}

export async function loginWithCredentials(email: string, password: string) {
  const { user, sessionId } = await api.auth.login({ email, password })
  if (!sessionId) throw new Error('Login succeeded but no session cookie returned')
  cookies().set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return user
}

export async function logout() {
  const cookieStore = cookies()
  await api.auth.logout(cookieStore.toString())
  cookieStore.delete(SESSION_COOKIE_NAME)
}
