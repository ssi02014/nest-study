<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS 학습 로드맵</h1>

<p align="center">
  AI 기반으로 구성된 <strong>NestJS 완전 정복 학습 가이드</strong><br/>
  17개 챕터를 따라가며 <strong>블로그 API</strong>를 처음부터 끝까지 완성합니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v10-E0234E?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Generated%20by-Claude%20Code-7C3AED" alt="Claude Code" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 이 프로젝트는?

NestJS를 **처음 배우는 초보자**를 위한 단계별 학습 로드맵입니다.

- 17개 챕터가 모두 **개념 학습 → 기본 예제 → 블로그 API 적용** 3단계로 구성
- 챕터를 순서대로 따라가면 **실제 동작하는 블로그 API 서버**가 완성
- 모든 내용은 [NestJS 공식 문서](https://docs.nestjs.com)를 기반으로 검증
- AI(Claude Code)가 구조 설계, 예제 코드, 설명을 작성하고 공식 문서로 크로스체크

---

## 학습 구조

```
각 챕터 구성:

┌─────────────────────────────────────────────┐
│  1단계: 개념 학습                             │
│  - 이 기술이 무엇인지, 왜 필요한지             │
│  - 초보자 눈높이의 비유와 다이어그램            │
├─────────────────────────────────────────────┤
│  2단계: 기본 예제                             │
│  - 개념을 확인하는 독립적인 작은 예제           │
│  - 직접 실행하며 동작 확인                     │
├─────────────────────────────────────────────┤
│  3단계: 블로그 API 적용                       │
│  - 배운 내용을 블로그 프로젝트에 바로 적용       │
│  - 챕터마다 기능이 하나씩 추가됨                │
└─────────────────────────────────────────────┘
```

---

## 로드맵 전체 구성

> 상세 내용은 [`docs/00-roadmap.md`](./docs/00-roadmap.md)를 참고하세요.

### Phase 1: 기초 — 프로젝트 뼈대 만들기

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [01](./docs/01-module.md) | **Module** | 프로젝트 뼈대 (모듈 분리) |
| [02](./docs/02-controller.md) | **Controller** | CRUD 라우트 정의 |
| [03](./docs/03-provider-and-di.md) | **Provider & DI** | 메모리 기반 CRUD 동작 |

### Phase 2: 요청 파이프라인 — 안전한 API 만들기

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [04](./docs/04-middleware.md) | **Middleware** | 요청 로깅 |
| [05](./docs/05-pipe.md) | **Pipe** | DTO 유효성 검사 |
| [06](./docs/06-guard.md) | **Guard** | 간이 인증 (헤더 기반) |

### Phase 3: 응답 & 에러 — 일관된 API 응답

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [07](./docs/07-interceptor.md) | **Interceptor** | 응답 포맷 통일 |
| [08](./docs/08-exception-filter.md) | **Exception Filter** | 에러 포맷 통일 |
| [09](./docs/09-custom-decorator.md) | **Custom Decorator** | @CurrentUser, @Public |

### Phase 4: 데이터 — 실제 DB 연동

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [10](./docs/10-typeorm.md) | **TypeORM** | SQLite DB 연동 |

### Phase 5: 설정 & 인증 — 실전 수준으로

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [11](./docs/11-configuration.md) | **Configuration** | .env 기반 설정 관리 |
| [12](./docs/12-authentication.md) | **Authentication** | JWT 인증 시스템 |
| [13](./docs/13-testing.md) | **Testing** | 핵심 로직 테스트 코드 |

### Phase 6: API 문서화 & 실시간 통신

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [14](./docs/14-swagger.md) | **Swagger** | API 문서 자동 생성 |
| [15](./docs/15-websocket.md) | **WebSocket** | 실시간 댓글 알림 |

### Phase 7: 아키텍처 패턴 — 대규모 앱 설계

| 챕터 | 주제 | 블로그 API 결과물 |
|------|------|-------------------|
| [16](./docs/16-cqrs.md) | **CQRS** | 게시글 CQRS 리팩토링 |
| [17](./docs/17-microservices.md) | **Microservices** | 알림 마이크로서비스 분리 |

---

## 블로그 API 성장 과정

```
Phase 1  모듈 분리 → 라우트 정의 → 메모리 CRUD 동작
            │
Phase 2  + 로깅 → + DTO 검증 → + 간이 인증
            │
Phase 3  + 응답 포맷 통일 → + 에러 포맷 통일 → + 커스텀 데코레이터
            │
Phase 4  + SQLite 데이터베이스 연동
            │
Phase 5  + 환경 변수 관리 → + JWT 인증 → + 테스트 코드
            │
Phase 6  + Swagger API 문서 → + 실시간 댓글 알림
            │
Phase 7  + CQRS 패턴 → + 알림 마이크로서비스 ── 완성!
```

---

## 시작하기

### 1. 프로젝트 설치

```bash
yarn install
```

### 2. 개발 서버 실행

```bash
yarn run start:dev
```

### 3. 학습 시작

[`docs/00-roadmap.md`](./docs/00-roadmap.md)를 열고 챕터 1부터 순서대로 진행하세요.

---

## 프로젝트 구조

```
nest-study/
├── README.md                    ← 지금 보고 있는 파일
├── docs/
│   ├── 00-roadmap.md            ← 전체 로드맵
│   ├── project-guide.md         ← 챕터별 블로그 API 구현 명세
│   ├── 01-module.md             ← Phase 1
│   ├── 02-controller.md
│   ├── 03-provider-and-di.md
│   ├── 04-middleware.md         ← Phase 2
│   ├── 05-pipe.md
│   ├── 06-guard.md
│   ├── 07-interceptor.md       ← Phase 3
│   ├── 08-exception-filter.md
│   ├── 09-custom-decorator.md
│   ├── 10-typeorm.md            ← Phase 4
│   ├── 11-configuration.md     ← Phase 5
│   ├── 12-authentication.md
│   ├── 13-testing.md
│   ├── 14-swagger.md           ← Phase 6
│   ├── 15-websocket.md
│   ├── 16-cqrs.md              ← Phase 7
│   └── 17-microservices.md
├── src/                         ← NestJS 소스 코드
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
└── test/                        ← E2E 테스트
```

---

## NestJS 요청 라이프사이클

학습 중 항상 이 흐름을 머릿속에 두세요.

```
Client Request
    │
    ▼
 Middleware           ← 챕터 4
    │
    ▼
  Guard               ← 챕터 6
    │
    ▼
 Interceptor (pre)    ← 챕터 7
    │
    ▼
   Pipe               ← 챕터 5
    │
    ▼
 Controller           ← 챕터 2
    │
    ▼
  Service             ← 챕터 3
    │
    ▼
 Interceptor (post)   ← 챕터 7
    │
    ▼
 Exception Filter     ← 챕터 8
    │
    ▼
Client Response
```

---

## 학습 팁

1. **순서대로 진행** — 각 챕터는 이전 내용을 이어받아 블로그 API를 확장합니다
2. **3단계 따라가기** — 개념 → 예제 → 블로그 적용 순서로 읽으세요
3. **직접 타이핑** — 코드를 복붙하지 말고 직접 타이핑하세요 (이해도가 다릅니다)
4. **공식 문서 병행** — [NestJS Docs](https://docs.nestjs.com)와 함께 보면 더 효과적입니다
5. **커밋 습관** — 각 챕터를 마칠 때마다 git commit으로 진행 상황을 기록하세요

---

## 참고 자료

- [NestJS 공식 문서](https://docs.nestjs.com)
- [NestJS GitHub](https://github.com/nestjs/nest)
- [TypeORM 공식 문서](https://typeorm.io)
- [class-validator](https://github.com/typestack/class-validator)
- [Passport.js](http://www.passportjs.org)

---

## AI 기반 학습 콘텐츠 생성

이 로드맵은 **Claude Code**를 활용하여 제작되었습니다.

- 17개 에이전트가 병렬로 각 챕터를 작성
- 각 에이전트가 NestJS 공식 문서를 참조하여 내용 검증
- 챕터 간 블로그 API의 연속성과 일관성 유지
- 초보자 관점에서 설명의 난이도와 깊이를 조절

---

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE)
