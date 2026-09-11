#!/usr/bin/env bash
# Runs one SEARCH_MODE's full load matrix (3 keywords x 3 repeats) against
# the local bench Mongo, for one collection size label. Never touches the
# Atlas cloud cluster - MONGO_URI always points at localhost:27117.
#
# Usage: bench/run-mode.sh <mode> <size-label>
#   e.g. bench/run-mode.sh regex 20k
set -uo pipefail

MODE="$1"
SIZE="$2"
APP_PORT=3000
BASE="http://localhost:${APP_PORT}"
MONGO_URI_VAL="mongodb://localhost:27117/blogger_bench?directConnection=true"
RESULTS_DIR="bench/results"
LOG="${RESULTS_DIR}/app-${SIZE}-${MODE}.log"

mkdir -p "$RESULTS_DIR"

echo "== [$SIZE/$MODE] killing anything on port ${APP_PORT} =="
for pid in $(netstat -ano | grep ":${APP_PORT} " | awk '{print $5}' | sort -u); do
  taskkill //F //PID "$pid" >/dev/null 2>&1 || true
done
sleep 1

echo "== [$SIZE/$MODE] starting app with SEARCH_MODE=${MODE} =="
export SEARCH_MODE="$MODE"
export MONGO_URI="$MONGO_URI_VAL"
node app.js > "$LOG" 2>&1 &
APP_PID=$!
unset SEARCH_MODE MONGO_URI

for i in $(seq 1 30); do
  grep -q "Server running on port ${APP_PORT}" "$LOG" 2>/dev/null && break
  sleep 1
done
if ! grep -q "Server running on port ${APP_PORT}" "$LOG" 2>/dev/null; then
  echo "== [$SIZE/$MODE] APP FAILED TO START =="
  cat "$LOG"
  exit 1
fi

echo "== [$SIZE/$MODE] confirming X-Search-Mode header =="
TOKEN=$(node -e "console.log(require('./bench/tokens.json')[0])")
GOT_MODE=$(curl -s -D - -o /dev/null -X POST "$BASE/api/v1/post/filtered" \
  -H "Content-Type: application/json" -H "Cookie: token=${TOKEN}" \
  -d '{"keyword":"javascript"}' | grep -i '^x-search-mode:' | tr -d '\r' | cut -d' ' -f2)
echo "expected=${MODE} got=${GOT_MODE}"
if [ "$GOT_MODE" != "$MODE" ]; then
  echo "== [$SIZE/$MODE] MODE MISMATCH - aborting this mode, app left running for inspection =="
  exit 1
fi

JWT_SECRET=$(grep '^JWT_SECRET=' .env | head -1 | cut -d'=' -f2-)

for kw in javascript xenolith gerrymandering; do
  for r in 1 2 3; do
    OUT="${RESULTS_DIR}/${SIZE}-${MODE}-${kw}-${r}.json"
    KLOG="${RESULTS_DIR}/${SIZE}-${MODE}-${kw}-${r}.log"
    echo "== [$SIZE/$MODE] $kw run $r =="
    k6 run -e JWT_SECRET="$JWT_SECRET" -e BENCH_EMAIL="bench-user-1@example.com" \
      -e APP_PORT="$APP_PORT" -e MODE="$MODE" -e KW="$kw" \
      --summary-export "$OUT" bench/k6-search.js > "$KLOG" 2>&1

    FAILED=$(node -e "
      try { const s = require(process.argv[1]); console.log(!s.metrics.checks || s.metrics.checks.fails > 0); }
      catch (e) { console.log('true'); }
    " "./$OUT" 2>/dev/null)

    if [ "$FAILED" = "true" ]; then
      echo "== [$SIZE/$MODE] $kw run $r FAILED CHECKS - rerunning once =="
      RETRY_OUT="${RESULTS_DIR}/${SIZE}-${MODE}-${kw}-${r}-retry.json"
      RETRY_LOG="${RESULTS_DIR}/${SIZE}-${MODE}-${kw}-${r}-retry.log"
      k6 run -e JWT_SECRET="$JWT_SECRET" -e BENCH_EMAIL="bench-user-1@example.com" \
        -e APP_PORT="$APP_PORT" -e MODE="$MODE" -e KW="$kw" \
        --summary-export "$RETRY_OUT" bench/k6-search.js > "$RETRY_LOG" 2>&1
    fi
  done
done
unset JWT_SECRET

echo "== [$SIZE/$MODE] done, stopping app (pid $APP_PID) =="
taskkill //F //PID "$APP_PID" >/dev/null 2>&1 || kill "$APP_PID" 2>/dev/null || true
sleep 1
echo "== [$SIZE/$MODE] complete =="
