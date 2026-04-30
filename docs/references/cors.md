# CORS 레퍼런스

이 문서는 **CORS(Cross-Origin Resource Sharing)** 를 독립적으로 이해할 수 있도록 작성된 참고 문서입니다.
CORS가 무엇인지, 왜 발생하는지, 내부 동작 원리, NestJS에서 어떻게 설정하는지를 다룹니다.

> **참고:** NestJS 공식 문서의 CORS 설명은 [Security — CORS](https://docs.nestjs.com/security/cors)에서 확인할 수 있습니다.

---

## 목차

1. [CORS란?](#1-cors란)
2. [Same-Origin Policy — 왜 브라우저가 막는가](#2-same-origin-policy--왜-브라우저가-막는가)
3. [단순 요청 vs 사전 요청(Preflight)](#3-단순-요청-vs-사전-요청preflight)
4. [CORS 관련 헤더 전체 정리](#4-cors-관련-헤더-전체-정리)
5. [Credentials 모드 — 쿠키와 인증 헤더](#5-credentials-모드--쿠키와-인증-헤더)
6. [NestJS에서 CORS 활성화](#6-nestjs에서-cors-활성화)
7. [CORS 주요 옵션 상세](#7-cors-주요-옵션-상세)
8. [자주 발생하는 에러 메시지 해석](#8-자주-발생하는-에러-메시지-해석)
9. [개발 vs 프로덕션 설정](#9-개발-vs-프로덕션-설정)
10. [CORS의 한계 — 브라우저 전용 보안](#10-cors의-한계--브라우저-전용-보안)

---

## 1. CORS란?

**CORS(Cross-Origin Resource Sharing)** 는 브라우저가 **다른 출처(Origin)의 서버**에 HTTP 요청을 보낼 때 적용되는 보안 메커니즘이다.

출처(Origin)는 **프로토콜 + 도메인 + 포트** 세 가지로 결정된다. 이 중 하나라도 다르면 다른 출처다.

| URL | 출처 | `http://localhost:3000` 기준 |
|-----|------|------|
| `http://localhost:3000` | `http://localhost:3000` | ✅ 동일 출처 |
| `http://localhost:5500` | `http://localhost:5500` | ❌ 포트 다름 |
| `https://localhost:3000` | `https://localhost:3000` | ❌ 프로토콜 다름 |
| `http://example.com:3000` | `http://example.com:3000` | ❌ 도메인 다름 |
| `http://api.localhost:3000` | `http://api.localhost:3000` | ❌ 서브도메인 다름 |

---

## 2. Same-Origin Policy — 왜 브라우저가 막는가

브라우저는 기본적으로 **Same-Origin Policy(동일 출처 정책)** 를 적용한다. 스크립트가 자신과 다른 출처의 리소스에 접근하는 것을 차단하는 규칙이다.

### 왜 이 정책이 필요한가

악의적인 사이트가 사용자의 인증 정보(쿠키, 세션)를 이용해 다른 서버에 몰래 요청을 보내는 **CSRF(Cross-Site Request Forgery)** 공격을 막기 위해서다.

```
[시나리오] 사용자가 bank.com에 로그인한 상태에서 evil.com을 방문

evil.com의 스크립트
    │
    │  fetch('https://bank.com/transfer', {   ← 다른 출처 요청
    │    method: 'POST',
    │    body: '{"to":"attacker","amount":1000000}',
    │    credentials: 'include'               ← 쿠키 자동 첨부
    │  })
    ▼
bank.com 서버
    │
    │  쿠키가 있으니 인증된 요청으로 처리 → 송금 실행!
```

SOP는 다른 출처의 **응답을 읽는 것**을 차단한다. 그러나 쿠키가 포함된 요청 **전송 자체**를 막지는 않는다. CSRF 공격을 막으려면 CSRF 토큰, SameSite 쿠키 설정 등 별도 방어책이 필요하다.

> **팁:** CORS는 이 정책에 **예외를 허용**하는 메커니즘이다. 서버가 "이 출처는 내 데이터를 읽어도 된다"고 명시적으로 선언하면 브라우저가 허용한다.

---

## 3. 단순 요청 vs 사전 요청(Preflight)

CORS 요청은 조건에 따라 두 가지 방식으로 처리된다.

### 단순 요청 (Simple Request)

아래 조건을 **모두** 만족하면 Preflight 없이 바로 요청을 보낸다.

| 조건 | 허용 값 |
|------|---------|
| 메서드 | `GET`, `HEAD`, `POST` |
| 헤더 | `Accept`, `Accept-Language`, `Content-Language`, `Content-Type`만 포함 |
| `Content-Type` | `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`만 허용 |

```
브라우저 (http://127.0.0.1:5500)              서버 (http://localhost:3000)
    │                                              │
    │  GET /posts                                  │
    │  Origin: http://127.0.0.1:5500              │  ← 단순 요청, 바로 전송
    │──────────────────────────────────────────────▶│
    │                                              │
    │  200 OK                                      │
    │  Access-Control-Allow-Origin: *             │  ← 서버가 허용 선언
    │◀──────────────────────────────────────────────│
    │                                              │
    │  브라우저가 응답 허용 → JS에서 응답 읽기 가능    │
```

### 사전 요청 (Preflight Request)

단순 요청 조건을 벗어나면 **실제 요청 전에 `OPTIONS` 요청을 먼저 보낸다.** 아래 중 하나라도 해당하면 Preflight가 발생한다.

- `PUT`, `PATCH`, `DELETE` 메서드 사용
- `Content-Type: application/json` 헤더 포함 (REST API의 대부분)
- `Authorization` 등 커스텀 헤더 포함

```
브라우저 (http://127.0.0.1:5500)              서버 (http://localhost:3000)
    │                                              │
    │  [1단계] OPTIONS /users                      │  ← Preflight: "보내도 돼?"
    │  Origin: http://127.0.0.1:5500              │
    │  Access-Control-Request-Method: POST        │
    │  Access-Control-Request-Headers: Content-Type│
    │──────────────────────────────────────────────▶│
    │                                              │
    │  204 No Content                              │  ← 서버 허용 응답
    │  Access-Control-Allow-Origin: *             │
    │  Access-Control-Allow-Methods: POST         │
    │  Access-Control-Allow-Headers: Content-Type │
    │◀──────────────────────────────────────────────│
    │                                              │
    │  [2단계] POST /users { "email": "..." }       │  ← 실제 요청
    │  Origin: http://127.0.0.1:5500              │
    │  Content-Type: application/json             │
    │──────────────────────────────────────────────▶│
    │                                              │
    │  201 Created { "id": 1, ... }                │
    │◀──────────────────────────────────────────────│
```

서버가 Preflight에 올바르게 응답하지 않으면 2단계 실제 요청은 전송 자체가 되지 않는다.

---

## 4. CORS 관련 헤더 전체 정리

### 요청 헤더 (브라우저 → 서버)

브라우저가 자동으로 추가한다. 직접 설정하지 않아도 된다.

| 헤더 | 설명 |
|------|------|
| `Origin` | 요청을 보내는 출처. 모든 CORS 요청에 포함된다. |
| `Access-Control-Request-Method` | Preflight에서 실제 요청에 사용할 HTTP 메서드를 서버에 알림 |
| `Access-Control-Request-Headers` | Preflight에서 실제 요청에 포함할 헤더 목록을 서버에 알림 |

### 응답 헤더 (서버 → 브라우저)

서버가 CORS 허용 여부를 브라우저에 알리기 위해 응답에 포함한다. `app.enableCors()`가 자동으로 추가해준다.

| 헤더 | 설명 | 예시 값 |
|------|------|---------|
| `Access-Control-Allow-Origin` | 허용할 출처. 필수 헤더 | `*` 또는 `http://localhost:5173` |
| `Access-Control-Allow-Methods` | 허용할 HTTP 메서드 목록 | `GET,POST,PATCH,DELETE` |
| `Access-Control-Allow-Headers` | 허용할 요청 헤더 목록 | `Content-Type,Authorization` |
| `Access-Control-Allow-Credentials` | 인증 정보(쿠키 등) 포함 요청 허용 여부 | `true` |
| `Access-Control-Max-Age` | Preflight 결과를 캐시할 시간(초). 이 시간 동안 재요청 생략 | `86400` |
| `Access-Control-Expose-Headers` | JS에서 접근 가능하도록 노출할 응답 헤더 목록 | `X-Custom-Header` |

> **팁:** 기본적으로 JS에서 읽을 수 있는 응답 헤더는 `Cache-Control`, `Content-Language`, `Content-Type`, `Expires`, `Last-Modified`, `Pragma` 6개뿐이다. 커스텀 헤더를 JS에서 읽으려면 `Access-Control-Expose-Headers`에 명시해야 한다.

---

## 5. Credentials 모드 — 쿠키와 인증 헤더

기본적으로 CORS 요청에는 **쿠키, `Authorization` 헤더 등 인증 정보가 포함되지 않는다.** 인증 정보를 함께 보내려면 클라이언트와 서버 양쪽에 모두 설정이 필요하다.

### 클라이언트 (프론트엔드)

```typescript
// fetch API
fetch('http://localhost:3000/auth/me', {
  credentials: 'include', // 쿠키 자동 첨부
});

// axios
axios.get('http://localhost:3000/auth/me', {
  withCredentials: true,
});
```

### 서버 (NestJS)

```typescript
app.enableCors({
  origin: 'http://localhost:5173', // ← 반드시 명시적 출처 지정
  credentials: true,               // ← Access-Control-Allow-Credentials: true 추가
});
```

### credentials와 와일드카드 origin의 충돌

`credentials: true`와 `origin: '*'`(와일드카드)은 **함께 사용할 수 없다.** 브라우저 보안 정책으로 금지되어 있다.

```typescript
// ❌ 브라우저가 CORS 에러 발생 (credentials + 와일드카드 조합 불가)
app.enableCors({
  origin: '*',
  credentials: true,
});

// ✅ 출처를 명시적으로 지정해야 함
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

---

## 6. NestJS에서 CORS 활성화

### 기본 활성화

`src/main.ts`에서 `app.enableCors()`를 호출한다. 모든 출처의 요청을 허용한다.

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 모든 출처 허용
  await app.listen(3000);
}
bootstrap();
```

### 옵션과 함께 활성화

허용할 출처, 메서드, 헤더를 세밀하게 제어할 수 있다.

```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600,
});
```

### NestFactory 옵션으로 설정

`NestFactory.create()`의 두 번째 인자로도 설정 가능하다.

```typescript
const app = await NestFactory.create(AppModule, {
  cors: true,
});

// 또는 옵션 지정
const app = await NestFactory.create(AppModule, {
  cors: {
    origin: 'https://my-frontend.com',
    credentials: true,
  },
});
```

---

## 7. CORS 주요 옵션 상세

NestJS의 CORS 옵션은 [cors](https://github.com/expressjs/cors) 패키지의 옵션을 그대로 사용한다.

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `origin` | `string \| string[] \| boolean \| RegExp \| Function` | `*` | 허용할 출처. `true`: 요청 Origin을 그대로 반영 (credentials와 함께 사용 가능), `false`: 모든 요청 차단 |
| `methods` | `string \| string[]` | `GET,HEAD,PUT,PATCH,POST,DELETE` | 허용할 HTTP 메서드 |
| `allowedHeaders` | `string \| string[]` | 요청의 `Access-Control-Request-Headers` 반영 | 허용할 요청 헤더 |
| `exposedHeaders` | `string \| string[]` | — | JS에서 읽을 수 있도록 노출할 응답 헤더 |
| `credentials` | `boolean` | `false` | 쿠키·인증 헤더 포함 요청 허용 |
| `maxAge` | `number` | — | Preflight 캐시 시간(초) |
| `preflightContinue` | `boolean` | `false` | Preflight 응답을 직접 처리할지 여부 |
| `optionsSuccessStatus` | `number` | `204` | Preflight 성공 응답 코드 |

### origin 설정 방법

```typescript
// 1. 단일 출처
origin: 'http://localhost:5173'

// 2. 여러 출처 배열
origin: ['http://localhost:5173', 'https://my-app.com']

// 3. 정규식 (서브도메인 전체 허용)
origin: /\.my-domain\.com$/

// 4. 함수로 동적 결정
origin: (requestOrigin, callback) => {
  const allowedOrigins = ['http://localhost:5173', 'https://my-app.com'];
  if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
    callback(null, true);  // 허용
  } else {
    callback(new Error('Not allowed by CORS'));  // 차단
  }
}
```

### maxAge로 Preflight 최적화

매 요청마다 Preflight가 발생하면 네트워크 비용이 두 배가 된다. `maxAge`를 설정하면 브라우저가 Preflight 결과를 캐시해서 재요청을 생략한다.

```typescript
app.enableCors({
  maxAge: 86400, // 24시간 동안 Preflight 캐시
});
```

---

## 8. 자주 발생하는 에러 메시지 해석

### ① Access-Control-Allow-Origin 헤더 없음

```
Access to fetch at 'http://localhost:3000/users' from origin 'http://127.0.0.1:5500'
has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**원인:** 서버에 CORS 설정이 없거나 서버가 꺼져 있다.  
**해결:** `app.enableCors()` 추가 또는 서버 실행 확인.

---

### ② origin이 허용 목록에 없음

```
Access to fetch at 'http://localhost:3000/users' from origin 'http://127.0.0.1:5500'
has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173'
that is not equal to the supplied origin.
```

**원인:** `origin` 옵션에 현재 요청 출처가 포함되어 있지 않다.  
**해결:** `origin` 배열에 `http://127.0.0.1:5500` 추가.

---

### ③ Preflight가 허용되지 않음

```
Access to fetch at 'http://localhost:3000/users' from origin 'http://127.0.0.1:5500'
has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**원인:** 서버가 `OPTIONS` 요청을 처리하지 못하고 있다. `app.enableCors()`가 없거나 위치가 잘못됐다.  
**해결:** `app.enableCors()`를 `app.listen()` **이전**에 위치시켜야 한다.

---

### ④ credentials와 와일드카드 충돌

```
Access to fetch at 'http://localhost:3000/auth/me' from origin 'http://localhost:5173'
has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Origin' header in the response must not be
the wildcard '*' when the request's credentials mode is 'include'.
```

**원인:** `credentials: true`로 요청하면서 서버의 `origin`이 `'*'`이다.  
**해결:** `origin`을 명시적 출처로 변경.

---

## 9. 개발 vs 프로덕션 설정

| 환경 | 권장 설정 | 이유 |
|------|-----------|------|
| 개발 | `enableCors()` (모든 출처) | 로컬 포트가 자주 바뀌므로 편의 우선 |
| 프로덕션 | `origin`을 명시적으로 지정 | 허가되지 않은 출처의 요청 차단 |

```typescript
// 환경에 따라 다르게 설정
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL          // 환경변수로 관리
    : true,                             // 개발 환경: 요청 Origin을 그대로 반영 (credentials와 함께 사용 가능)
  credentials: true,
});
```

> **팁:** 프로덕션에서 `FRONTEND_URL` 같은 환경변수로 출처를 관리하면 배포 환경마다 코드 수정 없이 유연하게 대응할 수 있다. 환경 변수 관리는 [챕터 11 - Configuration](../11-configuration.md)에서 다룬다.

---

## 10. CORS의 한계 — 브라우저 전용 보안

CORS는 **브라우저**가 강제하는 보안 정책이다. 서버 자체를 보호하는 것이 아니다.

```
브라우저 요청   → CORS 정책 적용 O  (차단 가능)
curl 요청       → CORS 정책 적용 X  (서버가 응답함)
서버 간 요청    → CORS 정책 적용 X  (서버가 응답함)
Postman 요청    → CORS 정책 적용 X  (서버가 응답함)
```

즉, CORS를 설정하지 않아도 `curl`이나 서버 간 통신으로는 API에 접근할 수 있다. **진짜 인증/인가 보안은 JWT, Guard, Role 기반 접근 제어 등 서버 측 로직으로 처리해야 한다.**

> **CORS의 역할:** "어떤 출처의 브라우저 스크립트가 이 서버의 응답을 읽을 수 있는가"를 제어하는 것이지, 요청 자체를 막는 것이 아니다.
