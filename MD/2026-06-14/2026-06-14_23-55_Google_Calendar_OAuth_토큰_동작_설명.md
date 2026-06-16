# Google Calendar OAuth · 토큰 동작 설명

일정관리 Google Calendar 연동에서 **OAuth가 무엇인지**, **`oauthCallback()`이 하는 일**, **토큰이 DB에 어떻게 저장·사용·갱신되는지** Q&A 형식으로 정리한 문서.

구현·설정 전체는 `2026-06-14_23-45_일정관리_UI_및_캘린더_연동_정리.md` 참고.

---

## 1. OAuth가 뭐고 어디에 쓰이나?

Google Calendar는 **비밀번호 대신 OAuth 2.0**으로 접근한다.

- 사용자가 Google 로그인 후 **캘린더 읽기 허용**
- mtools 백엔드가 **access token + refresh token** 수령
- 이후 Calendar API 호출 시 token 사용

### mtools에서 OAuth가 쓰이는 API

| API | 역할 |
|-----|------|
| `GET /api/calendar/auth-url` | Google 로그인 URL 생성 (연결 시작) |
| `GET /api/calendar/oauth/callback` | Google redirect 수신, code → token, DB 저장 |
| `GET /api/calendar/events` | DB token으로 일정 조회 (OAuth 재실행 아님) |
| `DELETE /api/calendar/disconnect` | DB token 삭제 |

### 설정 파일

```properties
# application.properties
app.google.client-id=${GOOGLE_CLIENT_ID:}
app.google.client-secret=${GOOGLE_CLIENT_SECRET:}
app.google.redirect-uri=http://localhost:8080/api/calendar/oauth/callback
app.google.frontend-redirect-url=http://localhost:5173
```

- **Client ID / Secret**: Google Cloud Console OAuth 클라이언트
- **redirect-uri**: Google이 `code`를 돌려보내는 주소 (**8080 백엔드**)
- Secret은 **백엔드만** (`application-local.properties`, Git 제외)

---

## 2. 전체 OAuth 흐름

```text
[1] 사용자] 일정관리 → "Google Calendar 연결" 클릭
[2] mtools-ui]  GET /api/calendar/auth-url
[3] mtools-api] Google OAuth URL 생성 (state 랜덤값 서버에 잠깐 저장)
[4] 브라우저]  Google 로그인 + "캘린더 읽기" 허용
[5] Google]     브라우저를 8080 callback으로 redirect
                 ?code=일회용교환권&state=아까값
[6] mtools-api] oauthCallback() → code를 token으로 교환 → DB 저장
[7] mtools-api] 브라우저를 5173으로 redirect
                 ?view=schedule&calendar=connected
[8] mtools-ui]  일정관리 화면, GET /api/calendar/events
[9] mtools-api] DB token으로 Google Calendar API 호출
```

### 등장인물

| 구분 | 포트 | 역할 |
|------|------|------|
| mtools-ui | 5173 | 화면, API 호출 |
| mtools-api | 8080 | OAuth, token, Google API |
| Google | - | 로그인, token 발급 |
| PostgreSQL | 5432 | token 저장 |

---

## 3. `oauthCallback()` 상세

**파일:** `CalendarController.java`

```java
@GetMapping("/api/calendar/oauth/callback")
public void oauthCallback(
    @RequestParam String code,
    @RequestParam String state,
    HttpServletResponse response
) throws IOException {
    try {
        googleCalendarService.handleOAuthCallback(code, state);
        response.sendRedirect(frontend + "?view=schedule&calendar=connected");
    } catch (Exception e) {
        response.sendRedirect(frontend + "?view=schedule&calendar=error&message=...");
    }
}
```

### 중요 포인트

1. **Vue가 fetch로 부르지 않음** — Google이 사용자 **브라우저를 redirect** 시킴
2. **code** = 일회용 교환권 (짧게 쓰고 버림)
3. **state** = 연결 시작 시 서버가 만든 값과 비교 (위조 방지)
4. **handleOAuthCallback()** = code + client secret → Google에 token 요청 → DB 저장
5. **sendRedirect** = JSON 응답이 아니라 **5173 화면으로 브라우저 이동**

### code vs token

| 이름 | 비유 | 특징 |
|------|------|------|
| code | 편의점 교환권 | 1회용, callback URL에 노출 |
| access token | 출입 wristband | API 호출마다 사용, ~1시간 |
| refresh token | 갱신 카드 | access 만료 시 새 access 발급 |

### redirect URI가 8080인 이유

- **client secret**으로 code → token 교환 필요
- secret은 프론트(5173)에 두면 안 됨
- 그래서 Google redirect URI = `http://localhost:8080/api/calendar/oauth/callback`

---

## 4. Vue는 callback 이후 어떻게 아나?

백엔드가 redirect:

```text
http://localhost:5173/?view=schedule&calendar=connected
```

`App.vue` → `handleCalendarCallbackParams()`:

- `view=schedule` → 일정관리 메뉴 열기
- `calendar=connected` → 성공 메시지
- `loadCalendarData()` → `/api/calendar/status`, `/api/calendar/events`

Vue는 OAuth를 **직접 처리하지 않고**, redirect URL 파라미터만 읽는다.

---

## 5. 토큰은 언제 발급되나?

| 상황 | token 새로 발급? |
|------|------------------|
| **Google Calendar 연결** (최초 OAuth) | ✅ 예 |
| **일정관리 메뉴** 클릭 | ❌ 아니오 (DB token 재사용) |
| **새로고침** | ❌ 아니오 |
| **access token 만료** | △ refresh token으로 **갱신** (Google 로그인 X) |
| **연결 해제** | DB 삭제 → 다음에 다시 OAuth |

