CREATE TABLE IF NOT EXISTS "items" (
  "id" text PRIMARY KEY NOT NULL,
  "zone_id" text NOT NULL REFERENCES "zones"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "category" text,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "purchase_url" text,
  "specs" jsonb,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
