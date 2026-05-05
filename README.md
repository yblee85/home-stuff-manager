# Home Stuff Manager

## Problem

Light bulb went out. I couldn't remember what type of bulb it was to replace it, like base or color unless you dig through your drawer if you're lucky to find the box or purchase history from email.

## Idea

I'm thinking I will take a picture of the item and it will detect the light bulb (and where in your home it is) and give you information about it so you can buy or something.

What, I think, separates this from others is that I don't want google search result of bunch of products that I don't know.

I want the same product that I bought last time. This will give a link that I bought last time so you can buy it again.

---

## Repository layout

Monorepo managed with **pnpm**:

| Package | Description |
|--------|-------------|
| `apps/web` | Next.js (App Router) PWA frontend |
| `apps/api` | Fastify REST API, Postgres + Drizzle |

Product direction and user stories live in **`PRD.md`**. Implementation phases in **`plans/home-stuff-manager.md`**.

---

## Requirements

- **Node.js** 22 (matches Docker and CI)
- **pnpm** 10
- **Postgres** (local or Docker)

---

## Environment

Copy **`.env.example`** to **`.env`** at the repo root and adjust.

Important values:

- **`DATABASE_URL`** — Postgres connection string (API + migrations)
- **`API_URL`** — Base URL the **Next.js server** uses to call the API. In Docker this must be the compose service name, e.g. `http://api:3001`, not `localhost`.
- **`NEXT_PUBLIC_API_URL`** — Optional; for anything that must be known in the browser (defaults in `.env.example` point at localhost for dev).

Session cookies use **`session_id`** by default (`SESSION_COOKIE_NAME`).

---

## Local development

```bash
pnpm install
pnpm dev
```

Runs **`web`** and **`api`** in parallel (`http://localhost:3000` and `http://localhost:3001` by default, depending on your `.env`).

---

## Docker

```bash
docker compose up --build
```

After changing **`Dockerfile`**, **`pnpm-lock.yaml`**, or **`package.json`** dependencies, rebuild images (e.g. `docker compose up --build` or `docker compose build api`).

---

## Scripts (repo root)

| Command | Purpose |
|--------|---------|
| `pnpm dev` | Start `web` + `api` dev servers |
| `pnpm build` | Typecheck/build API (`tsc`) and web (`next build`) |
| `pnpm lint` | ESLint for API + `next lint` for web |
| `pnpm lint:api` | ESLint: `apps/api` TypeScript |
| `pnpm lint:web` | Next.js ESLint for `apps/web` |
| `pnpm test` | API integration tests (Vitest; needs **`DATABASE_URL`**) |

API integration tests expect a running Postgres and run Drizzle migrations against **`DATABASE_URL`** (see CI).

---

## Continuous integration

**GitHub Actions** (`.github/workflows/ci.yml`) on push and pull request:

1. Install dependencies (`pnpm install --frozen-lockfile`)
2. Lint (`pnpm lint`)
3. Build API (`pnpm --filter api build`)
4. Run API tests against a **Postgres 16** service
5. Build web (`pnpm --filter web build`)

---

## Tech / tools (planned & in use)

- Image detect: TensorFlow direction (see PRD)
- Storage: Postgres + Drizzle (replacing an early sqlite sketch)
- Image processing: ImageMagick (planned)
- **Auth**: Backend-issued **`session_id`** cookie (`HttpOnly`), session rows in Postgres
- **Lint**: ESLint 9 (flat config); web uses `eslint-config-next`
