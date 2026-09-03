---
name: handoff
description: Write or update docs/HANDOFF.md with a session summary so the next Claude Code session can resume with full context.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git status:*), Bash(git log:*), Bash(git diff:*)
argument-hint: [optional note about what this session was about]
---

# Session handoff

Extra context from the user: $ARGUMENTS

## Gather
- `!git status --short`
- `!git log --oneline -15`
- `!git diff --stat HEAD`
- Read the existing `docs/HANDOFF.md` if present — you are updating it, not starting over.
- Skim any files you touched this session.

## Write `docs/HANDOFF.md`
Overwrite it with these sections, in this order. Keep it under ~150 lines — it is a
briefing, not a changelog. Be concrete: name files, functions, routes, line-level details.

1. **Last updated** — today's date, one line on the session's theme.
2. **State of the app** — what works end to end right now. One line each.
3. **Changed this session** — file → what changed → why. Only real changes.
4. **In flight** — anything half-done, with the exact next step to finish it.
5. **Known issues** — bugs and rough edges found but not fixed, ranked by severity.
   Include the file and the reason it breaks.
6. **Decisions made** — choices a future session might otherwise undo, and the reasoning.
7. **Next up** — 3–5 concrete tasks in priority order, phrased as actions.
8. **Gotchas** — anything surprising about this codebase a fresh session would trip on.

## Rules
- Do not invent progress. If you did not verify something runs, say "unverified".
- Do not duplicate `CLAUDE.md`. That file holds stable facts; this one holds current state.
- If a known issue got fixed, delete it from the list rather than marking it done.
- End your reply with a 3-line summary and nothing else.
