#!/usr/bin/env bash
# Back up the OctopusTech data volume (leads database and AI spend ledgers). Keeps the last 14.
# Nightly at 03:00:  (crontab -l; echo "0 3 * * * /opt/octopustech/deploy/backup.sh") | crontab -
set -euo pipefail

DEST="${BACKUP_DIR:-/var/backups/octopustech}"
mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"

docker volume inspect octopustech_data >/dev/null 2>&1 || { echo "No data volume yet"; exit 1; }
docker run --rm -v octopustech_data:/data:ro -v "$DEST":/backup alpine \
  tar czf "/backup/octopustech-data-$STAMP.tar.gz" -C /data .

ls -1t "$DEST"/octopustech-data-*.tar.gz | tail -n +15 | xargs -r rm --
echo "Backed up to $DEST/octopustech-data-$STAMP.tar.gz"
