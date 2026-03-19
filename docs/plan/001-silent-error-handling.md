# 001 - 무음 실패(Silent Failure) 제거

> 우선순위: Critical | 난이도: 낮음 | 예상 파일: 3개

---

## 문제

`RequestForm.tsx` 안에 catch 블록이 4곳 있는데 모두 에러를 삼킨다. 사용자는 뭔가 안 될 때 이유를 알 수 없다.

```tsx
catch (e) {}                        // 커스텀 함수 실행 실패
catch (e) { /* ignore */ }          // JSON 파싱 실패
catch (e) { /* silently fail */ }   // URL 파라미터 파싱 실패
catch (e) { /* silently fail */ }   // 코드 생성 실패
```

`SidebarList.tsx`의 템플릿 fetch도 `.catch()` 없음.

---

## 해결 방향

에러를 삼키지 않는다. 종류에 따라 처리를 나눈다:

1. **사용자에게 알려야 하는 에러** → 화면에 토스트/인라인 메시지 표시
2. **로직 상 무시 가능한 에러** → 최소한 `console.warn`으로 기록

---

## 구현 계획

### Step 1. 토스트 컴포넌트 추가 (`src/components/Toast.tsx`)

Alpine.js `$store` 또는 단순 `window.showToast()` 함수로 구현. 복잡하게 만들 필요 없음.

```html
<!-- Layout.tsx에 추가할 토스트 컨테이너 -->
<div id="toast-container"
     x-data="{ toasts: [] }"
     x-on:show-toast.window="toasts.push($event.detail); setTimeout(() => toasts.shift(), 3000)"
     class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
  <template x-for="t in toasts" :key="t.id">
    <div class="bg-red-600 text-white px-4 py-2 rounded shadow" x-text="t.message"></div>
  </template>
</div>
```

토스트 발생 방법:
```js
window.dispatchEvent(new CustomEvent('show-toast', {
  detail: { id: Date.now(), message: '에러 내용' }
}));
```

### Step 2. `RequestForm.tsx` catch 블록 수정

| 위치 | 현재 | 수정 후 |
|------|------|---------|
| 커스텀 함수 실행 | `catch (e) {}` | `catch (e) { showToast(`함수 실행 실패: ${e.message}`) }` |
| JSON 파싱 (`parseRawJson`) | `catch (e) { /* ignore */ }` | `catch (e) { showToast('JSON 형식이 올바르지 않습니다') }` |
| URL 파라미터 파싱 | `catch (e) { /* silently fail */ }` | `catch (e) { console.warn('params parse failed', e) }` |
| 코드 생성 | `catch (e) { /* silently fail */ }` | `catch (e) { showToast('코드 생성 실패') }` |

### Step 3. `SidebarList.tsx` 템플릿 fetch 에러 처리

```js
// 현재
fetch(`/templates/${name}`).then(r => r.json()).then(...)

// 수정 후
fetch(`/templates/${name}`)
  .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
  .then(...)
  .catch(e => showToast(`템플릿 로드 실패: ${e.message}`))
```

---

## 수정 파일 목록

- `src/components/Toast.tsx` - 신규 생성
- `src/components/Layout.tsx` - 토스트 컨테이너 추가
- `src/components/RequestForm.tsx` - catch 블록 4곳 수정
- `src/components/SidebarList.tsx` - fetch 에러 처리 추가

---

## 완료 기준

- 커스텀 함수 실행 실패 시 화면에 에러 메시지 표시
- 잘못된 JSON 입력 시 "JSON 형식이 올바르지 않습니다" 표시
- 템플릿 로드 실패 시 메시지 표시
- `catch (e) {}` 형태의 무음 catch 블록 0개
