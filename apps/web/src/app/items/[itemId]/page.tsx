import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export default async function ItemDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const cookieHeader = await getRequestCookieHeader()
  if (!cookieHeader) redirect('/login')

  let item: Awaited<ReturnType<(typeof api)['items']['get']>>
  try {
    item = await api.items.get(cookieHeader, itemId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    if (e instanceof ApiError && e.status === 401) redirect('/login')
    throw e
  }

  const { locationId, ...rest } = item
  const zoneId = rest.zoneId

  return (
    <main>
      <p>
        <Link href={`/locations/${locationId}/zones/${zoneId}`}>← Back to zone</Link>
      </p>
      <h1>{rest.name}</h1>
      {rest.category ? <p>Category: {rest.category}</p> : null}
      {rest.tags.length > 0 ? (
        <p>
          Tags: {rest.tags.join(', ')}
        </p>
      ) : null}
      {rest.purchaseUrl ? (
        <p>
          Purchase:{' '}
          <a href={rest.purchaseUrl} target="_blank" rel="noopener noreferrer">
            {rest.purchaseUrl}
          </a>
        </p>
      ) : null}
      {rest.specs ? (
        <section>
          <h2>Specs</h2>
          {rest.specs.dimension ? (
            <p>
              Dimensions: {rest.specs.dimension.w} × {rest.specs.dimension.l} × {rest.specs.dimension.h}{' '}
              {rest.specs.dimension.unit}
            </p>
          ) : null}
          {rest.specs.weight ? (
            <p>
              Weight: {rest.specs.weight.value} {rest.specs.weight.unit}
            </p>
          ) : null}
          {rest.specs.info ? <p>Info: {rest.specs.info}</p> : null}
        </section>
      ) : null}
      {rest.notes ? (
        <section>
          <h2>Notes</h2>
          <p>{rest.notes}</p>
        </section>
      ) : null}
      <p>
        <small>Created {new Date(rest.createdAt).toLocaleString()}</small>
      </p>
      <p>
        <Link href={`/items/${itemId}/edit`}>Edit</Link>
      </p>
      <form
        action={async () => {
          'use server'
          const { deleteItemAction } = await import('./actions')
          await deleteItemAction(locationId, zoneId, itemId)
        }}
      >
        <button type="submit">Delete item</button>
      </form>
    </main>
  )
}
