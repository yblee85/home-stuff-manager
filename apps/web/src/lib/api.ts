const API_URL = process.env.API_URL

async function apiFetch(path: string, options?: RequestInit & { headers?: Record<string, string> }) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status })
  }
  return res.json()
}

function parseSessionIdFromSetCookie(setCookie: string | null) {
  if (!setCookie) return null
  const first = setCookie.split(';')[0]
  if (!first.startsWith('session_id=')) return null
  return first.slice('session_id='.length)
}

export const api = {
  auth: {
    register: (body: { email: string; name: string; password: string }) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }) as Promise<{ id: string; email: string; name: string }>,
    login: async (body: { email: string; password: string }) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status })
      }
      const user = (await res.json()) as { id: string; email: string; name: string }
      return {
        user,
        sessionId: parseSessionIdFromSetCookie(res.headers.get('set-cookie')),
      }
    },
    session: (cookieHeader: string) =>
      apiFetch('/auth/session', { headers: { Cookie: cookieHeader } }) as Promise<{
        user: { id: string; email: string; name: string | null }
      }>,
    logout: (cookieHeader: string) =>
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
      }),
  },
  health: () => apiFetch('/health') as Promise<{ status: string }>,
}
