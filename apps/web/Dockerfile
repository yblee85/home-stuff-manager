FROM node:22-alpine
RUN corepack enable

WORKDIR /repo

COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --filter web

COPY apps/api/src ./apps/api/src
COPY apps/web ./apps/web

WORKDIR /repo/apps/web

CMD ["pnpm", "dev"]
