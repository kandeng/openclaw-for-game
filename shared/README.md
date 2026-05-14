# Shared

Cross-package type definitions and contracts.

## Purpose

Contains TypeScript interfaces and constants shared between all modules:
- Gateway protocol frame types (WebSocket)
- Game event definitions
- Game state schema (for director dashboard)
- Entity agent types (identity, role, status)
- QMD memory record types
- Director control commands (human + AI)
- MCP tool contracts
- AI runtime API interface (gateway <-> AI boundary)

## Future

This package will export types only (no runtime code) so that all other packages can depend on it without circular imports.
