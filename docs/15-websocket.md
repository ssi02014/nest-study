# 챕터 15 - WebSocket

## 목차

1. [WebSocket이란?](#1-websocket이란)
2. [HTTP vs WebSocket 비교](#2-http-vs-websocket-비교)
3. [NestJS Gateway 핵심 개념](#3-nestjs-gateway-핵심-개념)
4. [라이프사이클 훅](#4-라이프사이클-훅)
5. [네임스페이스와 룸(Room)](#5-네임스페이스와-룸room)
6. [기본 예제: 에코 Gateway](#6-기본-예제-에코-gateway)
7. [기본 예제: 메시지 브로드캐스트](#7-기본-예제-메시지-브로드캐스트)
8. [기본 예제: Room 활용](#8-기본-예제-room-활용)
9. [블로그 API 적용: 실시간 댓글 알림](#9-블로그-api-적용-실시간-댓글-알림)

---

## 1. WebSocket이란?

**WebSocket**은 클라이언트와 서버 간에 **양방향(Full-Duplex) 통신**을 가능하게 하는 프로토콜이다. 일반적인 HTTP 통신은 클라이언트가 요청을 보내야만 서버가 응답할 수 있지만, WebSocket은 한 번 연결이 수립되면 서버와 클라이언트가 자유롭게 데이터를 주고받을 수 있다.

WebSocket이 적합한 사용 사례:

- **실시간 채팅**: 메시지를 즉시 주고받아야 하는 경우
- **실시간 알림**: 서버에서 클라이언트로 즉시 알림을 보내야 하는 경우 (댓글 알림, 좋아요 알림 등)
- **실시간 대시보드**: 데이터가 변경될 때마다 화면을 갱신해야 하는 경우
- **온라인 게임**: 빠른 양방향 통신이 필요한 경우

WebSocket 연결 흐름:

```
1. 클라이언트 → 서버: HTTP Upgrade 요청
2. 서버 → 클라이언트: 101 Switching Protocols 응답
3. 양방향 통신 시작 (ws:// 프로토콜)
4. 어느 한쪽이 연결을 종료할 때까지 유지
```

---

## 2. HTTP vs WebSocket 비교

| 구분 | HTTP | WebSocket |
|------|------|-----------|
| 통신 방식 | 단방향 (요청-응답) | 양방향 (Full-Duplex) |
| 연결 유지 | 요청마다 연결/해제 반복 | 한 번 연결 후 지속 유지 |
| 프로토콜 | `http://` / `https://` | `ws://` / `wss://` |
| 오버헤드 | 매 요청마다 헤더 전송 | 최초 핸드셰이크 이후 헤더 없음 |
| 서버 푸시 | 불가능 (폴링 방식 필요) | 가능 (서버가 자유롭게 전송) |
| 적합한 경우 | REST API, 일반적인 웹 요청 | 실시간 통신, 채팅, 알림 |

> **Tip**: 블로그 API에서 "새 댓글이 달렸습니다" 같은 알림을 구현한다고 생각해보자. HTTP만 사용하면 클라이언트가 주기적으로 서버에 "새 댓글 있어요?" 하고 물어봐야 한다(폴링). WebSocket을 사용하면 댓글이 작성되는 순간 서버가 바로 클라이언트에게 알려줄 수 있다.

---

## 3. NestJS Gateway 핵심 개념

NestJS에서 WebSocket 서버를 구현할 때는 **Gateway**라는 개념을 사용한다. Gateway는 `@WebSocketGateway()` 데코레이터가 붙은 클래스로, WebSocket 이벤트를 처리하는 역할을 한다. Gateway는 NestJS의 Provider로 취급되므로, DI(의존성 주입)를 통해 서비스를 주입받을 수 있다.

### @WebSocketGateway

Gateway 클래스를 선언하는 데코레이터다.

```typescript
// echo.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class EchoGateway {
  @WebSocketServer()
  server: Server;
}
```

옵션을 전달하여 포트, 네임스페이스, CORS 등을 설정할 수 있다:

```typescript
// echo.gateway.ts
@WebSocketGateway(3001, {
  namespace: 'events',
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class EchoGateway {}
```

| 옵션 | 설명 |
|------|------|
| 첫 번째 인자 (포트) | WebSocket이 수신할 포트. 생략하면 HTTP 서버와 동일한 포트를 사용한다 |
| `namespace` | 네임스페이스를 지정한다 |
| `cors` | CORS 설정을 지정한다 |
| `transports` | 전송 방식을 지정한다 (`websocket`, `polling` 등) |

### @SubscribeMessage

특정 이벤트를 구독하여, 해당 이벤트가 발생했을 때 메서드를 실행한다. REST API의 `@Get()`, `@Post()` 같은 역할이라고 생각하면 이해하기 쉽다.

```typescript
// echo.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class EchoGateway {
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(`클라이언트 ${client.id}로부터 메시지 수신: ${data}`);
    return data; // 요청한 클라이언트에게 응답 반환
  }
}
```

### 매개변수 데코레이터

| 데코레이터 | 설명 |
|-------------|------|
| `@MessageBody()` | 클라이언트가 보낸 메시지 데이터를 추출한다 |
| `@ConnectedSocket()` | 현재 연결된 소켓 인스턴스를 주입한다 |

### @WebSocketServer

기본 Socket.IO 서버 인스턴스에 접근할 수 있게 해준다. 이를 통해 모든 클라이언트에게 메시지를 브로드캐스트하거나, 특정 룸에 메시지를 보내는 등의 작업이 가능하다.

```typescript
// notification.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // 모든 클라이언트에게 알림 전송
  sendNotificationToAll(message: string) {
    this.server.emit('notification', { message, timestamp: new Date() });
  }

  // 특정 룸에 알림 전송
  sendNotificationToRoom(room: string, message: string) {
    this.server.to(room).emit('notification', { message, timestamp: new Date() });
  }
}
```

### 응답 방식 3가지

**1. return 값으로 응답 (요청한 클라이언트에게만)**

```typescript
@SubscribeMessage('message')
handleMessage(@MessageBody() data: string) {
  return { event: 'message', data: `서버 응답: ${data}` };
}
```

**2. server.emit()으로 브로드캐스트 (모든 클라이언트에게)**

```typescript
@SubscribeMessage('message')
handleMessage(@MessageBody() data: string) {
  this.server.emit('message', data); // 모든 클라이언트에게 전송
}
```

**3. client.emit()으로 특정 클라이언트에게만 전송**

```typescript
@SubscribeMessage('message')
handleMessage(
  @MessageBody() data: string,
  @ConnectedSocket() client: Socket,
) {
  client.emit('message', `개인 메시지: ${data}`);
}
```

---

## 4. 라이프사이클 훅

NestJS는 Gateway의 라이프사이클을 관리하기 위한 세 가지 인터페이스를 제공한다. 이 인터페이스들을 구현하면 Gateway 초기화, 클라이언트 연결/해제 시점에 원하는 로직을 실행할 수 있다.

| 인터페이스 | 메서드 | 호출 시점 |
|-------------|--------|-----------|
| `OnGatewayInit` | `afterInit(server: Server)` | Gateway가 초기화된 후 |
| `OnGatewayConnection` | `handleConnection(client: Socket, ...args)` | 클라이언트가 연결되었을 때 |
| `OnGatewayDisconnect` | `handleDisconnect(client: Socket)` | 클라이언트가 연결을 해제했을 때 |

```typescript
// events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway 초기화 완료');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`클라이언트 연결: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`클라이언트 연결 해제: ${client.id}`);
  }
}
```

> **Tip**: `OnGatewayConnection`의 `handleConnection`은 REST API의 미들웨어와 비슷한 역할을 한다. 클라이언트가 처음 연결될 때 인증 토큰을 확인하거나, 연결 로그를 남기는 데 활용할 수 있다.

---

## 5. 네임스페이스와 룸(Room)

### 네임스페이스 (Namespace)

네임스페이스는 하나의 WebSocket 서버 안에서 **논리적으로 분리된 통신 채널**이다. 서로 다른 네임스페이스끼리는 이벤트가 공유되지 않는다.

```typescript
// admin.gateway.ts - ws://localhost:3000/admin 으로 접속
@WebSocketGateway({ namespace: 'admin' })
export class AdminGateway {
  @SubscribeMessage('adminEvent')
  handleAdminEvent(@MessageBody() data: string) {
    return { event: 'adminEvent', data: `관리자 이벤트: ${data}` };
  }
}
```

```typescript
// user.gateway.ts - ws://localhost:3000/user 로 접속
@WebSocketGateway({ namespace: 'user' })
export class UserGateway {
  @SubscribeMessage('userEvent')
  handleUserEvent(@MessageBody() data: string) {
    return { event: 'userEvent', data: `사용자 이벤트: ${data}` };
  }
}
```

### 룸 (Room)

룸은 네임스페이스 안에서 클라이언트를 **그룹별로 분류**하는 기능이다. 특정 룸에 속한 클라이언트들에게만 메시지를 전송할 수 있다.

이해를 돕기 위해 비유하면:
- **네임스페이스** = 건물 (아파트, 오피스텔 등 완전히 다른 공간)
- **룸** = 건물 안의 방 (같은 건물이지만 방마다 다른 사람들이 있음)

```
네임스페이스: /blog
  ├── 룸: post-1   (게시글 1번을 보고 있는 사용자들)
  ├── 룸: post-2   (게시글 2번을 보고 있는 사용자들)
  └── 룸: post-42  (게시글 42번을 보고 있는 사용자들)
```

### 룸 관련 주요 메서드

```typescript
// 룸 입장
client.join('room-name');

// 룸 퇴장
client.leave('room-name');

// 본인을 제외한 룸 전체에 전송
client.to('room-name').emit('event', data);

// 본인을 포함한 룸 전체에 전송 (서버 인스턴스 사용)
this.server.to('room-name').emit('event', data);

// 여러 룸에 동시 전송
this.server.to('room-a').to('room-b').emit('event', data);

// 룸에 속한 소켓 목록 가져오기
const sockets = await this.server.in('room-name').fetchSockets();
```

---

## 6. 기본 예제: 에코 Gateway

개념을 이해했으니, 가장 간단한 예제부터 시작하자. 클라이언트가 보낸 메시지를 그대로 돌려주는 에코(Echo) Gateway다.

### 패키지 설치

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install -D @types/socket.io
```

### 에코 Gateway

```typescript
// src/echo/echo.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EchoGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('EchoGateway');

  handleConnection(client: Socket) {
    this.logger.log(`클라이언트 연결: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`클라이언트 연결 해제: ${client.id}`);
  }

  @SubscribeMessage('echo')
  handleEcho(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`수신: ${data}`);
    // 보낸 클라이언트에게 그대로 돌려준다
    return { event: 'echo', data: `에코: ${data}` };
  }
}
```

### 모듈 등록

```typescript
// src/echo/echo.module.ts
import { Module } from '@nestjs/common';
import { EchoGateway } from './echo.gateway';

@Module({
  providers: [EchoGateway],
})
export class EchoModule {}
```

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { EchoModule } from './echo/echo.module';

@Module({
  imports: [EchoModule],
})
export class AppModule {}
```

### 테스트 (브라우저 콘솔)

서버를 실행한 후 브라우저의 개발자 도구 콘솔에서 다음 코드로 테스트할 수 있다:

```javascript
// 브라우저 콘솔에서 실행
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
document.head.appendChild(script);

// 스크립트 로드 후 실행
setTimeout(() => {
  const socket = io('http://localhost:3000');

  socket.on('connect', () => {
    console.log('연결됨:', socket.id);
    socket.emit('echo', '안녕하세요!', (response) => {
      console.log('응답:', response);
    });
  });

  socket.on('echo', (data) => {
    console.log('에코 수신:', data);
  });
}, 1000);
```

---

## 7. 기본 예제: 메시지 브로드캐스트

모든 연결된 클라이언트에게 메시지를 전송하는 브로드캐스트 예제다.

```typescript
// src/broadcast/broadcast.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class BroadcastGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('BroadcastGateway');

  handleConnection(client: Socket) {
    this.logger.log(`클라이언트 연결: ${client.id}`);
    // 새 클라이언트 연결 시, 모든 클라이언트에게 현재 접속자 수 알림
    const count = this.server.engine.clientsCount;
    this.server.emit('users:count', { count });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`클라이언트 연결 해제: ${client.id}`);
    const count = this.server.engine.clientsCount;
    this.server.emit('users:count', { count });
  }

  // 모든 클라이언트에게 공지 전송
  @SubscribeMessage('announce')
  handleAnnounce(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    // server.emit() → 본인 포함 전체
    this.server.emit('announcement', {
      sender: client.id,
      message,
      timestamp: new Date(),
    });
  }

  // 본인을 제외한 나머지 클라이언트에게 전송
  @SubscribeMessage('whisperAll')
  handleWhisperAll(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ) {
    // client.broadcast.emit() → 본인 제외 전체
    client.broadcast.emit('whisper', {
      sender: client.id,
      message,
    });
  }
}
```

> **Tip**: `this.server.emit()`은 본인 포함 전체에게, `client.broadcast.emit()`은 본인 제외 전체에게 전송한다. 이 차이를 잘 기억해두자.

---

## 8. 기본 예제: Room 활용

Room은 이 챕터의 블로그 API 적용에서 핵심이 되는 개념이다. 게시글별로 Room을 만들어 해당 게시글을 보고 있는 사용자들에게만 알림을 보내는 방식이다.

```typescript
// src/room-example/room.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RoomGateway {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RoomGateway');

  // 룸 입장
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(roomName);
    this.logger.log(`${client.id}가 ${roomName}에 입장`);

    // 해당 룸의 다른 사용자들에게 알림
    client.to(roomName).emit('userJoined', {
      userId: client.id,
      message: `${client.id}님이 입장했습니다.`,
    });

    return { event: 'joinedRoom', data: roomName };
  }

  // 룸 퇴장
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(roomName);
    this.logger.log(`${client.id}가 ${roomName}에서 퇴장`);

    client.to(roomName).emit('userLeft', {
      userId: client.id,
      message: `${client.id}님이 퇴장했습니다.`,
    });

    return { event: 'leftRoom', data: roomName };
  }

  // 특정 룸에 메시지 전송
  @SubscribeMessage('messageToRoom')
  handleMessageToRoom(
    @MessageBody() payload: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 본인 포함 해당 룸 전체에 전송
    this.server.to(payload.room).emit('roomMessage', {
      sender: client.id,
      message: payload.message,
      timestamp: new Date(),
    });
  }
}
```

---

## 9. 블로그 API 적용: 실시간 댓글 알림

이제 지금까지 배운 WebSocket 개념을 블로그 API에 적용한다. 이전 챕터에서 만든 Post(게시글)와 Comment(댓글) 기능에 **실시간 댓글 알림**을 추가한다.

구현할 기능:
1. 사용자가 게시글 상세 페이지에 접속하면 해당 게시글의 Room에 입장
2. 누군가 댓글을 작성하면, 같은 게시글을 보고 있는 모든 사용자에게 실시간 알림 전송
3. 페이지를 떠나면 Room에서 퇴장

### 패키지 설치

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install -D @types/socket.io
```

### 프로젝트 구조

```
src/
├── blog/
│   ├── blog.module.ts
│   ├── blog.gateway.ts           ← WebSocket Gateway (NEW)
│   ├── posts/
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   └── entities/
│   │       └── post.entity.ts
│   └── comments/
│       ├── comments.controller.ts
│       ├── comments.service.ts   ← Gateway 주입하여 알림 전송 (수정)
│       ├── dto/
│       │   └── create-comment.dto.ts
│       └── entities/
│           └── comment.entity.ts
├── public/
│   └── blog-test.html            ← 테스트용 HTML (NEW)
├── app.module.ts
└── main.ts
```

### 9-1. Post Entity

이전 챕터(TypeORM)에서 만든 Entity를 그대로 사용한다. 아직 만들지 않았다면 아래를 참고한다:

```typescript
// src/blog/posts/entities/post.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  author: string;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 9-2. Comment Entity

```typescript
// src/blog/comments/entities/comment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column()
  author: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post: Post;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 9-3. CreateCommentDto

```typescript
// src/blog/comments/dto/create-comment.dto.ts
import { IsString, IsNotEmpty, IsNumber, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsNumber()
  postId: number;
}
```

### 9-4. BlogGateway (핵심)

이 챕터의 핵심이다. 게시글 상세 페이지별로 Room을 만들어 관리한다.

```typescript
// src/blog/blog.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'blog',
  cors: {
    origin: '*',
  },
})
export class BlogGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('BlogGateway');

  afterInit(server: Server) {
    this.logger.log('Blog WebSocket Gateway 초기화 완료');
  }

  handleConnection(client: Socket) {
    this.logger.log(`클라이언트 연결: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`클라이언트 연결 해제: ${client.id}`);
  }

  /**
   * 게시글 상세 페이지 Room 입장
   * 클라이언트가 특정 게시글 페이지를 열면, 해당 게시글의 Room에 입장한다.
   * Room 이름: "post-{postId}" (예: "post-1", "post-42")
   */
  @SubscribeMessage('joinPostRoom')
  handleJoinPostRoom(
    @MessageBody() postId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `post-${postId}`;
    client.join(roomName);
    this.logger.log(`${client.id}가 ${roomName} Room에 입장`);

    return {
      event: 'joinedPostRoom',
      data: { postId, message: `게시글 ${postId}번 Room에 입장했습니다.` },
    };
  }

  /**
   * 게시글 상세 페이지 Room 퇴장
   * 클라이언트가 게시글 페이지를 떠나면, 해당 Room에서 퇴장한다.
   */
  @SubscribeMessage('leavePostRoom')
  handleLeavePostRoom(
    @MessageBody() postId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `post-${postId}`;
    client.leave(roomName);
    this.logger.log(`${client.id}가 ${roomName} Room에서 퇴장`);

    return {
      event: 'leftPostRoom',
      data: { postId, message: `게시글 ${postId}번 Room에서 퇴장했습니다.` },
    };
  }

  /**
   * 댓글 작성 시 해당 게시글 Room에 실시간 알림 전송
   * CommentsService에서 호출하는 메서드다. (서비스 → Gateway)
   */
  notifyNewComment(postId: number, comment: {
    id: number;
    content: string;
    author: string;
    createdAt: Date;
  }) {
    const roomName = `post-${postId}`;
    this.server.to(roomName).emit('newComment', {
      postId,
      comment,
      message: `${comment.author}님이 새 댓글을 작성했습니다.`,
    });
    this.logger.log(`게시글 ${postId}에 새 댓글 알림 전송`);
  }
}
```

> **핵심 포인트**: `notifyNewComment()` 메서드는 `@SubscribeMessage`가 아니다. 이 메서드는 클라이언트의 WebSocket 이벤트로 호출되는 것이 아니라, **CommentsService에서 직접 호출**하는 일반 메서드다. Gateway도 Provider이므로 다른 서비스에서 주입받아 사용할 수 있다.

### 9-5. CommentsService (Gateway 연동)

댓글을 생성할 때 BlogGateway의 `notifyNewComment()`를 호출하여 실시간 알림을 보낸다.

```typescript
// src/blog/comments/comments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post } from '../posts/entities/post.entity';
import { BlogGateway } from '../blog.gateway';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    // BlogGateway를 주입받는다
    private readonly blogGateway: BlogGateway,
  ) {}

  async create(dto: CreateCommentDto): Promise<Comment> {
    // 1. 게시글 존재 확인
    const post = await this.postRepository.findOne({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException(`게시글 ${dto.postId}을(를) 찾을 수 없습니다.`);
    }

    // 2. 댓글 저장
    const comment = this.commentRepository.create({
      content: dto.content,
      author: dto.author,
      post,
    });
    const savedComment = await this.commentRepository.save(comment);

    // 3. WebSocket으로 실시간 알림 전송
    this.blogGateway.notifyNewComment(dto.postId, {
      id: savedComment.id,
      content: savedComment.content,
      author: savedComment.author,
      createdAt: savedComment.createdAt,
    });

    return savedComment;
  }

  async findByPostId(postId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { post: { id: postId } },
      order: { createdAt: 'DESC' },
    });
  }
}
```

> **Tip**: 이 패턴이 WebSocket 활용의 핵심이다. REST API로 댓글을 생성하는 기존 흐름은 그대로 유지하면서, 생성 이후에 Gateway를 통해 실시간 알림만 추가한다. 기존 코드를 크게 바꾸지 않아도 된다.

### 9-6. CommentsController

```typescript
// src/blog/comments/comments.controller.ts
import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create({ ...dto, postId });
  }

  @Get()
  async findAll(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPostId(postId);
  }
}
```

### 9-7. BlogModule

BlogGateway를 모듈에 등록하고, CommentsService에서 사용할 수 있도록 설정한다.

```typescript
// src/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './posts/entities/post.entity';
import { Comment } from './comments/entities/comment.entity';
import { PostsService } from './posts/posts.service';
import { PostsController } from './posts/posts.controller';
import { CommentsService } from './comments/comments.service';
import { CommentsController } from './comments/comments.controller';
import { BlogGateway } from './blog.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment])],
  controllers: [PostsController, CommentsController],
  providers: [PostsService, CommentsService, BlogGateway],
})
export class BlogModule {}
```

### 9-8. main.ts (정적 파일 서빙 설정)

테스트용 HTML 파일을 서빙하기 위해 정적 파일 서빙을 추가한다.

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 정적 파일 서빙 (public 폴더)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 전역 ValidationPipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(3000);
  console.log('서버가 http://localhost:3000 에서 실행 중입니다.');
  console.log('테스트 페이지: http://localhost:3000/blog-test.html');
}
bootstrap();
```

### 9-9. 테스트용 HTML 페이지

실제로 WebSocket이 동작하는지 확인할 수 있는 간단한 테스트 페이지다. 프로젝트 루트에 `public` 폴더를 만들고 아래 파일을 생성한다.

```html
<!-- public/blog-test.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>블로그 실시간 댓글 알림 테스트</title>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
    h1 { color: #333; margin-bottom: 20px; }
    .container { max-width: 700px; margin: 0 auto; }

    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card h2 { color: #555; font-size: 16px; margin-bottom: 12px; }

    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: bold;
    }
    .status.connected { background: #d4edda; color: #155724; }
    .status.disconnected { background: #f8d7da; color: #721c24; }

    input, button {
      padding: 8px 14px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    input { width: 120px; }
    button {
      background: #4a90d9;
      color: white;
      border: none;
      cursor: pointer;
    }
    button:hover { background: #357abd; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    button.leave { background: #e74c3c; }
    button.leave:hover { background: #c0392b; }

    .controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    #log {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      font-family: 'Consolas', monospace;
      font-size: 13px;
      height: 300px;
      overflow-y: auto;
    }
    .log-entry { margin-bottom: 4px; }
    .log-time { color: #6a9955; }
    .log-event { color: #569cd6; }
    .log-info { color: #dcdcaa; }
    .log-error { color: #f44747; }

    .comment-form { display: flex; gap: 8px; flex-wrap: wrap; }
    .comment-form input[type="text"] { flex: 1; min-width: 200px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>블로그 실시간 댓글 알림 테스트</h1>

    <!-- 연결 상태 -->
    <div class="card">
      <h2>연결 상태</h2>
      <span id="status" class="status disconnected">연결 안됨</span>
    </div>

    <!-- Room 관리 -->
    <div class="card">
      <h2>게시글 Room 입장/퇴장</h2>
      <div class="controls">
        <label>게시글 ID:</label>
        <input type="number" id="postId" value="1" min="1" />
        <button id="joinBtn" onclick="joinRoom()">Room 입장</button>
        <button id="leaveBtn" class="leave" onclick="leaveRoom()">Room 퇴장</button>
      </div>
    </div>

    <!-- 댓글 작성 (REST API) -->
    <div class="card">
      <h2>댓글 작성 (REST API로 전송)</h2>
      <div class="comment-form">
        <input type="text" id="author" placeholder="작성자" value="테스터" />
        <input type="text" id="commentContent" placeholder="댓글 내용을 입력하세요" />
        <button onclick="postComment()">댓글 작성</button>
      </div>
    </div>

    <!-- 이벤트 로그 -->
    <div class="card">
      <h2>이벤트 로그</h2>
      <div id="log"></div>
    </div>
  </div>

  <script>
    // Socket.IO 클라이언트 - /blog 네임스페이스에 연결
    const socket = io('http://localhost:3000/blog');

    const statusEl = document.getElementById('status');
    const logEl = document.getElementById('log');

    // --- 로그 유틸 ---
    function addLog(event, message, type = 'info') {
      const time = new Date().toLocaleTimeString();
      const colorClass = type === 'error' ? 'log-error' : 'log-info';
      logEl.innerHTML += `<div class="log-entry">` +
        `<span class="log-time">[${time}]</span> ` +
        `<span class="log-event">${event}</span> ` +
        `<span class="${colorClass}">${message}</span>` +
        `</div>`;
      logEl.scrollTop = logEl.scrollHeight;
    }

    // --- 연결 이벤트 ---
    socket.on('connect', () => {
      statusEl.textContent = '연결됨 (ID: ' + socket.id + ')';
      statusEl.className = 'status connected';
      addLog('connect', `서버에 연결되었습니다. (ID: ${socket.id})`);
    });

    socket.on('disconnect', () => {
      statusEl.textContent = '연결 안됨';
      statusEl.className = 'status disconnected';
      addLog('disconnect', '서버와 연결이 끊어졌습니다.', 'error');
    });

    // --- 실시간 댓글 알림 수신 ---
    socket.on('newComment', (data) => {
      addLog('newComment',
        `[게시글 #${data.postId}] ${data.comment.author}: "${data.comment.content}"`
      );
    });

    // --- Room 입장 ---
    function joinRoom() {
      const postId = parseInt(document.getElementById('postId').value);
      socket.emit('joinPostRoom', postId, (response) => {
        addLog('joinPostRoom', response.data.message);
      });
    }

    // --- Room 퇴장 ---
    function leaveRoom() {
      const postId = parseInt(document.getElementById('postId').value);
      socket.emit('leavePostRoom', postId, (response) => {
        addLog('leavePostRoom', response.data.message);
      });
    }

    // --- 댓글 작성 (REST API) ---
    async function postComment() {
      const postId = document.getElementById('postId').value;
      const author = document.getElementById('author').value;
      const content = document.getElementById('commentContent').value;

      if (!content) {
        addLog('error', '댓글 내용을 입력하세요.', 'error');
        return;
      }

      try {
        const response = await fetch(`/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, author, postId: parseInt(postId) }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        addLog('REST API', `댓글 작성 성공 (ID: ${result.id})`);
        document.getElementById('commentContent').value = '';
      } catch (err) {
        addLog('REST API', `댓글 작성 실패: ${err.message}`, 'error');
      }
    }
  </script>
</body>
</html>
```

### 테스트 방법

1. 서버를 실행한다:

```bash
npm run start:dev
```

2. 브라우저 탭을 **2개** 열고 `http://localhost:3000/blog-test.html`에 접속한다.

3. 두 탭 모두 같은 게시글 번호(예: 1)로 **Room 입장** 버튼을 클릭한다.

4. 한쪽 탭에서 댓글을 작성하면, **양쪽 탭 모두** 이벤트 로그에 실시간으로 새 댓글 알림이 표시된다.

```
[14:30:15] newComment [게시글 #1] 테스터: "첫 번째 댓글입니다!"
```

5. 한쪽 탭에서 **Room 퇴장** 버튼을 클릭한 뒤 다시 댓글을 작성하면, 퇴장한 탭에는 알림이 오지 않는다.

### 전체 동작 흐름 정리

```
[사용자 A: 게시글 1번 페이지 접속]
  브라우저 → WebSocket 연결 (io('/blog'))
  브라우저 → joinPostRoom(1) → BlogGateway
  BlogGateway → client.join('post-1')

[사용자 B: 게시글 1번 페이지 접속]
  브라우저 → WebSocket 연결 (io('/blog'))
  브라우저 → joinPostRoom(1) → BlogGateway
  BlogGateway → client.join('post-1')

[사용자 A: 댓글 작성]
  브라우저 → REST POST /posts/1/comments → CommentsController
  CommentsController → CommentsService.create()
  CommentsService → DB에 댓글 저장
  CommentsService → BlogGateway.notifyNewComment(1, comment)
  BlogGateway → server.to('post-1').emit('newComment', ...)
  사용자 A, B 모두 실시간으로 'newComment' 이벤트 수신

[사용자 B: 페이지 이탈]
  브라우저 → leavePostRoom(1) → BlogGateway
  BlogGateway → client.leave('post-1')
  이후 게시글 1번에 새 댓글이 달려도 사용자 B에게는 알림이 가지 않음
```

> **Tip**: 이 구조에서 REST API와 WebSocket은 각자의 역할을 한다. REST API는 데이터를 **저장**(Create)하고, WebSocket은 변경 사항을 **실시간 전파**(Notify)한다. 이 두 가지를 혼합하는 것이 실무에서 가장 흔한 WebSocket 활용 패턴이다.

---

## 마무리

이 챕터에서 학습한 내용을 정리하면:

| 개념 | 설명 |
|------|------|
| `@WebSocketGateway()` | WebSocket 서버(Gateway)를 선언하는 데코레이터 |
| `@SubscribeMessage()` | 클라이언트 이벤트를 구독하는 데코레이터 |
| `@WebSocketServer()` | Socket.IO Server 인스턴스에 접근하는 데코레이터 |
| `@MessageBody()` | 메시지 데이터를 추출하는 매개변수 데코레이터 |
| `@ConnectedSocket()` | 소켓 인스턴스를 주입하는 매개변수 데코레이터 |
| `OnGatewayInit` | Gateway 초기화 시 호출 |
| `OnGatewayConnection` | 클라이언트 연결 시 호출 |
| `OnGatewayDisconnect` | 클라이언트 연결 해제 시 호출 |
| 네임스페이스 | 논리적으로 분리된 통신 채널 |
| 룸 (Room) | 네임스페이스 안에서 클라이언트를 그룹별로 분류 |

블로그 API에 적용한 핵심 패턴:

1. **게시글별 Room**: `post-{id}` 형태의 Room으로 게시글 페이지 단위 그룹 관리
2. **서비스에서 Gateway 호출**: CommentsService에서 BlogGateway를 주입받아 `notifyNewComment()` 호출
3. **REST + WebSocket 혼합**: REST API로 데이터 저장, WebSocket으로 실시간 알림 전송

이 챕터를 마치면 **실시간 댓글 알림 기능이 완성**된다. 다음 챕터에서는 CQRS 패턴에 대해 알아본다.
