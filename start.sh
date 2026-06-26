#!/usr/bin/env bash
# mtools API(8080) + UI(5173) 시작
# 사용: ./start.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
API_PORT=8080
UI_PORT=5173
RUN_DIR="$ROOT/.run"
API_LOG="$RUN_DIR/api.log"
UI_LOG="$RUN_DIR/ui.log"

mkdir -p "$RUN_DIR"

port_in_use() {
  lsof -ti:"$1" >/dev/null 2>&1
}

start_api() {
  if port_in_use "$API_PORT"; then
    echo "[skip] API  — port $API_PORT 이미 사용 중"
    return
  fi

  echo "[start] API  → http://localhost:$API_PORT"
  cd "$ROOT/mtools-api"
  nohup ./gradlew bootRun >"$API_LOG" 2>&1 &
  echo $! >"$RUN_DIR/api.pid"
}

start_ui() {
  if port_in_use "$UI_PORT"; then
    echo "[skip] UI   — port $UI_PORT 이미 사용 중"
    return
  fi

  echo "[start] UI   → http://localhost:$UI_PORT"
  cd "$ROOT/mtools-ui"
  nohup npm run dev >"$UI_LOG" 2>&1 &
  echo $! >"$RUN_DIR/ui.pid"
}

echo "=== mtools 서비스 시작 ==="
start_api
start_ui

echo ""
echo "백그라운드로 기동했습니다."
echo "  API 로그: $API_LOG"
echo "  UI  로그: $UI_LOG"
echo ""
echo "API 기동까지 20~40초 정도 걸릴 수 있습니다."
echo "  ./status.sh"
echo "  tail -f $API_LOG"
echo "  tail -f $UI_LOG"
