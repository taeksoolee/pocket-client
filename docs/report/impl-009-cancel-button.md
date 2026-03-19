# 구현 결과: 009 - 요청 중단 버튼 UI

> 구현일: 2026-03-20
> 커밋: `827d3fb`
> 계획 문서: [docs/plan/009-request-cancel-button.md](../plan/009-request-cancel-button.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/alpine/requestFormState.ts` | `isLoading` 상태, `cancelRequest()`, HTMX 이벤트 리스너 추가 |
| `src/components/RequestForm.tsx` | Send↔Cancel 버튼 전환 UI, `x-ref`, `hx-disabled-elt` 수정 |
| `src/routes/request.tsx` | `AbortSignal.any` 적용 |

---

## 구현 상세

### Alpine 로딩 상태 (`requestFormState.ts`)

HTMX 이벤트를 `x-init` 내에서 form 요소에 직접 바인딩:

```js
this.$el.addEventListener('htmx:beforeRequest', () => { this.isLoading = true; });
this.$el.addEventListener('htmx:afterRequest', () => { this.isLoading = false; });
```

`htmx:beforeRequest`(전송 직전) / `htmx:afterRequest`(완료, 오류, abort 모두 포함)를 사용해 `isLoading`을 제어한다.

```js
cancelRequest() {
  htmx.trigger(this.$refs.requestForm, 'htmx:abort');
  this.isLoading = false;
},
```

### 버튼 전환 UI (`RequestForm.tsx`)

Send 버튼은 `x-show="!isLoading"`, Cancel 버튼은 `x-show="isLoading"`:

```tsx
<button type="submit" x-show="!isLoading" ...>Send</button>
<button type="button" x-show="isLoading" x-on:click="cancelRequest()" ...>
  <svg class="animate-spin ...">...</svg>
  Cancel
</button>
```

기존 `hx-disabled-elt="button"` → `hx-disabled-elt="button[type='submit']"`로 변경. HTMX의 요청 중 비활성화 대상을 submit 버튼으로 한정해 Cancel 버튼이 클릭 가능하도록 했다.

`x-ref="requestForm"` — `cancelRequest()`에서 `this.$refs.requestForm`으로 form 요소를 참조하기 위해 추가.

### 서버 측 클라이언트 연결 감지 (`request.tsx`)

```ts
const clientSignal = c.req.raw.signal;
const combinedSignal = AbortSignal.any([controller.signal, clientSignal]);
```

클라이언트가 Cancel을 누르면:
1. HTMX가 서버로의 HTTP 연결을 끊음
2. `c.req.raw.signal`이 abort됨
3. `combinedSignal`이 abort됨
4. 진행 중인 외부 API fetch가 즉시 중단됨

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| 요청 전송 후 버튼이 "Cancel"로 바뀜 | ✅ |
| Cancel 클릭 시 HTMX 요청 중단 + 로딩 상태 해제 | ✅ |
| 응답 수신 후 다시 "Send" 버튼으로 복귀 | ✅ |
| 타임아웃 발생 시에도 로딩 상태 정상 해제 | ✅ (`htmx:afterRequest`가 abort 후에도 발생) |
