# 구현 결과: 001 - 무음 실패 제거

> 구현일: 2026-03-19
> 커밋: `7886bce`
> 계획 문서: [docs/plan/001-silent-error-handling.md](../plan/001-silent-error-handling.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/components/Toast.tsx` | 신규 생성 |
| `src/components/Layout.tsx` | `showToast` 전역 함수 등록, `<Toast />` 삽입 |
| `src/components/RequestForm.tsx` | catch 블록 4곳 수정 |
| `src/components/SidebarList.tsx` | 템플릿 fetch 에러 처리 추가 |

---

## 구현 상세

### Toast 컴포넌트 (`src/components/Toast.tsx`)

Alpine.js `x-on:show-toast.window` 이벤트를 수신해 화면 우하단에 토스트를 표시하는 컴포넌트를 신규 생성했다. 3초 후 자동으로 사라진다. `type` 필드로 `'error'`(빨강)와 `'warn'`(노랑)을 구분한다.

```tsx
x-on:show-toast.window="toasts.push($event.detail); setTimeout(() => toasts.splice(0, 1), 3000)"
```

### 전역 `showToast` 함수 (`src/components/Layout.tsx`)

Alpine이 로드되기 전에도 호출 가능하도록 `window.showToast`를 일반 스크립트로 등록했다. Alpine 이벤트 시스템과 연결되어 있어 어디서든 호출하면 토스트가 뜬다.

```js
window.showToast = function(msg, type) {
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: { id: Date.now(), message: msg, type: type || 'error' }
  }));
};
```

### `RequestForm.tsx` catch 블록 수정

| 위치 | 변경 전 | 변경 후 | 이유 |
|------|---------|---------|------|
| 커스텀 함수 로딩 (outer) | `catch (e) {}` | `window.showToast('함수 로딩 실패 [파일명]: ...')` | 사용자가 함수 파일 문제를 알아야 함 |
| `parseRawJson` | `catch (e) { /* ignore */ }` | `console.warn(...)` | 타이핑 중 매 글자마다 호출되므로 토스트 스팸 방지 |
| `generateFetchCode` URL 파싱 | `catch(e) {}` | `console.warn(...)` | 폴백(params 생략) 처리되므로 경고로 충분 |
| `generateFetchCode` body 포맷 | `catch(e){}` | `console.warn(...)` | 원본 문자열 사용하는 폴백이므로 경고로 충분 |
| 템플릿 저장 실패 | `alert('저장 실패!')` | `window.showToast('템플릿 저장 실패: ...')` | alert 제거, 토스트로 통일 |

`parseRawJson`은 Raw JSON 탭 textarea의 `x-on:input`에 바인딩되어 있어 글자를 입력할 때마다 호출된다. 이 경우 토스트를 쓰면 사용자가 타이핑하는 동안 에러 메시지가 계속 뜨는 최악의 UX가 된다. `console.warn`으로 처리한 것은 계획과 다른 의도적인 조정이다.

### `SidebarList.tsx` 템플릿 fetch 에러 처리

기존에 `.catch()` 자체가 없었던 fetch 호출에 에러 처리를 추가했다. 응답 상태코드가 실패(non-ok)인 경우도 함께 처리한다.

```js
fetch('/templates/${item}')
  .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
  .then(data => $dispatch('fill-template-form', data))
  .catch(e => window.showToast('템플릿 로드 실패: ' + e.message))
```

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| 커스텀 함수 실행 실패 시 화면에 에러 메시지 표시 | ✅ |
| 잘못된 JSON 입력 시 메시지 표시 | ✅ (console.warn, 토스트 스팸 방지) |
| 템플릿 로드 실패 시 메시지 표시 | ✅ |
| `catch (e) {}` 형태의 무음 catch 블록 0개 | ✅ |

---

## 계획과 다른 점

- `parseRawJson` 실패: 계획은 토스트였으나 `console.warn`으로 변경. 타이핑 중 매 입력마다 호출되는 함수 특성상 토스트 스팸이 발생해 UX에 역효과.
- 템플릿 저장 실패: 계획에 없었으나 기존 `alert()`도 함께 토스트로 교체.
