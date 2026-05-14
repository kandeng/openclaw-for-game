# Game Control Big Screen

**Module 3** -- Game Control Big Screen website + Director Dashboard.

## Purpose

A web application (served by the gateway) that provides:
- **Big Screen view** -- Full-screen 3DGS scene rendering with mesh objects as movable assets
- **Director Dashboard** -- Real-time game state, narrative timeline, and control knobs

## Current State

Currently implemented with Lit (web components). Will be refactored to React + React Three Fiber in a future session.

## Tech Stack (Target)

- React 19 + React Three Fiber (3D rendering)
- gsplat.js (3DGS Gaussian Splatting)
- Zustand (state management, synced via WebSocket)
- Vite (build tool)

## Connects To

- OpenClaw Gateway (via WebSocket for real-time game state)
- Gateway HTTP API (for asset fetching: /api/fetch-3dgs, /api/game-asset)

## Build

```bash
cd packages/game-control
pnpm install
pnpm build   # outputs to dist/game_control/ served by gateway
```
