#!/usr/bin/env bash
# mtools API(8080) + UI(5173) 실행 상태 확인
# 사용: ./status.sh

API_PORT=8080
UI_PORT=5173
API_URL="http://localhost:$API_PORT/swagger-ui/index.html"
UI_URL="http://localhost:$UI_PORT/"

check_port() {
  local port="$1"
  lsof -ti:"$port" 2>/dev/null || true
}

check_http() {
  local url="$1"
  curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 "$url" 2>/dev/null || echo "000"
}

print_service() {
  local name="$1"
  local port="$2"
  local url="$3"
  local pids http_code

  pids="$(check_port "$port")"
  http_code="$(check_http "$url")"

  echo "[$name] port $port"

  if [[ -n "$pids" ]]; then
    echo "  프로세스: 실행 중 (pid $(echo "$pids" | tr '\n' ' ' | sed 's/ $//'))"
  else
    echo "  프로세스: 없음"
  fi

  if [[ "$http_code" =~ ^[23] ]]; then
    echo "  HTTP:     응답 OK ($http_code) — $url"
  elif [[ "$http_code" == "000" ]]; then
    echo "  HTTP:     응답 없음"
  else
    echo "  HTTP:     $http_code — $url"
  fi

  if [[ -n "$pids" && "$http_code" =~ ^[23] ]]; then
    echo "  상태:     ● 살아 있음"
    return 0
  fi

  if [[ -n "$pids" ]]; then
    echo "  상태:     ◐ 포트만 점유 (기동 중이거나 응답 대기)"
    return 1
  fi

  echo "  상태:     ○ 꺼짐"
  return 1
}

echo "=== mtools 서비스 상태 ==="
echo ""

api_ok=0
ui_ok=0
print_service "API" "$API_PORT" "$API_URL" && api_ok=1 || true
echo ""
print_service "UI" "$UI_PORT" "$UI_URL" && ui_ok=1 || true
echo ""

if [[ "$api_ok" == 1 && "$ui_ok" == 1 ]]; then
  echo "전체: 둘 다 정상"
  exit 0
fi

if [[ "$api_ok" == 1 || "$ui_ok" == 1 ]]; then
  echo "전체: 일부만 실행 중"
  exit 1
fi

echo "전체: 모두 꺼짐"
echo "  ./restart.sh 로 기동"
exit 2
