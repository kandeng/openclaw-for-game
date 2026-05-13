# Build a Game Engine based on OpenClaw

## 1. Background & Requirements

1. Refactor OpenClaw built-in **WebChat UI** into dedicated **Game Control Big Screen Website** for game directors and guides.

2. When deploying the customized OpenClaw game system together with the original vanilla OpenClaw on **the same physical server**, run them independently with **no port conflict, no config conflict, no data interference**.

3. The game control website acts as a **built-in frontend plugin** inside OpenClaw Gateway, following the same integration pattern as official WebChat.

4. Mobile players use PWA as Matrix clients to connect; messages and events are relayed through OpenClaw Gateway to the game control big screen, enabling directors to assign missions, give suggestions, and trigger storyline events.

5. The system architecture of the game engine refers to [`Game Control Room`](./openclaw_for_game_architecture.png) in the system architecture diagram. And the game client side refers to the `Matrix AppService` and `Matrix Client` in the system architecture diagram.


## 2. Core Architecture Design

1. openclaw_for_game: full copy of official OpenClaw source, customized UI, dedicated port, isolated config, independent data/log folders, separate process.

2. Game Control Big Screen: replace the official WebChat static frontend, embedded and served natively by Custom OpenClaw Gateway; no standalone web server required.

3. Communication Flow:
  Mobile PWA (Matrix Client) 
  → Custom OpenClaw Gateway 
  → Internal WebSocket
  → Game Control Big Screen UI
  → Director operation & event injection
  → Gateway forwards tasks/storyline back to players via Matrix.


## 3. Overall Implementation Strategy

1. This directory is a fork a complete independent copy of OpenClaw source code, renamed as `openclaw_for_game`. Feel free to modify any source code in this directory.

2. Replace the official WebChat static frontend with self-developed Game Control Big Screen UI.

3. Customize runtime isolation: different service port, different web route path, independent config file, isolated data & log directories, renamed binary/service identifier. To prevent from interfering with any openclaw systems running on the same computer. 

4. Reserve OpenClaw core capabilities: Gateway service, Matrix protocol channel, session management, WebSocket backend, agent runtime — keep unchanged.

5. Remove all the unnecessary functions of the openclaw, including the channels that we don't use, e.g. whatsapp, telegram, etc., including the plugins, e.g. Zapier, Codex harness, Google meet, etc.


## 4. Project File Structure of openclaw_for_game

The existing Control UI is a **Vite + Lit** SPA (TypeScript) located in `ui/`. The Game Control Big Screen replaces this UI by modifying the `ui/` source and building with the same Vite toolchain.

Runtime isolation is achieved via the `OPENCLAW_HOME` environment variable — each instance points to a separate home directory that holds its own `openclaw.json` config, data, logs, and credentials.

~~~
openclaw_for_game/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── openclaw.mjs
├── openclaw-game-home/             # OPENCLAW_HOME for game instance
│   └── .openclaw/
│       ├── openclaw.json           # Independent config file (gateway port, basePath, auth, etc.)
│       ├── credentials/            # Isolated credentials store
│       └── agents/                 # Isolated agent workspace & session data
├── ui/                             # Game Control Big Screen UI (replaces original Control UI)
│   ├── package.json                # Vite + Lit build config
│   ├── index.html                  # Main entry
│   ├── src/
│   │   ├── ui/
│   │   │   ├── controllers/
│   │   │   │   └── game-control.ts # Director event/task operation logic
│   │   │   ├── views/
│   │   │   │   ├── game-dashboard.ts  # Game state monitoring panel
│   │   │   │   ├── player-chat.ts     # Real-time player chat panel
│   │   │   │   ├── mission-panel.ts   # Mission task issuing module
│   │   │   │   └── storyline.ts       # Storyline event generator
│   │   │   └── chat/               # Reuse existing WebSocket/RPC client
│   │   └── ...
│   └── dist/                       # Build output served by gateway
├── src/                            # OpenClaw core source (unchanged mostly)
├── packages/
├── extensions/
└── deploy/
~~~


