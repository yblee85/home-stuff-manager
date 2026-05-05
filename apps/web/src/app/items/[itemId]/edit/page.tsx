import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, api } from '@/lib/api'
import { getRequestCookieHeader } from '@/lib/cookieHeader'

export default async function ItemEditPage({ params }: { params: Promise<{ itemId: string }> }) {
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
        <Link href={`/items/${itemId}`}>← Cancel</Link>
      </p>
      <h1>Edit {rest.name}</h1>
      <form
        action={async (formData) => {
          'use server'
          const { updateItemAction } = await import('../actions')
          await updateItemAction(locationId, zoneId, itemId, formData)
        }}
      >
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required defaultValue={rest.name} />
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <input id="category" name="category" type="text" defaultValue={rest.category ?? ''} />
        </div>
        <div>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input id="tags" name="tags" type="text" defaultValue={rest.tags.join(', ')} />
        </div>
        <div>
          <label htmlFor="purchaseUrl">Purchase URL</label>
          <input id="purchaseUrl" name="purchaseUrl" type="text" defaultValue={rest.purchaseUrl ?? ''} />
        </div>
        <fieldset>
          <legend>Specs — dimensions</legend>
          <label>
            W{' '}
            <input
              name="dim_w"
              type="number"
              step="any"
              defaultValue={rest.specs?.dimension?.w ?? ''}
            />
          </label>{' '}
          <label>
            L{' '}
            <input
              name="dim_l"
              type="number"
              step="any"
              defaultValue={rest.specs?.dimension?.l ?? ''}
            />
          </label>{' '}
          <label>
            H{' '}
            <input
              name="dim_h"
              type="number"
              step="any"
              defaultValue={rest.specs?.dimension?.h ?? ''}
            />
          </label>{' '}
          <label>
            Unit{' '}
            <input
              name="dim_unit"
              type="text"
              defaultValue={rest.specs?.dimension?.unit ?? ''}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Specs — weight</legend>
          <label>
            Value{' '}
            <input
              name="weight_value"
              type="number"
              step="any"
              defaultValue={rest.specs?.weight?.value ?? ''}
            />
          </label>{' '}
          <label>
            Unit{' '}
            <input
              name="weight_unit"
              type="text"
              defaultValue={rest.specs?.weight?.unit ?? ''}
            />
          </label>
        </fieldset>
        <div>
          <label htmlFor="specs_info">Specs — other info</label>
          <textarea id="specs_info" name="specs_info" rows={2} defaultValue={rest.specs?.info ?? ''} />
        </div>
        <div>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={rest.notes ?? ''} />
        </div>
        <button type="submit">Save</button>
      </form>
    </main>
  )
}
