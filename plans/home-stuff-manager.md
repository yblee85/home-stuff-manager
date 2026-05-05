# Plan: Home Stuff Manager

> Source PRD: PRD.md

## Architectural decisions

- **Repo**: Monorepo — `web` (Next.js PWA) and `api` (Fastify TypeScript)
- **API**: REST — Fastify routes in `api`, consumed by `web` via fetch
- **Database**: Postgres via Docker; Drizzle ORM for schema + migrations
- **Auth**: Backend cookie sessions — API owns login/logout/session, web forwards credentials and uses `session_id` cookie
- **File storage**: Local filesystem (Docker named volume); path stored in DB
- **Image processing**: ImageMagick server-side resize/compress on upload
- **ML**: TensorFlow.js + MobileNet pretrained model, runs server-side in `api`
- **Deployment**: Docker Compose — 3 containers: `web`, `api`, `db`
- **Key models**: User, Location, LocationMember, Zone, Item
- **Location hierarchy**: Location → Zone (items belong to a Zone)
- **Item fields**: `name`, `category`, `tags[]`, `photo`, `purchase_url`, `specs { dimension { w, l, h, unit }, weight { value, unit }, info }`, `notes`, `created_at`
- **Routes (web)**: `/`, `/login`, `/register`, `/locations`, `/locations/[id]`, `/locations/[id]/zones/[zoneId]`, `/items/[id]`, `/items/[id]/edit`
- **REST routes**: `auth.*`, `locations.*`, `zones.*`, `items.*`

---

## Phase 1: Monorepo scaffold & Docker

**User stories**: (none — prerequisite for all phases)

### What to build

Set up the full project skeleton end-to-end: monorepo structure, Docker Compose wiring all three containers, Next.js and Fastify both running, REST API connected between them (a single working endpoint), and Drizzle connected to Postgres with migrations running on startup.

### Acceptance criteria

- [ ] `docker compose up` starts all three containers without errors
- [ ] Next.js `web` is reachable in browser
- [ ] Fastify `api` is reachable and responds to health check
- [ ] REST API call from `web` to `api` returns a response
- [ ] Drizzle migration runs on `api` startup and creates schema in Postgres

---

## Phase 2: Auth — register & login

**User stories**: 1, 2

### What to build

End-to-end authentication: register page, login page, logout, and session persistence. Backend API handles session issuance and validation using `session_id` cookies backed by Postgres. All API endpoints (except register/login) reject unauthenticated requests. The UI reflects logged-in state.

### Acceptance criteria

- [ ] User can register with email + password
- [ ] User can log in and receives a session
- [ ] User can log out and session is invalidated
- [ ] Authenticated user sees their session persist across page refreshes
- [ ] Unauthenticated requests to protected API endpoints return 401
- [ ] Register and login pages are publicly accessible

---

## Phase 3: Location & Zone CRUD

**User stories**: 3, 4, 5, 26

### What to build

Full end-to-end management of Locations and Zones. A user can create multiple Locations (e.g. home address), create Zones within each Location (e.g. kitchen, living room), and delete them. The creating user is automatically the owner via a membership join table. The UI lets users navigate between their Locations and Zones.

### Acceptance criteria

- [ ] User can create a Location with a name/address
- [ ] User can view a list of their Locations
- [ ] User can create Zones within a Location
- [ ] User can view all Zones in a Location
- [ ] User can delete a Zone
- [ ] User can delete a Location (cascades to Zones)
- [ ] User cannot access Locations they do not own or belong to

---

## Phase 4: Item CRUD (no photo)

**User stories**: 13, 14, 15, 16, 17, 18, 22, 23, 24, 25

### What to build

Full item lifecycle without photo or ML. User can create an item inside a Zone, filling in name, specs (dimension, weight, info), purchase URL, tags, and notes. Items are viewable, editable, and deletable. Purchase URL is clickable. Items are listed within their Zone.

### Acceptance criteria

- [ ] User can create an item inside a Zone with all fields
- [ ] Item detail page shows all fields including a clickable purchase URL
- [ ] User can edit any field on an existing item
- [ ] User can delete an item
- [ ] Items are listed within their Zone view
- [ ] Tags are stored as an array and displayed on the item

---

## Phase 5: Photo upload & image processing

**User stories**: 8, 9

### What to build

Users can attach a photo to an item by uploading a file. The `api` receives the upload, resizes and compresses it via ImageMagick, saves it to the local filesystem volume, and stores the path in the DB. The item detail page displays the photo.

### Acceptance criteria

- [ ] User can upload a photo file when creating or editing an item
- [ ] Photo is resized server-side before storage
- [ ] Photo is displayed on the item detail page
- [ ] Uploading a new photo replaces the old one
- [ ] Photo persists across container restarts (named Docker volume)

---

## Phase 6: ML category detection

**User stories**: 10, 11, 12

### What to build

When a user uploads a photo, the `api` runs it through TensorFlow.js MobileNet and returns the top detected category. The UI presents this as a pre-filled suggestion in the category field. The user can confirm it or type a different value. Tags remain separate and user-managed.

### Acceptance criteria

- [ ] Uploading a photo triggers ML classification server-side
- [ ] Detected category is returned and pre-filled in the form
- [ ] User can override the detected category before saving
- [ ] If ML fails or returns low confidence, field is left blank (no crash)
- [ ] Category is saved as a single string value on the item

---

## Phase 7: Search & filtering

**User stories**: 19, 20, 21

### What to build

Users can filter and search items within a Location. Filtering by Zone narrows the list to items in that Zone. Filtering by category or tag narrows by those fields. Searching by name does a case-insensitive substring match.

### Acceptance criteria

- [ ] Zone filter shows only items in the selected Zone
- [ ] Category filter shows only items matching that category
- [ ] Tag filter shows only items with that tag
- [ ] Name search returns items whose name contains the query (case-insensitive)
- [ ] Filters and search can be combined
- [ ] Clearing filters restores the full item list

---

## Phase 8: Location membership & share links

**User stories**: 6, 7

### What to build

Location owners can generate a share link with an expiry date. Anyone with the link can join the Location and gains access to its Zones and items. Members can only see Locations they own or have been invited to.

### Acceptance criteria

- [ ] Owner can generate a share link for a Location
- [ ] Share link has an expiry date set by the owner
- [ ] A user who visits the link is added as a member of the Location
- [ ] Expired links are rejected
- [ ] Members can view Zones and items in the shared Location
- [ ] Members cannot access Locations they have not been invited to

---

## Phase 9: PWA

**User stories**: 27, 28

### What to build

Configure Next.js as a PWA with next-pwa. Add a web manifest, icons, and service worker. Camera access (capture + upload) works in the mobile browser. The app can be added to the home screen.

### Acceptance criteria

- [ ] App has a valid web manifest (name, icons, theme color)
- [ ] Service worker is registered and caches static assets
- [ ] App can be added to home screen on iOS and Android
- [ ] Camera capture works in mobile browser (take photo or upload from gallery)
- [ ] App loads correctly when launched from home screen
