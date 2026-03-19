# 009 - 요청 중단 버튼 UI

> 우선순위: Medium | 난이도: 낮음 | 예상 파일: 2개

---

## 문제

`src/routes/request.tsx`에는 AbortController가 이미 구현되어 있다.

```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
```

그런데 이건 타임아웃 전용이다. 사용자가 응답을 기다리다가 중간에 취소하고 싶을 때 방법이 없다. 버튼은 없고, 페이지를 새로고침하거나 브라우저를 닫아야 한다.

---

## 해결 방향

서버에서의 fetch 취소와 클라이언트에서의 HTMX 요청 취소를 모두 처리한다.

---

## 구현 계획

### Step 1. 요청 중 UI 상태 추가 (RequestForm.tsx Alpine)

```js
// Alpine 상태에 추가
isLoading: false,

// submit() 안에서
async submit() {
  this.isLoading = true;
  try {
    // htmx 요청 트리거
  } finally {
    this.isLoading = false;
  }
}
```

HTMX의 `htmx:beforeRequest` / `htmx:afterRequest` 이벤트로도 제어 가능:

```js
document.body.addEventListener('htmx:beforeRequest', () => {
  this.isLoading = true;
});
document.body.addEventListener('htmx:afterRequest', () => {
  this.isLoading = false;
});
```

### Step 2. 전송 버튼 → 로딩 중 취소 버튼으로 전환

```tsx
// RequestForm.tsx - 전송/취소 버튼
<button
  x-show="!isLoading"
  type="submit"
  class="px-4 py-2 bg-blue-600 text-white rounded">
  전송
</button>

<button
  x-show="isLoading"
  type="button"
  x-on:click="cancelRequest()"
  class="px-4 py-2 bg-red-600 text-white rounded">
  취소
</button>

<!-- 로딩 인디케이터 -->
<span x-show="isLoading" class="text-sm text-gray-400 animate-pulse">
  요청 중...
</span>
```

### Step 3. HTMX 요청 취소 구현

HTMX는 `htmx.trigger(el, 'htmx:abort')` 또는 `htmx.remove()` 로 진행 중인 요청을 중단한다.

```js
// Alpine 메서드
cancelRequest() {
  // 진행 중인 HTMX 요청 중단
  htmx.trigger(document.body, 'htmx:abort');
  this.isLoading = false;
}
```

### Step 4. 서버 측 - 클라이언트 연결 끊김 감지 (선택)

현재 서버는 클라이언트가 연결을 끊어도 외부 API 요청을 끝까지 보낸다. 이건 대부분의 경우 허용 가능한 동작이므로 필수는 아님. 필요하다면 Hono의 `c.req.raw.signal`을 사용:

```ts
// request.tsx - 클라이언트 연결 끊김도 abort로 처리
const clientSignal = c.req.raw.signal;
const combined = AbortSignal.any([controller.signal, clientSignal]);
const response = await fetch(resolvedUrl, { signal: combined, ... });
```

---

## 수정 파일 목록

- `src/components/RequestForm.tsx` - `isLoading` 상태, 버튼 전환 UI
- `src/routes/request.tsx` - `AbortSignal.any` 적용 (선택)

---

## 완료 기준

- 요청 전송 후 버튼이 "취소"로 바뀜
- 취소 버튼 클릭 시 HTMX 요청 중단 + 로딩 상태 해제
- 응답 수신 후 다시 "전송" 버튼으로 복귀
- 타임아웃 발생 시에도 로딩 상태 정상 해제
