# 2026-06-13 22:17 - PostgreSQL 확인과 mtools 스키마 계획

## 목표

Docker를 사용하지 않고, 현재 Mac 내부에서 실행 중인 PostgreSQL을 `mtools-api`에서 사용한다.

최종 구조:

```text
mtools/
  mtools-ui/   # Vue 3 프론트엔드
  mtools-api/  # Spring Boot 백엔드 API 서버
  MD/          # 작업 기록
```

`mtools-db` 폴더는 Docker나 DB 초기화 파일을 따로 관리할 때 의미가 있으므로, 현재 방식에서는 만들지 않는다.

## PostgreSQL 실행 여부 확인

PostgreSQL이 5432 포트에서 접속 가능한지 확인한다.

```bash
pg_isready -h localhost -p 5432
```

확인 결과:

```text
localhost:5432 - accepting connections
```

즉 PostgreSQL은 실행 중이다.

## 5432 포트를 사용하는 프로세스 확인

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

확인 결과:

```text
postgres ... TCP 127.0.0.1:5432 (LISTEN)
postgres ... TCP [::1]:5432 (LISTEN)
```

즉 로컬 PostgreSQL 프로세스가 5432 포트에서 대기 중이다.

## psql 접속 확인

```bash
psql -h localhost -p 5432 -d postgres -c "select current_user, current_database(), version();"
```

확인 결과:

```text
current_user     : yujinseok
current_database : postgres
version          : PostgreSQL 16.11 (Homebrew)
```

현재 로컬 사용자인 `yujinseok` 계정으로 PostgreSQL 접속이 가능하다.

## 데이터베이스 목록 확인

```bash
psql -h localhost -p 5432 -d postgres -c "\l"
```

확인된 주요 데이터베이스:

```text
mtools
postgres
template0
template1
wne
```

이미 `mtools` 데이터베이스가 존재한다.

## mtools 데이터베이스의 스키마 확인

```bash
psql -h localhost -p 5432 -d mtools -c "\dn"
```

확인 결과:

```text
public
```

현재 `mtools` 데이터베이스 안에는 기본 스키마인 `public`만 있고, `mtools` 스키마는 아직 없다.

## mtools 스키마 생성 명령어

`mtools` 데이터베이스 안에 `mtools` 스키마를 만들려면 아래 명령어를 실행한다.

```bash
psql -h localhost -p 5432 -d mtools -c "create schema if not exists mtools;"
```

생성 후 다시 확인한다.

```bash
psql -h localhost -p 5432 -d mtools -c "\dn"
```

## mtools-api 연결 설정 예시

`mtools-api/src/main/resources/application.properties`에 아래처럼 설정하면 된다.

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mtools?currentSchema=mtools
spring.datasource.username=yujinseok
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

의미:

- Database: `mtools`
- Schema: `mtools`
- User: `yujinseok`
- Host: `localhost`
- Port: `5432`

## 다음 단계

1. `mtools` 스키마를 생성한다.
2. `mtools-api`의 `application.properties`에 PostgreSQL 연결 정보를 추가한다.
3. `mtools-api`에서 `./gradlew bootRun`을 다시 실행한다.
