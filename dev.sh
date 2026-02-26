#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# --- Detect primary LAN IP ---
PRIMARY_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
[ -z "$PRIMARY_IP" ] && PRIMARY_IP="localhost"

# --- Find a free port starting at 3001 ---
PORT=3001
while ss -tlnp 2>/dev/null | grep -q ":${PORT}[[:space:]]"; do
  PORT=$((PORT + 1))
done

echo "==> Starting Support Portal dev environment..."
echo "    Host: $PRIMARY_IP  Port: $PORT"

# --- Start PostgreSQL ---
echo "==> Starting PostgreSQL..."
docker compose up -d postgres

# --- Wait for Postgres to be ready ---
echo "==> Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U support_portal -d support_portal -q 2>/dev/null; do
  sleep 1
done
echo "    PostgreSQL is ready."

# --- Install dependencies if node_modules is missing ---
if [ ! -d node_modules ]; then
  echo "==> Installing dependencies..."
  npm install
fi

# --- Prisma: generate client + migrate + seed ---
echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running migrations..."
npx prisma migrate deploy

echo "==> Seeding database..."
npm run db:seed

echo ""
echo "================================================"
echo "  Support Portal ready at:"
echo "  http://$PRIMARY_IP:$PORT"
echo ""
echo "  admin@example.com  /  admin123!"
echo "================================================"
echo ""

# --- Start Next.js, bound to all interfaces, with correct auth URL ---
NEXTAUTH_URL="http://$PRIMARY_IP:$PORT" \
NEXT_PUBLIC_BASE_URL="http://$PRIMARY_IP:$PORT" \
  exec npx next dev --hostname 0.0.0.0 --port "$PORT"
