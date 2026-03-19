# 003 - URL 슬래시 처리 버그 수정

> 우선순위: Critical | 난이도: 낮음 | 예상 파일: 1개

---

## 문제

`RequestForm.tsx`의 `resolvedUrl` getter에서 이스케이프가 혼재되어 있다.

```tsx
// RequestForm.tsx - resolvedUrl getter (의심 코드)
get resolvedUrl() {
  return (this.baseUrl + this.rawUrl)
    .replace(/\/+$/, '')   // ✅ 끝의 슬래시 제거 - 올바름
    .replace(/\\+$/, '')   // ❌ 끝의 백슬래시 제거 - URL에서 왜?
}
```

URL에서 백슬래시(`\`)를 제거하는 코드가 왜 있는지 불명확하다. JSX 문자열 안에서 정규식을 이스케이프하다가 의도치 않게 들어갔을 가능성이 높다.

또한 baseUrl과 rawUrl을 단순 문자열 덧붙이기로 합치면 슬래시가 중복되는 케이스가 처리되지 않는다:

```
baseUrl  = "https://api.example.com/"
rawUrl   = "/users"
결과     = "https://api.example.com//users"  // 슬래시 중복
```

---

## 해결 방향

URL 조합 로직을 명시적으로 처리하는 헬퍼로 분리한다.

---

## 구현 계획

### Step 1. URL 조합 로직 수정

```ts
// URL 조합 유틸리티 (RequestForm.tsx Alpine 객체 안 또는 유틸로 분리)
function resolveUrl(baseUrl: string, rawUrl: string): string {
  // 절대 URL이면 그대로 사용
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  // 상대 경로면 baseUrl과 합산
  if (rawUrl.startsWith('/') && baseUrl) {
    const base = baseUrl.replace(/\/+$/, ''); // baseUrl 끝 슬래시 제거
    return base + rawUrl;
  }

  return rawUrl;
}
```

### Step 2. 백슬래시 제거 코드 삭제

```tsx
// 삭제 대상
.replace(/\\+$/, '')
```

의도가 있는 코드인지 확인 후 삭제 또는 주석으로 이유 명시.

### Step 3. URL 미리보기 정확성 확인

수정 후 다음 케이스를 수동으로 검증:

| baseUrl | rawUrl | 기대 결과 |
|---------|--------|----------|
| `https://api.example.com` | `/users` | `https://api.example.com/users` |
| `https://api.example.com/` | `/users` | `https://api.example.com/users` |
| `` (없음) | `https://other.com/api` | `https://other.com/api` |
| `` (없음) | `/users` | `/users` (baseUrl 없다는 경고 별도) |

---

## 수정 파일 목록

- `src/components/RequestForm.tsx` - `resolvedUrl` getter 로직 수정

---

## 완료 기준

- `\\+$` 패턴 제거
- baseUrl + 상대경로 조합 시 슬래시 중복 없음
- 절대 URL 입력 시 baseUrl 무시
