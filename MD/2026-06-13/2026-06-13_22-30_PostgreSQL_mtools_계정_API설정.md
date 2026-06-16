# 2026-06-13 22:30 - PostgreSQL mtools 계정과 API 설정

## 목표

기존 PostgreSQL 접속 계정이 로컬 사용자 `yujinseok`로 되어 있던 것을 프로젝트 전용 계정 `mtools`로 변경한다.

설정 목표:

```text
database: mtools
schema: mtools
user: mtools
password: 123456
```

## PostgreSQL 계정 및 소유자 변경

`mtools` 사용자를 만들고 비밀번호를 `123456`으로 설정했다.

이미 사용자가 있으면 비밀번호만 다시 설정한다.

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mtools') THEN
    CREATE ROLE mtools LOGIN PASSWORD '123456';
  ELSE
    ALTER ROLE mtools WITH LOGIN PASSWORD '123456';
  END IF;
END
$$;
```

`mtools` 데이터베이스의 소유자를 `mtools`로 변경했다.

```sql
ALTER DATABASE mtools OWNER TO mtools;
```

`mtools` 데이터베이스에 접속한 뒤, `mtools` 스키마의 소유자도 `mtools`로 변경했다.

```sql
ALTER SCHEMA mtools OWNER TO mtools;
GRANT ALL PRIVILEGES ON DATABASE mtools TO mtools;
GRANT ALL PRIVILEGES ON SCHEMA mtools TO mtools;
```

## 확인 결과

`mtools` 계정으로 실제 접속 확인:

```bash
PGPASSWORD=123456 psql -h localhost -p 5432 -U mtools -d mtools -c "select current_user, current_database(), current_schema();"
```

결과:

```text
current_user     : mtools
current_database : mtools
current_schema   : mtools
```

데이터베이스와 스키마 소유자 확인:

```text
database owner : mtools
schema owner   : mtools
```

## mtools-api 설정

`mtools-api/src/main/resources/application.properties`를 아래처럼 설정했다.

```properties
spring.application.name=mtools-api

spring.datasource.url=jdbc:postgresql://localhost:5432/mtools?currentSchema=mtools
spring.datasource.username=mtools
spring.datasource.password=123456

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

## API 실행 명령어

`mtools-api` 폴더에서 실행한다.

```bash
./gradlew bootRun
```

정상 실행되면 Spring Boot API 서버가 기본적으로 `8080` 포트에서 실행된다.
