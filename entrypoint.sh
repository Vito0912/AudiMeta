#!/bin/sh
set -e

npx prisma db push --skip-generate

exec "$@"
