'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') as string)?.trim()
    const name = (fd.get('name') as string)?.trim()
    const password = fd.get('password') as string

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    })

    let data: { error?: string } = {}
    try {
      data = (await res.json()) as { error?: string }
    } catch {
      // non-JSON body
    }

    setPending(false)

    if (!res.ok) {
      setError(
        res.status === 409
          ? (data.error ?? 'That email is already registered.')
          : (data.error ?? `Request failed (${res.status})`),
      )
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required disabled={pending} />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required disabled={pending} />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={8} required disabled={pending} />
      </div>
      {error ? (
        <p role="alert" style={{ color: 'crimson' }}>
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Register'}
      </button>
    </form>
  )
}
