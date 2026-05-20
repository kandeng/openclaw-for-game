#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="$SCRIPT_DIR/state"
export OPENCLAW_STATE_DIR="$STATE_DIR"

GATEWAY_PORT=2027
GATEWAY_HOST=127.0.0.1

echo "=== game-openclaw production mode ==="

# 1. Verify openclaw.json exists
if [ ! -f "$STATE_DIR/openclaw.json" ]; then
  echo "Error: $STATE_DIR/openclaw.json not found."
  echo "Run ./install.sh first."
  exit 1
fi

# 2. Verify built web apps exist
GP_DIST="$PROJECT_ROOT/game-player/dist"
GD_DIST="$PROJECT_ROOT/game-director/dist"

if [ ! -f "$GP_DIST/index.html" ]; then
  echo "Error: game-player is not built."
  echo "Run: cd game-player && BASE=/game-player/ pnpm build"
  exit 1
fi

if [ ! -f "$GD_DIST/index.html" ]; then
  echo "Error: game-director is not built."
  echo "Run: cd game-director && BASE=/game-director/ pnpm build"
  exit 1
fi

# 3. Verify workspace dependencies are installed
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo "Error: workspace dependencies not installed."
  echo "Run: pnpm install (from project root)"
  exit 1
fi

# 4. Start the OpenClaw gateway on port 2027
echo "[gateway] Starting on port 2027..."
openclaw gateway &
GATEWAY_PID=$!
echo "[gateway] PID: $GATEWAY_PID"

# Give the gateway time to bind the port (poll for up to 15s)
echo "[gateway] waiting for port $GATEWAY_PORT to be ready..."
for i in $(seq 1 15); do
  if nc -z "$GATEWAY_HOST" "$GATEWAY_PORT" 2>/dev/null; then
    echo "[ok] Gateway is ready on port $GATEWAY_PORT"
    break
  fi
  if ! kill -0 "$GATEWAY_PID" 2>/dev/null; then
    echo "[error] Gateway process exited unexpectedly"
    exit 1
  fi
  sleep 1
done

# 5. Start the proxy on port 2026
echo "[proxy] Starting on port 2026..."
cd "$SCRIPT_DIR"
node proxy.mjs &
PROXY_PID=$!
echo "[proxy] PID: $PROXY_PID"

echo ""
echo "=== Production mode running ==="
echo "  Game Player:   http://localhost:2026/game-player/"
echo "  Game Director: http://localhost:2026/game-director/"
echo "  WebChat:       http://localhost:2026/webchat"
echo ""
echo "  Gateway (internal): http://localhost:2027"
echo ""
echo "Press Ctrl+C to stop."

# Wait for either process to exit
wait -n "$GATEWAY_PID" "$PROXY_PID" 2>/dev/null || wait

echo "[stop] A process exited, shutting down..."
kill "$GATEWAY_PID" "$PROXY_PID" 2>/dev/null || true
wait 2>/dev/null
