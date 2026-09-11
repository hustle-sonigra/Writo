import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import { hmac } from "k6/crypto";
import { b64encode } from "k6/encoding";
import { scenario } from "k6/execution";

const commonTrend = new Trend("search_common_javascript", true);
const rareTrend = new Trend("search_rare_xenolith", true);
const missTrend = new Trend("search_miss_gerrymandering", true);

const APP_PORT = __ENV.APP_PORT || "3000";
const BASE_URL = `http://localhost:${APP_PORT}`;

// VUS is overridable (-e VUS=n) because it doesn't mean the same thing across
// SEARCH_MODEs at high post counts: 10 concurrent full-collection-scan+populate
// requests against the memory mode don't measure 10x the per-query cost, they
// measure Node's single-threaded event loop and the Mongo connection pool
// falling over — queueing, not the number this harness exists to produce.
const VUS = parseInt(__ENV.VUS || "10", 10);
const WARMUP_DURATION = "10s";
const MEASURED_DURATION = "30s";

// Two back-to-back scenarios instead of one flat block: "warmup" runs first
// and gets the connection pool, OS page cache, and JIT to steady state;
// "measured" starts right after (startTime) and is the only one whose
// samples land in the Trends below. Without this split, the first several
// seconds of cold-start latency would sit inside the same p95 as the
// steady-state numbers we actually want to compare across SEARCH_MODEs.
export const options = {
  scenarios: {
    warmup: {
      executor: "constant-vus",
      vus: VUS,
      duration: WARMUP_DURATION,
      tags: { phase: "warmup" },
    },
    measured: {
      executor: "constant-vus",
      vus: VUS,
      duration: MEASURED_DURATION,
      startTime: WARMUP_DURATION,
      tags: { phase: "measured" },
    },
  },
};

function base64url(obj) {
  return b64encode(JSON.stringify(obj), "rawurl");
}

function mintToken(email, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { email };
  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const signature = hmac("sha256", secret, unsigned, "base64rawurl");
  return `${unsigned}.${signature}`;
}

export function setup() {
  const secret = __ENV.JWT_SECRET;
  const email = __ENV.BENCH_EMAIL;
  if (!secret || !email) {
    throw new Error("JWT_SECRET and BENCH_EMAIL must be set as k6 -e vars");
  }
  const token = mintToken(email, secret);
  return { token };
}

const KEYWORDS = [
  { keyword: "javascript", trend: commonTrend, label: "common" },
  { keyword: "xenolith", trend: rareTrend, label: "rare" },
  { keyword: "gerrymandering", trend: missTrend, label: "miss" },
];

// One keyword per run, from -e KW=..., not a random cycle — each results
// file (results\<size>-<mode>-<kw>-<run>.json) then holds one clean band
// instead of three interleaved ones. -e MODE=... is NOT what selects the
// server's search mode (that's the SEARCH_MODE env var on the app process,
// set before it's (re)started) - it's only used here to tag output and to
// assert the running server is actually in the mode this run thinks it's
// testing, via the X-Search-Mode response header.
const KW = __ENV.KW;
const MODE = __ENV.MODE || null;
const active = KEYWORDS.find((k) => k.keyword === KW);
if (!active) {
  throw new Error(`-e KW=... must be one of: ${KEYWORDS.map((k) => k.keyword).join(", ")}`);
}
const { keyword, trend, label } = active;

export default function (data) {
  const res = http.post(
    `${BASE_URL}/api/v1/post/filtered`,
    JSON.stringify({ keyword }),
    {
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${data.token}`,
      },
      tags: { band: label },
    }
  );

  check(res, {
    "status is 200": (r) => r.status === 200,
    "body has success:true": (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch (e) {
        return false;
      }
    },
    // catches mode drift mid-run (e.g. the wrong server left running from a
    // previous stage) instead of silently attributing another mode's cost
    // to this one
    "server is in the expected SEARCH_MODE": (r) =>
      !MODE || r.headers["X-Search-Mode"] === MODE,
  });

  // only the measured scenario's samples count toward the reported trends
  if (scenario.name === "measured") {
    trend.add(res.timings.duration);
  }

  sleep(0.1);
}
