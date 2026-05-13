# openclaw_for_game — System Wiki

## Overview

`openclaw_for_game` is a game control system built on top of OpenClaw. It replaces the default Control UI with a custom **Game Control Big Screen** web application, serving game directors who manage players, missions, and storyline events.

The system runs as a fully isolated instance — separate port, config, data, and process — so it coexists safely with any vanilla OpenClaw installation on the same machine.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Game Control Big Screen                        │
│              (Lit Web Component @ /game_control/)                 │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Player  │  │   Mission    │  │ Storyline │  │   Game     │  │
│  │  Chat    │  │   Control    │  │  Events   │  │   State    │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Message Inbox: POST → /game_control/api/game-message      │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               OpenClaw Gateway (port 18790)                       │
│                                                                   │
│  • Serves Game Control UI static assets                          │
│  • Handles /api/game-message POST → logs to server console       │
│  • WebSocket endpoint for real-time communication                │
│  • Matrix protocol channel for player messaging                  │
│  • Agent runtime and session management                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Matrix Protocol
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Mobile Players (PWA / Matrix Clients)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow

### Startup Sequence

1. Set `OPENCLAW_HOME` to the game-specific home directory
2. Gateway loads config from `$OPENCLAW_HOME/.openclaw/openclaw.json`
3. Gateway binds to port **18790** on LAN interface (`0.0.0.0`)
4. Built UI assets from `dist/control-ui/` are served at `/game_control/`
5. Gateway authenticates connections using token `game-control-2026`
6. Gateway is ready — directors open `http://<ip>:18790/game_control/`

### Message Flow (UI → Server Log)

1. Director types text in the "Send Message to Server" input box
2. UI sends HTTP POST to `/game_control/api/game-message` with JSON body `{"message": "..."}`
3. Gateway's `handleGameMessagePost()` handler receives the request
4. Message is logged to server console: `[game-control] message from UI: <text>`
5. HTTP 200 `{"ok": true}` is returned; UI shows success feedback

### Startup Command

```bash
OPENCLAW_HOME=/home/robot/openclaw_for_game/openclaw-game-home \
  node /home/robot/openclaw_for_game/openclaw.mjs gateway run \
  --port 18790 --bind lan --force
```

---

## File Structure (Actual)

After cleanup, only game-relevant directories remain. Removed: `extensions/`, `patches/`, `apps/`, `deploy/`, `packages/`, `security/`, `docs/`, `skills/`.

```
openclaw_for_game/
├── openclaw-game-home/                  # Isolated OPENCLAW_HOME directory
│   └── .openclaw/
│       ├── openclaw.json                # Gateway config (port, auth, basePath)
│       └── logs/
│           └── config-health.json       # Config integrity tracking
│
├── ui/                                  # Game Control Big Screen UI source
│   ├── package.json                     # Lit 3.3.2 + Vite 8.0.12
│   ├── index.html                       # Entry HTML (mounts <game-control-app>)
│   ├── vite.config.ts                   # Build config (base: /game_control/)
│   ├── public/                          # Static assets (favicon, manifest)
│   └── src/
│       └── main.ts                      # GameControlApp Lit component
│
├── dist/control-ui/                     # Built UI output (served by gateway)
│   ├── index.html
│   └── assets/
│       └── index-*.js                   # Bundled JS
│
├── src/                                 # OpenClaw core (gateway, channels, agents)
│   ├── gateway/
│   │   ├── control-ui.ts                # Control UI handler + game-message POST
│   │   └── ...                          # Server, auth, WebSocket
│   ├── config/                          # Config paths, types, parsing
│   ├── cli/                             # CLI commands (gateway run)
│   ├── agents/                          # Agent runtime
│   └── ...                              # Other core modules
│
├── config/                              # TypeScript, lint, format configs
├── scripts/                             # Build & dev scripts
├── test/                                # Test suite
├── qa/                                  # QA test scenarios
├── changelog/                           # Changelog fragments
├── proposal/                            # Design docs
│   ├── proposal.md                      # Original design proposal
│   ├── openclaw_for_game_architecture.png
│   └── WIKI.md                          # This file
├── openclaw.mjs                         # CLI entry point / launcher
├── package.json                         # Root package config
├── pnpm-lock.yaml                       # Dependency lockfile
└── node_modules/                        # Installed dependencies
```

