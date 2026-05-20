# Game Director

Human director web UI for the game. Built with React + Vite + Tailwind + Matrix.

The director logs in as `@human_director:matrix.openclaw.local` and joins the shared `#alice-bob` chat room.

## Prerequisites

- Node.js 22+
- pnpm
- For chat features: a Matrix homeserver — see `game-infra/`

## Setup

From the project root:

```sh
pnpm install
```

Or install just this package:

```sh
cd game-director && pnpm install
```

## Standalone Mode

```sh
pnpm dev
```

Opens on **http://localhost:5174** (port 5174, to avoid conflict with game-player on 5173).

The login form auto-fills `human_director` / `human_director_pass`.

Without a Matrix homeserver, the app shows the login screen. The joystick and HUD still render, but no chat messages flow.

With a homeserver running, sign in as `human_director` to test chat. The app auto-joins the `#alice-bob:matrix.openclaw.local` room.

## Build

```sh
pnpm build
```

For production deployment via game-openclaw (served from `/game-director/`):

```sh
BASE=/game-director/ pnpm build
```

## User Accounts

| User | Matrix ID | Password |
|------|-----------|----------|
| Human Director | `@human_director:matrix.openclaw.local` | `human_director_pass` |
