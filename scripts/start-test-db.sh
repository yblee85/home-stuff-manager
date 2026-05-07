#!/usr/bin/env sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

docker compose \
  --project-directory "${REPO_ROOT}" \
  -f "${REPO_ROOT}/docker-compose.test.yml" \
  --env-file "${REPO_ROOT}/.env.test" \
  up
  