---

## Key Configuration

**File:** `openclaw-game-home/.openclaw/openclaw.json`

```json
{
  "gateway": {
    "mode": "local",
    "port": 18790,
    "bind": "lan",
    "controlUi": {
      "basePath": "/game_control",
      "dangerouslyDisableDeviceAuth": true,
      "allowInsecureAuth": true
    },
    "auth": {
      "mode": "token",
      "token": "game-control-2026"
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| `port: 18790` | Avoids conflict with vanilla OpenClaw (default 18789) |
| `bind: "lan"` | Listen on all interfaces so LAN devices can access |
| `controlUi.basePath` | UI served at `/game_control/` instead of root `/` |
| `dangerouslyDisableDeviceAuth` | Skip browser pairing step (convenience for game screen) |
| `allowInsecureAuth` | Allow HTTP auth without TLS (local network only) |
| `auth.mode: "token"` | Simple shared token for gateway access |

---

## Key Source Modifications

### 1. UI Component — `ui/src/main.ts`

The `GameControlApp` Lit web component replaces the vanilla Control UI. It provides:
- Dark-themed director dashboard with status indicator
- **Message inbox**: text input + Send button that POSTs to the gateway
- Placeholder panels for Player Chat, Mission Control, Storyline Events, Game State

### 2. Gateway Handler — `src/gateway/control-ui.ts`

Added `handleGameMessagePost()` function that:
- Intercepts `POST /game_control/api/game-message` before standard routing
- Parses JSON body, extracts `.message` string
- Logs to server stdout with `[game-control]` prefix
- Returns JSON success/error response

### 3. Build Config — `ui/vite.config.ts`

- `base: "/game_control/"` — ensures all asset URLs match the gateway base path
- `outDir: "../dist/control-ui"` — output goes where the gateway expects it

---

## Isolation Mechanism

The system is fully isolated from any other OpenClaw instance via `OPENCLAW_HOME`:

| Resource | Game Instance | Vanilla OpenClaw |
|----------|---------------|-----------------|
| Port | 18790 | 18789 (default) |
| Home dir | `openclaw-game-home/` | `~/.openclaw/` |
| Config | `openclaw-game-home/.openclaw/openclaw.json` | `~/.openclaw/openclaw.json` |
| Logs | `openclaw-game-home/.openclaw/logs/` | `~/.openclaw/logs/` |
| UI path | `/game_control/` | `/` |
| Process | Independent node process | Separate process/systemd |
| Lock dir | `/tmp/openclaw-<uid>/` (port-based) | Same dir, different port lock |

The isolation is enforced by `src/config/paths.ts` and `src/infra/home-dir.ts` which resolve all paths relative to `OPENCLAW_HOME`.

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Build everything (gateway + UI)
pnpm build
cd ui && npx vite build

# Start gateway (development)
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 18790 --bind lan --force --verbose

# UI dev server (hot reload, proxies to gateway)
cd ui && npx vite

# Test the message endpoint
curl -X POST http://127.0.0.1:18790/game_control/api/game-message \
  -H "Content-Type: application/json" \
  -d '{"message": "hello from curl"}'
# Server log shows: [game-control] message from UI: hello from curl
```

---

## Security Notes

- `dangerouslyDisableDeviceAuth` and `allowInsecureAuth` are intentional for a local game LAN setup
- The `game-control-2026` token prevents unauthorized WebSocket connections
- Do **not** expose port 18790 to the public internet with these settings
- For public deployment: enable TLS, remove dangerous flags, use proper auth
