# study 시리즈

mtools를 만들며 배운 **Vue · Spring Boot · PostgreSQL** 내용을 학습 순서대로 정리한 글 모음입니다.

> clone 후 실행 방법은 [INSTALL.md](../../INSTALL.md) · 공식 설치 가이드  
> 날짜별 상세 작업 일지는 `MD/2026-06-13/` 이후 폴더

---

## 목차

### 기초 (000~008)

| 번호 | 제목 | 한 줄 요약 |
|------|------|------------|
| [000](./000.설치.md) | 설치 — PostgreSQL · API · UI | JDK, Node, DB, Spring Boot, Vue 각각 세팅 |
| [001](./001.Echo_API로_UI와_API_연결.md) | Echo API로 UI ↔ API 연결 | `@GetMapping`, `fetch()`, 첫 JSON 통신 |
| [002](./002.CORS와_application_properties.md) | CORS와 application.properties | 포트가 다를 때 브라우저 차단 해결 |
| [003](./003.Swagger_UI로_API_확인.md) | Swagger UI로 API 확인 | springdoc, API 문서·테스트 |
| [004](./004.schema_sql과_DB_첫_조회.md) | schema.sql과 DB 첫 조회 | 앱 기동 시 테이블·데이터, SELECT API |
| [005](./005.MD_목록과_뷰어.md) | MD 목록과 뷰어 | API로 MD 폴더 읽기, Markdown 렌더링 |
| [006](./006.Markdown_편집과_저장.md) | Markdown 편집·저장 | 리뷰/편집 모드, PUT으로 파일 저장 |
| [007](./007.Vue_컴포넌트와_메뉴_구조.md) | Vue 컴포넌트와 메뉴 구조 | App.vue, View 분리, 좌측 사이드바 |
| [008](./008.게시판_CRUD와_MyBatis.md) | 게시판 CRUD와 MyBatis | t_board, Controller → Service → Dao |

### 심화 (009~014)

| 번호 | 제목 | 한 줄 요약 |
|------|------|------------|
| [009](./009.홈_터미널_UI와_첫_명령어.md) | 홈 터미널 UI와 첫 명령어 | TerminalView, 명령 파싱, REST 호출 |
| [010](./010.터미널_모듈_구조.md) | 터미널 모듈 구조 | terminal/ 폴더, commands 분리 |
| [011](./011.블로그형_무한답글_게시판.md) | 블로그형 무한답글 게시판 | st_pid, st_order 트리 |
| [012](./012.Google_Calendar_OAuth와_gc.md) | Google Calendar OAuth와 gc | OAuth, gc 일정 조회·추가 |
| [013](./013.로그인과_회원관리.md) | 로그인과 회원관리 | @@login, t_member, 메뉴 제한 |
| [014](./014.Gmail_연동과_gm.md) | Gmail 연동과 gm | Gmail OAuth, gm 명령 |

---

## 읽는 순서

```text
000 설치
  ↓
001 Echo API        ← UI와 API 통신
  ↓
002 CORS
  ↓
003 Swagger
  ↓
004 DB 조회
  ↓
005~006 MD          ← 문서 보기·쓰기
  ↓
007 Vue 구조
  ↓
008 게시판 CRUD
  ↓
009~010 터미널      ← 명령 UI · 모듈 구조
  ↓
011 답글 게시판
  ↓
012 Calendar · gc   ← OAuth (선택)
  ↓
013 로그인 · 회원
  ↓
014 Gmail · gm      ← OAuth (선택)
```

012·014(Google OAuth)는 Cloud Console 설정이 필요합니다. OAuth 없이 000~011·013까지 학습 가능합니다.

---

## 더 보려면

| 주제 | 일지 예시 |
|------|-----------|
| GitHub push | `MD/2026-06-17/`, `2026-06-19/` |
| 사이드바 접기·단축키 | `MD/2026-06-19/2026-06-19_09-00_...` |
| Java @어노테이션 | `MD/2026-06-16/2026-06-16_09-00_...` |
| 블로그용 요약 | `MD/2026-06-14/2026-06-14_15-09_mtools_개발여정_블로그용_요약본.md` |
