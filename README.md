# OpenClaw for Game

A game control system that provides a **Game Control Big Screen** web interface for game directors to manage live game sessions, communicate with players, and monitor game state in real-time.

Built on OpenClaw — an open-source multi-channel AI gateway.

## Features

- **Game Control Dashboard** — Web-based big screen UI for game directors
- **Real-time Messaging** — Send messages to server log from the dashboard
- **Player Communication** — Matrix protocol integration for player messaging
- **AI Agent Runtime** — Built-in AI agent for game logic and automation
- **Fully Isolated** — Runs independently without conflicting with other OpenClaw instances

## System Requirements

| Component | Requirement |
|-----------|-------------|
| OS | Linux (Ubuntu 20.04+), macOS 12+, Windows 10+ (WSL2) |
| Node.js | >= 22.0 |
| pnpm | >= 9.0 |
| RAM | >= 2GB |
| Disk | >= 500MB (including dependencies) |
| Network | LAN access (for game control UI) |

## Installation

### Step 1: Install Node.js 22

#### Ubuntu/Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version   # Should show v22.x.x
npm --version    # Should show 10.x.x
```

#### macOS (Homebrew)

```bash
brew install node@22

# Verify installation
node --version
```

#### Windows (WSL2)

Install WSL2 first, then follow Ubuntu instructions inside WSL.

### Step 2: Install pnpm

```bash
npm install -g pnpm

# Verify installation
pnpm --version   # Should show 9.x.x or higher
```

### Step 3: Clone the Repository

```bash
git clone https://github.com/kandeng/openclaw_unity_game.git
cd openclaw_unity_game
```

### Step 4: Install Dependencies

```bash
pnpm install
```

This downloads and installs all required packages. Takes 1-3 minutes depending on network speed.

### Step 5: Build the Project

```bash
# Build the gateway core
pnpm build

# Build the Game Control UI
cd ui
npx vite build
cd ..
```

Build output goes to `dist/` and `dist/control-ui/` directories.

## Configuration

### Create Game Config Directory

```bash
mkdir -p openclaw-game-home/.openclaw
```

### Create Configuration File

Create `openclaw-game-home/.openclaw/openclaw.json`:

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

### Configuration Options Explained

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gateway.mode` | string | Yes | Set to `"local"` for standalone mode |
| `gateway.port` | number | Yes | HTTP port number (default: 18790) |
| `gateway.bind` | string | Yes | `"lan"` = all interfaces, `"loopback"` = localhost only |
| `controlUi.basePath` | string | Yes | URL path for the web UI (default: `/game_control`) |
| `controlUi.dangerouslyDisableDeviceAuth` | boolean | Yes | Skip browser device pairing (convenience for game screens) |
| `controlUi.allowInsecureAuth` | boolean | Yes | Allow HTTP without TLS (local network only) |
| `auth.mode` | string | Yes | `"token"` or `"password"` |
| `auth.token` | string | If mode=token | Shared secret for authentication |

## Starting the Gateway

### Basic Start

```bash
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 18790 --bind lan --force
```

### Start with Verbose Logging

```bash
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 18790 --bind lan --force --verbose
```

### Expected Output

```
🦞 OpenClaw 2026.5.12-beta.1
   Gateway online—please keep hands, feet, and appendages inside the shell at all times.

23:43:09 [gateway] loading configuration…
23:43:09 [gateway] force: no listeners on port 18790
23:43:09 [gateway] resolving authentication…
23:43:09 [gateway] starting...
23:43:10 [gateway] starting HTTP server...
23:43:10 [health-monitor] started
23:43:10 [plugins] loaded 1 plugin(s)
23:43:10 [gateway] agent model: openai/gpt-5.5
23:43:10 [gateway] http server listening
23:43:10 [gateway] ready
23:43:10 [heartbeat] started
```

The gateway is now running and ready.

### Stop the Gateway

Press `Ctrl+C` in the terminal where the gateway is running.

Or force kill from another terminal:

```bash
pkill -9 -f "openclaw.mjs gateway"
```

## Usage

### Access the Game Control Dashboard

Open your web browser and navigate to:

```
http://<server-ip>:18790/game_control/
```

Examples:
- Local machine: `http://localhost:18790/game_control/`
- LAN access: `http://192.168.1.100:18790/game_control/`

### Game Control Dashboard Features

The dashboard provides the following panels:

#### 1. Status Indicator
- Shows gateway connection state
- Green = connected, Red = disconnected
- Located in the top-right corner

#### 2. Message Inbox
Send messages from the dashboard to the server console log.

**How to use:**
1. Type your message in the "Send Message to Server" text input
2. Click the **Send** button, or press **Enter**
3. Message appears in the gateway terminal with `[game-control]` prefix

**Example:**
- You type: `Game starting in 5 minutes`
- Server log shows: `[game-control] message from UI: Game starting in 5 minutes`

#### 3. Player Chat (Placeholder)
- Future feature for real-time player messaging
- Will integrate with Matrix protocol

#### 4. Mission Control (Placeholder)
- Future feature for managing game missions
- Create, assign, and track mission progress

#### 5. Storyline Events (Placeholder)
- Future feature for triggering storyline events
- Schedule and broadcast event notifications

#### 6. Game State (Placeholder)
- Future feature for displaying current game state
- Show player scores, progress, and game variables

### API Endpoints

#### Send Message (POST)

```bash
curl -X POST http://127.0.0.1:18790/game_control/api/game-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Your message here"}'
```

**Response:**
```json
{"ok": true}
```

**Server Log:**
```
[game-control] message from UI: Your message here
```

### Authentication

When accessing the gateway, you need to provide the authentication token.

#### Via URL Parameter

```
http://localhost:18790/game_control/?token=game-control-2026
```

#### Via WebSocket

