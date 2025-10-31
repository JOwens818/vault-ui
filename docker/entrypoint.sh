#!/bin/sh
set -eu

CONTENT_DIR=/usr/share/nginx/html
TEMPLATE_FILE="$CONTENT_DIR/env.template.js"
ENV_FILE="$CONTENT_DIR/env.js"
TMP_FILE="$CONTENT_DIR/env.js.tmp"
VERSION_FILE=${APP_VERSION_FILE:-/etc/app-version}

if [ -f "$TEMPLATE_FILE" ]; then
  envsubst '$API_BASE' < "$TEMPLATE_FILE" > "$TMP_FILE"
  mv "$TMP_FILE" "$ENV_FILE"
elif [ -f "$ENV_FILE" ]; then
  # Backward compatibility: fall back to substituting in-place if template missing.
  envsubst '$API_BASE' < "$ENV_FILE" > "$TMP_FILE"
  mv "$TMP_FILE" "$ENV_FILE"
fi

if [ -f "$ENV_FILE" ] && grep -q '\$API_BASE' "$ENV_FILE"; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] warning: API_BASE placeholder is still present in env.js" >&2
fi

APP_VERSION="unknown"
if [ -f "$VERSION_FILE" ]; then
  APP_VERSION=$(cat "$VERSION_FILE")
fi

START_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "[$START_TIME] vault-ui version ${APP_VERSION} starting (API_BASE='${API_BASE:-}')"

exec "$@"
