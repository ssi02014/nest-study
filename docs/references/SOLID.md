# SOLID 원칙 레퍼런스

이 문서는 **SOLID 원칙**을 독립적으로 이해할 수 있도록 작성된 참고 문서입니다.
각 원칙마다 무엇인지, 왜 중요한지, 일반적인 TypeScript 예제와 함께 설명합니다.

> **참고:** NestJS 공식 문서는 Provider와 DI를 설명하면서 SOLID 원칙을 따르는 것을 **강력히 권장**합니다. 각 원칙이 NestJS에서 어떻게 적용되는지는 [7. NestJS에서의 SOLID 요약](#7-nestjs에서의-solid-요약)에서 정리합니다.

---

## 목차

1. [SOLID란?](#1-solid란)
2. [S — Single Responsibility (단일 책임 원칙)](#2-s--single-responsibility-단일-책임-원칙)
3. [O — Open/Closed (개방/폐쇄 원칙)](#3-o--openclosed-개방폐쇄-원칙)
4. [L — Liskov Substitution (리스코프 치환 원칙)](#4-l--liskov-substitution-리스코프-치환-원칙)
5. [I — Interface Segregation (인터페이스 분리 원칙)](#5-i--interface-segregation-인터페이스-분리-원칙)
6. [D — Dependency Inversion (의존성 역전 원칙)](#6-d--dependency-inversion-의존성-역전-원칙)
7. [NestJS에서의 SOLID 요약](#7-nestjs에서의-solid-요약)

---

## 1. SOLID란?

**SOLID**는 로버트 C. 마틴(Robert C. Martin)이 정리한 객체 지향 설계의 5가지 핵심 원칙의 앞글자를 딴 약어다.

| 글자 | 원칙                  | 한국어               |
| ---- | --------------------- | -------------------- |
| S    | Single Responsibility | 단일 책임 원칙       |
| O    | Open/Closed           | 개방/폐쇄 원칙       |
| L    | Liskov Substitution   | 리스코프 치환 원칙   |
| I    | Interface Segregation | 인터페이스 분리 원칙 |
| D    | Dependency Inversion  | 의존성 역전 원칙     |

이 원칙들은 코드의 **유지보수성**, **확장성**, **테스트 용이성**을 높이기 위한 가이드라인이다.

---

## 2. S — Single Responsibility (단일 책임 원칙)

### 무엇인가

> 클래스는 **하나의 책임**만 가져야 하며, **변경의 이유가 하나**여야 한다.

하나의 클래스가 여러 역할을 담당하면, 한 역할의 변경이 다른 역할에 영향을 미칠 수 있다.

### 왜 중요한가

- 책임이 분리되면 변경 범위가 좁아져 **버그 발생 확률이 줄어든다**
- 클래스가 작고 명확해져 **이해하기 쉽다**
- **테스트 코드 작성**이 간편해진다

### 예제

```typescript
// ❌ 위반 — 하나의 클래스가 여러 책임을 가진다
class UserManager {
  createUser(name: string, email: string) {
    // 1. 유효성 검사 (검증 책임)
    if (!email.includes('@')) throw new Error('유효하지 않은 이메일');

    // 2. 사용자 저장 (데이터 접근 책임)
    const user = { id: Date.now(), name, email };
    database.save(user);

    // 3. 환영 이메일 발송 (알림 책임)
    emailClient.send(email, `환영합니다, ${name}님!`);

    return user;
  }
}
```

```typescript
// ✅ 준수 — 책임별로 클래스를 분리한다
class UserValidator {
  validate(email: string): void {
    if (!email.includes('@')) throw new Error('유효하지 않은 이메일');
  }
}

class UserRepository {
  save(name: string, email: string) {
    const user = { id: Date.now(), name, email };
    database.save(user);
    return user;
  }
}

class UserNotifier {
  sendWelcome(email: string, name: string): void {
    emailClient.send(email, `환영합니다, ${name}님!`);
  }
}

class UserService {
  constructor(
    private validator: UserValidator,
    private repository: UserRepository,
    private notifier: UserNotifier
  ) {}

  createUser(name: string, email: string) {
    this.validator.validate(email);
    const user = this.repository.save(name, email);
    this.notifier.sendWelcome(email, name);
    return user;
  }
}
```

> **팁:** "이 클래스가 변경되어야 하는 이유가 2개 이상인가?"라고 자문해보자. 이메일 템플릿이 바뀔 때와 DB 스키마가 바뀔 때 같은 클래스를 수정해야 한다면 SRP를 위반한 것이다.

---

## 3. O — Open/Closed (개방/폐쇄 원칙)

### 무엇인가

> 소프트웨어 엔티티(클래스, 모듈, 함수)는 **확장에는 열려있고, 수정에는 닫혀있어야** 한다.

기존 코드를 수정하지 않고도 새로운 기능을 추가할 수 있어야 한다.

### 왜 중요한가

- 기존에 잘 동작하는 코드를 **건드리지 않으므로 안전하다**
- 새로운 요구사항을 **확장으로 대응**할 수 있다

### 예제

```typescript
// ❌ 위반 — 새 할인 유형이 추가될 때마다 기존 코드를 수정해야 한다
class DiscountCalculator {
  calculate(type: string, price: number): number {
    if (type === 'percent') {
      return price * 0.9;
    } else if (type === 'fixed') {
      return price - 1000;
    } else if (type === 'vip') {
      // 새 유형 추가 → 기존 코드 수정 필요!
      return price * 0.7;
    }
    return price;
  }
}
```

```typescript
// ✅ 준수 — 인터페이스를 정의하고 구현체를 추가하는 방식으로 확장한다
interface DiscountStrategy {
  apply(price: number): number;
}

class PercentDiscount implements DiscountStrategy {
  apply(price: number): number {
    return price * 0.9;
  }
}

class FixedDiscount implements DiscountStrategy {
  apply(price: number): number {
    return price - 1000;
  }
}

// 새 할인 유형 추가 — 기존 코드를 수정하지 않고 새 클래스만 만든다
class VipDiscount implements DiscountStrategy {
  apply(price: number): number {
    return price * 0.7;
  }
}

class DiscountCalculator {
  constructor(private strategy: DiscountStrategy) {}

  calculate(price: number): number {
    return this.strategy.apply(price);
  }
}

// 사용
const calculator = new DiscountCalculator(new VipDiscount());
console.log(calculator.calculate(10000)); // 7000
```

> **팁:** `if/else`나 `switch`로 타입을 분기하는 코드가 늘어난다면, 인터페이스 + 구현체 패턴(전략 패턴)으로 리팩토링할 시점이다.

---

## 4. L — Liskov Substitution (리스코프 치환 원칙)

### 무엇인가

> 자식 클래스는 **부모 클래스를 대체해도 프로그램이 정상 동작**해야 한다.

부모 타입을 사용하는 곳에 자식 타입을 넣어도 기대한 대로 동작해야 한다는 뜻이다.

### 왜 중요한가

- 다형성을 **안전하게** 사용할 수 있다
- 인터페이스 기반 설계에서 구현체를 **자유롭게 교체**할 수 있다

### 예제

```typescript
// ❌ 위반 — 자식 클래스가 부모의 계약을 깨뜨린다
class Rectangle {
  constructor(
    protected width: number,
    protected height: number
  ) {}

  setWidth(w: number): void {
    this.width = w;
  }

  setHeight(h: number): void {
    this.height = h;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  // 정사각형이므로 width를 바꾸면 height도 바꾼다
  setWidth(w: number): void {
    this.width = w;
    this.height = w; // ← 부모의 동작과 다르다!
  }

  setHeight(h: number): void {
    this.width = h;
    this.height = h;
  }
}

function printArea(rect: Rectangle) {
  rect.setWidth(5);
  rect.setHeight(4);
  // Rectangle이면 20을 기대하지만, Square이면 16이 나온다!
  console.log(rect.getArea());
}

printArea(new Rectangle(0, 0)); // 20 ✅
printArea(new Square(0, 0)); // 16 ❌ — 기대와 다르다
```

```typescript
// ✅ 준수 — 공통 인터페이스로 분리하고 각각 독립적으로 구현한다
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}

  getArea(): number {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}

  getArea(): number {
    return this.side * this.side;
  }
}

function printArea(shape: Shape) {
  console.log(shape.getArea()); // 어떤 Shape이든 안전하게 동작한다
}

printArea(new Rectangle(5, 4)); // 20
printArea(new Square(5)); // 25
```

> **주의:** "A **is-a** B" 관계가 성립해도 자식이 부모의 메서드 계약(사전조건, 사후조건)을 깨뜨리면 LSP 위반이다. 상속보다 **인터페이스 기반 설계**가 더 안전한 이유다.

---

## 5. I — Interface Segregation (인터페이스 분리 원칙)

### 무엇인가

> 클라이언트는 **자신이 사용하지 않는 인터페이스에 의존하지 않아야** 한다.

하나의 거대한 인터페이스보다 역할별로 작은 인터페이스 여러 개로 분리하는 것이 좋다.

### 왜 중요한가

- 필요한 기능만 의존하므로 **결합도가 낮아진다**
- 인터페이스 변경 시 **영향 범위가 최소화**된다

### 예제

```typescript
// ❌ 위반 — 모든 동물이 fly()를 구현해야 한다
interface Animal {
  eat(): void;
  walk(): void;
  fly(): void;
}

class Dog implements Animal {
  eat() {
    console.log('먹는다');
  }
  walk() {
    console.log('걷는다');
  }
  fly() {
    // 개는 날 수 없는데 구현을 강제당한다!
    throw new Error('개는 날 수 없습니다');
  }
}
```

```typescript
// ✅ 준수 — 역할별로 인터페이스를 분리한다
interface Eatable {
  eat(): void;
}

interface Walkable {
  walk(): void;
}

interface Flyable {
  fly(): void;
}

// 개: 먹고 걸을 수 있다
class Dog implements Eatable, Walkable {
  eat() {
    console.log('먹는다');
  }
  walk() {
    console.log('걷는다');
  }
}

// 독수리: 먹고 걷고 날 수 있다
class Eagle implements Eatable, Walkable, Flyable {
  eat() {
    console.log('먹는다');
  }
  walk() {
    console.log('걷는다');
  }
  fly() {
    console.log('난다');
  }
}

// 날 수 있는 동물만 받는 함수
function makeFly(animal: Flyable) {
  animal.fly();
}

makeFly(new Eagle()); // ✅
// makeFly(new Dog()); // ❌ 컴파일 에러 — Dog은 Flyable이 아니다
```

> **팁:** 인터페이스를 설계할 때 "이 인터페이스를 구현하는 모든 클래스가 모든 메서드를 의미 있게 사용하는가?"를 자문해보자. 빈 구현이나 예외를 던지는 메서드가 있다면 분리가 필요하다.

---

## 6. D — Dependency Inversion (의존성 역전 원칙)

### 무엇인가

> 상위 모듈은 하위 모듈에 의존하지 않아야 한다. **둘 다 추상(인터페이스)에 의존**해야 한다.

구체적인 클래스가 아닌 추상(인터페이스)에 의존하면 구현체를 자유롭게 교체할 수 있다.

### 왜 중요한가

- **구현체 교체가 쉽다** (테스트 시 Mock 주입 등)
- 상위 모듈과 하위 모듈 간 **결합도가 낮아진다**

### 예제

```typescript
// ❌ 위반 — 상위 모듈(OrderService)이 하위 모듈(MySQLDatabase)에 직접 의존
class MySQLDatabase {
  save(data: string): void {
    console.log(`MySQL에 저장: ${data}`);
  }
}

class OrderService {
  private db: MySQLDatabase;

  constructor() {
    this.db = new MySQLDatabase(); // 직접 생성 — 강한 결합
  }

  placeOrder(order: string): void {
    this.db.save(order);
  }
}

// DB를 PostgreSQL로 바꾸려면? OrderService 코드를 수정해야 한다!
```

```typescript
// ✅ 준수 — 인터페이스(추상)에 의존하고, 구현체는 외부에서 주입받는다
interface Database {
  save(data: string): void;
}

class MySQLDatabase implements Database {
  save(data: string): void {
    console.log(`MySQL에 저장: ${data}`);
  }
}

class PostgreSQLDatabase implements Database {
  save(data: string): void {
    console.log(`PostgreSQL에 저장: ${data}`);
  }
}

class OrderService {
  // 구체 클래스가 아닌 인터페이스에 의존한다
  constructor(private db: Database) {}

  placeOrder(order: string): void {
    this.db.save(order);
  }
}

// 사용 — 구현체를 자유롭게 교체할 수 있다
const mysqlOrder = new OrderService(new MySQLDatabase());
const postgresOrder = new OrderService(new PostgreSQLDatabase());

// 테스트 — Mock 객체를 쉽게 주입할 수 있다
class MockDatabase implements Database {
  savedData: string[] = [];
  save(data: string): void {
    this.savedData.push(data);
  }
}

const mockDb = new MockDatabase();
const testOrder = new OrderService(mockDb);
testOrder.placeOrder('테스트 주문');
console.log(mockDb.savedData); // ['테스트 주문']
```

> **팁:** 핵심은 `new`를 직접 쓰지 않는 것이다. 생성자에서 `new ConcreteClass()`를 호출하는 순간 그 구체 클래스에 강하게 결합된다. 외부에서 인터페이스 타입으로 주입받으면 결합이 느슨해진다.

---

## 7. NestJS에서의 SOLID 요약

NestJS의 Provider + DI 구조는 SOLID 원칙을 자연스럽게 따르도록 설계되어 있다.

| 원칙                          | NestJS에서의 적용                                               |
| ----------------------------- | --------------------------------------------------------------- |
| **S** — 단일 책임 (SRP)       | Controller는 라우팅만, Service는 비즈니스 로직만 담당           |
| **O** — 개방/폐쇄 (OCP)       | 커스텀 프로바이더(`useClass`)로 기존 코드 수정 없이 구현체 교체 |
| **L** — 리스코프 치환 (LSP)   | 인터페이스를 구현한 클래스는 언제든 교체 가능                   |
| **I** — 인터페이스 분리 (ISP) | 모듈의 `exports`로 외부에 공개하는 Provider를 최소화            |
| **D** — 의존성 역전 (DIP)     | IoC 컨테이너가 토큰/인터페이스 기반으로 의존성을 자동 주입      |

### SOLID와 NestJS 구조의 관계

```
Client Request
    │
    ▼
 Controller  ── SRP: 라우팅만 담당
    │
    ▼
  Service    ── SRP: 비즈니스 로직만
    │              DIP: 인터페이스에 의존
    ▼
 Repository  ── OCP: 구현체 교체로 확장
                 LSP: 인터페이스 구현체는 대체 가능
```

> **참고:** SOLID는 "반드시 지켜야 하는 규칙"이 아닌 **설계 가이드라인**이다. 과도하게 적용하면 오히려 복잡성이 증가할 수 있다. 프로젝트의 규모와 상황에 맞게 적절히 적용하자.