The UI automatically handles authentication using the token from the URL or localStorage.

## Development

### UI Development with Hot Reload

```bash
cd ui
npx vite
```

The Vite dev server starts at `http://localhost:5173` with:
- Hot module replacement (instant updates)
- Automatic proxy to gateway API
- Source maps for debugging

Open `http://localhost:5173` in your browser. Changes to `ui/src/main.ts` update instantly.

### Gateway Development

Restart the gateway after code changes:

```bash
# Stop existing gateway (Ctrl+C or kill)
pkill -9 -f "openclaw.mjs gateway"

# Rebuild
pnpm build
cd ui && npx vite build && cd ..

# Restart
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 18790 --bind lan --force --verbose
```

### Project Structure

```
openclaw_unity_game/
│
├── openclaw-game-home/          # Game instance data (not in git)
│   └── .openclaw/
│       └── openclaw.json        # Your configuration
│
├── ui/                          # Game Control UI source
│   ├── src/
│   │   └── main.ts              # Main Lit web component
│   ├── index.html               # HTML entry point
│   ├── vite.config.ts           # Vite build configuration
│   └── package.json             # UI dependencies
│
├── src/                         # Gateway core source
│   ├── gateway/                 # HTTP server, WebSocket, routing
│   ├── config/                  # Configuration parsing
│   ├── cli/                     # Command-line interface
│   └── agents/                  # AI agent runtime
│
├── dist/                        # Built gateway output
│   └── control-ui/              # Built UI assets
│
├── dist-runtime/                # Runtime extension files
├── docs/
│   └── reference/
│       └── templates/           # Workspace templates (required)
├── scripts/                     # Build and utility scripts
├── config/                      # TypeScript/lint configurations
├── proposal/                    # Design documentation
│   └── WIKI.md                  # System architecture wiki
│
├── openclaw.mjs                 # CLI entry point
├── package.json                 # Project dependencies
├── pnpm-lock.yaml               # Locked dependency versions
└── README.md                    # This file
```

## Environment Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `OPENCLAW_HOME` | Game instance directory | `./openclaw-game-home` | Yes |
| `OPENCLAW_GATEWAY_PORT` | Override config port | `18790` | No |
| `OPENAI_API_KEY` | OpenAI API key (for AI features) | `sk-...` | Optional |

## CLI Reference

### Gateway Commands

```bash
node openclaw.mjs gateway run [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--port <number>` | HTTP port | From config or 18789 |
| `--bind <mode>` | Network binding: `loopback` or `lan` | From config |
| `--force` | Kill existing process on port | false |
| `--verbose` | Enable detailed logging | false |

### Examples

**Start on custom port:**
```bash
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 9000 --bind loopback
```

**Start with force mode:**
```bash
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 18790 --bind lan --force
```

## Security

### Local Network Only

The default configuration is designed for **local game LAN** use:

- `allowInsecureAuth: true` — Allows HTTP without HTTPS
- `dangerouslyDisableDeviceAuth: true` — Skips browser pairing

**DO NOT expose this to the public internet with these settings.**

### Public Deployment Hardening

If deploying to a public server:

1. **Enable HTTPS** — Use a reverse proxy (nginx, Caddy) with TLS
2. **Remove dangerous flags** — Delete `dangerouslyDisableDeviceAuth` and `allowInsecureAuth`
3. **Use strong authentication** — Generate a secure token:
   ```bash
   openssl rand -hex 32
   ```
4. **Restrict binding** — Use `bind: "loopback"` behind a reverse proxy
5. **Firewall rules** — Only allow necessary ports

## Isolation

This system runs completely isolated from other OpenClaw instances:

| Resource | This System | Default OpenClaw |
|----------|-------------|------------------|
| Port | 18790 | 18789 |
| Config directory | `./openclaw-game-home/` | `~/.openclaw/` |
| Data directory | `./openclaw-game-home/` | `~/.openclaw/` |
| UI path | `/game_control/` | `/` |
| Process | Independent | Separate |

Isolation is enforced via the `OPENCLAW_HOME` environment variable.

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use 0.0.0.0:18790`

**Solution:**
```bash
# Find what's using the port
lsof -i :18790

# Kill the process
kill -9 <PID>

# Or use --force flag to auto-kill
OPENCLAW_HOME=./openclaw-game-home node openclaw.mjs gateway run --port 18790 --bind lan --force
```

### Missing Workspace Templates

**Error:** `Missing workspace template: AGENTS.md`

**Solution:** Ensure these files exist:
```
docs/reference/templates/AGENTS.md
docs/reference/templates/SOUL.md
docs/reference/templates/TOOLS.md
docs/reference/templates/IDENTITY.md
docs/reference/templates/USER.md
docs/reference/templates/HEARTBEAT.md
docs/reference/templates/BOOTSTRAP.md
```

All template files are included in this repository.

### Gateway Won't Start on LAN

**Error:** `EXIT_CONFIG_ERROR` when using `bind: "lan"`

**Solution:** LAN binding requires authentication. Make sure your config has:
```json
{
  "auth": {
    "mode": "token",
    "token": "your-secret-token"
  }
}
```

### UI Not Loading

**Check:**
1. Gateway is running: Check terminal for `[gateway] ready`
2. UI is built: Verify `dist/control-ui/index.html` exists
3. Correct URL: `http://<ip>:18790/game_control/` (note the trailing slash)
4. Token authentication: Add `?token=game-control-2026` to URL

### Build Fails

**Try:**
```bash
# Clean and reinstall
rm -rf node_modules dist
pnpm install
pnpm build
```

## License

MIT License — see [LICENSE](LICENSE) file.

## Support

- **Issues:** https://github.com/kandeng/openclaw_unity_game/issues
- **Documentation:** See `proposal/WIKI.md` for system architecture details
