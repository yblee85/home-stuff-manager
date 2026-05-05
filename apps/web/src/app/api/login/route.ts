import { NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api'
import { extractSessionIdFromResponse, sessionCookieName } from '@/lib/sessionCookie'

export async function POST(req: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  let apiUrl: string
  try {
    apiUrl = getApiBaseUrl()
  } catch {
    return NextResponse.json({ error: 'Server misconfiguration: API_URL is not set' }, { status: 500 })
  }

  const apiRes = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const cookieName = sessionCookieName()

  if (!apiRes.ok) {
    const errBody = await apiRes.json().catch(() => ({ error: 'Login failed' }))
    return NextResponse.json(
      { error: typeof errBody.error === 'string' ? errBody.error : 'Login failed' },
      { status: apiRes.status },
    )
  }

  const user = (await apiRes.json()) as { id: string; email: string; name: string }
  const sessionId = extractSessionIdFromResponse(apiRes, cookieName)
  if (!sessionId) {
    return NextResponse.json({ error: 'Login succeeded but session cookie was not issued' }, { status: 502 })
  }

  const response = NextResponse.json(user, { status: 200 })
  response.cookies.set(cookieName, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return response
}
