import type { FastifyPluginAsync } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { items, locationMembers, zones } from '../db/schema.js'

const dimensionSchema = z.object({
  w: z.number(),
  l: z.number(),
  h: z.number(),
  unit: z.string().min(1),
})

const weightSchema = z.object({
  value: z.number(),
  unit: z.string().min(1),
})

const specsSchema = z
  .object({
    dimension: dimensionSchema.optional(),
    weight: weightSchema.optional(),
    info: z.string().optional(),
  })
  .optional()

const createItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  purchaseUrl: z.string().optional().nullable(),
  specs: specsSchema.nullable(),
  notes: z.string().optional().nullable(),
})

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  purchaseUrl: z.string().optional().nullable(),
  specs: specsSchema.nullable(),
  notes: z.string().optional().nullable(),
})

async function assertLocationMember(locationId: string, userId: string) {
  const [m] = await db
    .select({ locationId: locationMembers.locationId })
    .from(locationMembers)
    .where(and(eq(locationMembers.locationId, locationId), eq(locationMembers.userId, userId)))
    .limit(1)
  return m ?? null
}

/** Zone must belong to `locationId` and user must be a member of that location. */
async function assertZoneInLocation(zoneId: string, locationId: string, userId: string) {
  const loc = await assertLocationMember(locationId, userId)
  if (!loc) return null
  const [z] = await db
    .select({ id: zones.id })
    .from(zones)
    .where(and(eq(zones.id, zoneId), eq(zones.locationId, locationId)))
    .limit(1)
  return z ?? null
}

async function getItemWithLocationForUser(itemId: string, userId: string) {
  const [row] = await db
    .select({ item: items, locationId: zones.locationId })
    .from(items)
    .innerJoin(zones, eq(zones.id, items.zoneId))
    .innerJoin(
      locationMembers,
      and(eq(locationMembers.locationId, zones.locationId), eq(locationMembers.userId, userId)),
    )
    .where(eq(items.id, itemId))
    .limit(1)
  return row ?? null
}

function mapItem(row: typeof items.$inferSelect) {
  return {
    id: row.id,
    zoneId: row.zoneId,
    name: row.name,
    category: row.category,
    tags: row.tags,
    purchaseUrl: row.purchaseUrl,
    specs: row.specs,
    notes: row.notes,
    createdAt: row.createdAt,
  }
}

export const itemRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/locations/:locationId/zones/:zoneId/items', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const { locationId, zoneId } = req.params as { locationId: string; zoneId: string }

    const ok = await assertZoneInLocation(zoneId, locationId, req.user.id)
    if (!ok) return reply.status(404).send({ error: 'Not found' })

    const rows = await db.select().from(items).where(eq(items.zoneId, zoneId))
    return { items: rows.map(mapItem) }
  })

  fastify.post('/locations/:locationId/zones/:zoneId/items', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const { locationId, zoneId } = req.params as { locationId: string; zoneId: string }
    const body = createItemSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const ok = await assertZoneInLocation(zoneId, locationId, req.user.id)
    if (!ok) return reply.status(404).send({ error: 'Not found' })

    const [row] = await db
      .insert(items)
      .values({
        zoneId,
        name: body.data.name,
        category: body.data.category ?? null,
        tags: body.data.tags ?? [],
        purchaseUrl: body.data.purchaseUrl?.trim() ? body.data.purchaseUrl.trim() : null,
        specs: body.data.specs ?? null,
        notes: body.data.notes?.trim() ? body.data.notes.trim() : null,
      })
      .returning()

    return reply.status(201).send(mapItem(row!))
  })

  fastify.get('/items/:itemId', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const itemId = (req.params as { itemId: string }).itemId

    const row = await getItemWithLocationForUser(itemId, req.user.id)
    if (!row) return reply.status(404).send({ error: 'Not found' })

    return { ...mapItem(row.item), locationId: row.locationId }
  })

  fastify.patch('/items/:itemId', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const itemId = (req.params as { itemId: string }).itemId
    const body = updateItemSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const existing = await getItemWithLocationForUser(itemId, req.user.id)
    if (!existing) return reply.status(404).send({ error: 'Not found' })

    const patch = body.data
    if (Object.keys(patch).length === 0) return reply.status(400).send({ error: 'No fields to update' })

    const [updated] = await db
      .update(items)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
        ...(patch.purchaseUrl !== undefined
          ? { purchaseUrl: patch.purchaseUrl?.trim() ? patch.purchaseUrl.trim() : null }
          : {}),
        ...(patch.specs !== undefined ? { specs: patch.specs } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes?.trim() ? patch.notes.trim() : null } : {}),
      })
      .where(eq(items.id, itemId))
      .returning()

    return mapItem(updated!)
  })

  fastify.delete('/items/:itemId', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const itemId = (req.params as { itemId: string }).itemId

    const existing = await getItemWithLocationForUser(itemId, req.user.id)
    if (!existing) return reply.status(404).send({ error: 'Not found' })

    await db.delete(items).where(eq(items.id, itemId))
    return { ok: true }
  })
}
