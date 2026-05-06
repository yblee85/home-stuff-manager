import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export default async function ZoneItemsPage({
  params,
}: {
  params: Promise<{ locationId: string; zoneId: string }>
}) {
  const { locationId, zoneId } = await params
  const cookieHeader = await getRequestCookieHeader()
  if (!cookieHeader) redirect('/login')

  let locData: Awaited<ReturnType<(typeof api)['locations']['get']>>
  try {
    locData = await api.locations.get(cookieHeader, locationId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    if (e instanceof ApiError && e.status === 401) redirect('/login')
    throw e
  }

  const zoneMeta = locData.zones.find((z) => z.id === zoneId)
  if (!zoneMeta) notFound()

  let itemsData: Awaited<ReturnType<(typeof api)['items']['listInZone']>>
  try {
    itemsData = await api.items.listInZone(cookieHeader, locationId, zoneId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    if (e instanceof ApiError && e.status === 401) redirect('/login')
    throw e
  }

  return (
    <main>
      <p>
        <Link href={`/locations/${locationId}`}>← Back to {locData.location.name}</Link>
      </p>
      <h1>
        {locData.location.name} — {zoneMeta.name}
      </h1>

      <h2>Items</h2>
      <ul>
        {itemsData.items.map((item) => (
          <li key={item.id}>
            <Link href={`/items/${item.id}`}>{item.name}</Link>
            {item.category ? ` (${item.category})` : null}
          </li>
        ))}
      </ul>

      <h2>Add item</h2>
      <form
        encType="multipart/form-data"
        action={async (formData) => {
          'use server'
          const { createItemAction } = await import('./actions')
          await createItemAction(locationId, zoneId, formData)
        }}
      >
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <input id="category" name="category" type="text" />
        </div>
        <div>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" type="text" />
        </div>
        <div>
          <label htmlFor="purchaseUrl">Purchase URL</label>
          <input id="purchaseUrl" name="purchaseUrl" type="text" />
        </div>
        <fieldset>
          <legend>Specs — dimensions</legend>
          <label>
            W <input name="dim_w" type="number" step="any" />
          </label>{' '}
          <label>
            L <input name="dim_l" type="number" step="any" />
          </label>{' '}
          <label>
            H <input name="dim_h" type="number" step="any" />
          </label>{' '}
          <label>
            Unit <input name="dim_unit" type="text" placeholder="e.g. cm" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Specs — weight</legend>
          <label>
            Value <input name="weight_value" type="number" step="any" />
          </label>{' '}
          <label>
            Unit <input name="weight_unit" type="text" placeholder="e.g. kg" />
          </label>
        </fieldset>
        <div>
          <label htmlFor="specs_info">Specs — other info</label>
          <textarea id="specs_info" name="specs_info" rows={2} />
        </div>
        <div>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={2} />
        </div>
        <div>
          <label htmlFor="photo">Photo (optional)</label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
        </div>
        <button type="submit">Create item</button>
      </form>
    </main>
  )
}
