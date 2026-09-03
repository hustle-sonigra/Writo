# Benchmarking environment — `searchOutput` baseline

Goal: measure the latency cost of the in-memory regex search in
`controllers/postController.js#searchOutput` against a **local, containerized**
Mongo, before any text index exists, so the same k6 script can be re-run later
(out of scope here) once a text index is added, for a clean before/after
comparison.

App runs natively on the Windows host (`npm start`), against a Mongo container.
k6 runs natively on Windows. Docker is only used for Mongo. No Dockerfile, no
edits to any existing file — every file below is new.

## Environment detected

- Windows 11 Home, build 26200, x86_64
- WSL: **not installed** — required, since Docker Desktop on Home edition needs
  the WSL2 backend (no Hyper-V on Home)
- Docker / Docker Compose: **not installed**
- k6: **not installed**
- Node v22.19.0, npm 10.9.3: **present** on host — this is what `npm start`
  will use, and it's the same Node your existing `node_modules/bcrypt` was
  already built against, so nothing needs recompiling.

## The gotcha this plan is built around

`Models/post.js` already declares a text index on the schema:

```js
postSchema.index({ postTittle: "text", postData: "text" });
```

`searchOutput` currently queries with a regex (`$or` on `postTittle`/`postData`),
not `$text` — so today that index is dormant *for this query*, but it's still
declared. Mongoose's default `autoIndex: true` builds every declared index in
the background the moment a connection opens and the model is used — regardless
of whether any query references it. That means the instant `app.js` connects to
a fresh Mongo container, a text-index build silently starts, competing for the
same mongod CPU/IO you're trying to measure the baseline against, and
eventually the index *does* exist — violating "baseline before any text index
exists."

Since `Models/post.js` and `config/db.js` can't be edited, the fix is a Node
`-r` preload file (`bench/no-autoindex.js`) that calls
`mongoose.set('autoIndex', false)` globally, loaded *before* `app.js` or the
seed script require any models. Mongoose resolves `autoIndex` as schema option
→ connection option → global `mongoose` setting; the schema and connection here
set neither, so the global flag wins. This is used for both the seed step and
the baseline app run.

## Phase 0 — toolchain (you run this, not me)

**Docker Desktop.** Requires WSL2 first:

```powershell
wsl --install
```

This requires a **reboot**. After reboot, install Docker Desktop for Windows
(WSL2 backend is the default and only supported backend on Home edition):

- Docs: https://docs.docker.com/desktop/install/windows-install/
- Direct installer: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

