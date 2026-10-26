#!/bin/sh
# Container start: optional one-off data import, then PocketBase.
#
# To move a database into production, put a gzipped data.db at /pb/pb_data/import.db.gz (the volume)
# and restart the container. It replaces data.db once; the previous one is kept as data.db.before-import.
set -e
D=/pb/pb_data

if [ -f "$D/import.db.gz" ]; then
  gunzip -c "$D/import.db.gz" > "$D/data.db.import"
  if [ -f "$D/data.db" ]; then mv "$D/data.db" "$D/data.db.before-import"; fi
  rm -f "$D/data.db-wal" "$D/data.db-shm"
  mv "$D/data.db.import" "$D/data.db"
  rm "$D/import.db.gz"
  echo "Imported $D/import.db.gz (previous database kept as data.db.before-import)"
fi

exec /pb/pocketbase serve --http=0.0.0.0:8090 --dir="$D" --hooksDir=/pb/pb_hooks --hooksWatch=false \
  --migrationsDir=/pb/pb_migrations --publicDir=/pb/pb_public
