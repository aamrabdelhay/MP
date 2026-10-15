#!/bin/sh
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "[database] Applying pending Drizzle migrations before the production build."
  npm run db:migrate
  node scripts/verify-production-db.mjs
else
  echo "[database] Skipping production migrations for this non-production build."
fi

npm run build
