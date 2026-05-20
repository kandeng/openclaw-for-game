#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_DIR="$SCRIPT_DIR/state"

echo "=== game-openclaw installer ==="

# 1. Install openclaw globally
if command -v openclaw &>/dev/null; then
  echo "[ok] openclaw already installed: $(openclaw --version 2>/dev/null || echo 'unknown version')"
else
  echo "[install] Installing openclaw globally..."
  pnpm add -g openclaw@2026.3.23-2
  echo "[ok] openclaw installed"
fi

# 1b. Install Matrix crypto native module (needed by the gateway for E2EE)
OPENCLAW_DIR="$(dirname "$(command -v openclaw)")/../lib/node_modules/openclaw"
# pnpm global layout may differ from npm
if [ ! -d "$OPENCLAW_DIR" ]; then
  OPENCLAW_DIR="$(pnpm root -g 2>/dev/null)/openclaw"
fi
if [ -d "$OPENCLAW_DIR/node_modules/@matrix-org/matrix-sdk-crypto-nodejs" ]; then
  echo "[ok] @matrix-org/matrix-sdk-crypto-nodejs already installed"
else
  echo "[install] Installing @matrix-org/matrix-sdk-crypto-nodejs for E2EE support..."
  (cd "$OPENCLAW_DIR" && npm install --legacy-peer-deps @matrix-org/matrix-sdk-crypto-nodejs 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "[ok] @matrix-org/matrix-sdk-crypto-nodejs installed"
  else
    echo "[warn] Failed to install @matrix-org/matrix-sdk-crypto-nodejs - E2EE will be unavailable, but basic messaging works"
  fi
fi

# 2. Install workspace dependencies (for production mode proxy)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -d "$PROJECT_ROOT/node_modules" ]; then
  echo "[ok] workspace dependencies already installed"
else
  echo "[install] Installing workspace dependencies..."
  cd "$PROJECT_ROOT"
  pnpm install
  cd "$SCRIPT_DIR"
  echo "[ok] workspace dependencies installed"
fi

# 3. Create state directory and copy agent template
echo "[setup] Creating state directory..."
mkdir -p "$STATE_DIR/agents/ai_director/agent"
cp "$SCRIPT_DIR/agents/ai_director/agent/AGENTS.md" "$STATE_DIR/agents/ai_director/agent/AGENTS.md"
echo "[ok] Agent ai_director created"

# 4. Generate openclaw.json (only if it doesn't already exist)
CONFIG_FILE="$STATE_DIR/openclaw.json"
if [ -f "$CONFIG_FILE" ]; then
  echo "[skip] $CONFIG_FILE already exists — not overwriting"
else
  echo "[setup] Generating openclaw.json..."

  # Read Qwen API key from env or prompt
  QWEN_KEY="${QWEN_API_KEY:-}"
  if [ -z "$QWEN_KEY" ]; then
    echo ""
    echo "The Qwen model provider needs an API key for dashscope.aliyuncs.com."
    echo "Get one at: https://dashscope.console.aliyun.com/apiKey"
    echo ""
    read -rp "Enter Qwen API key (or leave blank to set later): " QWEN_KEY
  fi

  # Read Matrix access token from env or prompt
  MATRIX_TOKEN="${MATRIX_ACCESS_TOKEN:-}"
  if [ -z "$MATRIX_TOKEN" ]; then
    echo ""
    echo "The Matrix channel needs an access token for @ai_director:matrix.openclaw.local."
    echo "To obtain one, register the user in Synapse and log in:"
    echo '    curl -s -X POST http://localhost:8008/_matrix/client/r0/login \'
    echo '    -H "Content-Type: application/json" \'
    echo '    -d '"'"'"'{\"type\":\"m.login.password\",\"user\":\"ai_director\",\"password\":\"ai_director_pass\"}'"'"'"' | jq -r .access_token'
    echo ""
    read -rp "Enter Matrix access token (or leave blank to set later): " MATRIX_TOKEN
  fi

  cat > "$CONFIG_FILE" << JSONEOF
{
  "meta": {},
  "models": {
    "mode": "merge",
    "providers": {
      "custom-dashscope-aliyuncs-com": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "PLACEHOLDER_SET_YOUR_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen-max",
            "name": "qwen-max (Custom Provider)",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 128000,
            "maxTokens": 8192
          },
          {
            "id": "qwen3-coder-plus",
            "name": "qwen3-coder-plus (Custom Provider)",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "custom-dashscope-aliyuncs-com/qwen-max"
      }
    },
    "list": [
      {
        "id": "ai_director",
        "default": true,
        "skills": []
      }
    ]
  },
  "channels": {
    "matrix": {
      "enabled": true,
      "homeserver": "http://localhost:8008",
      "accessToken": "PLACEHOLDER_SET_YOUR_TOKEN",
      "autoJoin": "always",
      "dm": { "policy": "open" },
      "network": { "dangerouslyAllowPrivateNetwork": true },
      "groupPolicy": "open"
    }
  },
  "gateway": {
    "port": 2027,
    "mode": "local"
  },
  "plugins": {
    "entries": {
      "matrix": { "enabled": true }
    }
  }
}
JSONEOF

  # Replace placeholders with actual values if provided
  if [ -n "$QWEN_KEY" ]; then
    sed -i "s|PLACEHOLDER_SET_YOUR_API_KEY|$QWEN_KEY|g" "$CONFIG_FILE"
    echo "[ok] Qwen API key set"
  else
    echo "[warn] Qwen API key not set. Edit $CONFIG_FILE to add it."
  fi
  if [ -n "$MATRIX_TOKEN" ]; then
    sed -i "s|PLACEHOLDER_SET_YOUR_TOKEN|$MATRIX_TOKEN|g" "$CONFIG_FILE"
    echo "[ok] Matrix access token set"
  else
    echo "[warn] Matrix access token not set. Edit $CONFIG_FILE to add it."
  fi

  echo "[ok] $CONFIG_FILE generated"
fi

echo ""
echo "=== Setup complete ==="
echo "Run ./start.sh to start the gateway (standalone mode, port 2026)"
echo "Run ./start-prod.sh to start the gateway + proxy (production mode, port 2026)"
echo "Visit http://localhost:2026/webchat to chat with ai_director"
