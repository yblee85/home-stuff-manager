import Link from 'next/link'
import { redirect } from 'next/navigation'
import { api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export default async function LocationsPage() {
  const cookieHeader = await getRequestCookieHeader()
  if (!cookieHeader) redirect('/login')

  const { locations } = await api.locations.list(cookieHeader)

  return (
    <main>
      <h1>Locations</h1>

      <ul>
        {locations.map((loc) => (
          <li key={loc.id}>
            <Link href={`/locations/${loc.id}`}>{loc.name}</Link> ({loc.role})
          </li>
        ))}
      </ul>

      <h2>Create location</h2>
      <form action={async (formData) => {
        'use server'
        const { createLocationAction } = await import('./actions')
        await createLocationAction(formData)
      }}>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required />
        <button type="submit">Create</button>
      </form>
    </main>
  )
}

