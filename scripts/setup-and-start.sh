#!/usr/bin/env bash
set -euo pipefail

# Unified setup and start script for all services
# Usage:
#   scripts/setup-and-start.sh [start|restart|stop|status|logs] [--skip-install]
#   Default action is 'start' which installs deps (unless --skip-install) and launches services via PM2.

ACTION="start"
SKIP_INSTALL=0

for arg in "$@"; do
  case "$arg" in
    start|restart|stop|status|logs)
      ACTION="$arg" ;;
    --skip-install)
      SKIP_INSTALL=1 ;;
    -h|--help)
      echo "Usage: $0 [start|restart|stop|status|logs] [--skip-install]" && exit 0 ;;
    *)
      echo "Unknown argument: $arg" >&2; echo "Run with --help for usage." >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "Project root: $ROOT_DIR"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    return 1
  fi
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi
  echo "PM2 not found. Installing globally (npm i -g pm2)..."
  if npm install -g pm2; then
    echo "PM2 installed."
  else
    echo "Failed to install PM2 globally. You can either:"
    echo "  - Re-run this script with permissions (e.g., sudo), or"
    echo "  - Configure a user-level npm prefix and re-run:"
    echo "      npm config set prefix ~/.npm-global && export PATH=\"$HOME/.npm-global/bin:$PATH\""
    echo "      npm install -g pm2"
    exit 1
  fi
}

load_env() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    echo "Loading environment from .env"
    # Export variables from .env into current shell for PM2 and installs
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  else
    echo ".env not found at $ROOT_DIR/.env (continuing without it)"
  fi
}

install_deps() {
  echo "Installing dependencies for all services..."
  declare -a DIRS=(
    "." \
    "backend/events" \
    "backend/heatmap/backend/exhibition-map-backend" \
    "backend/Maps/backend map" \
    "backend/Organizer_Dashboard-main/backend/api-gateway" \
    "backend/Organizer_Dashboard-main/backend/services/auth-service" \
    "backend/Organizer_Dashboard-main/backend/services/orgMng-service" \
    "backend/Organizer_Dashboard-main/backend/services/event-service" \
    "backend/Organizer_Dashboard-main/backend/services/building-service" \
    "backend/Organizer_Dashboard-main/backend/services/alert-service"
  )

  for d in "${DIRS[@]}"; do
    if [[ -f "$d/package.json" ]]; then
      echo "- npm install in: $d"
      (cd "$d" && npm install)
    else
      echo "- Skipping (no package.json): $d"
    fi
  done
}

pm2_start() {
  mkdir -p "$ROOT_DIR/logs"
  echo "Starting services with PM2 using ecosystem.config.cjs"
  pm2 start "$ROOT_DIR/ecosystem.config.cjs" --update-env
  pm2 status
  echo
  echo "Tip: View logs with: pm2 logs"
}

pm2_restart() {
  echo "Restarting services with PM2"
  pm2 restart "$ROOT_DIR/ecosystem.config.cjs" --update-env || pm2_start
  pm2 status
}

pm2_stop() {
  echo "Stopping known services via PM2"
  # Restrict deletes to this project’s process names
  pm2 delete vite-frontend \
              events-service \
              heatmap-service \
              maps-service \
              api-gateway \
              auth-service \
              org-management-service \
              event-service-dashboard \
              building-service \
              alert-service 2>/dev/null || true
  pm2 status
}

main() {
  need_cmd node
  need_cmd npm
  ensure_pm2
  load_env

  case "$ACTION" in
    start)
      if [[ "$SKIP_INSTALL" -eq 0 ]]; then
        install_deps
      else
        echo "Skipping dependency installation (--skip-install)"
      fi
      pm2_start
      ;;
    restart)
      pm2_restart
      ;;
    stop)
      pm2_stop
      ;;
    status)
      pm2 status
      ;;
    logs)
      pm2 logs --lines 100
      ;;
    *)
      echo "Unknown action: $ACTION" >&2; exit 1 ;;
  esac
}

main "$@"

