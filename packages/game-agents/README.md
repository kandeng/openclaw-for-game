# Game Agents

**Module 7** -- Game-specific agent definitions and behaviors.

## Purpose

Defines the AI-powered entities that populate the game world:
- **NPC agents** -- Each movable NPC has its own agent with personality and behavior
- **Camera agent** -- Controls cinematic camera movements and shot composition
- **Lighting agent** -- Controls scene lighting based on mood and narrative
- **AI Director agent** -- Autonomous narrative controller that paces the story
- **Asset agents** -- Controllers for changeable/interactive scene assets

## Future

This package will contain:
- Agent class definitions for each entity type
- Skill.md files defining each agent's persona and capabilities
- Behavior trees / state machines for NPC decision-making
- Narrative planning and event scheduling for the AI director

## Connects To

- `packages/ai-runtime` (execution engine for all agents)
- `packages/agent-memory` (persistent memory for each agent)
- `shared/` (shared type definitions for game events, state, commands)
