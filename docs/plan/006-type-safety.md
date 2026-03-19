# 006 - 타입 안전성 강화

> 우선순위: Medium | 난이도: 중간 | 예상 파일: 3개

---

## 문제

TypeScript를 쓰는데 `as string` 캐스팅으로 타입 체커를 우회하는 곳이 여러 군데 있다. 런타임에서 예상치 못한 타입이 들어와도 컴파일 타임에 잡히지 않는다.

### 발견된 문제 위치

**1. `src/routes/request.tsx`** (002에서 일부 처리, 여기서 나머지 정리)
```tsx
let rawUrl = body.url as string;       // ❌
const method = body.method as string;  // ❌
```

**2. `src/config.ts`** - 설정 파일 로드 시 타입 검증 없음
```ts
// JSON 파싱 결과를 그대로 반환 - 필수 필드가 없어도 모름
return { ...INTERNAL_DEFAULT, ...defaultConfig, ...envConfig };
```

**3. `src/routes/templates.tsx`**
```ts
const body = await c.req.json(); // unknown → 바로 사용
```

**4. Alpine.js 상태 객체** - `x-data` 문자열 안이라 타입 체크 전혀 없음
(005 리팩토링으로 해결될 부분이지만, 005 전에도 타입 정의는 선행 가능)

---

## 해결 방향

`as` 캐스팅 대신 타입 가드(type guard) 함수를 만들어 런타임에서 실제로 검증한다. 실패 시 명확한 에러를 던진다.

---

## 구현 계획

### Step 1. `src/types/index.ts` 확장

```ts
// 기존 인터페이스 보완
export interface PocketConfig {
  port: number;
  baseUrl: string;
  timeout: number;
  globalHeaders: Record<string, string>;
  commonEndpoints: string[];
}

// 템플릿 저장 바디
export interface SaveTemplatePayload {
  name: string;
  data: RequestPayload;
}

// 런타임 타입 가드 모음
export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isValidRequestPayload(body: unknown): body is RequestPayload {
  if (!isRecord(body)) return false;
  return isString(body.url) && body.url.trim() !== '' &&
         isString(body.method) && body.method.trim() !== '';
}

export function isValidSaveTemplatePayload(body: unknown): body is SaveTemplatePayload {
  if (!isRecord(body)) return false;
  return isString(body.name) && body.name.trim() !== '' &&
         isRecord(body.data);
}
```

### Step 2. `src/config.ts` 설정 검증 추가

```ts
// 로드된 설정이 필수 필드를 갖췄는지 검증
function validateConfig(config: unknown): PocketConfig {
  if (!isRecord(config)) throw new Error('config must be an object');

  return {
    port: typeof config.port === 'number' ? config.port : INTERNAL_DEFAULT.port,
    baseUrl: typeof config.baseUrl === 'string' ? config.baseUrl : INTERNAL_DEFAULT.baseUrl,
    timeout: typeof config.timeout === 'number' ? config.timeout : INTERNAL_DEFAULT.timeout,
    globalHeaders: isRecord(config.globalHeaders)
      ? config.globalHeaders as Record<string, string>
      : {},
    commonEndpoints: Array.isArray(config.commonEndpoints)
      ? config.commonEndpoints.filter(isString)
      : [],
  };
}
```

잘못된 설정 타입 필드는 기본값으로 자동 대체하고, console.warn으로 알린다.

### Step 3. `src/routes/templates.tsx` 바디 검증

```ts
// 현재
const body = await c.req.json();
const name = body.name;

// 수정
const body = await c.req.json().catch(() => null);
if (!isValidSaveTemplatePayload(body)) {
  return c.json({ error: 'name과 data는 필수입니다' }, 400);
}
```

### Step 4. Alpine 상태 초기 데이터 타입 정의

005 리팩토링 전이라도 초기 데이터 타입을 미리 정의:

```ts
// src/types/index.ts에 추가
export interface RequestFormInitialData {
  globalHeaders: { key: string; value: string }[];
  suggestions: string[];
  baseUrl: string;
  functionsMap: Record<string, string>;
}
```

`Home.tsx`에서 이 타입으로 프롭을 넘기면 컴파일 타임에 누락을 잡는다.

---

## 수정 파일 목록

- `src/types/index.ts` - 타입 가드 함수 및 인터페이스 추가
- `src/config.ts` - `validateConfig` 함수 추가
- `src/routes/templates.tsx` - 바디 검증 추가
- `src/routes/request.tsx` - 002에서 남긴 나머지 `as` 캐스팅 제거

---

## 완료 기준

- 코드베이스에서 `as string`, `as any` 사용 0건
- 설정 파일 누락/잘못된 타입 필드 → 기본값 + console.warn
- 모든 라우트 핸들러에서 요청 바디 검증 후 사용
