import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'

const jsonHeaders = { 'content-type': 'application/json' }

describe('api (integration)', () => {
  let app!: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp({ migrate: true, logger: false })
  })

  afterAll(async () => {
    await app?.close()
  })

  it('GET /health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ status: 'ok' })
  })

  it('POST /auth/register then POST /auth/login sets session cookie', async () => {
    const email = `user-${Date.now()}@example.com`
    const password = 'password1234'

    const reg = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email, name: 'Test User', password },
      headers: jsonHeaders,
    })
    expect(reg.statusCode).toBe(201)

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
      headers: jsonHeaders,
    })
    expect(login.statusCode).toBe(200)
    const setCookie = login.headers['set-cookie']
    expect(setCookie).toBeDefined()
    const firstSetCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
    expect(firstSetCookie).toMatch(/session_id=/)

    const sessionPair = firstSetCookie!.split(';')[0]!.trim()

    const session = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie: sessionPair },
    })
    expect(session.statusCode).toBe(200)
    const body = JSON.parse(session.payload) as { user: { email: string } }
    expect(body.user.email).toBe(email)
  })
})
