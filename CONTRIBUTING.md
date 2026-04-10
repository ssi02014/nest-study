# 기여 가이드 (Contributing Guide)

NestJS Study 저장소에 기여해 주셔서 감사합니다.
오타 수정부터 새 챕터 추가까지, 모든 형태의 기여를 환영합니다.

---

## 기여할 수 있는 내용

| 종류               | 예시                                      |
| ------------------ | ----------------------------------------- |
| **오타·문법 수정** | 오탈자, 어색한 표현, 맞춤법               |
| **내용 보완**      | 설명이 부족한 부분에 예제나 설명 추가     |
| **오류 수정**      | 잘못된 코드 예제, 틀린 개념 설명          |
| **새 섹션 추가**   | 기존 챕터 내 누락된 개념 섹션 추가        |
| **새 챕터 추가**   | Phase 8+ 챕터 (GraphQL, Docker, Redis 등) |
| **레퍼런스 추가**  | `docs/references/` 아래 새 참고 문서      |
| **링크·앵커 수정** | 잘못된 링크, 깨진 앵커                    |

---

## 기여 방법

크게 두 가지 방법이 있습니다.

### 방법 1: Issue 등록 (간단한 제보)

직접 수정하기 어렵거나 논의가 필요한 경우, GitHub Issue를 통해 제보해 주세요.

1. 상단 **Issues** 탭 → **New Issue** 클릭
2. 제목에 변경하려는 내용을 간결하게 작성
3. 본문에 아래 내용을 포함해 주세요:
   - 어떤 파일의 몇 번째 줄인지
   - 현재 내용과 문제점
   - 제안하는 개선 내용 (선택)

### 방법 2: Fork 후 Pull Request (직접 수정)

직접 내용을 수정하고 PR로 제출하는 방법입니다.

---

## Pull Request 기여 순서

```
1. 저장소 Fork
        │
        ▼
2. 로컬에 클론
        │
        ▼
3. 작업 브랜치 생성
        │
        ▼
4. 내용 수정
        │
        ▼
5. 커밋
        │
        ▼
6. 내 Fork 저장소에 Push
        │
        ▼
7. 원본 저장소로 Pull Request 생성
```

### 1단계 — 저장소 Fork

GitHub 우측 상단 **Fork** 버튼을 클릭해 내 계정으로 복사합니다.

### 2단계 — 로컬에 클론

```bash
git clone https://github.com/내아이디/nest-study.git
cd nest-study
```

### 3단계 — 작업 브랜치 생성

`main` 브랜치에서 직접 작업하지 말고, 목적에 맞는 브랜치를 새로 만드세요.

```bash
# 브랜치명 예시
git checkout -b fix/ch02-typo
git checkout -b docs/ch05-add-example
git checkout -b feat/ch18-graphql
```

| 접두사  | 사용 상황             |
| ------- | --------------------- |
| `fix/`  | 오타, 오류 수정       |
| `docs/` | 내용 보완, 설명 추가  |
| `feat/` | 새 챕터, 새 섹션 추가 |

### 4단계 — 내용 수정

수정 시 아래 규칙을 따라 주세요:

- **챕터 제목 형식**: `# 챕터 N - 주제명`
- **마무리 순서**: `## 정리` → `## 다음 챕터 예고` (파일 맨 끝)
- **데코레이터 링크**: 코드 블록 밖에서 언급되는 데코레이터는 `references/decorators.md`로 인라인 링크 연결
  ```markdown
  [`@Controller()`](references/decorators.md#controllerprefix)
  ```
- **링크 경로**: `../references/`가 아닌 `references/`로 작성 (챕터 파일과 references가 모두 `docs/` 안에 있음)
- **블록쿼트 스타일**: `> **팁:**`, `> **주의:**`, `> **참고:**` 세 가지만 사용
- **코드 블록**: 언어는 `typescript`, 첫 줄에 파일 경로 주석 포함

> **참고:** 새 데코레이터가 추가되는 경우 `docs/references/decorators.md`에도 해당 섹션을 추가하고, CLAUDE.md의 섹션 구성 표도 함께 갱신해 주세요.

### 5단계 — 커밋

커밋 메시지는 무엇을 바꿨는지 한눈에 알 수 있게 작성합니다.

```bash
git add .
git commit -m "fix: ch02 @Headers 링크 앵커 오류 수정"
git commit -m "docs: ch05 ValidationPipe 예제 보완"
git commit -m "feat: ch18 GraphQL 챕터 초안 추가"
```

### 6단계 — Push

```bash
git push origin fix/ch02-typo
```

### 7단계 — Pull Request 생성

1. 내 Fork 저장소 페이지로 이동
2. **Compare & pull request** 버튼 클릭
3. PR 제목과 본문 작성:
   - **제목**: 변경 내용을 한 줄로 요약 (예: `fix: ch02 @Headers 링크 앵커 수정`)
   - **본문**: 어떤 문제를 어떻게 해결했는지 설명
   - 관련 Issue가 있다면 `Closes #이슈번호` 포함

---

## 새 챕터 추가 시 체크리스트

새로운 챕터(18번 이후)를 추가하는 경우 아래 항목을 모두 확인해 주세요:

- [ ] `docs/NN-주제.md` 파일 생성
- [ ] 챕터 제목 형식 `# 챕터 N - 주제명` 준수
- [ ] 이전 챕터 요약 blockquote 포함 (`> **이전 챕터 요약**:`)
- [ ] 3단계 구조 포함 (1단계 개념 학습 / 2단계 기본 예제 / 3단계 블로그 API 적용)
- [ ] `## 정리` 섹션 포함
- [ ] `## 다음 챕터 예고` 섹션 포함 (마지막 챕터 제외)
- [ ] 등장하는 데코레이터에 `references/decorators.md` 인라인 링크 연결
- [ ] `docs/00-roadmap.md` 로드맵 업데이트
- [ ] `README.md` 로드맵 테이블 업데이트
- [ ] `CLAUDE.md` 관련 내용 갱신

---

## 질문이나 제안이 있다면

Issue 탭에서 자유롭게 의견을 남겨 주세요.
모든 피드백은 이 저장소를 더 좋게 만드는 데 도움이 됩니다.
