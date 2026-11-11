#!/usr/bin/env bash
# Deploy or update OctopusTech on the server. Run from the repository root:  ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env: cp .env.production.example .env, fill it in, chmod 600 .env" >&2
  exit 1
fi

echo "==> Backing up data before deploying"
./deploy/backup.sh || echo "   (no existing data to back up yet)"

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Validating compose file"
docker compose config --quiet

echo "==> Building and starting"
docker compose up -d --build

echo "==> Waiting for the site"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${WEB_PORT:-3200}/api/ai/status" >/dev/null 2>&1; then
    echo "OctopusTech is up on 127.0.0.1:${WEB_PORT:-3200}"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done
echo "Site did not come up. Recent logs:" >&2
docker compose logs --tail=50 >&2
exit 1
