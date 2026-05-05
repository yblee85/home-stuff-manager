import { cookies } from 'next/headers'

/** Build a `Cookie` header string for server-side `fetch` to the API (Next 15+ async cookies). */
export async function getRequestCookieHeader(): Promise<string> {
  const jar = await cookies()
  return jar.getAll().map(({ name, value }) => `${name}=${value}`).join('; ')
}
