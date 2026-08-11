---
name: sweep
description: Run the GHN console weekly backlog sweep. Use when the user invokes $sweep, asks to sweep or audit the backlog, fix top risks, target a specific risk or handoff item, or propose the next GHN console features.
---

# GHN Console Backlog Sweep

Before taking any sweep action, read `../../../.ai/workflows/sweep.md` completely.

Execute that file as the canonical workflow. Treat any text following `$sweep` as its mode
or target argument. With no argument, fix the single highest-priority open item end-to-end.

Keep `.ai/workflows/sweep.md` as the sole source of workflow details. Do not duplicate or
silently override its backlog ordering, safety boundaries, validation steps, or close-out
requirements here.
