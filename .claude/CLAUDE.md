# TryBuy GHN Console — Claude Code Adapter

Shared agent guidance is canonical in `.ai/`.

Before repository work, read completely:

@../.ai/project.md
@../.ai/context/core.md
@../.ai/context/domain.md

Load additional files using the Context Map in `.ai/project.md`:

- Folder layout, App Router routes, where to put a file → `.ai/context/structure.md`
- Tailwind, tokens, `cn()`, light theme → `.ai/context/styling.md`
- Login, logout, roles, route guards → `.ai/context/auth.md`
- Backend calls, API gateway boundary, env vars → `.ai/context/data-fetching.md`
- Components, TypeScript, `NEXT_PUBLIC_*` → `.ai/context/conventions.md`
- GHN status semantics (read-only), mock vs. real → `.ai/context/domain.md`

## Quick commands (Windows-safe — use `.cmd` when `npm.ps1` is blocked)

```bash
npm.cmd run dev     # Next dev → http://localhost:3013
npm.cmd run lint    # next lint — must pass before done
npm.cmd run build   # next build
npx.cmd tsc --noEmit  # type check — must pass before done
```

Claude-specific settings stay under `.claude/`. Do not copy shared rules back into this file.
