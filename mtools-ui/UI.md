# mtools UI 문서

## 기본 정보

| 항목 | 값 |
|------|-----|
| 프레임워크 | Vue 3 + TypeScript + Vite |
| 개발 서버 | http://localhost:5173 |
| API Base URL | http://localhost:8080 (`App.vue`에서 설정) |
| Node.js | 20.19+ 또는 22.12+ |

백엔드 API는 **별도 실행**이 필요합니다. 전체 설치는 [../INSTALL.md](../INSTALL.md)를 참고하세요.

---

## 설치 및 실행

```bash
cd mtools-ui
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속.

### 프로덕션 빌드

```bash
npm run build      # dist/ 생성
npm run preview    # 빌드 결과 미리보기
```

---

## 화면 구성 (좌측 메뉴)

| 번호 | 메뉴 | 컴포넌트 | 설명 |
|------|------|----------|------|
| 1 | 터미널 | `TerminalView.vue` | `bd` / `gc` / `md` 명령 실행 |
| 2 | 게시판 | `BoardView.vue` | 게시글 CRUD, 답글 |
| 3 | 회원관리 | `MemberView.vue` | 회원 화면 (준비) |
| 4 | 일정관리 | `ScheduleView.vue` | Google Calendar OAuth 연동 |
| 5 | API 스웨거 | `SwaggerView.vue` | Swagger UI iframe |
| 6 | API 테스트 | `ApiTestView.vue` | Echo 등 API 호출 테스트 |
| 7 | 일자별 LOG | `DocsView.vue` | `MD/` Markdown 조회·편집 |

레이아웃·메뉴 상태는 `App.vue`, 좌측 사이드바는 `SidebarMenu.vue`에서 관리합니다.

---

## 키보드 단축키 (Mac)

| 단축키 | 동작 |
|--------|------|
| `⌘1` | 터미널 |
| `⌘2` | 게시판 |
| `⌘3` | 회원관리 |
| `⌘4` | 일정관리 |
| `⌘5` | API 스웨거 |
| `⌘6` | API 테스트 |
| `⌘7` | 일자별 LOG |
| `⌘←` | 좌측 메뉴 접기 |
| `⌘→` | 좌측 메뉴 펼치기 |

MD 편집 중 (파일 선택된 상태):

| 단축키 | 동작 |
|--------|------|
| `⌘E` | 편집 모드 |
| `⌘V` | 리뷰 모드 |
| `⌘S` | 저장 |

---

## 터미널 명령

터미널 로직은 `src/terminal/` 에 있습니다.  
도움말 데이터는 `src/terminal/help.ts` — 새 명령 추가 시 `TERMINAL_HELP` Map에 항목을 넣으면 `/?`에 자동 반영됩니다.

### 공통

| 명령 | 설명 |
|------|------|
| `/?` | 명령어 목록 |
| `/? bd` | 게시판 명령 상세 |
| `cls` | 화면 지우기 |
| `<` | 좌측 메뉴 접기 |
| `>` | 좌측 메뉴 펼치기 |

### bd — 게시판

| 명령 | 설명 |
|------|------|
| `bd l` | 상위 20개 제목 |
| `bd l <n>` | 상위 n개 |
| `bd lb <n>~<m>` | n~m번째 제목 |
| `bd g <id>` | 게시물 상세 |
| `bd a` | 등록 화면 열기 |
| `bd m <id>` | 수정 화면 열기 |
| `bd d <id>` | 삭제 |

### gc — Google Calendar

| 명령 | 설명 |
|------|------|
| `gc` | 오늘 일정 |
| `gc l` | 1주일 일정 |
| `gc l <YYYYMMDD>` | 특정일 |
| `gc l <시작>~<끝>` | 기간 |
| `gc l -c <n>[,<n>]` | 캘린더 필터 |
| `gc c` | 캘린더 목록 |
| `gc a "<제목>" [날짜] [시간] [-c n]` | 일정 추가 |
| `gc m <키> -t/-d/-c` | 수정 |
| `gc r <키>` | 삭제 |

일정 키 형식: `캘린더-MMDD-순번` (예: `1-0619-2`). 목록에서 클릭하면 `gc m` / `gc r` 입력란에 자동 채움.

### md — 일자별 LOG

| 명령 | 설명 |
|------|------|
| `md ld [*키워드*]` | 날짜 폴더 목록 |
| `md l [*키워드*]` | MD 파일 검색 |
| `md g <키워드>` | 파일 열기 (Docs 화면) |

---

## 소스 구조

```text
mtools-ui/src/
├── App.vue                 앱 루트, 라우팅(뷰 전환), API 호출, 단축키
├── main.ts
├── types.ts                공통 TypeScript 타입
├── boardUtils.ts           게시판 유틸
├── assets/
│   ├── app.css             레이아웃·사이드바·뷰 스타일
│   ├── base.css
│   └── main.css
├── components/
│   ├── SidebarMenu.vue     좌측 메뉴 (접기/펼치기)
│   ├── TerminalView.vue    터미널 UI
│   ├── BoardView.vue
│   ├── DocsView.vue
│   ├── ScheduleView.vue
│   ├── SwaggerView.vue
│   ├── ApiTestView.vue
│   └── MemberView.vue
└── terminal/
    ├── index.ts            명령 디스패처
    ├── help.ts             /? 도움말
    ├── apiClient.ts        fetch 래퍼
    ├── dateUtils.ts        날짜 유틸
    ├── types.ts            터미널 결과·액션 타입
    └── commands/
        ├── boardCommand.ts
        ├── calendarCommand.ts
        └── mdCommand.ts
