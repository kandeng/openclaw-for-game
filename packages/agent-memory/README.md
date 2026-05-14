# Agent Memory

**Module 6** -- QMD (Quantized Memory Digest) + database-backed persistent memory.

## Purpose

Provides persistent memory for every agent in the system:
- QMD encoding/decoding for efficient memory storage
- Per-agent isolated memory namespace (keyed by agentId)
- Pluggable storage backends (Redis, PostgreSQL, SQLite)
- Memory retrieval with similarity search, recency decay, and importance weighting

## Future

This package will contain:
- QMD encoder/decoder/compactor
- Abstract store interface with Redis, PostgreSQL, and SQLite adapters
- Retrieval engine (vector similarity, time-decay, importance scoring)
- Per-agent memory manager

## Configuration

Database backend is configured in `openclaw.json`:
- Redis for hot/session memory (fast, ephemeral)
- PostgreSQL for cold/long-term memory (durable, structured)
- SQLite as local dev fallback

## Connects To

- `packages/ai-runtime` (provides memory context to agents)
- `packages/game-agents` (each agent uses this for persistence)