During setup, keep "Use WSL 2 instead of Hyper-V" checked (it's the default).
Launch Docker Desktop once after install so its background service starts.

Verify:

```powershell
docker run hello-world
docker compose version
```

Expect: the hello-world container prints a welcome message and exits 0;
`docker compose version` prints a `v2.x` line. **Likeliest failure:** `docker`
not recognized — the terminal was opened before Docker Desktop finished
installing/starting; open a new PowerShell window. Second likeliest: a Windows
Defender Firewall prompt on first container run — allow it, or Docker's
internal networking won't come up.

**k6.**

```powershell
winget install k6.k6
```

If winget isn't available, Chocolatey (`choco install k6`) or the MSI from
https://github.com/grafana/k6/releases/latest work identically.

Verify:

```powershell
k6 version
```

Expect: a `k6 v0.x.x` line. **Likeliest failure:** PATH not refreshed after
winget install — open a new terminal.

## Phase 1 — Mongo via Compose

Files created:
- `bench/docker-compose.yml` — one service, `mongo:7`, port published as
  `27117:27017` (not the default 27017, so this never collides with a
  locally-installed mongod and so `27117` in a command is an unambiguous
  visual signal you're pointed at the bench instance), a named volume for
  data, no auth (local-only, throwaway data).

Commands:

```powershell
docker compose -f bench/docker-compose.yml up -d
docker compose -f bench/docker-compose.yml ps
```

Verify: `ps` shows the `mongo` service as `running (healthy)` or just
`running`. `docker exec -it <container> mongosh --eval "db.adminCommand('ping')"`
returns `{ ok: 1 }`. **Likeliest failure:** port 27117 already bound by
something else (unlikely, but check with `netstat -ano | findstr 27117` if
`up -d` errors) — pick a different host port in the compose file.

## Phase 2 — seed

Files created:
- `bench/no-autoindex.js` — one line: `require("mongoose").set("autoIndex", false);`
  Reused in Phase 3.
- `bench/seed.js` — seed script. Requires `../config/db.js` (unmodified) so it
  connects with the exact same logic the app uses, `../Models/user` and
  `../Models/post` for schema/field-name fidelity (`postTittle` included).
  Reads `SEED_USERS` (default 50) and `SEED_POSTS` (default 20,000) from env.
  Creates users with a single pre-computed bcrypt hash shared across all of
  them (see Decisions) and posts with body text drawn from a small local word
  list, with three fixed keywords injected as **whole, space-delimited
  words** at three different frequencies:
  - `javascript` — common, injected into ~20% of bodies
  - `xenolith` — rare, injected into exactly 25 bodies regardless of
    `SEED_POSTS` (so the rare band's match count doesn't drift as volume
    changes)
  - `gerrymandering` — miss, injected into 0 bodies

  All three are picked so none is a substring of another and none is a
  substring of any word in the filler vocabulary used to pad bodies —
  `searchOutput`'s regex is substring-matching and case-insensitive
  (`new RegExp(keyword, "i")`), so a careless choice (e.g. `"script"` as rare
  when `"javascript"` is common) would silently let one band's matches leak
  into another. Because that same line also passes `keyword` into `RegExp`
  **unescaped**, the three keywords are restricted to plain alphanumeric
  words with no regex metacharacters — the app has no escaping to protect a
  malformed pattern, so the bench script can't introduce one either. Any
  place `seed.js` itself needs to build a `RegExp` from a keyword (e.g. to
  verify injected counts while seeding), it does so through a small
  `escapeRegex()` helper before constructing it — defensive, and not
  something the app itself does, so this only protects the bench tooling's
  own bookkeeping, not `searchOutput`. Inserts posts with `insertMany`, then
  back-fills `user.posts` with one `bulkWrite` of `$push` ops (not required
  by `searchOutput` itself, which never reads `user.posts` — done anyway for
  data integrity, see Decisions). Prints the resolved `MONGO_URI`
  (host/port/db name only, no credentials) and the actual injected counts for
  all three keywords at startup so you can eyeball both before trusting a k6
  run against them.

**Safety check before running anything:** `config/db.js` reads
`process.env.MONGO_URI`, and `dotenv` (loaded by `config/db.js`) never
overwrites a variable that's already set in the process environment. So
setting `$env:MONGO_URI` in the shell *before* running the seed script safely
overrides whatever is in your untracked `.env` — but only if you actually set
it every time, in the same shell session. Getting this wrong means seeding
20,000 junk posts into whatever database your real `.env` points at.

Commands (PowerShell):

```powershell
$env:MONGO_URI = "mongodb://localhost:27117/blogger_bench"
node -r ./bench/no-autoindex.js bench/seed.js
```

Verify: script logs the resolved URI, then a final count
(`users: 50, posts: 20000`). Then confirm no text index exists yet:

```powershell
docker exec -it <container> mongosh blogger_bench --eval "db.posts.getIndexes()"
```

Expect: only the default `_id_` index. **Likeliest failure:** the script hangs
on connect — `$env:MONGO_URI` wasn't set in *this* shell (a new PowerShell tab
resets it), so it's trying to reach `localhost:27017` with nothing listening
there. Second likeliest: `getIndexes()` already shows a `postTittle_text...`
index — the preload wasn't actually picked up (check the `-r` flag came before
the script path, not after).

## Phase 3 — baseline k6 run

