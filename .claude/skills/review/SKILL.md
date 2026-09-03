---
name: review
description: Review uncommitted changes against this project's conventions before committing.
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*)
---

Review `!git diff HEAD` against `CLAUDE.md`.

Check in this order, reporting only real findings:
1. **Auth** — is the route behind `requireAuth`? Does it assume `req.user` exists?
2. **Ownership** — can a user edit or delete a post they do not own?
3. **Render contract** — does every `res.render` pass every variable the EJS file reads?
   This is the most common breakage in this codebase.
4. **Injection & escaping** — `<%=` not `<%-` for user content. Any unvalidated `req.params.id`
   passed to `findById` (throws a CastError on malformed input)?
5. **Async** — missing `await`, unhandled rejection, no try/catch around a DB call.
6. **Secrets** — anything logged or committed that should not be.

For each finding: file, what breaks, and the minimal fix. No praise, no summary of what
the diff does. If the diff is clean, say so in one line.
