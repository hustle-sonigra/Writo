---
name: catchup
description: Load project context at the start of a session — reads CLAUDE.md, docs/HANDOFF.md and recent git history, then reports where things stand.
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git status:*)
---

# Catch up

1. Read `CLAUDE.md` and `docs/HANDOFF.md`.
2. Run `!git log --oneline -10` and `!git status --short`.
3. Cross-check: does the handoff still match the code? Open the files it names under
   "In flight" and "Known issues" and verify each is still true. Flag anything stale.

Then report, in under 15 lines:
- Where the project stands
- What is half-finished and the exact next step
- Anything in the handoff that no longer matches reality

Ask which task to pick up. Do not start editing until told.
