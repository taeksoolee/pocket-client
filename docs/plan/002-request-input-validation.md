# 002 - request.tsx 입력 검증 강화

> 우선순위: Critical | 난이도: 낮음 | 예상 파일: 2개

---

## 문제

`src/routes/request.tsx`에서 요청 바디를 타입 검증 없이 `as string`으로 캐스팅한다.

```tsx
// 현재 코드
let rawUrl = body.url as string;      // undefined일 수 있음
const method = body.method as string; // undefined일 수 있음
```

요청 바디가 예상과 다른 형태면 이후 로직에서 런타임 에러가 터진다. TypeScript의 타입 체커를 `as` 캐스팅으로 속이는 것이므로 컴파일 타임에도 잡히지 않는다.

추가로 URL이 빈 문자열이거나, baseUrl이 설정되지 않은 상태에서 `/`로 시작하는 상대 경로를 보낼 경우 잘못된 요청이 나간다.

---

## 해결 방향

라우트 핸들러 진입부에서 입력을 명시적으로 검증한다. 검증 실패 시 400 응답을 반환하고 실행을 중단한다.

---

## 구현 계획

### Step 1. `src/types/index.ts`에 검증 타입 추가

```ts
export interface RequestPayload {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  bodyType?: 'none' | 'json';
  bodyContent?: string;
  timeout?: number;
}

// 런타임 타입 가드
export function isValidRequestPayload(body: unknown): body is RequestPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.url === 'string' && b.url.trim() !== '' &&
    typeof b.method === 'string' && b.method.trim() !== ''
  );
}
```

### Step 2. `src/routes/request.tsx` 핸들러 수정

```tsx
// 현재
const body = await c.req.json();
let rawUrl = body.url as string;
const method = body.method as string;

// 수정 후
const body = await c.req.json().catch(() => null);
if (!isValidRequestPayload(body)) {
  return c.json({ error: 'url과 method는 필수입니다' }, 400);
}

let rawUrl = body.url.trim();
const method = body.method.trim().toUpperCase();
```

### Step 3. URL 유효성 검증 추가

```tsx
// baseUrl 없이 상대 경로만 들어온 경우
if (rawUrl.startsWith('/') && !config.baseUrl) {
  return c.json({ error: 'baseUrl이 설정되지 않아 상대 경로를 사용할 수 없습니다' }, 400);
}

// URL 형식 검증
try {
  new URL(resolvedUrl);
} catch {
  return c.json({ error: `올바르지 않은 URL 형식입니다: ${resolvedUrl}` }, 400);
}
```

### Step 4. 클라이언트 측 사전 검증 (RequestForm.tsx)

서버 검증과 별개로, 요청 보내기 전에 프론트에서도 체크:

```js
// Alpine.js submit 핸들러에 추가
if (!this.rawUrl.trim()) {
  showToast('URL을 입력해주세요');
  return;
}
```

---

## 수정 파일 목록

- `src/types/index.ts` - `isValidRequestPayload` 타입 가드 추가
- `src/routes/request.tsx` - 입력 검증 및 URL 유효성 체크 추가
- `src/components/RequestForm.tsx` - 클라이언트 측 사전 검증

---

## 완료 기준

- `as string` 캐스팅 없이 타입 가드로 검증
- url/method 누락 시 400 + 에러 메시지 반환
- 빈 URL로 요청 시 클라이언트에서 먼저 차단
- baseUrl 없는 상대 경로 요청 시 명확한 에러 메시지
