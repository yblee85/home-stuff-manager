import { jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const locations = pgTable('locations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const locationMembers = pgTable(
  'location_members',
  {
    locationId: text('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('owner'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.locationId, t.userId] }),
  }),
)

export const zones = pgTable('zones', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  locationId: text('location_id')
    .notNull()
    .references(() => locations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const items = pgTable('items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  zoneId: text('zone_id')
    .notNull()
    .references(() => zones.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>().notNull(),
  purchaseUrl: text('purchase_url'),
  specs: jsonb('specs').$type<{
    dimension?: { w: number; l: number; h: number; unit: string }
    weight?: { value: number; unit: string }
    info?: string
  } | null>(),
  notes: text('notes'),
  photoPath: text('photo_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
