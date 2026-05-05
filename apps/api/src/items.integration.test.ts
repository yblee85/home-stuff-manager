import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'

const jsonHeaders = { 'content-type': 'application/json' }

function cookieHeaderFromLoginResponse(setCookie: string | string[] | undefined): string {
  expect(setCookie).toBeDefined()
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie
  return first!.split(';')[0]!.trim()
}

async function registerAndLogin(app: Awaited<ReturnType<typeof buildApp>>, label: string) {
  const email = `${label}-${Date.now()}@example.com`
  const password = 'password12345'
  const reg = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, name: 'Test', password },
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
  const cookie = cookieHeaderFromLoginResponse(login.headers['set-cookie'])
  return { email, cookie }
}

function authHeaders(cookie: string) {
  return { ...jsonHeaders, cookie }
}

describe('items API (integration)', () => {
  let app!: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp({ migrate: true, logger: false })
  })

  afterAll(async () => {
    await app?.close()
  })

  it('creates, lists, gets, patches, deletes an item in a zone', async () => {
    const { cookie } = await registerAndLogin(app, 'items-crud')
    const h = authHeaders(cookie)

    const locRes = await app.inject({
      method: 'POST',
      url: '/locations',
      headers: h,
      payload: { name: 'Test Location' },
    })
    expect(locRes.statusCode).toBe(201)
    const location = JSON.parse(locRes.payload) as { id: string }

    const zoneRes = await app.inject({
      method: 'POST',
      url: `/locations/${location.id}/zones`,
      headers: h,
      payload: { name: 'Garage' },
    })
    expect(zoneRes.statusCode).toBe(201)
    const zone = JSON.parse(zoneRes.payload) as { id: string }

    const createRes = await app.inject({
      method: 'POST',
      url: `/locations/${location.id}/zones/${zone.id}/items`,
      headers: h,
      payload: {
        name: 'Filter',
        category: 'Plumbing',
        tags: ['sink', '10-inch'],
        purchaseUrl: 'https://example.com/buy',
        specs: {
          dimension: { w: 10, l: 20, h: 1, unit: 'cm' },
          weight: { value: 0.5, unit: 'kg' },
          info: 'Thread type M',
        },
        notes: 'Under sink',
      },
    })
    expect(createRes.statusCode).toBe(201)
    const created = JSON.parse(createRes.payload) as { id: string; zoneId: string; tags: string[] }
    expect(created.zoneId).toBe(zone.id)
    expect(created.tags).toEqual(['sink', '10-inch'])

    const listRes = await app.inject({
      method: 'GET',
      url: `/locations/${location.id}/zones/${zone.id}/items`,
      headers: h,
    })
    expect(listRes.statusCode).toBe(200)
    const list = JSON.parse(listRes.payload) as { items: { id: string }[] }
    expect(list.items).toHaveLength(1)

    const getRes = await app.inject({
      method: 'GET',
      url: `/items/${created.id}`,
      headers: h,
    })
    expect(getRes.statusCode).toBe(200)
    const item = JSON.parse(getRes.payload) as { name: string; locationId: string; specs: { info?: string } }
    expect(item.name).toBe('Filter')
    expect(item.locationId).toBe(location.id)
    expect(item.specs?.info).toBe('Thread type M')

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/items/${created.id}`,
      headers: h,
      payload: { name: 'Filter (updated)', tags: ['sink'] },
    })
    expect(patchRes.statusCode).toBe(200)
    const updated = JSON.parse(patchRes.payload) as { name: string }
    expect(updated.name).toBe('Filter (updated)')

    const delRes = await app.inject({
      method: 'DELETE',
      url: `/items/${created.id}`,
      headers: { cookie },
    })
    expect(delRes.statusCode).toBe(200)

    const listAfter = await app.inject({
      method: 'GET',
      url: `/locations/${location.id}/zones/${zone.id}/items`,
      headers: h,
    })
    const empty = JSON.parse(listAfter.payload) as { items: unknown[] }
    expect(empty.items).toHaveLength(0)
  })

  it('returns 404 when zone is not under the location in the path', async () => {
    const { cookie } = await registerAndLogin(app, 'items-wrong-loc')
    const h = authHeaders(cookie)

    const locA = JSON.parse(
      (
        await app.inject({
          method: 'POST',
          url: '/locations',
          headers: h,
          payload: { name: 'A' },
        })
      ).payload,
    ) as { id: string }
    const locB = JSON.parse(
      (
        await app.inject({
          method: 'POST',
          url: '/locations',
          headers: h,
          payload: { name: 'B' },
        })
      ).payload,
    ) as { id: string }

    const zoneB = JSON.parse(
      (
        await app.inject({
          method: 'POST',
          url: `/locations/${locB.id}/zones`,
          headers: h,
          payload: { name: 'Z' },
        })
      ).payload,
    ) as { id: string }

    const wrongPath = await app.inject({
      method: 'GET',
      url: `/locations/${locA.id}/zones/${zoneB.id}/items`,
      headers: h,
    })
    expect(wrongPath.statusCode).toBe(404)
  })

  it('returns 401 without session for item routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/locations/00000000-0000-0000-0000-000000000001/zones/00000000-0000-0000-0000-000000000002/items',
      headers: jsonHeaders,
    })
    expect(res.statusCode).toBe(401)
  })
})
