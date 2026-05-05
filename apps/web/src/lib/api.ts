export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function apiBaseUrl() {
  const base = process.env.API_URL
  if (!base) {
    throw new ApiError('Server misconfiguration: set API_URL for the Next.js server (e.g. http://api:3001 in Docker)', 500)
  }
  return base.replace(/\/$/, '')
}

/** Base URL for backend API (used by Route Handlers and `api` helpers). */
export function getApiBaseUrl(): string {
  return apiBaseUrl()
}

async function apiFetch(path: string, options?: RequestInit & { headers?: Record<string, string> }) {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(err.error ?? 'Request failed', res.status)
  }
  return res.json()
}

export const api = {
  auth: {
    register: (body: { email: string; name: string; password: string }) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }) as Promise<{ id: string; email: string; name: string }>,
    session: (cookieHeader: string) =>
      apiFetch('/auth/session', { headers: { Cookie: cookieHeader } }) as Promise<{
        user: { id: string; email: string; name: string | null }
      }>,
    logout: (cookieHeader: string) =>
      fetch(`${apiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
      }),
  },
  health: () => apiFetch('/health') as Promise<{ status: string }>,
  locations: {
    list: (cookieHeader: string) =>
      apiFetch('/locations', { headers: { Cookie: cookieHeader } }) as Promise<{
        locations: { id: string; name: string; role: string; createdAt: string }[]
      }>,
    create: (cookieHeader: string, body: { name: string }) =>
      apiFetch('/locations', { method: 'POST', body: JSON.stringify(body), headers: { Cookie: cookieHeader } }) as Promise<{
        id: string
        name: string
        createdAt: string
      }>,
    get: (cookieHeader: string, locationId: string) =>
      apiFetch(`/locations/${locationId}`, { headers: { Cookie: cookieHeader } }) as Promise<{
        location: { id: string; name: string }
        role: string
        zones: { id: string; name: string; createdAt: string }[]
      }>,
    createZone: (cookieHeader: string, locationId: string, body: { name: string }) =>
      apiFetch(`/locations/${locationId}/zones`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { Cookie: cookieHeader },
      }) as Promise<{ id: string; name: string; createdAt: string }>,
    deleteZone: (cookieHeader: string, zoneId: string) =>
      fetch(`${apiBaseUrl()}/zones/${zoneId}`, { method: 'DELETE', headers: { Cookie: cookieHeader } }),
  },
}
