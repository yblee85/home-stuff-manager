import { NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api'

export async function POST(req: Request) {
  let body: { email?: string; name?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }

  let apiUrl: string
  try {
    apiUrl = getApiBaseUrl()
  } catch {
    return NextResponse.json({ error: 'Server misconfiguration: API_URL is not set' }, { status: 500 })
  }

  const apiRes = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  })

  const resBody = (await apiRes.json().catch(() => ({}))) as { error?: string; id?: string }

  if (!apiRes.ok) {
    return NextResponse.json(
      { error: typeof resBody.error === 'string' ? resBody.error : 'Registration failed' },
      { status: apiRes.status },
    )
  }

  return NextResponse.json(resBody, { status: apiRes.status })
}
