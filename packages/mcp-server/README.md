# MCP Server

**Module 5** -- MCP (Model Context Protocol) tool servers.

## Purpose

Provides tool servers that AI agents can invoke:
- HTTP and WebSocket transport for MCP protocol
- Tool registration and discovery
- Individual tool server implementations (file access, web search, game state queries, etc.)

## Future

This package will contain:
- MCP transport layer (HTTP/WebSocket)
- Tool server implementations
- Tool registry for dynamic discovery

## Connects To

- `packages/ai-runtime` (invoked by AI agents via tool calls)
- `packages/gateway` (routed through the gateway)
