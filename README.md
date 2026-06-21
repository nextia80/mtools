# mtools

터미널 기반 개인 워크스페이스 — 게시판, Google Calendar, 일자별 MD 등을 한 화면에서 관리합니다.

## 주요 기능

- **터미널** — `bd`(게시판), `gc`(Google Calendar), `md`(일자별 로그) 명령
- **게시판** — 블로그형 무한 답글
- **일정관리** — Google Calendar OAuth 연동
- **일자별 LOG** — `MD/` 폴더 Markdown 조회·편집
- **API 테스트 / Swagger** — 백엔드 API 확인

## 빠른 시작

```bash
git clone https://github.com/nextia80/mtools.git
cd mtools
```

설치 및 실행 방법은 **[INSTALL.md](./INSTALL.md)** 를 참고하세요.

## 프로젝트 구조

```text
mtools/
├── mtools-api/    Spring Boot API (Java 21, PostgreSQL)
├── mtools-ui/     Vue 3 + Vite 프론트엔드
└── MD/            일자별 Markdown 파일
```

## 실행 (요약)

PostgreSQL과 Java, Node.js 설치 후:

```bash
# 터미널 1 — API
cd mtools-api && ./gradlew bootRun

# 터미널 2 — UI
cd mtools-ui && npm install && npm run dev
```

브라우저: http://localhost:5173

## 문서

| 문서 | 설명 |
|------|------|
| [INSTALL.md](./INSTALL.md) | 설치·실행 가이드 |
| [mtools-ui/UI.md](./mtools-ui/UI.md) | UI·터미널·화면 구조 |
| [mtools-api/API.md](./mtools-api/API.md) | API 엔드포인트 |
| `MD/` | 개발 일지 및 기능 정리 |

## 라이선스

개인 프로젝트
