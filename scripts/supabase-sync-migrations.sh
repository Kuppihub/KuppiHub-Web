#!/usr/bin/env bash
set -euo pipefail

mkdir -p supabase/migrations

for f in supabase_migrations/*.sql; do
  if [ -f "$f" ]; then
    base="$(basename "$f")"
    cp "$f" "supabase/migrations/${base}"
  fi
done

echo "Copied supabase_migrations/*.sql -> supabase/migrations/"
