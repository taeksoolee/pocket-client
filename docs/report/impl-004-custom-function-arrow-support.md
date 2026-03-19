# 구현 결과: 004 - 커스텀 함수 화살표 함수 지원

> 구현일: 2026-03-20
> 커밋: `fe641af`
> 계획 문서: [docs/plan/004-custom-function-arrow-support.md](../plan/004-custom-function-arrow-support.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/components/RequestForm.tsx` | `runCustomFunctions` 로직 전면 교체 |
| `dev/functions/auth.js` | 새 패턴으로 예제 업데이트 (`.gitignore` 대상이라 미커밋) |

---

## 구현 상세

### 기존 로직의 구조적 문제

기존 코드는 두 가지 역할이 뒤섞여 있었다.

1. **정규식으로 함수 이름 추출** → `primaryFunc` 결정
2. **코드 실행** → 추출한 함수 이름으로 `primaryFunc(pocket)` 호출

```js
// 기존: 정규식으로 이름 추출 후 호출
const allMatches = Array.from(rawCode.matchAll(/(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)/g));
const funcNames = allMatches.map(m => m[1]);
if (funcNames.length === 0) return;  // ← 화살표 함수면 여기서 종료
const primaryFunc = funcNames[0];
// ... primaryFunc(pocket) 호출
```

`function` 선언 방식이 없으면 `return`으로 코드 실행 자체를 건너뛴다. `registerAction`을 호출하는 코드가 있어도 실행되지 않는다.

### 수정 후: `new Function` 파라미터 방식

정규식을 완전히 제거하고, 코드를 항상 실행하되 `registerAction` 등 API를 파라미터로 직접 주입한다.

```js
// 수정 후
const finalCode = rawCode + '\n//# sourceURL=pocket/functions/' + fileName + '.js';
const runner = new Function(
  'pocket', 'registerAction', 'setHeader', 'setUrl', 'setMethod', 'getHeaders', 'getUrl',
  finalCode
);
runner(pocket, pocket.registerAction, pocket.setHeader, pocket.setUrl, pocket.setMethod, pocket.getHeaders, pocket.getUrl);
```

`new Function`의 파라미터로 `registerAction`, `setHeader` 등을 직접 넘기므로, 함수 파일 안에서 이름을 그대로 호출할 수 있다. `pocket` 객체도 유지해 기존 `pocket.registerAction(...)` 스타일과 하위 호환된다.

### 이제 동작하는 패턴들

```js
// ✅ 기존 방식 (하위 호환)
async function auth(pocket) {
  pocket.registerAction('Refresh', async () => { ... });
}

// ✅ 화살표 함수 + 직접 호출
const init = async () => {
  registerAction('Refresh', async () => { ... });
};
init();

// ✅ IIFE (권장 패턴)
(async () => {
  setHeader('Authorization', 'Bearer token');
  registerAction('Refresh', async () => { ... });
})();

// ✅ 최상위 직접 호출
registerAction('Simple Action', () => console.log('hello'));
```

### `window.PocketActions` 초기화 위치 변경

기존에는 `registerAction` 내부에서 `window.PocketActions = window.PocketActions || {}`로 지연 초기화했다. 이를 `runCustomFunctions` 시작 시점에 `window.PocketActions = {}`로 리셋하도록 변경했다. 페이지 새로고침 없이 함수 파일이 재실행될 때 이전 액션이 남는 문제를 방지한다.

### `dev/functions/auth.js` 예제 업데이트

`dev/` 폴더가 `.gitignore`에 포함되어 커밋되지 않지만, 로컬 개발용 예제를 IIFE 패턴으로 업데이트했다.

```js
// 변경 전: function 선언 + 엔진이 호출
async function auth(pocket) {
  pocket.setHeader('Authorization', 'Bearer ...');
  pocket.registerAction('Refresh Session', ...);
}

// 변경 후: IIFE + 직접 API 사용
(async () => {
  setHeader('Authorization', 'Bearer ...');
  registerAction('Refresh Session', ...);
  registerAction('Clear Auth', ...);  // 액션 추가
})();
```

### `FunctionsDropdown.tsx` - 이미 구현됨

계획의 Step 3(빈 상태 메시지)은 기존 코드에 이미 구현되어 있었다.

```tsx
<div x-show="actions.length === 0" ...>
  등록된 액션이 없습니다.
</div>
```

별도 수정 불필요.

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| 화살표 함수로 작성된 커스텀 액션도 드롭다운에 표시됨 | ✅ |
| 정규식 기반 함수 이름 추출 코드 제거 | ✅ |
| 함수 파일 로드 실패 시 토스트 메시지 표시 | ✅ (001에서 적용됨) |
| `registerAction`이 유일한 액션 등록 방법임을 문서화 | ✅ (auth.js 주석) |

---

## 계획과 다른 점

- **`pocket` 객체 유지**: 계획은 `registerAction`, `setHeader` 등을 개별 파라미터로만 전달하는 방식이었으나, `pocket` 객체도 함께 전달해 기존 `pocket.xxx()` 스타일과 하위 호환 유지.
- **`FunctionsDropdown.tsx` 수정 불필요**: 빈 상태 메시지가 이미 구현되어 있었음.
- **`auth.js` 미커밋**: `dev/` 폴더가 `.gitignore` 대상이라 커밋 불가. 로컬 예제만 업데이트.
