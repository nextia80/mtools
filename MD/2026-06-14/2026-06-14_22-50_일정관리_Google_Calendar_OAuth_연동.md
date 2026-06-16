# 일정관리 메뉴와 Google Calendar OAuth 연동

회원관리 아래 **일정관리** 메뉴를 추가하고, Google Calendar API를 OAuth 2.0으로 연동해 primary 캘린더 일정을 불러오도록 구현했다.

---

## 1. 메뉴 구조

좌측 메뉴 순서:

```text
홈 → 게시판 → 회원관리 → 일정관리 → API 스웨거 → API 테스트 → 일자별LOG
```

### 프론트엔드 변경 파일

| 파일 | 내용 |
|------|------|
| `mtools-ui/src/components/SidebarMenu.vue` | 일정관리 메뉴 버튼 추가 (아이콘: S) |
| `mtools-ui/src/components/ScheduleView.vue` | 일정관리 화면 (연결/해제, 일정 목록) |
| `mtools-ui/src/types.ts` | `ActiveView`에 `schedule` 추가, `CalendarEvent`, `CalendarConnectionStatus` 타입 |
| `mtools-ui/src/App.vue` | 캘린더 API 호출, OAuth 콜백 URL 파라미터 처리 |
| `mtools-ui/src/assets/app.css` | `.schedule-view` 스타일 |

---

## 2. Google Calendar 연동 개요

### 방식

- **OAuth 2.0 (사용자 로그인)** 방식
- 사용자가 Google 계정으로 로그인 후 본인 primary 캘린더 일정 조회
- access token + refresh token을 DB에 저장해 재로그인 없이 갱신

### OAuth 흐름

```text
[일정관리] Google Calendar 연결 클릭
    ↓
GET /api/calendar/auth-url  →  Google 로그인 URL 반환
    ↓
브라우저가 Google 로그인/권한 승인
    ↓
GET /api/calendar/oauth/callback?code=...&state=...
    ↓
백엔드: code → token 교환 → DB 저장
    ↓
http://localhost:5173/?view=schedule&calendar=connected 로 리디렉트
    ↓
일정관리 화면에서 GET /api/calendar/events 호출 → 일정 표시
```

### 요청 OAuth Scope

- `https://www.googleapis.com/auth/calendar.readonly` (캘린더 읽기)
- `https://www.googleapis.com/auth/userinfo.email` (연결 계정 이메일 표시)

---

## 3. Google Cloud Console 설정 (처음 1회)

