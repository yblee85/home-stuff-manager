# PRD: Home Stuff Manager

## Problem Statement

Households accumulate items (light bulbs, water filters, batteries, furniture, appliances) that periodically need to be replaced or repurchased. Finding the exact same product again is frustrating — users dig through email purchase history, check item boxes, or guess and buy the wrong thing. There is no easy way to record what you have, where it is, and how to buy it again.

## Solution

A multi-user household inventory app. Users photo an item, the app detects its category via ML, and the user fills in the rest (name, specs, purchase URL). Items are anchored to a physical location hierarchy (Location → Zone) so that two identical-looking items in different rooms can be tracked separately. Any household member can look up an item and instantly find what it is and where to buy it.

## User Stories

1. As a user, I want to create an account, so that I can access the app securely.
2. As a user, I want to log in and out, so that my data is protected.
3. As a user, I want to create a Location (e.g. my home address), so that I can organize items by property.
4. As a user, I want to create multiple Locations, so that I can manage items across different properties.
5. As a user, I want to create Zones within a Location (e.g. living room, kitchen), so that I can group items by room.
6. As a user, I want to invite other household members to a Location via a share link, so that we can manage items together.
8. As a user, I want invited members to only see Locations they have been granted access to, so that my other properties stay private.
9. As a user, I want to take a photo of an item using my phone camera, so that I can quickly start adding it.
10. As a user, I want to upload an existing photo from my device, so that I can add items I photographed earlier.
11. As a user, I want the app to automatically detect the category of an item from its photo, so that I don't have to type it manually.
12. As a user, I want to confirm or correct the ML-detected category, so that misidentifications don't pollute my data.
13. As a user, I want to add extra tags to an item, so that I can categorize it beyond the ML-detected category.
14. As a user, I want to enter a name for an item, so that I can identify it in plain language.
15. As a user, I want to enter specs for an item (dimensions, weight, and a free-form info field), so that I have all the details needed to repurchase it.
16. As a user, I want to paste a purchase URL for an item, so that I can quickly navigate to the right product page.
16. As a user, I want to attach an item to a Zone, so that I know where in my home it lives.
17. As a user, I want to add notes to an item, so that I can record anything that doesn't fit into structured fields.
18. As a user, I want to view all items in a Location, so that I can browse my full inventory.
19. As a user, I want to filter items by Zone, so that I can see only what's in a specific area.
20. As a user, I want to filter items by category or tag, so that I can find all bulbs or all filters quickly.
21. As a user, I want to search items by name, so that I can find something without browsing.
22. As a user, I want to view an item's full details (photo, specs, purchase URL), so that I have everything I need to reorder it.
23. As a user, I want to click the purchase URL directly from the app, so that I can reorder without copy-pasting.
24. As a user, I want to edit any item's details after creation, so that I can correct mistakes or update info.
25. As a user, I want to delete an item, so that I can remove things I no longer own.
26. As a user, I want to delete a Zone or Location, so that I can clean up my hierarchy.
27. As a user, I want to use the app on my phone browser without installing anything, so that it's always accessible.
28. As a user, I want the app to work as a PWA, so that I can add it to my home screen for quick access.

## Implementation Decisions

### Architecture
- Monorepo with two packages: `web` (Next.js PWA) and `api` (Fastify TypeScript)
- Frontend and backend communicate via tRPC for end-to-end type safety
- Deployed locally via Docker Compose with 3 containers: `web`, `api`, `db`

### Auth module
- Auth.js handles user registration, login, and sessions
- Sessions stored in Postgres (no Redis)
- Auth is enforced at the tRPC router layer

### Location module
- Data hierarchy: Location → Zone
- Each Location has a membership table linking users to locations with roles
- Items belong to a Zone; querying up the hierarchy is supported (all items in a Zone, all items in a Location)

### Item module
- Fields: `name`, `category` (ML-detected, single value), `tags` (user-added array), `photo` (file path), `purchase_url`, `specs` (`{ dimension: { w, l, h, unit }, weight: { value, unit }, info: string }`), `notes`, `created_at`
- Photo stored on local filesystem (Docker named volume); path stored in DB
- ImageMagick resizes photo server-side before storage

### ML classification module
- TensorFlow.js + MobileNet pretrained model runs server-side in Fastify
- Photo is sent to the API, classified, and the top category label returned to the user for confirmation
- User can override the detected category

### Image processing module
- ImageMagick resizes and compresses uploaded photos server-side before saving
- Abstracted behind a simple interface to allow swapping storage backend later

### tRPC router
- Single tRPC router in Fastify exposes procedures for: auth, locations, zones, items
- Next.js frontend consumes via tRPC client
- All procedures protected by auth middleware except login/register

### Database
- Postgres via Docker
- Drizzle ORM for schema definition and migrations

## Testing Decisions

- Tests should only test external behavior (inputs → outputs), not internal implementation details
- Tests should not depend on execution order
- Modules to test:
  - **Auth module**: registration, login, session creation/invalidation
  - **Location module**: CRUD for Location/Zone, membership access control
  - **Item module**: CRUD, spec validation, photo attachment
  - **tRPC router**: integration tests covering auth enforcement and correct data returned per procedure
- Use a real test Postgres instance (not mocks) to avoid mock/prod divergence

## Out of Scope

- Email-based invite system (use share links instead)
- Cloudflare R2 or any external file storage (local filesystem only for now)
- Custom ML model training (MobileNet pretrained model only)
- Mobile native app (PWA only)
- Cloud or remote deployment (local Docker only)

## Further Notes

- Share invite links should have an expiry date
- The ML category detection is intentionally low-accuracy; the user flow assumes manual correction is common
- Specs structure is intentionally hybrid: structured fields for dimension/weight, free-form `info` for everything else (e.g. "E26, 60W, warm white")
- File storage and invite modules are intentionally abstracted so they can be upgraded later without touching business logic