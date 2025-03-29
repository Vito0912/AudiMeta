#!/bin/sh
set -e

npx prisma db push --skip-generate --force-reset

exec "$@"
