# mtools 설치 가이드

GitHub에서 clone한 뒤 로컬 PC(Mac / Windows)에서 mtools를 실행하는 방법입니다.

---

## 1. 필요한 프로그램

| 프로그램 | 버전 | 용도 |
|----------|------|------|
| **Java JDK** | 21 | Spring Boot API |
| **Node.js** | 20.19+ 또는 22.12+ | Vue 프론트엔드 |
| **PostgreSQL** | 14+ (16 권장) | 데이터베이스 |
| **Git** | 최신 | 소스 clone |

### 설치 확인

```bash
java -version      # openjdk 21.x
node -version      # v20.19+ 또는 v22.12+
npm -version
psql --version     # PostgreSQL
```

### Windows 참고

- Java: [Adoptium](https://adoptium.net/) 또는 Oracle JDK 21
- Node: [nodejs.org](https://nodejs.org/)
- PostgreSQL: [postgresql.org](https://www.postgresql.org/download/windows/)
- API 실행: `./gradlew bootRun` 대신 `gradlew.bat bootRun`

---

## 2. 소스 받기

```bash
git clone https://github.com/nextia80/mtools.git
cd mtools
```

---

## 3. PostgreSQL 설정

API는 아래 설정을 기본으로 사용합니다 (`application.properties`).

| 항목 | 값 |
|------|-----|
| 데이터베이스 | `mtools` |
| 스키마 | `mtools` |
| 사용자 | `mtools` |
| 비밀번호 | `123456` |
| 포트 | `5432` |

### 3-1. 데이터베이스·사용자 생성

PostgreSQL에 **superuser**(`postgres` 등)로 접속한 뒤 실행합니다.

```sql
CREATE DATABASE mtools;

\c mtools

CREATE SCHEMA IF NOT EXISTS mtools;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mtools') THEN
    CREATE ROLE mtools LOGIN PASSWORD '123456';
  ELSE
    ALTER ROLE mtools WITH LOGIN PASSWORD '123456';
  END IF;
END
$$;

ALTER DATABASE mtools OWNER TO mtools;
ALTER SCHEMA mtools OWNER TO mtools;
GRANT ALL PRIVILEGES ON DATABASE mtools TO mtools;
GRANT ALL PRIVILEGES ON SCHEMA mtools TO mtools;
```

### 3-2. 접속 확인

```bash
PGPASSWORD=123456 psql -h localhost -p 5432 -U mtools -d mtools -c "SELECT current_user, current_database(), current_schema();"
```

비밀번호를 바꾸려면 `mtools-api/src/main/resources/application.properties`의  
`spring.datasource.username`, `spring.datasource.password`도 함께 수정하세요.

---

## 4. 백엔드 (mtools-api) 설정

### 4-1. Google Calendar OAuth (선택)

`gc` 터미널 명령·일정관리 메뉴를 쓰려면 Google Cloud Console에서 OAuth 클라이언트를 만듭니다.

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 생성
2. **Google Calendar API** 활성화
3. **OAuth 2.0 클라이언트 ID** (웹 애플리케이션) 생성
4. **승인된 리디렉션 URI** 등록:

   ```text
   http://localhost:8080/api/calendar/oauth/callback
   ```

5. 아래 파일을 생성합니다 (Git에 올라가지 않음).

   `mtools-api/src/main/resources/application-local.properties`

   ```properties
   app.google.client-id=YOUR_CLIENT_ID
   app.google.client-secret=YOUR_CLIENT_SECRET
   ```

   또는 환경 변수:

   ```bash
   export GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
   export GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
   ```

> OAuth 없이도 게시판·MD·API 테스트는 사용할 수 있습니다. Calendar만 연동 불가입니다.

### 4-2. API 실행

```bash
cd mtools-api
./gradlew bootRun
```

Windows:

```cmd
cd mtools-api
gradlew.bat bootRun
```

정상 기동 시:

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html

앱 기동 시 `schema.sql`, `data.sql`이 자동 실행되어 테이블이 생성됩니다.

---

## 5. 프론트엔드 (mtools-ui) 설정

```bash
cd mtools-ui
npm install
npm run dev
```

정상 기동 시:

- UI: http://localhost:5173

브라우저에서 **http://localhost:5173** 을 열면 mtools 화면이 표시됩니다.

---

## 6. 한 번에 실행하기

**터미널 2개**가 필요합니다.

| 터미널 | 명령 | 포트 |
|--------|------|------|
| 1 | `cd mtools-api && ./gradlew bootRun` | 8080 |
| 2 | `cd mtools-ui && npm run dev` | 5173 |

PostgreSQL은 API 실행 전에 **미리 켜져 있어야** 합니다.

---

## 7. MD 파일 (일자별 LOG)

Markdown 파일은 프로젝트 루트의 `MD/` 폴더에 둡니다.

```text
MD/
├── 2026-06-19/
│   └── 2026-06-19_09-00_좌측메뉴_접기_및_단축키_정리.md
└── ...
```

API는 `mtools-api` 폴더 기준 `../MD` 경로를 읽습니다.  
`mtools-api`에서 `bootRun`으로 실행하면 자동으로 프로젝트 루트 `MD/`를 사용합니다.

---

## 8. 터미널 명령 요약

홈 화면 터미널에서 사용합니다. `/?` 로 전체 도움말을 볼 수 있습니다.

| 명령 | 설명 |
|------|------|
| `/?` | 도움말 |
| `cls` | 화면 지우기 |
| `<` / `>` | 좌측 메뉴 접기 / 펼치기 |
| `bd l` | 게시판 목록 |
| `gc` | 오늘 Google Calendar 일정 |
| `gc l` | 1주일 일정 |
| `gc a "제목"` | 일정 추가 |
| `md l` | MD 파일 검색 |

자세한 `gc` 스펙은 `MD/2026-06-18/` 문서를 참고하세요.

---

## 9. 키보드 단축키 (Mac)

| 단축키 | 동작 |
|--------|------|
| `⌘1` | 터미널 |
| `⌘2` | 일자별 LOG |
| `⌘3` | 일정관리 |
| `⌘4` | 게시판 |
| `⌘5` | 회원관리 |
| `⌘6` | API 스웨거 |
| `⌘7` | API 테스트 |
| `⌘←` | 좌측 메뉴 접기 |
| `⌘→` | 좌측 메뉴 펼치기 |

Windows에서는 `Ctrl`을 사용하면 됩니다 (추후 앱화 시 정식 지원 예정).

---

## 10. 자주 발생하는 문제

### API가 안 뜸 / DB 연결 오류

```text
Connection refused / FATAL: password authentication failed
```

- PostgreSQL 서비스가 실행 중인지 확인
- DB 이름·사용자·비밀번호가 `application.properties`와 일치하는지 확인
- 3번 PostgreSQL 설정 SQL을 다시 실행

### 포트 8080 이미 사용 중

```text
Web server failed to start. Port 8080 was already in use.
```

8080을 쓰는 프로세스를 종료한 뒤 API를 다시 실행합니다.

Mac / Linux:

```bash
lsof -ti:8080 | xargs kill -TERM
```

### `gc` / Calendar 연동 실패

- `application-local.properties`에 Google client-id, secret 설정
- Google Cloud Console 리디렉션 URI가 `http://localhost:8080/api/calendar/oauth/callback` 인지 확인
- API 재시작 후 일정관리 메뉴에서 **Google 연결** 클릭

### MD 목록이 비어 있음

- 프로젝트 루트에 `MD/` 폴더와 `.md` 파일이 있는지 확인
- API를 `mtools-api` 폴더에서 실행했는지 확인

### 프론트에서 API 호출 실패 (CORS)

- UI는 `http://localhost:5173`, API는 `http://localhost:8080` 으로 접속
- `application.properties`의 `app.cors.allowed-origins`에 UI 주소가 포함되어 있는지 확인

---

## 11. 프로덕션 빌드 (선택)

```bash
# UI 빌드
cd mtools-ui
npm run build
# 결과: mtools-ui/dist/

# API jar 빌드
cd mtools-api
./gradlew bootJar
# 결과: mtools-api/build/libs/*.jar
```

현재는 **개발 모드**(API + Vite dev server) 기준으로 사용하는 것을 권장합니다.

---

## 12. 관련 문서

- UI·터미널·화면: [mtools-ui/UI.md](./mtools-ui/UI.md)
- API 명세: [mtools-api/API.md](./mtools-api/API.md)
- GitHub push: [MD/2026-06-19/2026-06-19_10-00_GitHub_push_명령어_정리.md](./MD/2026-06-19/2026-06-19_10-00_GitHub_push_명령어_정리.md)
- PAT·최초 업로드: [MD/2026-06-17/2026-06-17_08-30_GitHub_업로드_및_토큰_가이드.md](./MD/2026-06-17/2026-06-17_08-30_GitHub_업로드_및_토큰_가이드.md)
- 기능 상세: `MD/` 폴더의 개발 일지

문제가 있으면 GitHub Issues에 남겨 주세요.
