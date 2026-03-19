# 005 - RequestForm.tsx 분리 및 리팩토링

> 우선순위: High | 난이도: 높음 | 예상 파일: 6~8개

---

## 문제

`src/components/RequestForm.tsx`가 660줄이다. 하나의 JSX 파일 안에 다음이 전부 얽혀 있다:

- Alpine.js 상태 관리 (x-data 안에 300줄짜리 객체)
- URL 조합 로직
- 쿼리 파라미터 파싱/직렬화
- 헤더 관리
- JSON 바디 파싱
- fetch 코드 생성
- 자동완성 로직
- 커스텀 함수 실행
- 폼 제출 (HTMX)
- UI (탭, 버튼, 입력 필드)

문제는 Alpine.js 로직이 JSX 문자열 안에 박혀 있다는 것이다. IDE 자동완성이 없고, TypeScript 타입 체크가 안 되고, 테스트도 불가능하다. 기능을 추가할수록 이 파일은 더 커진다.

---

## 해결 방향

Alpine.js 데이터 객체를 별도 파일로 분리하고, 순수 로직을 유틸 함수로 추출한다. 컴포넌트는 UI 구조만 담당하도록 한다.

---

## 구현 계획

### 분리 구조

```
src/
├── components/
│   ├── RequestForm.tsx          # UI 구조만 (대폭 축소)
│   ├── request-form/
│   │   ├── FormTabs.tsx         # Params/Headers/Body/Raw 탭 UI
│   │   └── CodeModal.tsx        # 코드 생성 모달
├── alpine/
│   └── requestFormState.ts      # Alpine x-data 객체 정의
└── utils/
    ├── url.ts                   # URL 조합, 파라미터 파싱
    ├── code-gen.ts              # fetch 코드 생성
    └── custom-functions.ts      # 커스텀 함수 로딩/실행
```

---

### Step 1. URL 유틸리티 분리 (`src/utils/url.ts`)

```ts
// URL 조합
export function resolveUrl(baseUrl: string, rawUrl: string): string { ... }

// 쿼리 파라미터 → URL 문자열
export function buildQueryString(params: { key: string; value: string }[]): string { ... }

// URL → 쿼리 파라미터 파싱
export function parseQueryParams(url: string): { key: string; value: string }[] { ... }
```

### Step 2. 코드 생성 유틸 분리 (`src/utils/code-gen.ts`)

```ts
export interface FetchCodeOptions {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  params: { key: string; value: string }[];
  body?: string;
}

export function generateFetchCode(options: FetchCodeOptions): string { ... }
```

타입이 있으므로 TypeScript가 생성 로직을 체크할 수 있다.

### Step 3. 커스텀 함수 로딩 분리 (`src/utils/custom-functions.ts`)

004 계획에서 단순화한 로딩 로직을 여기에 분리:

```ts
export function initCustomFunctions(
  functionsMap: Record<string, string>,
  context: { setHeader: ..., setUrl: ..., setMethod: ... }
): void { ... }
```

### Step 4. Alpine 상태 객체 분리 (`src/alpine/requestFormState.ts`)

Alpine.js의 `x-data`에 들어가는 객체를 별도 파일로 분리. 빌드 시 문자열로 직렬화하여 주입하거나, `Alpine.data()` 방식으로 등록.

```ts
// src/alpine/requestFormState.ts
export function requestFormState(initialData: RequestFormInitialData) {
  return {
    method: 'GET',
    rawUrl: '',
    headers: initialData.globalHeaders,
    params: [],
    // ... 상태 필드들

    // 메서드들 (타입 체크 가능)
    get resolvedUrl(): string { ... },
    updateRawJson() { ... },
    parseRawJson() { ... },
    generateFetchCode() { ... },
    submit() { ... },
  };
}
```

**Alpine.data() 등록 방식:**
```html
<!-- Layout.tsx에서 Alpine 초기화 전에 등록 -->
<script>
  document.addEventListener('alpine:init', () => {
    Alpine.data('requestForm', (initialData) => requestFormState(initialData));
  });
</script>
```

```tsx
// RequestForm.tsx - x-data가 단순해짐
<div x-data={`requestForm(${JSON.stringify(initialData)})`}>
```

### Step 5. `RequestForm.tsx` UI 정리

상태/로직이 분리된 후 남는 것: 순수 HTML 구조.

```tsx
// 목표: 200줄 이하
export function RequestForm({ initialData }: Props) {
  return (
    <div x-data={`requestForm(${JSON.stringify(initialData)})`}>
      <UrlBar />
      <FormTabs />
      <SubmitButton />
    </div>
  );
}
```

---

## 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `src/components/RequestForm.tsx` | UI만 남기고 대폭 축소 |
| `src/components/request-form/FormTabs.tsx` | 탭 UI 분리 (신규) |
| `src/components/request-form/CodeModal.tsx` | 코드 생성 모달 분리 (신규) |
| `src/alpine/requestFormState.ts` | Alpine 상태 객체 (신규) |
| `src/utils/url.ts` | URL 유틸리티 (신규) |
| `src/utils/code-gen.ts` | 코드 생성 유틸 (신규) |
| `src/utils/custom-functions.ts` | 커스텀 함수 로딩 (신규) |

---

## 완료 기준

- `RequestForm.tsx` 200줄 이하
- Alpine 로직이 TypeScript 파일 안에 있어 IDE 자동완성 동작
- `url.ts`, `code-gen.ts` 함수에 단위 테스트 작성 가능한 구조
- `catch (e) {}` 없음 (001 작업과 연계)
- 기존 동작 100% 유지 (기능 변경 없음)

---

## 주의사항

이 작업은 가장 범위가 크다. 001~004를 먼저 완료한 후 진행하는 것을 권장한다. 리팩토링 중 기존 동작이 깨지지 않도록 단계별로 추출하면서 브라우저에서 직접 확인한다.
