# 2026-06-13 22:10 - mtools-api Spring Boot 생성 과정

## 목표

`mtools` 작업공간 안에 Spring Boot 백엔드 프로젝트를 `mtools-api`라는 폴더로 생성한다.

예상 구조:

```text
mtools/
  mtools-ui/   # Vue 3 프론트엔드
  mtools-api/  # Spring Boot 백엔드 API 서버
  mtools-db/   # PostgreSQL 관련 파일
  MD/          # 작업 기록
```

## 생성 방식

Spring Initializr를 터미널 명령어로 호출해서 `mtools-api.zip`을 받고, 압축을 풀어 `mtools-api` 프로젝트를 만든다.

## mtools 폴더에서 실행할 명령어

먼저 현재 위치가 `mtools`인지 확인한다.

```bash
pwd
```

아래처럼 나오면 맞다.

```text
/Users/yujinseok/project/mtools
```

Spring Boot 프로젝트를 생성한다.

```bash
curl "https://start.spring.io/starter.zip" \
  -d type=gradle-project \
  -d language=java \
  -d baseDir=mtools-api \
  -d groupId=com.mtools \
  -d artifactId=mtools-api \
  -d name=mtools-api \
  -d description="mtools Spring Boot API server" \
  -d packageName=com.mtools.api \
  -d packaging=jar \
  -d javaVersion=21 \
  -d dependencies=web,devtools,data-jpa,postgresql,validation,lombok \
  -o mtools-api.zip
```

압축을 푼다.

```bash
unzip mtools-api.zip
```

압축 파일을 삭제한다.

```bash
rm mtools-api.zip
```

생성된 프로젝트 폴더로 이동한다.

```bash
cd mtools-api
```

Spring Boot를 실행한다.

```bash
./gradlew bootRun
```

## 선택한 설정

- Project: Gradle
- Language: Java
- Java: 21
- Group: `com.mtools`
- Artifact: `mtools-api`
- Package: `com.mtools.api`
- Packaging: Jar

## 추가한 Dependencies

- Spring Web: REST API 개발
- Spring Boot DevTools: 개발 중 자동 재시작 편의 기능
- Spring Data JPA: DB 테이블을 Java Entity와 연결
- PostgreSQL Driver: PostgreSQL 연결
- Validation: 요청값 검증
- Lombok: 반복 코드 감소

## 아직 넣지 않은 것

Spring Security는 처음 생성 시점에는 제외한다.

이유:

- 로그인/회원 기능을 만들기 전에는 설정이 불필요하게 복잡해질 수 있음.
- API 구조와 PostgreSQL 연결을 먼저 잡은 뒤 추가하는 편이 이해하기 좋음.

## 생성 후 확인

정상 생성되면 아래 파일들이 생긴다.

```text
mtools-api/
  build.gradle
  settings.gradle
  gradlew
  src/
```

`./gradlew bootRun` 실행 후 서버가 정상적으로 뜨면 기본 포트는 보통 `8080`이다.
