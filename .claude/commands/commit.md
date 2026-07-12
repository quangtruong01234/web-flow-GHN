# Commit Changes

Read `.ai/context/git-workflow.md` to understand the commit convention before committing.

Then:
1. Run `git status` to see changed files.
2. Group files by scope using `.ai/context/git-workflow.md`.
3. Run the relevant verification commands for the changed scope.
4. Create separate local commits following the format in `git-workflow.md`.
5. Do not push.
6. Report the list of commits created.

For `$commit --auto`, treat the request as commit-only automation. Do not edit source,
tests, docs, config, formatting, or generated files. If verification fails or inspection
finds a likely blocker, stop before staging and report the blocker; wait for a separate fix
request before changing files.
