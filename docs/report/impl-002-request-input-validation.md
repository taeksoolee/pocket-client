# 구현 결과: 002 - request 입력 검증 강화

> 구현일: 2026-03-19
> 커밋: `72a1c86`
> 계획 문서: [docs/plan/002-request-input-validation.md](../plan/002-request-input-validation.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/types/index.ts` | `RequestFormBody` 인터페이스 및 `isValidRequestFormBody` 타입 가드 추가 |
| `src/routes/request.tsx` | `as string` 캐스팅 제거, 3단계 검증 로직 추가 |

---

## 구현 상세

### 타입 가드 추가 (`src/types/index.ts`)

계획에서는 `isValidRequestPayload`를 JSON body 기준으로 설계했으나, 실제 폼 제출 방식이 `application/x-www-form-urlencoded`(HTMX form data)임을 코드에서 확인했다. `c.req.parseBody()`가 반환하는 타입이 `Record<string, string | File>`이므로 이에 맞는 타입 가드를 별도로 작성했다.

```ts
export interface RequestFormBody {
  url: string;
  method: string;
  pocket_payload: string;
}

export function isValidRequestFormBody(
  body: Record<string, string | File>,
): body is Record<string, string> & RequestFormBody {
  return (
    typeof body.url === 'string' &&
    body.url.trim() !== '' &&
    typeof body.method === 'string' &&
    body.method.trim() !== ''
  );
}
```

### `request.tsx` 검증 로직 (`src/routes/request.tsx`)

기존 `body.url as string`, `body.method as string` 캐스팅을 완전히 제거하고 3단계 검증을 순서대로 적용했다.

**1단계 - 필드 존재 검증**
```tsx
if (!isValidRequestFormBody(body)) {
  return c.html(<ErrorCard message="url과 method는 필수입니다." />, 400);
}
```

**2단계 - 상대 경로 + baseUrl 없음 검증**
```tsx
if (rawUrl.startsWith('/') && !config.baseUrl) {
  return c.html(
    <ErrorCard message="baseUrl이 설정되지 않아 상대 경로를 사용할 수 없습니다. config/default.json에 baseUrl을 설정해주세요." />,
    400,
  );
}
```

**3단계 - URL 형식 검증**
```tsx
try {
  new URL(rawUrl);
} catch {
  return c.html(<ErrorCard message={`올바르지 않은 URL 형식입니다: ${rawUrl}`} />, 400);
}
```

기존에는 3단계가 없어서 잘못된 URL이 들어오면 이후 `new URL(rawUrl)` 호출 시 예외가 발생하고, 최하단 catch에서 `err.message`만 출력됐다. 이제 명확한 메시지로 선제 차단된다.

**검증 통과 후 처리**

검증을 통과한 값은 이미 타입이 보장되므로 이후 코드에서 `as string` 없이 사용한다.

```tsx
let rawUrl = body.url.trim();
const method = body.method.trim().toUpperCase();
const payloadStr = body.pocket_payload;
```

`method`에 `.toUpperCase()`를 적용해 소문자로 들어와도 정상 처리되도록 했다. 기존에는 대소문자 그대로 fetch에 넘겼다.

### 에러 응답 형식

계획에서는 `c.json({error: ...}, 400)`을 제안했으나, HTMX의 `hx-target="#snapshort"`가 HTML 응답을 기대하므로 `c.html(<ErrorCard .../>, 400)`으로 변경했다. JSON 응답을 받으면 HTMX가 타겟 영역에 `[object Object]`를 렌더링한다.

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| `as string` 캐스팅 없이 타입 가드로 검증 | ✅ |
| url/method 누락 시 400 + 에러 메시지 반환 | ✅ |
| 빈 URL로 요청 시 차단 | ✅ (서버 검증, HTML `required`도 병존) |
| baseUrl 없는 상대 경로 요청 시 명확한 에러 메시지 | ✅ |

---

## 계획과 다른 점

- **타입 가드 이름**: `isValidRequestPayload` → `isValidRequestFormBody`. 실제 폼 제출이 JSON이 아닌 form data 방식이므로 구분을 명확히 함.
- **에러 응답 형식**: `c.json()` → `c.html(<ErrorCard/>)`. HTMX 렌더링 구조 때문.
- **클라이언트 측 검증**: 구현하지 않음. `required` 속성이 이미 있고 HTMX가 이를 존중하므로 중복 구현 불필요.
- **method toUpperCase()**: 계획에 없던 추가 처리. 방어적 정규화.
