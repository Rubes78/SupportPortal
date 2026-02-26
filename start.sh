#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# --- Detect primary LAN IP ---
PRIMARY_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' | head -1)
[ -z "$PRIMARY_IP" ] && PRIMARY_IP="localhost"
PORT=3001

# --- Ensure logs directory exists ---
mkdir -p logs

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

# --- Start or restart via PM2 ---
echo "==> Starting Support Portal via PM2..."
export NEXTAUTH_URL="http://$PRIMARY_IP:$PORT"
export NEXT_PUBLIC_BASE_URL="http://$PRIMARY_IP:$PORT"

pm2 startOrRestart ecosystem.config.js --update-env

echo ""
echo "================================================"
echo "  Support Portal running at:"
echo "  http://$PRIMARY_IP:$PORT"
echo ""
echo "  admin@example.com  /  admin123!"
echo ""
echo "  Logs:    pm2 logs support-portal"
echo "  Status:  pm2 status"
echo "  Stop:    ./stop.sh"
echo "================================================"
