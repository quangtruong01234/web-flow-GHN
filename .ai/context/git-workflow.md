# Git Workflow

## Commit Format

```
<type>(<scope>): <description>
```

**Allowed types:** `feat`, `fix`, `refactor`, `docs`, `chore`

**Banned types:** `update`, `fix bug`, `change`, `edit`, `wip`

## Scopes

Use the narrowest scope that describes the commit:

- `ghn` - GHN shipment screens, hooks, adapters, status/action workflows.
- `auth` - login/logout/me, route guards, allowed roles.
- `ui` - generic UI primitives, layout, styling-only UI changes.
- `tests` - Jest, Playwright, fixtures, test-only changes.
- `tooling` - package scripts, config, build/lint/e2e runner setup.
- `ai` - `.ai/`, `AGENTS.md`, `.claude/`, handoff/context guidance.
- `docs` - README or user-facing documentation outside `.ai/`.

## Rules

- Never commit unless the user explicitly asks for `$commit` or otherwise asks to commit.
- Do not push. Local commits only.
- Run `git status` first and inspect changed files.
- Group unrelated changes into separate commits by scope.
- Do not commit `.env`, `.next/`, `node_modules/`, Playwright reports, test results, or
  generated local artifacts.
- Keep commit messages in English, even if the user communicates in another language.
- Prefer small, reviewable commits over one mixed commit when files naturally split by
  scope.

## Suggested Validation Before Commit

Run the relevant checks for the changed scope. For broad app changes, run:

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd test
npm.cmd run build
npm.cmd run e2e
```

Run these sequentially. Do not run `npx.cmd tsc --noEmit` in parallel with
`npm.cmd run build`, because both can read/write `.next/types`.

## Examples

```
feat(ghn): wire gateway-backed shipment actions
fix(ghn): show retryable copy for transient sync failures
refactor(ui): use lucide-backed icon adapter
chore(tooling): add Windows-safe e2e runner
docs(ai): update GHN console guidance
```
