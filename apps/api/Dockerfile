FROM node:22-alpine
RUN corepack enable

WORKDIR /repo

COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --filter api

COPY apps/api ./apps/api

WORKDIR /repo/apps/api

CMD ["pnpm", "dev"]
