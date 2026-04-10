# 실습 프로젝트: 블로그 API 만들기

각 챕터를 학습하면서 하나의 블로그 API를 점진적으로 완성합니다.
챕터를 마칠 때마다 기능이 추가되어, 최종적으로 완성된 서비스를 갖게 됩니다.

---

## 프로젝트 개요

| 항목         | 내용                                      |
| ------------ | ----------------------------------------- |
| 서비스       | 블로그 REST API                           |
| 주요 도메인  | 사용자(User), 게시글(Post), 댓글(Comment) |
| 데이터베이스 | SQLite (개발용) → PostgreSQL (운영용)     |
| 인증         | JWT (Access + Refresh Token)              |
| 문서화       | Swagger                                   |
| 실시간       | 댓글 알림 (WebSocket)                     |

---

## 챕터별 구현 가이드

### Phase 1: 기초 — 프로젝트 뼈대 만들기

#### 챕터 1: Module

> **구현**: 도메인별 모듈 분리

```
src/
├── app.module.ts              ← 루트 모듈
├── users/
│   └── users.module.ts        ← UsersModule
├── posts/
│   └── posts.module.ts        ← PostsModule
├── comments/
│   └── comments.module.ts     ← CommentsModule
└── common/
    └── common.module.ts       ← 공유 모듈 (유틸, 헬퍼)
```

- `AppModule`에서 각 Feature 모듈을 imports
- `CommonModule`을 만들어 공유 서비스를 exports

---

#### 챕터 2: Controller

> **구현**: 각 도메인의 CRUD 라우트 정의

```typescript
// 구현할 엔드포인트

// Users
POST   /users          ← 회원가입
GET    /users/:id      ← 프로필 조회

// Posts
POST   /posts          ← 게시글 작성
GET    /posts          ← 게시글 목록 (쿼리: page, limit, search)
GET    /posts/:id      ← 게시글 상세
PATCH  /posts/:id      ← 게시글 수정
DELETE /posts/:id      ← 게시글 삭제

// Comments
POST   /posts/:postId/comments      ← 댓글 작성
GET    /posts/:postId/comments      ← 댓글 목록
DELETE /comments/:id                ← 댓글 삭제
```

- `@Param`, `@Query`, `@Body` 활용
- 이 시점에서는 메모리 배열로 데이터 관리 (DB 연동은 챕터 10)

---

#### 챕터 3: Provider & DI

> **구현**: 비즈니스 로직을 Service로 분리

```
src/users/
├── users.controller.ts
├── users.service.ts          ← 사용자 CRUD 로직
└── users.module.ts

src/posts/
├── posts.controller.ts
├── posts.service.ts          ← 게시글 CRUD 로직
└── posts.module.ts

src/comments/
├── comments.controller.ts
├── comments.service.ts       ← 댓글 CRUD 로직
└── comments.module.ts
```

- Controller → Service 의존성 주입
- interface로 데이터 타입 정의 (`User`, `Post`, `Comment`)
- 메모리 배열 기반 CRUD 구현

---

### Phase 2: 요청 파이프라인 — 안전한 API 만들기

#### 챕터 4: Middleware

> **구현**: 요청 로깅 미들웨어

```typescript
// 구현할 미들웨어

LoggerMiddleware       ← 모든 요청의 method, url, 응답시간 로깅
```

- `AppModule`에서 전역 적용
- NestJS Logger를 주입해서 사용

---

#### 챕터 5: Pipe

> **구현**: DTO 유효성 검사 추가

```typescript
// 구현할 DTO

CreateUserDto {
  email: string       // @IsEmail
  password: string    // @MinLength(8)
  name: string        // @IsString, @MaxLength(20)
}

CreatePostDto {
  title: string       // @IsString, @MaxLength(100)
  content: string     // @IsString, @MinLength(10)
}

UpdatePostDto         // PartialType(CreatePostDto)

CreateCommentDto {
  content: string     // @IsString, @MinLength(1)
}

PaginationQueryDto {
  page: number        // @IsOptional, @Type(() => Number)
  limit: number       // @IsOptional, @Max(100)
  search: string      // @IsOptional
}
```

