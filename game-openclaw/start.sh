#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export OPENCLAW_STATE_DIR="$SCRIPT_DIR/state"

if [ ! -f "$OPENCLAW_STATE_DIR/openclaw.json" ]; then
  echo "Error: $OPENCLAW_STATE_DIR/openclaw.json not found."
  echo "Run ./install.sh first."
  exit 1
fi

echo "Starting openclaw gateway on port 2027..."
echo "WebChat: http://localhost:2027/webchat"
exec openclaw gateway
