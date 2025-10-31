#!/bin/sh
set -eu

CONTENT_DIR=/usr/share/nginx/html
ENV_FILE="$CONTENT_DIR/env.js"
TMP_FILE="$CONTENT_DIR/env.js.tmp"
VERSION_FILE=${APP_VERSION_FILE:-/etc/app-version}

if [ -f "$ENV_FILE" ]; then
  # Substitute API_BASE placeholder with the runtime value (can be empty).
  envsubst '$API_BASE' < "$ENV_FILE" > "$TMP_FILE"
  mv "$TMP_FILE" "$ENV_FILE"
fi

APP_VERSION="unknown"
if [ -f "$VERSION_FILE" ]; then
  APP_VERSION=$(cat "$VERSION_FILE")
fi

START_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "[$START_TIME] vault-ui version ${APP_VERSION} starting (API_BASE='${API_BASE:-}')"

exec "$@"
