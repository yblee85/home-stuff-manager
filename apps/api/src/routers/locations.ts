import type { FastifyPluginAsync } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { locationMembers, locations, zones } from '../db/schema.js'

const createLocationSchema = z.object({
  name: z.string().min(1),
})

const createZoneSchema = z.object({
  name: z.string().min(1),
})

export const locationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/locations', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })

    const rows = await db
      .select({
        id: locations.id,
        name: locations.name,
        role: locationMembers.role,
        createdAt: locations.createdAt,
      })
      .from(locationMembers)
      .innerJoin(locations, eq(locations.id, locationMembers.locationId))
      .where(eq(locationMembers.userId, req.user.id))

    return { locations: rows }
  })

  fastify.post('/locations', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const body = createLocationSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const locationId = crypto.randomUUID()
    const [loc] = await db
      .insert(locations)
      .values({ id: locationId, name: body.data.name })
      .returning({ id: locations.id, name: locations.name, createdAt: locations.createdAt })

    await db.insert(locationMembers).values({
      locationId,
      userId: req.user.id,
      role: 'owner',
    })

    return reply.status(201).send(loc)
  })

  fastify.get('/locations/:locationId', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const locationId = (req.params as { locationId: string }).locationId

    const [membership] = await db
      .select({ role: locationMembers.role })
      .from(locationMembers)
      .where(and(eq(locationMembers.locationId, locationId), eq(locationMembers.userId, req.user.id)))
      .limit(1)

    if (!membership) return reply.status(404).send({ error: 'Not found' })

    const [loc] = await db.select({ id: locations.id, name: locations.name }).from(locations).where(eq(locations.id, locationId)).limit(1)
    if (!loc) return reply.status(404).send({ error: 'Not found' })

    const zRows = await db
      .select({ id: zones.id, name: zones.name, createdAt: zones.createdAt })
      .from(zones)
      .where(eq(zones.locationId, locationId))

    return { location: loc, role: membership.role, zones: zRows }
  })

  fastify.post('/locations/:locationId/zones', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const locationId = (req.params as { locationId: string }).locationId
    const body = createZoneSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const [membership] = await db
      .select({ role: locationMembers.role })
      .from(locationMembers)
      .where(and(eq(locationMembers.locationId, locationId), eq(locationMembers.userId, req.user.id)))
      .limit(1)

    if (!membership) return reply.status(404).send({ error: 'Not found' })

    const [zone] = await db
      .insert(zones)
      .values({ locationId, name: body.data.name })
      .returning({ id: zones.id, name: zones.name, createdAt: zones.createdAt })

    return reply.status(201).send(zone)
  })

  fastify.delete('/zones/:zoneId', async (req, reply) => {
    if (!req.user) return reply.status(401).send({ error: 'Unauthenticated' })
    const zoneId = (req.params as { zoneId: string }).zoneId

    const [zone] = await db.select({ id: zones.id, locationId: zones.locationId }).from(zones).where(eq(zones.id, zoneId)).limit(1)
    if (!zone) return reply.status(404).send({ error: 'Not found' })

    const [membership] = await db
      .select({ role: locationMembers.role })
      .from(locationMembers)
      .where(and(eq(locationMembers.locationId, zone.locationId), eq(locationMembers.userId, req.user.id)))
      .limit(1)

    if (!membership) return reply.status(404).send({ error: 'Not found' })

    await db.delete(zones).where(eq(zones.id, zoneId))
    return { ok: true }
  })
}

