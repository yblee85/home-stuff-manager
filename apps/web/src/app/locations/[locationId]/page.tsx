import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export default async function LocationPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params
  const cookieHeader = await getRequestCookieHeader()
  if (!cookieHeader) redirect('/login')

  let data: Awaited<ReturnType<(typeof api)['locations']['get']>>
  try {
    data = await api.locations.get(cookieHeader, locationId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    if (e instanceof ApiError && e.status === 401) redirect('/login')
    throw e
  }

  return (
    <main>
      <p>
        <Link href="/locations">← Back</Link>
      </p>
      <h1>{data.location.name}</h1>
      <p>Role: {data.role}</p>

      <h2>Zones</h2>
      <ul>
        {data.zones.map((z) => (
          <li key={z.id}>
            {z.name}{' '}
            <form
              action={async () => {
                'use server'
                const { deleteZoneAction } = await import('./actions')
                await deleteZoneAction(locationId, z.id)
              }}
              style={{ display: 'inline' }}
            >
              <button type="submit">Delete</button>
            </form>
          </li>
        ))}
      </ul>

      <h3>Create zone</h3>
      <form
        action={async (formData) => {
          'use server'
          const { createZoneAction } = await import('./actions')
          await createZoneAction(locationId, formData)
        }}
      >
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required />
        <button type="submit">Create</button>
      </form>
    </main>
  )
}