- `ValidationPipe`을 글로벌 적용 (`whitelist: true`, `transform: true`)
- `ParseIntPipe`으로 `:id` 파라미터 변환

---

#### 챕터 6: Guard

> **구현**: 인증 가드 (간이 버전)

```typescript
// 구현할 Guard

SimpleAuthGuard      ← 헤더에 x-user-id가 있는지 확인 (JWT는 챕터 12에서)
RolesGuard           ← @Roles('admin') 데코레이터와 함께 역할 검사
```

- 게시글 작성/수정/삭제에 `SimpleAuthGuard` 적용
- `@Public()` 데코레이터로 목록/상세 조회는 인증 스킵
- 이 시점에서는 간단한 헤더 기반 인증 → 챕터 12에서 JWT로 교체

---

### Phase 3: 응답 & 에러 — 일관된 API 응답 만들기

#### 챕터 7: Interceptor

> **구현**: 응답 포맷 통일 + 로깅

```typescript
// 구현할 Interceptor

TransformInterceptor   ← 모든 응답을 { success, data, timestamp } 형태로 래핑
LoggingInterceptor     ← 요청 처리 시간 측정 및 로깅
```

적용 후 모든 API 응답 형태:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### 챕터 8: Exception Filter

> **구현**: 에러 응답 포맷 통일

```typescript
// 구현할 Filter

HttpExceptionFilter    ← 모든 HTTP 예외를 통일된 형태로 변환
```

에러 응답 형태:

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "게시글을 찾을 수 없습니다",
    "path": "/posts/999",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

- Service에서 `NotFoundException`, `ForbiddenException` 등 적극 활용

---

#### 챕터 9: Custom Decorator

> **구현**: 편의 데코레이터 만들기

```typescript
// 구현할 Decorator

@CurrentUser()         ← 요청에서 현재 유저 정보 추출
@Public()              ← 이미 챕터 6에서 만든 것 리팩토링
@ApiAuth()             ← Guard + Swagger 데코레이터 합성 (Swagger는 챕터 14에서)
```

---

### Phase 4: 데이터 — 실제 DB 연동

#### 챕터 10: TypeORM

> **구현**: 메모리 배열 → 실제 데이터베이스 교체

```typescript
// 구현할 Entity

@Entity()
User {
  id, email, password, name, role, createdAt
  posts: Post[]          // OneToMany
  comments: Comment[]    // OneToMany
}

@Entity()
Post {
  id, title, content, createdAt, updatedAt
  author: User           // ManyToOne
  comments: Comment[]    // OneToMany
}

@Entity()
Comment {
  id, content, createdAt
  author: User           // ManyToOne
  post: Post             // ManyToOne
}
```

- SQLite로 간편하게 시작
- Repository 패턴으로 Service 리팩토링
- 페이지네이션 구현 (`skip`, `take`)
- 게시글 삭제 시 댓글도 함께 삭제 (`cascade`)

---

### Phase 5: 설정 & 인증 — 실전 수준으로 업그레이드

#### 챕터 11: Configuration

> **구현**: 환경 변수 관리

```
# .env
DATABASE_PATH=./blog.sqlite
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
```

- `ConfigModule`로 전역 설정
- `database.config.ts`, `jwt.config.ts` 네임스페이스 분리
- Joi로 환경 변수 유효성 검사

---

#### 챕터 12: Authentication

> **구현**: 챕터 6의 SimpleAuthGuard → JWT 인증으로 교체

```typescript
// 구현할 엔드포인트

POST /auth/signup       ← 회원가입 (bcrypt 해싱)
POST /auth/login        ← 로그인 (이메일 + 비밀번호 → JWT 발급)
POST /auth/refresh      ← 토큰 갱신
POST /auth/logout       ← 로그아웃
```

- `AuthModule` 추가
- `LocalStrategy` + `JwtStrategy` 구현
- `SimpleAuthGuard` → `JwtAuthGuard`로 교체
- 게시글/댓글의 작성자만 수정/삭제 가능하도록 소유권 검증 추가

---

#### 챕터 13: Testing

