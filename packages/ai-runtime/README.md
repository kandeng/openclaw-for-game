# AI Runtime

**Module 4** -- PI agent loop and AI model integration.

## Purpose

Hosts the AI agent execution engine:
- PI loop: bind agent/session -> assemble prompt -> call AI model -> execute tool -> generate response
- Multi-provider support (OpenAI, Anthropic, etc.)
- Agent-per-entity orchestration (NPC, camera, lighting, director AI)
- Sandboxed tool execution

## Future

This package will absorb the current `src/agents/` source code and own all `@earendil-works/pi-*` dependencies.

It exports a single `registerAIRuntime(gateway)` function that the gateway calls only when `agents` is configured in `openclaw.json`.

## Connects To

- `packages/gateway` (registers via plugin hook / event bus)
- `packages/agent-memory` (persistent memory for each agent)
- `packages/mcp-server` (invokes MCP tools)
- `packages/game-agents` (game-specific agent definitions)

## Activation

This module is **optional**. When `agents.enabled` is absent or false in `openclaw.json`, the gateway runs as a pure relay without loading any AI runtime code.
