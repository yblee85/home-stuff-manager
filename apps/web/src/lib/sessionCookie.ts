/** Must match API `SESSION_COOKIE_NAME` (default `session_id`). */
export function sessionCookieName() {
  return process.env.SESSION_COOKIE_NAME ?? 'session_id'
}

/** Read session id from a fetch `Response` Set-Cookie headers (Node/undici exposes `getSetCookie`). */
export function extractSessionIdFromResponse(res: Response, cookieName: string): string | null {
  const h = res.headers as Headers & { getSetCookie?: () => string[] }
  const chunks =
    typeof h.getSetCookie === 'function'
      ? h.getSetCookie()
      : (() => {
          const single = h.get('set-cookie')
          return single ? [single] : []
        })()

  for (const raw of chunks) {
    const firstPair = raw.split(';')[0]?.trim()
    if (firstPair?.startsWith(`${cookieName}=`)) return firstPair.slice(cookieName.length + 1)
  }
  return null
}
