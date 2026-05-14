# Gateway

**Module 1** -- OpenClaw Gateway: the central hub.

## Purpose

The gateway is the WebSocket/HTTP hub that glues all other modules together:
- Serves the Game Control Big Screen static files
- Routes messages between Matrix clients and WebSocket connections
- Manages authentication and session state
- Provides hook system for extensibility

## Future

This package will absorb the current `src/gateway/`, `src/channels/`, `src/plugins/`, `src/config/`, and `src/infra/` source code.

## Connects To

- `packages/game-control` (serves its static build)
- `packages/client` (via Matrix channel adapter)
- `packages/ai-runtime` (via plugin hook / event bus, optional)
- `packages/mcp-server` (routes tool calls from AI runtime)
