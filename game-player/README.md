# Game Player

Player web UI for the game — a mobile-first React PWA with 3D joystick controls and Matrix chat.

For features, usage guide, and production mode, see the [root README](../README.md).

## Prerequisites

- [Node.js](https://nodejs.org/) v22 or later
- pnpm (install via `npm install -g pnpm`)
- For chat features: a Matrix homeserver — see `game-infra/`

## Setup

From the project root:

```bash
pnpm install
```

Or install just this package:

```bash
cd game-player && pnpm install
```

## Standalone Mode

```bash
pnpm dev
```

Opens on **http://localhost:5173**.

Without a Matrix homeserver, the app shows the login screen. The joystick and HUD still render, but no chat messages flow.

With a homeserver running, sign in as `alice` or `bob` to test chat. The app auto-joins the `#alice-bob:matrix.openclaw.local` room.

## Build

```bash
pnpm build
pnpm preview
```

## Project Structure

```
game-player/
├── public/models/          # 3D model assets (.glb) — demo only
├── src/
│   ├── components/
│   │   ├── ThreeScene.tsx   # 3D viewport (replace with your VR/AR scene)
│   │   ├── Joystick.tsx     # 4-mode touch joystick (reusable)
│   │   ├── ChatPanel.tsx    # Matrix chat + toolbox panel (reusable)
│   │   ├── Login.tsx        # Matrix sign-in form (Tailwind)
│   │   └── HUD.tsx          # Telemetry overlay (reusable)
│   ├── matrix/
│   │   ├── client.ts        # Matrix client factory, login, creds storage
│   │   ├── listener.ts      # Room.timeline listener (dedup removed events)
│   │   └── dispatcher.ts    # sendChat — outbound text messages
│   ├── state/
│   │   └── store.ts         # Zustand store (creds, client, rooms, log)
│   ├── App.tsx              # Root component, Matrix boot + state management
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind CSS entry
├── index.html               # HTML shell with iOS meta tags
├── vite.config.ts           # Vite + PWA + Tailwind config
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type-safe development
- **Vite 8** — Build tool with hot module reload
- **Three.js** / **@react-three/fiber** / **@react-three/drei** — 3D rendering
- **Tailwind CSS v4** — Utility-first styling
- **matrix-js-sdk** — Matrix client protocol
- **Zustand** — State management
- **Framer Motion** — Chat panel animations
- **Lucide React** — Icon library
- **vite-plugin-pwa** — PWA manifest and service worker generation

## License

MIT — see [LICENSE](./LICENSE)

## Documentation

For technical details including architecture and workflow, please refer to [doc/WIKI.md](doc/WIKI.md).