[Google Cloud Console](https://console.cloud.google.com/) 접속 후 진행.

### 3-1. Google Calendar API 활성화

1. **API 및 서비스 → 라이브러리**
2. `Google Calendar API` 검색
3. **사용** 클릭

### 3-2. OAuth 동의 화면

1. **API 및 서비스 → OAuth 동의 화면**
2. 앱 이름 등 기본 정보 입력
3. **테스트 사용자**에 **본인 Gmail** 추가 (앱 상태가 Testing일 때 필수)

### 3-3. OAuth 클라이언트 ID 생성

1. **API 및 서비스 → 사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `mtools` (예시)

**승인된 리디렉션 URI** (필수):

```text
http://localhost:8080/api/calendar/oauth/callback
```

> **승인된 JavaScript 원본**은 비워 두어도 된다. (백엔드 OAuth 방식)

5. 생성 후 **클라이언트 ID**와 **클라이언트 보안 비밀번호** 확인
6. JSON 다운로드 또는 보안 비밀번호 옆 **복사** 아이콘으로 Secret 복사

### 현재 발급된 클라이언트 ID (mtools)

```text
178574281573-30eq5ko9dpe360j52nvbre4900ic5seo.apps.googleusercontent.com
```

> 클라이언트 Secret은 `application-local.properties`에만 보관한다. MD/ Git에 올리지 않는다.

---

## 4. 로컬 설정

### 4-1. application.properties

`mtools-api/src/main/resources/application.properties`

```properties
spring.config.import=optional:classpath:application-local.properties

# Google Calendar OAuth
app.google.client-id=${GOOGLE_CLIENT_ID:}
app.google.client-secret=${GOOGLE_CLIENT_SECRET:}
app.google.redirect-uri=http://localhost:8080/api/calendar/oauth/callback
app.google.frontend-redirect-url=http://localhost:5173
```

### 4-2. application-local.properties (로컬 전용, Git 제외)

`mtools-api/src/main/resources/application-local.properties`

```properties
# 로컬 전용 Google OAuth 설정 (Git에 커밋하지 마세요)
app.google.client-id=178574281573-30eq5ko9dpe360j52nvbre4900ic5seo.apps.googleusercontent.com
app.google.client-secret=GOCSPX-여기에-클라이언트-Secret
```

- `.gitignore`에 `application-local.properties` 추가됨
- Secret은 Google Cloud Console → OAuth 클라이언트 → **클라이언트 보안 비밀번호** 복사

### 4-3. 환경 변수로도 설정 가능

```bash
export GOOGLE_CLIENT_ID="178574281573-30eq5ko9dpe360j52nvbre4900ic5seo.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"
```

---

## 5. 서버 실행 및 사용

### 백엔드 (8080)

```bash
cd /Users/yujinseok/project/mtools/mtools-api
./gradlew bootRun
```

`Started MtoolsApiApplication` 메시지 확인.

### 프론트 (5173)

```bash
cd /Users/yujinseok/project/mtools/mtools-ui
npm run dev
```

브라우저: `http://localhost:5173`

### 사용 순서

1. 좌측 **일정관리** 클릭
2. **Google Calendar 연결** 클릭
3. Google 로그인 → 권한 **허용**
4. 일정관리 화면으로 돌아오면 **오늘 ~ 30일** primary 캘린더 일정 표시
5. **새로고침** / **연결 해제** 가능

> OAuth 설정(Secret 등)을 변경한 뒤에는 **백엔드를 재시작**해야 반영된다.

---

## 6. API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/calendar/auth-url` | Google OAuth 로그인 URL 생성 |
| GET | `/api/calendar/oauth/callback` | OAuth 콜백 (Google → 백엔드, 브라우저 리디렉트) |
| GET | `/api/calendar/status` | 연결 상태 조회 |
| GET | `/api/calendar/events` | 일정 목록 조회 (기본: 오늘 ~ 30일) |
| DELETE | `/api/calendar/disconnect` | 연결 해제 (토큰 삭제) |

### GET /api/calendar/auth-url

**Response**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET /api/calendar/status

**Response**

```json
{
  "connected": true,
  "email": "user@gmail.com"
}
```

### GET /api/calendar/events

**Query Parameters (선택)**

| 이름 | 타입 | 설명 |
|------|------|------|
| timeMin | string (ISO-8601) | 조회 시작 (미입력 시 오늘 0시) |
| timeMax | string (ISO-8601) | 조회 종료 (미입력 시 30일 후) |

**Response**

```json
[
  {
    "id": "event-id",
    "summary": "회의",
    "description": "설명",
    "start": "2026-06-14T10:00:00+09:00",
    "end": "2026-06-14T11:00:00+09:00",
    "allDay": false,
    "htmlLink": "https://www.google.com/calendar/event?...",
    "location": "회의실 A"
  }
]
```

### DELETE /api/calendar/disconnect

**Response**

```json
{
  "status": "ok"
}
```

---

## 7. 백엔드 구조

```text
com.mtools.api.calendar
├── config/
│   ├── GoogleOAuthProperties.java   # app.google.* 설정
│   └── GoogleOAuthConfig.java
├── controller/
│   └── CalendarController.java
├── service/
│   ├── GoogleCalendarService.java   # OAuth + Calendar API
│   ├── GoogleOAuthToken.java
│   ├── CalendarEvent.java
│   └── CalendarConnectionStatus.java
└── dao/
    └── GoogleOAuthDao.java

resources/mapper/calendar/
└── GoogleOAuthMapper.xml
```

### Gradle 의존성 (build.gradle)

```gradle
implementation 'com.google.api-client:google-api-client:2.7.2'
implementation 'com.google.oauth-client:google-oauth-client:1.36.0'
implementation 'com.google.http-client:google-http-client-gson:1.45.2'
implementation 'com.google.apis:google-api-services-calendar:v3-rev20260517-2.0.0'
implementation 'com.google.apis:google-api-services-oauth2:v2-rev20200213-2.0.0'
```

---

## 8. DB 테이블

### t_google_oauth

OAuth 토큰 저장 (단일 사용자, `id_oauth = 1` 고정)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id_oauth | NUMERIC(10) PK | 기본값 1 |
| st_access_token | TEXT | access token |
| st_refresh_token | TEXT | refresh token |
| dt_expires_at | TIMESTAMP | access token 만료 시각 |
| st_email | VARCHAR(1000) | 연결 Google 계정 이메일 |
| dt_updated | TIMESTAMP | 갱신 시각 |

`schema.sql`에 정의되어 있으며, API 서버 기동 시 `spring.sql.init`으로 생성된다.

---

## 9. 프론트엔드 동작

### ScheduleView.vue

- 미연결: Google Calendar 연동 안내 + **Google Calendar 연결** 버튼
- 연결됨: 연결 계정 이메일, 일정 목록, **새로고침** / **연결 해제**
- 각 일정에 **Google에서 보기** 링크 (`htmlLink`)

### App.vue 캘린더 관련 함수

| 함수 | 역할 |
|------|------|
| `loadCalendarStatus` | `/api/calendar/status` |
| `loadCalendarEvents` | `/api/calendar/events` |
| `loadCalendarData` | status + events 일괄 로드 |
| `connectGoogleCalendar` | auth-url 받아 Google로 이동 |
| `disconnectGoogleCalendar` | DELETE disconnect |
| `handleCalendarCallbackParams` | OAuth 후 `?view=schedule&calendar=connected` 처리 |

일정관리 메뉴 진입 시 `loadCalendarData()` 자동 호출.

---

## 10. 자주 발생하는 오류

| 증상 | 원인 | 해결 |
|------|------|------|
| `Google OAuth 설정이 필요합니다` | client-id/secret 미설정 | `application-local.properties` 또는 환경 변수 설정 |
| `redirect_uri_mismatch` | 리디렉션 URI 불일치 | Google Console에 `http://localhost:8080/api/calendar/oauth/callback` 등록 |
| `access_denied` | 테스트 사용자 미등록 | OAuth 동의 화면 → 테스트 사용자에 본인 Gmail 추가 |
| `OAuth state가 유효하지 않습니다` | 콜백 지연/중복 | 연결 버튼 다시 클릭 |
| 토큰 만료 후 조회 실패 | refresh token 없음 | **연결 해제** 후 다시 **Google Calendar 연결** |
| 변경 후 반영 안 됨 | 서버 미재시작 | `./gradlew bootRun` 재실행 |

---

## 11. 보안 참고

- **client secret**은 프론트엔드에 두지 않는다. 백엔드에서만 사용.
- `application-local.properties`는 `.gitignore` 처리.
- OAuth scope는 **읽기 전용** (`calendar.readonly`).
- Google Cloud 앱이 **Testing** 상태면 테스트 사용자만 로그인 가능.

---

## 12. 체크리스트 (설정 완료 확인)

- [ ] Google Calendar API **사용** 설정
- [ ] OAuth 클라이언트 ID 생성 (웹 애플리케이션)
- [ ] 리디렉션 URI `http://localhost:8080/api/calendar/oauth/callback` 등록
- [ ] OAuth 동의 화면 **테스트 사용자**에 본인 Gmail 추가
- [ ] `application-local.properties`에 client-id, client-secret 입력
- [ ] 백엔드 `./gradlew bootRun` 실행
- [ ] 프론트 `npm run dev` 실행
- [ ] `http://localhost:5173` → 일정관리 → **Google Calendar 연결**

---

## 13. 관련 파일 목록

### 백엔드

- `mtools-api/build.gradle`
- `mtools-api/src/main/resources/application.properties`
- `mtools-api/src/main/resources/application-local.properties` (Git 제외)
- `mtools-api/src/main/resources/sql/schema.sql`
- `mtools-api/src/main/resources/mapper/calendar/GoogleOAuthMapper.xml`
- `mtools-api/src/main/java/com/mtools/api/calendar/**`

### 프론트

- `mtools-ui/src/components/SidebarMenu.vue`
- `mtools-ui/src/components/ScheduleView.vue`
- `mtools-ui/src/App.vue`
- `mtools-ui/src/types.ts`
- `mtools-ui/src/assets/app.css`