Files created:
- `bench/k6-search.js` — k6 script. `setup()` reads `JWT_SECRET` and a seeded
  user email from k6 env vars (`__ENV.JWT_SECRET`, `__ENV.BENCH_EMAIL`) and
  mints a JWT itself using `k6/crypto`'s `hmac('sha256', ..., 'base64rawurl')`
  and `k6/encoding`'s `b64encode(..., 'rawurl')` — building the exact
  `header.payload.signature` HS256 structure `jsonwebtoken` produces, with a
  `{ email }` payload matching the contract `authMiddleWare` expects. The
  default function POSTs to
  `` `http://localhost:${__ENV.APP_PORT || 3000}/api/v1/post/filtered` ``
  — the full URL, not just the path, built from an `APP_PORT` k6 env var
  (default 3000, matching `app.js`'s own `process.env.PORT || 3000`) — with
  the token as a `Cookie: token=...` header. This is exactly
  `routes/postRoutes.js:17`'s `router.post("/api/v1/post/filtered", ...)`;
  confirmed against the route table (not `/feed/filtered`, which doesn't
  exist as a route) and against `public/javascripts/feed/feedSearch.js`,
  which is what the real feed page calls today. Requests cycle through the
  common/rare/miss keywords from the seed script, each tagged as a separate
  k6 `Trend` metric so the three cost profiles don't get averaged into mush.
  Constant 10 VUs for 30s (see Decisions).

**Why mint the token instead of logging in via `setup()`:** `authMiddleWare`
resolves the user purely from the JWT's `{ email }` claim
(`User.findOne({ email: data.email })`) — it never checks how the token was
produced. Logging in for real would route every `setup()` call through
`bcrypt.compare`, which is deliberately slow and has nothing to do with the
code path being measured. Minting the token directly isolates the benchmark
to exactly `searchOutput`, and it's cheap to do correctly since the token
contract is just `{ email }`.

Commands — two terminals, in this order:

Terminal A (start the app *with autoIndex disabled*, against the bench Mongo):

```powershell
$env:MONGO_URI = "mongodb://localhost:27117/blogger_bench"
node -r ./bench/no-autoindex.js app.js
```

Terminal B (confirm still no text index, then run k6):

```powershell
docker exec -it <container> mongosh blogger_bench --eval "db.posts.getIndexes()"

docker exec -it <container> mongosh blogger_bench --eval `
  'db.posts.find({ $or: [{ postTittle: /gerrymandering/i }, { postData: /gerrymandering/i }] }).explain("executionStats").executionStats'

$env:JWT_SECRET = (Select-String -Path .env -Pattern '^JWT_SECRET=(.*)$').Matches.Groups[1].Value
k6 run -e JWT_SECRET=$env:JWT_SECRET -e BENCH_EMAIL="bench-user-1@example.com" -e APP_PORT=3000 `
  --summary-export=bench/baseline.json bench/k6-search.js
```

(The `Select-String` line reads `JWT_SECRET` out of your local `.env` into a
shell variable without ever printing it to this conversation or a file.)

Verify: `getIndexes()` still shows only `_id_` (proves the run really happened
before any text index existed). The `explain()` call — run against the
`gerrymandering` miss keyword specifically, since that's the query with
nowhere to stop early — shows `executionStages.stage: "COLLSCAN"` (no
`IXSCAN` anywhere in the plan) and `totalDocsExamined` equal to
`SEED_POSTS`; that's the actual proof this baseline is a full unindexed scan,
independent of whatever latency number k6 reports. k6's summary shows checks
at 100% (all responses `200`), and three separate `Trend` blocks for
common/rare/miss with visibly different `p95`s. `bench/baseline.json` exists
and is valid JSON. **Likeliest failure:** every request comes back as a
redirect/302 to `/login` — the minted JWT's payload or signature doesn't
match what `authMiddleWare` expects (check `k6/encoding` is using
`'rawurl'`, not `'url'`, since JWT segments are unpadded base64url). Second
likeliest: `ECONNREFUSED` — Terminal A's app isn't actually up yet when k6
starts (Terminal A must fully print `Server running on port 3000` first), or
`APP_PORT` doesn't match whatever port `app.js` actually bound (check
Terminal A's own startup log, not just the default).

## Decisions

- **Seed volume — 50 users / 20,000 posts by default, via `SEED_USERS` /
  `SEED_POSTS` env vars.** Small enough to seed in well under a minute against
  a local container; large enough that an unindexed `$or` regex scan shows
  real, non-noise latency instead of being dominated by connection overhead.
  Drop to ~1,000 posts for a fast smoke test of the scripts themselves, or
  raise toward 100,000+ for a stress pass — no code changes needed either way.
  
- **Keyword frequency bands, not one fixed keyword — `javascript` /
  `xenolith` / `gerrymandering`.** A regex `$or` query with no usable index
  can't stop early on a miss, so "no results" is close to the worst case,
  while a common word that matches within the first `.limit(20)` documents
  scanned is close to the best case. Measuring only one keyword would hide
  that spread. The three words are picked so none is a substring of another
  or of the filler vocabulary (avoids one band's count silently leaking into
  another) and so all three are plain alphanumeric — `searchOutput` passes
  `keyword` into `new RegExp()` with no escaping, so an unescaped bench
  keyword is also the only kind that's safe to send it.
- **`explain()` as the real proof, k6 latency as the headline number.** A
  slow k6 `p95` is consistent with a full collection scan but doesn't prove
  it — caching, connection setup, or JSON serialization could produce a
  similar number for the wrong reason. Phase 3 runs `.explain("executionStats")`
  on the miss keyword directly against the container and checks for
  `COLLSCAN` and `totalDocsExamined == SEED_POSTS` before trusting anything
  k6 reports, and the same call is the thing to re-run after the text index
  exists (out of scope here) to confirm the plan changes to `IXSCAN`.
- **One shared bcrypt hash across all seeded users**, computed once, instead
  of hashing each user's password individually. Since k6 authenticates by
  minting JWTs directly (bypassing `/login` and bcrypt entirely), per-user
  hash correctness isn't exercised by this benchmark — hashing 50 (or 20,000,
  if `SEED_USERS` is raised) passwords individually would just be minutes of
  deliberately-slow bcrypt work for no signal. If a login benchmark is ever
  wanted later, this would need to change.
