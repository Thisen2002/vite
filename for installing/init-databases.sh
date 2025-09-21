#!/usr/bin/env bash
# PostgreSQL Database Initialization Script (Bash version)
# Initializes the heatmap_db and organizer_dashboard databases using psql.

set -o pipefail

echo "Starting PostgreSQL Database Initialization..."
echo

# Resolve repo root regardless of where the script is run from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Defaults (can be overridden by env)
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-root}"

if [[ -z "$PGPASSWORD" ]]; then
  read -s -p "Enter PostgreSQL password for user '$PGUSER': " PGPASSWORD
  echo
fi

export PGPASSWORD

run_sql() {
  local desc="$1"
  local file="$2"
  echo
  echo "$desc"
  if [[ ! -f "$file" ]]; then
    echo "[ERROR] SQL file not found: $file" >&2
    return 1
  fi
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -f "$file"
}

echo "Initializing databases..."

# 1) Heatmap database
HEATMAP_SQL="$ROOT_DIR/backend/heatmap/database/aa.sql"
if run_sql "1. Creating heatmap_db database..." "$HEATMAP_SQL"; then
  echo "[SUCCESS] Heatmap database created successfully!"
else
  echo "[ERROR] Error creating heatmap database"
fi

# 2) Organizer Dashboard schema
ORG_SCHEMA_SQL="$ROOT_DIR/backend/Organizer_Dashboard-main/backend/db/script.sql"
if run_sql "2. Creating organizer_dashboard database schema..." "$ORG_SCHEMA_SQL"; then
  echo "[SUCCESS] Organizer dashboard schema created successfully!"

  # 3) Seed sample data
  ORG_SEED_SQL="$ROOT_DIR/backend/Organizer_Dashboard-main/backend/db/insertData.sql"
  if run_sql "3. Inserting sample data into organizer_dashboard..." "$ORG_SEED_SQL"; then
    echo "[SUCCESS] Sample data inserted successfully!"
  else
    echo "[ERROR] Error inserting sample data"
  fi
else
  echo "[ERROR] Error creating organizer dashboard schema"
fi

# 4) Verify creation
echo
echo "4. Verifying database creation..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -t -c "SELECT datname FROM pg_database WHERE datname IN ('heatmap_db', 'organizer_dashboard');"

echo
echo "Database initialization completed!"
echo
echo "Databases created:"
echo "- heatmap_db (with buildings, locations, zones, etc.)"
echo "- organizer_dashboard (with events, organizers, buildings, etc.)"
echo
echo "You can now connect to these databases using:"
echo "  psql -h ${PGHOST} -U ${PGUSER} -d heatmap_db"
echo "  psql -h ${PGHOST} -U ${PGUSER} -d organizer_dashboard"

# Clear password from env for safety in current shell
unset PGPASSWORD
