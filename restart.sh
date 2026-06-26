#!/usr/bin/env bash
# mtools API(8080) + UI(5173) 종료 후 재시작
# 사용: ./restart.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== mtools 서비스 재시작 ==="
"$ROOT/stop.sh"
echo ""
"$ROOT/start.sh"