- **10 VUs, 30s, constant load — not a ramp.** The goal is the per-request
  Mongo-side cost of one query, not finding the app's breaking point. Higher
  concurrency mostly adds Node's single-threaded event-loop queuing time on
  top of the Mongo signal you're trying to isolate, which would make the
  before/after text-index comparison (the actual point of this whole setup)
  noisier, not more informative.
- **App on host, not containerized.** Confirmed with you — sidesteps writing
  a Dockerfile and any bcrypt-native-addon-in-a-container base-image decision
  entirely, since `bcrypt` is already built against the host's Node v22.19.
  Mongo, the one variable that actually needs to be isolated and reproducible,
  is still fully containerized.
- **k6 native on Windows, not containerized.** Confirmed with you — one fewer
  moving part now that Docker is only running Mongo; k6 talks to `localhost`
  for both the app and (indirectly, through the app) Mongo.
- **`vercel.json`** targets a `@vercel/node` serverless build and is unrelated
  to this Compose-based setup — not stale exactly, just orthogonal (the live
  deploy is on Render per `CLAUDE.md` anyway). Not touched.

## Explicitly out of scope

Adding the text index, switching `searchOutput` back to `$text`, and the
after-index k6 comparison run are all deliberately not part of this plan. When
that work happens, the same `bench/k6-search.js` gets re-run unmodified — only
the app-launch command changes (drop `-r ./bench/no-autoindex.js`, or run a
one-off `syncIndexes()`), since the script itself has no knowledge of whether
an index exists.
