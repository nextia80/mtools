#!/usr/bin/env bash
# mtools API(8080) + UI(5173) 종료
# 사용: ./stop.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
API_PORT=8080
UI_PORT=5173
RUN_DIR="$ROOT/.run"

kill_port() {
  local port="$1"
  local pids

  pids="$(lsof -ti:"$port" 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    echo "[skip] port $port — 실행 중인 프로세스 없음"
    return
  fi

  echo "[stop] port $port (pid: $(echo "$pids" | tr '\n' ' '))"
  echo "$pids" | xargs kill -TERM 2>/dev/null || true
  sleep 2

  pids="$(lsof -ti:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill -KILL 2>/dev/null || true
  fi
}

echo "=== mtools 서비스 종료 ==="
kill_port "$API_PORT"
kill_port "$UI_PORT"

rm -f "$RUN_DIR/api.pid" "$RUN_DIR/ui.pid"
echo ""
echo "종료 완료. 상태 확인: ./status.sh"
