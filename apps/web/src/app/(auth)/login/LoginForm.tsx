'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string)?.trim()
    const password = fd.get('password') as string

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    let data: { error?: string } = {}
    try {
      data = (await res.json()) as { error?: string }
    } catch {
      // non-JSON body
    }

    setPending(false)

    if (res.status === 401) {
      setError(data.error ?? 'Invalid email or password.')
      return
    }

    if (!res.ok) {
      setError(data.error ?? `Request failed (${res.status})`)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required disabled={pending} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required disabled={pending} />
      </div>
      {error ? (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Login'}
      </button>
    </form>
  )
}
