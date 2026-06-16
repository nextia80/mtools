# mtools API 문서

## 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| API Docs (JSON) | `http://localhost:8080/v3/api-docs` |

## CORS

프론트엔드 origin은 `application.properties`에서 관리한다.

```properties
app.cors.allowed-origins=http://localhost:5173,http://localhost:5174
```

`/api/**` 경로에 대해 전역 CORS가 적용된다. (`CorsConfig.java`)

---

## Echo

### GET /api/echo

요청 파라미터를 그대로 돌려주는 테스트 API.

**Query Parameters**

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | echo 값 |

**Response**

```json
{
  "id": "a"
}
```

**예시**

```http
GET /api/echo?id=a
```

---

## 게시판 (Board)

DB 테이블: `t_board`

### GET /api/boards

게시글 목록 조회. `yn_use = 'N'`인 항목은 제외.

**Response**

```json
[
  {
    "idBoard": 1,
    "title": "제목",
    "text": "내용",
    "insertedAt": "2026-06-14 16:09:58.123456",
    "updatedAt": null
  }
]
```

### POST /api/boards

게시글 등록.

**Request Body**

```json
{
  "title": "제목",
  "text": "내용"
}
```

**Response**

등록된 게시글 객체 (`BoardPost`)

### PUT /api/boards/{idBoard}

게시글 수정.

**Path Parameters**

| 이름 | 타입 | 설명 |
|------|------|------|
| idBoard | long | 게시글 ID |

**Request Body**

```json
{
  "title": "수정 제목",
  "text": "수정 내용"
}
```

**Response**

수정된 게시글 객체 (`BoardPost`)

### DELETE /api/boards/{idBoard}

게시글 삭제 (소프트 삭제: `yn_use = 'N'`).

**Path Parameters**

| 이름 | 타입 | 설명 |
|------|------|------|
| idBoard | long | 게시글 ID |

**Response**

```json
{
  "status": "ok"
}
```

---

## MD 파일 (Markdown)

파일 시스템의 `../MD` 폴더를 읽고 쓴다.

### GET /api/md-files

MD 파일 목록 조회.

**Response**

```json
[
  {
    "path": "2026-06-14/2026-06-14_21-10_Vue_메뉴별_컴포넌트_분리.md",
    "name": "2026-06-14_21-10_Vue_메뉴별_컴포넌트_분리.md",
    "size": 2048,
    "modifiedAt": "2026-06-14T12:10:00.000Z"
  }
]
```

### GET /api/md-files/content

MD 파일 내용 조회.

**Query Parameters**

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| path | string | Y | 상대 경로 (예: `2026-06-14/파일명.md`) |

**Response**

```json
{
  "content": "# Markdown 내용"
}
```

**예시**

```http
GET /api/md-files/content?path=2026-06-14/2026-06-14_21-10_Vue_메뉴별_컴포넌트_분리.md
```

### PUT /api/md-files/content

MD 파일 내용 저장.

**Query Parameters**

| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| path | string | Y | 상대 경로 |

**Request Body**

```json
{
  "content": "# 수정된 Markdown 내용"
}
```

**Response**

```json
{
  "status": "ok"
}
```

---

## tbl_test

DB 테이블: `tbl_test`

### GET /api/tbl-test

테스트 테이블 전체 조회.

**Response**

```json
[
  {
    "v01": "값1",
    "v02": "값2",
    "v03": "값3",
    "v04": "값4",
    "v05": "값5",
    "v06": "값6",
    "v07": "값7",
    "v08": "값8",
    "v09": "값9",
    "v10": "값10"
  }
]
```

---

## 백엔드 패키지 구조

```text
com.mtools.api
├── config/
│   └── CorsConfig.java
├── board/
│   ├── controller/BoardController.java
│   ├── service/BoardService.java, BoardPost.java
│   ├── dao/BoardDao.java
│   └── request/BoardPostRequest.java
├── md/
│   ├── controller/MdFileController.java
│   ├── service/MdFileService.java, MdFileInfo.java
│   └── request/MdFileContentRequest.java
├── echo/
│   └── controller/EchoController.java
└── tbltest/
    ├── controller/TblTestController.java
    ├── service/TblTestService.java
    └── dao/TblTestDao.java
```

## DB 접근 방식

| 기능 | 방식 |
|------|------|
| board | MyBatis (`mapper/board/BoardMapper.xml`) |
| tbl_test | MyBatis (`mapper/tbltest/TblTestMapper.xml`) |
| md | 파일 시스템 (Java NIO) |
| echo | DB 미사용 |

JPA 의존성은 있으나, 현재 API에서는 `@Entity` / `JpaRepository`를 사용하지 않는다.

## DB 테이블

### t_board

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id_board | NUMERIC(10) | 게시글 ID |
| st_title | VARCHAR(1000) | 제목 |
| st_text | TEXT | 내용 |
| yn_use | VARCHAR(1) | 사용 여부 (N이면 삭제) |
| id_member | NUMERIC(10) | 회원 ID |
| id_insert | NUMERIC(10) | 등록자 |
| dt_insert | TIMESTAMP | 등록일 |
| id_update | NUMERIC(10) | 수정자 |
| dt_update | TIMESTAMP | 수정일 |

### t_member

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id_member | NUMERIC(10) | 회원 ID |
| st_member | VARCHAR(100) | 회원 아이디 |
| st_name | VARCHAR(1000) | 이름 |
| st_email | VARCHAR(1000) | 이메일 |
| st_level | VARCHAR(10) | 권한 (기본 99) |
| yn_use | VARCHAR(1) | 사용 여부 |
| id_insert | NUMERIC(10) | 등록자 |
| dt_insert | TIMESTAMP | 등록일 |
| id_update | NUMERIC(10) | 수정자 |
| dt_update | TIMESTAMP | 수정일 |

### tbl_test

| 컬럼 | 타입 |
|------|------|
| v01 ~ v10 | VARCHAR(100) |

## 프론트엔드에서 사용하는 API

| 화면 | API |
|------|-----|
| 게시판 | GET/POST/PUT/DELETE `/api/boards` |
| 일자별 MD | GET `/api/md-files`, GET/PUT `/api/md-files/content` |
| API 테스트 | 임의 endpoint (기본 `/api/echo`) |
| API 스웨거 | Swagger UI iframe |
