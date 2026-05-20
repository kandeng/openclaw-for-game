#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export OPENCLAW_STATE_DIR="$SCRIPT_DIR/state"

echo "Stopping openclaw gateway..."
exec openclaw gateway stop
