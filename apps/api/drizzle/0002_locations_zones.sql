CREATE TABLE IF NOT EXISTS "locations" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "location_members" (
  "location_id" text NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text NOT NULL DEFAULT 'owner',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("location_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "zones" (
  "id" text PRIMARY KEY NOT NULL,
  "location_id" text NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
