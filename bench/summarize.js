// Aggregates bench/results/<size>-<mode>-<kw>-<r>.json into one table:
// median across the 3 repeats per (size, mode, keyword).
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "results");
const SIZE = process.argv[2] || "20k";
const MODES = ["memory", "regex", "text", "atlas"];
const BANDS = [
  { kw: "javascript", trend: "search_common_javascript", label: "common" },
  { kw: "xenolith", trend: "search_rare_xenolith", label: "rare" },
  { kw: "gerrymandering", trend: "search_miss_gerrymandering", label: "miss" },
];

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function loadRun(size, mode, kw, r) {
  const p = path.join(DIR, `${size}-${mode}-${kw}-${r}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const rows = [];
for (const mode of MODES) {
  for (const band of BANDS) {
    const runs = [1, 2, 3].map((r) => loadRun(SIZE, mode, band.kw, r)).filter(Boolean);
    if (runs.length === 0) continue;
    const meds = runs.map((s) => s.metrics[band.trend]?.med).filter((v) => v != null);
    const p95s = runs.map((s) => s.metrics[band.trend]?.["p(95)"]).filter((v) => v != null);
    const rates = runs.map((s) => s.metrics.http_reqs?.rate).filter((v) => v != null);
    const failCounts = runs.map((s) => s.metrics.checks?.fails || 0);
    const passCounts = runs.map((s) => s.metrics.checks?.passes || 0);
    const totalFails = failCounts.reduce((a, b) => a + b, 0);
    const totalChecks = totalFails + passCounts.reduce((a, b) => a + b, 0);
    rows.push({
      mode,
      band: band.label,
      kw: band.kw,
      runs: runs.length,
      medianMed: median(meds),
      medianP95: median(p95s),
      medianRate: median(rates),
      errPct: totalChecks ? ((totalFails / totalChecks) * 100).toFixed(2) : "n/a",
    });
  }
}

const w = { mode: 8, band: 8, runs: 4, medianMed: 10, medianP95: 10, medianRate: 9, errPct: 7 };
function fmt(v, width) { return String(v).padStart(width); }
console.log(
  fmt("mode", w.mode), fmt("band", w.band), fmt("n", w.runs),
  fmt("med(ms)", w.medianMed), fmt("p95(ms)", w.medianP95),
  fmt("req/s", w.medianRate), fmt("err%", w.errPct)
);
for (const row of rows) {
  console.log(
    fmt(row.mode, w.mode), fmt(row.band, w.band), fmt(row.runs, w.runs),
    fmt(row.medianMed.toFixed(1), w.medianMed), fmt(row.medianP95.toFixed(1), w.medianP95),
    fmt(row.medianRate.toFixed(1), w.medianRate), fmt(row.errPct, w.errPct)
  );
}