> **구현**: 핵심 로직 테스트 작성

```
테스트 대상:

단위 테스트:
  - PostsService     ← CRUD 로직, 소유권 검증
  - AuthService      ← 로그인, 토큰 발급/검증

컨트롤러 테스트:
  - PostsController  ← 라우팅, Guard 동작 확인

E2E 테스트:
  - 회원가입 → 로그인 → 게시글 작성 → 조회 → 수정 → 삭제 전체 플로우
```

---

### Phase 6: API 문서화 & 실시간 통신

#### 챕터 14: Swagger

> **구현**: 전체 API 문서화

- 모든 엔드포인트에 `@ApiTags`, `@ApiOperation`, `@ApiResponse` 추가
- 모든 DTO에 `@ApiProperty` 추가
- Bearer 인증 설정
- `http://localhost:3000/api-docs` 에서 확인 가능

---

#### 챕터 15: WebSocket

> **구현**: 실시간 댓글 알림

```typescript
// 구현할 Gateway

BlogGateway {
  @SubscribeMessage('joinPost')     ← 게시글 상세 페이지 입장 (Room)
  @SubscribeMessage('leavePost')    ← 게시글 상세 페이지 퇴장

  // 댓글이 작성되면 해당 게시글 Room에 실시간 알림
  notifyNewComment(postId, comment)
}
```

- `CommentsService`에서 댓글 생성 시 `BlogGateway`를 통해 실시간 브로드캐스트
- 게시글을 보고 있는 사용자에게만 새 댓글 알림

---

### Phase 7: 아키텍처 패턴 (선택)

#### 챕터 16: CQRS

> **구현**: 게시글 도메인을 CQRS로 리팩토링

```typescript
// Command
CreatePostCommand, UpdatePostCommand, DeletePostCommand

// Query
GetPostQuery, GetPostListQuery

// Event
PostCreatedEvent → 알림 전송, 검색 인덱스 업데이트
PostDeletedEvent → 댓글 정리
```

---

#### 챕터 17: Microservices

> **구현 (개념 실습)**: 알림 서비스 분리

```
┌──────────────┐         TCP         ┌─────────────────────┐
│  Blog API    │ ──────────────────→ │ Notification Service │
│  (HTTP:3000) │    EventPattern     │ (TCP:3001)           │
└──────────────┘                     └─────────────────────┘
```

- 댓글 작성 시 `NotificationService`로 이벤트 전송
- 알림 마이크로서비스가 이벤트를 수신하여 처리

---

## 최종 프로젝트 구조

```
src/
├── app.module.ts
│
├── common/
│   ├── common.module.ts
│   ├── decorators/          ← @CurrentUser, @Public, @Roles
│   ├── filters/             ← HttpExceptionFilter
│   ├── guards/              ← JwtAuthGuard, RolesGuard
│   ├── interceptors/        ← TransformInterceptor, LoggingInterceptor
│   └── middleware/           ← LoggerMiddleware
│
├── config/
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/           ← LocalStrategy, JwtStrategy
│   └── dto/
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/             ← user.entity.ts
│   └── dto/
│
├── posts/
│   ├── posts.module.ts
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   ├── entities/             ← post.entity.ts
│   └── dto/
│
├── comments/
│   ├── comments.module.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   ├── entities/             ← comment.entity.ts
│   └── dto/
│
└── gateway/
    └── blog.gateway.ts       ← WebSocket 실시간 알림
```

---

## 진행 체크리스트

- [ ] Phase 1: 모듈 분리, 컨트롤러, 서비스 (메모리 기반 CRUD)
- [ ] Phase 2: 미들웨어, DTO 검증, 가드 (안전한 API)
- [ ] Phase 3: 인터셉터, 예외 필터, 데코레이터 (일관된 응답)
- [ ] Phase 4: TypeORM 연동 (실제 DB)
- [ ] Phase 5: 환경 설정, JWT 인증, 테스트
- [ ] Phase 6: Swagger 문서화, WebSocket 실시간 기능
- [ ] Phase 7: CQRS, 마이크로서비스 (아키텍처 심화)
