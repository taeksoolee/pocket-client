# 구현 결과: 006 - 타입 안전성 강화

> 구현일: 2026-03-20
> 커밋: `abc262c`
> 계획 문서: [docs/plan/006-type-safety.md](../plan/006-type-safety.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/types/index.ts` | `isString`, `isRecord` 런타임 타입 가드 추가 |
| `src/config.ts` | `validateConfig()` 함수 추가 — JSON 필드 타입 검증 |
| `src/routes/templates.tsx` | POST 바디 `unknown` 수신 후 `isRecord` 가드 적용 |
| `src/components/partials/SuccessCard.tsx` | 불필요한 `as string` 캐스팅 2건 제거 |

---

## 구현 상세

### 런타임 타입 가드 (`types/index.ts`)

```ts
export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
```

### `validateConfig()` (`config.ts`)

JSON 파싱 결과를 `unknown`으로 받아 각 필드를 타입별로 검증 후 기본값 대체:

```ts
function validateConfig(raw: unknown, base: PocketConfig): PocketConfig {
  if (!isRecord(raw)) return base;
  const result = { ...base };
  if (typeof raw.port === 'number') result.port = raw.port;
  if (typeof raw.baseUrl === 'string') result.baseUrl = raw.baseUrl;
  // ... globalHeaders, commonEndpoints도 필터링
  return result;
}
```

기존 `{ ...finalConfig, ...defaultData }` 스프레드는 잘못된 타입 필드를 그대로 덮어쓸 위험이 있었다. 이제 타입이 맞지 않는 필드는 기본값을 유지한다.

### `templates.tsx` POST 바디 검증

```ts
const body: unknown = await c.req.json().catch(() => null);
if (!isRecord(body)) {
  return c.json({ error: '유효한 JSON 객체가 필요합니다' }, 400);
}
```

기존 `c.req.json()`은 Hono에서 `any`를 반환하므로 타입 체커가 통과했지만 런타임에 null/배열이 들어올 수 있었다.

### `SuccessCard.tsx` 불필요한 캐스팅 제거

`response.headers`와 `request.headers`는 이미 `Record<string, string>` 타입이므로 `as string` 캐스팅이 불필요했다. 제거 후에도 동일하게 동작한다.

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| 코드베이스 `as string` / `as any` 0건 | ✅ |
| 설정 파일 잘못된 타입 필드 → 기본값 대체 | ✅ |
| 모든 라우트 핸들러 요청 바디 검증 | ✅ |

---

## 계획과 다른 점

- **`request.tsx` 추가 작업 없음**: 002에서 이미 모든 `as string` 캐스팅이 제거되어 있었음.
- **`templates.tsx` 검증 범위**: 계획은 `name`/`data` 구조를 검증하는 `isValidSaveTemplatePayload`를 만들려 했으나, 실제 저장 로직은 body 내용을 그대로 직렬화하므로 `isRecord` 수준의 검증으로 충분. 과도한 스키마 검증은 템플릿 포맷 유연성을 해침.
- **`RequestFormInitialData` 타입 미추가**: 005에서 `requestFormState(config, initialHeaders, uniqueSuggestions)` 시그니처로 이미 타입이 강제되므로 별도 인터페이스 불필요.