### 서버(8080) 실행과 token

- token은 **PostgreSQL DB**에 저장 (`t_google_oauth`)
- 서버 **껐다 켜도** DB에 token 남음 (연결 해제 안 했으면)
- 서버 **꺼져 있으면** API 호출 불가, token 자체는 DB에 존재

---

## 6. DB 저장

### 테이블: `t_google_oauth`

| 컬럼 | 내용 |
|------|------|
| `id_oauth` | 항상 1 (단일 사용자) |
| `st_access_token` | Calendar API 호출용 |
| `st_refresh_token` | access 만료 시 갱신용 |
| `dt_expires_at` | access token 만료 시각 |
| `st_email` | 연결 Google 계정 |
| `dt_updated` | 마지막 갱신 시각 |

### 저장 시점

- **최초 연결:** `handleOAuthCallback()` → `saveToken()`
- **token 갱신:** `getValidCredential()` → `saveRefreshedToken()`
- **연결 해제:** `disconnect()` → `deleteAll()`

### 코드 위치

- DAO: `GoogleOAuthDao.java`
- Mapper: `mapper/calendar/GoogleOAuthMapper.xml`

---

## 7. DB에서 꺼내 쓰는 로직 (만료 판별)

**핵심 메서드:** `GoogleCalendarService.getValidCredential()`

### 호출 경로

```text
GET /api/calendar/events
  → fetchEvents()
  → getValidCredential()   ← 여기
  → Google Calendar API
```

`/api/calendar/status`는 token **있/없**만 확인, **만료는 검사하지 않음**.

### getValidCredential() 단계

```text
1. googleOAuthDao.find()           → DB에서 token 읽기
2. token 없으면                   → "연결되어 있지 않습니다" 에러
3. Credential 객체 생성            → access + refresh token 설정
4. DB dt_expires_at → Credential  → 만료 시각 반영
5. getExpiresInSeconds()          → "지금부터 몇 초 남았나" 계산
6. 60초 이하이면:
     - refresh token 없음         → "다시 연결해 주세요" 에러
     - refresh token 있음         → credential.refreshToken()
                                  → Google에 갱신 요청
                                  → saveRefreshedToken() → DB upsert
7. 유효한 Credential 반환         → Calendar API 호출
```

### 만료 판별 요약

| 항목 | 내용 |
|------|------|
| 만료 시각 저장 | 연결/갱신 시 `dt_expires_at` (보통 발급 + 3600초) |
| 판별 방법 | Google `Credential.getExpiresInSeconds()` |
| 갱신 기준 | **60초 이하** 남으면 refresh |
| 갱신 실패 | 사용자에게 **Google Calendar 재연결** 필요 |

### 관련 메서드 위치

```text
GoogleCalendarService.java
├── getValidCredential()     # DB 조회 + 만료 + refresh
├── saveToken()              # 최초 OAuth 후 DB 저장
├── saveRefreshedToken()     # refresh 후 DB 저장
├── fetchEvents()            # getValidCredential() 호출
└── getConnectionStatus()    # DB token 존재만 확인
```

---

## 8. Google Cloud 설정 (자주 막히는 부분)

### Testing 앱 + 테스트 사용자

- OAuth 동의 화면 **Testing** 상태 → **테스트 사용자**에 Gmail 등록 필수
- 미등록 시 `403 access_denied`

### 데이터 액세스 (scope)

- **필수:** `calendar.readonly`
- scope 추가 후 **연결 해제 → 재연결** (기존 token에 scope 없을 수 있음)
- `ACCESS_TOKEN_SCOPE_INSUFFICIENT` → scope 미등록 또는 재연결 필요

### Google 인증 플랫폼 메뉴 (신 UI)

| 메뉴 | 용도 |
|------|------|
| **대상** | 테스트 사용자 |
| **데이터 액세스** | scope (calendar.readonly) |
| **클라이언트** | OAuth Client ID |
| **인증 센터** | 앱 검증 상태 (Testing이면 심사 불필요) |

---

## 9. 비유로 한 번에 정리

| OAuth 단계 | 비유 |
|------------|------|
| auth-url | 놀이공원 입장 신청 URL |
| Google 로그인 | 본인 확인 + 동의 |
| code | 잠깐 쓰는 **교환권** |
| oauthCallback | 교환권 → **wristband(token)** 발급 |
| DB 저장 | wristband **금고** 보관 |
| /events | 금고에서 꺼내 Google API 이용 |
| refresh | wristband 만료 → **갱신 카드**로 새 wristband |
| disconnect | 금고에서 wristband **폐기** |

---

## 10. 관련 소스 파일

```text
mtools-api/
├── calendar/controller/CalendarController.java
├── calendar/service/GoogleCalendarService.java
├── calendar/dao/GoogleOAuthDao.java
├── calendar/config/GoogleOAuthProperties.java
└── resources/mapper/calendar/GoogleOAuthMapper.xml

mtools-ui/
└── App.vue                    # connectGoogleCalendar, handleCalendarCallbackParams
```

---

## 11. 관련 MD 문서

| 파일 | 내용 |
|------|------|
| `2026-06-14_22-50_일정관리_Google_Calendar_OAuth_연동.md` | 초기 OAuth 연동 |
| `2026-06-14_23-45_일정관리_UI_및_캘린더_연동_정리.md` | UI·API·설정 전체 |
