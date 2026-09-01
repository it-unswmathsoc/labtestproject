#!/usr/bin/env bash
# `supabase db reset` fails here with "failed to inspect service": the CLI needs the
# Docker CLI binary on PATH and otherwise picks up Podman. This is the working path.
set -euo pipefail

export DOCKER_HOST="${DOCKER_HOST:-unix://$HOME/.docker/run/docker.sock}"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

CONTAINER=supabase_db_labtestproject

docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
drop schema public cascade;
drop schema if exists private cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
delete from supabase_migrations.schema_migrations;
SQL

supabase migration up --local
docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed.sql

echo "Local database reset. Run 'npm run create-admin -- <email> <password>' to add an admin."
