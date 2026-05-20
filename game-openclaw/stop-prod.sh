#!/usr/bin/env bash
set -e

echo "=== Stopping game-openclaw production mode ==="

# Kill the proxy (node proxy.mjs on port 2026)
if command -v lsof &>/dev/null; then
  PROXY_PID=$(lsof -ti :2026 2>/dev/null || true)
  if [ -n "$PROXY_PID" ]; then
    echo "[stop] Killing proxy on port 2026 (PID: $PROXY_PID)..."
    kill $PROXY_PID 2>/dev/null || true
  fi
fi

# Kill the gateway (openclaw gateway on port 2027)
if command -v lsof &>/dev/null; then
  GATEWAY_PID=$(lsof -ti :2027 2>/dev/null || true)
  if [ -n "$GATEWAY_PID" ]; then
    echo "[stop] Killing gateway on port 2027 (PID: $GATEWAY_PID)..."
    kill $GATEWAY_PID 2>/dev/null || true
  fi
fi

# Also try the openclaw gateway stop command
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export OPENCLAW_STATE_DIR="$SCRIPT_DIR/state"
openclaw gateway stop 2>/dev/null || true

echo "[ok] Production mode stopped."
