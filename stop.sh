#!/usr/bin/env bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "==> Stopping Support Portal..."
pm2 stop support-portal 2>/dev/null && echo "    Next.js stopped." || echo "    Support Portal was not running."

echo ""
echo "  PostgreSQL is still running."
echo "  To also stop postgres: docker compose stop postgres"
echo ""
echo "  To start again: ./start.sh"
