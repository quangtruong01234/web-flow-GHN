# Shared AI context

This directory is the canonical, tool-neutral source for repository guidance used by
Codex, Claude Code, and any other AI agent working in this repo. It mirrors the
`.ai/` convention used by the main TryBuy `frontend/` app.

- `project.md`: project overview, current phase, and context routing map
- `context/`: engineering rules loaded by task area
  - `core.md`: always-loaded hard rules
  - `structure.md`, `styling.md`, `auth.md`, `data-fetching.md`, `conventions.md`, `domain.md`: loaded by task

## Tool entry points (adapters — do not duplicate rules into them)

- `AGENTS.md`: Codex / generic agent adapter → points here
- `.claude/CLAUDE.md`: Claude Code adapter → `@`-imports the always-loaded files

## Maintenance

Update a shared rule **here only**. Do not maintain a second copy in a tool adapter.
Keep tool-specific configuration (settings, permissions) in `.claude/`.