## 5. Key Source Code Modification Points

###  5.1 Frontend UI Replacement

1. Target Path: `openclaw_for_game/ui/`

2. Operation: Replace the original Control UI (Vite + Lit SPA in `ui/src/`) with Game Control Big Screen views. The UI framework (Vite + Lit + TypeScript) remains unchanged — only the views and controllers are replaced.

3. Reserved logic:
  - WebSocket RPC client connecting to gateway `/ws` endpoint (see `ui/src/ui/chat/`)
  - Compatible with native `chat.send` / `chat.history` / `chat.inject` RPC message protocol
  - Bootstrap config endpoint `/__openclaw__/bootstrap-config` for session initialization

4. Custom development:
  - Director game state monitoring panel
  - Real-time player chat panel
  - Mission task issuing module
  - Storyline event manual generator
  - Game runtime status dashboard


### 5.2 Gateway Web Route Customization

1. Game Control Big Screen access: `http://ip:18790/game_control`

2. The Control UI base path is configured via `gateway.controlUi.basePath` in the OpenClaw config (`openclaw.json`). The gateway's `control-ui-routing.ts` already supports arbitrary base paths — no gateway source modification needed.

3. Update the Vite `base` config in `ui/vite.config.ts` to match the configured base path so that built asset URLs are correct.


### 5.3 Isolated Configuration

Isolation is achieved via the `OPENCLAW_HOME` environment variable. Set it to a dedicated directory (e.g. `./openclaw-game-home`) so all config, data, credentials, and logs live separately from any vanilla OpenClaw instance.

Config file path: `openclaw-game-home/.openclaw/openclaw.json`

```json
{
  "gateway": {
    "port": 18790,
    "bind": "lan",
    "controlUi": {
      "basePath": "/game_control"
    }
  }
}
```

### 5.4 Runtime Isolation Rules

1. openclaw_for_game: dedicated port 18790, independent `OPENCLAW_HOME`, separate config/data/log/workspace/credentials.

2. Deploy as independent service. No shared port, no shared storage, no shared process space with any vanilla OpenClaw system on the same computer.

3. Isolation mechanism: each instance uses a different `OPENCLAW_HOME` directory. OpenClaw resolves its config path, state directory, credentials, agent workspaces, and logs all relative to this home directory (see `src/config/paths.ts` and `src/infra/home-dir.ts`).


## 6. Deployment & Startup Method

### 6.1 Development Runtime

~~~
cd openclaw_for_game
pnpm install

# Create the isolated home directory and config
mkdir -p openclaw-game-home/.openclaw
cat > openclaw-game-home/.openclaw/openclaw.json << 'EOF'
{
  "gateway": {
    "port": 18790,
    "bind": "lan",
    "controlUi": {
      "basePath": "/game_control"
    }
  }
}
EOF

# Start gateway with isolated home
OPENCLAW_HOME=./openclaw-game-home pnpm gateway:watch
~~~

### 6.2 Production Build & Deploy
~~~
pnpm build
pnpm ui:build
~~~

* Deploy as a website service, don't use Docker or Systemd

* Game Control Big Screen: `http://ip:18790/game_control`


## 7. Solution Advantages

1. Strictly follows OpenClaw official WebChat integration mode, belongs to standard plugin embedded architecture.

2. Double OpenClaw instances on one server are fully isolated: port / config / data / log / process are independent.

3. No need to develop additional standalone backend or WebSocket relay service; reuse native Matrix channel and message routing.

4. Directors can chat with players, assign tasks, and manually control game storyline through gateway internal APIs.

5. Subsequent narrative engine and game AI logic can be extended in src/ without affecting the original vanilla OpenClaw.


## 8. Isolation Guarantee Checklist

* Independent code repository

* Independent listening port

* Independent configuration file

* Independent data / log / workspace directory

* Independent runtime process / Docker instance

* No shared database and session storage