```

---

## API 연동

UI는 `App.vue` 상단의 `API_BASE_URL`로 백엔드에 연결합니다.

```typescript
const API_BASE_URL = 'http://localhost:8080'
```

터미널 명령은 `terminal/commands/*.ts`에서 동일 Base URL로 API를 호출합니다.

| UI 기능 | API |
|---------|-----|
| 게시판 | `/api/boards` |
| Google Calendar | `/api/calendar/*` |
| MD 파일 | `/api/md-files`, `/api/md-files/content` |
| API 테스트 | `/api/echo` 등 |

API 상세: [../mtools-api/API.md](../mtools-api/API.md)

---

## 터미널 액션 (화면 전환)

명령 실행 결과로 UI 화면을 바꿀 수 있습니다 (`terminal/types.ts` → `TerminalAction`).

| 액션 | 동작 |
|------|------|
| `open-md` | 일자별 LOG에서 MD 파일 열기 |
| `board-add` | 게시판 등록 화면 |
| `board-edit` | 게시판 수정 화면 |
| `sidebar-set-collapsed` | `<` / `>` 메뉴 접기·펼치기 |

`TerminalView.vue`가 `action` 이벤트를 emit하고, `App.vue`의 `handleTerminalAction`에서 처리합니다.

---

## 새 터미널 명령 추가 방법

1. `src/terminal/commands/` 에 `xxxCommand.ts` 생성
2. `src/terminal/index.ts` 에 디스패치 분기 추가
3. `src/terminal/help.ts` 의 `TERMINAL_HELP`에 도움말 등록
4. (선택) `TerminalAction` 타입·`handleTerminalAction`에 화면 연동 추가

---

## 스타일

- 전역 레이아웃: `src/assets/app.css`
- 터미널: `.terminal-view`, `.terminal-line-*` 클래스
- 사이드바 접힘: `.sidebar.collapsed`, `.app-shell.sidebar-collapsed`

---

## 개발 시 참고

| 항목 | 설명 |
|------|------|
| MD 파일 위치 | 프로젝트 루트 `MD/` (API가 읽음) |
| CORS | API `application.properties`의 `app.cors.allowed-origins`에 `5173` 포함 필요 |
| Google OAuth | API `application-local.properties` 설정 후 일정관리에서 연결 |
| IDE | VS Code + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [../INSTALL.md](../INSTALL.md) | 전체 설치 가이드 |
| [../mtools-api/API.md](../mtools-api/API.md) | REST API 명세 |
| [../MD/](../MD/) | 기능별 개발 일지 |
