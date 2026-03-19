# 004 - 커스텀 함수: 화살표 함수 지원 및 정규식 개선

> 우선순위: High | 난이도: 중간 | 예상 파일: 2개

---

## 문제

`RequestForm.tsx`에서 커스텀 함수 파일의 함수 이름을 정규식으로 추출한다.

```tsx
// 현재 정규식
matchAll(/(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)/g)
```

이 정규식은 `function` 키워드 선언 방식만 인식한다. 현대 JS에서 흔히 쓰는 패턴들은 전부 무시된다:

```js
// 인식 안 됨
const getToken = async () => { ... }
const fetchUser = function() { ... }
export const refreshToken = async () => { ... }
class ApiHelper { getToken() { ... } }
```

결과적으로 사용자가 화살표 함수로 함수를 작성하면 드롭다운에 아무것도 뜨지 않고, 어떤 피드백도 없다.

---

## 해결 방향

정규식 기반 파싱을 버리고, 함수 파일이 명시적으로 등록하는 방식으로 전환한다. `registerAction` API를 활용하면 함수 이름 추출 자체가 불필요해진다.

---

## 구현 계획

### 방향 전환: 정규식 파싱 → `registerAction` 중심

현재 `auth.js` 예제는 이미 `registerAction`을 사용하고 있다. 이 방식으로 통일하면 함수 이름을 따로 추출할 필요가 없다.

```js
// dev/functions/auth.js (현재 방식 - 이미 올바름)
registerAction('Get Token', async () => {
  // ...
});
```

문제는 `registerAction`이 등록한 액션 목록을 수집하는 방식이 현재 정규식과 함께 얽혀 있다는 것.

### Step 1. 함수 로딩 로직 수정 (`RequestForm.tsx`)

정규식 추출 코드 전체 제거. 대신 각 파일의 코드를 실행할 때 `registerAction`을 통해서만 액션이 등록되도록 단순화:

```js
// 현재: 정규식으로 함수 이름 추출 후 개별 실행
// 수정: 파일 실행 → registerAction이 호출됨 → PocketActions에 자동 등록

function runCustomFunctions(functionsMap) {
  window.PocketActions = {};

  // registerAction API 제공
  window.registerAction = (name, fn) => {
    window.PocketActions[name] = fn;
  };

  // 각 파일 실행 (함수 이름 추출 불필요)
  for (const [fileName, code] of Object.entries(functionsMap)) {
    try {
      const fn = new Function('registerAction', 'setHeader', 'setUrl', 'setMethod', code);
      fn(window.registerAction, window.setHeader, window.setUrl, window.setMethod);
    } catch (e) {
      showToast(`함수 파일 로드 실패 [${fileName}]: ${e.message}`);
    }
  }
}
```

### Step 2. 함수 파일 API 문서 정비

`registerAction`만 지원하는 것으로 명확히 하고, README 및 예제 파일 업데이트:

```js
// functions/example.js 예제 업데이트
// registerAction(이름, 비동기함수) 으로 액션 등록
registerAction('Get Token', async () => {
  const res = await fetch('/auth/token');
  const { token } = await res.json();
  setHeader('Authorization', `Bearer ${token}`);
});

registerAction('Clear Auth', () => {
  setHeader('Authorization', '');
});
```

### Step 3. 등록된 액션 없을 때 UI 피드백

```tsx
// FunctionsDropdown.tsx
// 액션이 하나도 없을 때 안내 메시지
{Object.keys(actions).length === 0 && (
  <p class="text-xs text-gray-400 px-3 py-2">
    functions/ 폴더에 registerAction()을 사용한 .js 파일을 추가하세요
  </p>
)}
```

---

## 수정 파일 목록

- `src/components/RequestForm.tsx` - 정규식 함수 추출 코드 제거, 함수 로딩 로직 단순화
- `src/components/FunctionsDropdown.tsx` - 빈 상태 메시지 추가
- `dev/functions/auth.js` - 주석 업데이트 (이미 올바른 방식이므로 최소 수정)
- `README.md` - 커스텀 함수 작성 가이드 업데이트

---

## 완료 기준

- 화살표 함수로 작성된 커스텀 액션도 드롭다운에 표시됨
- 정규식 기반 함수 이름 추출 코드 제거
- 함수 파일 로드 실패 시 토스트 메시지 표시
- `registerAction`이 유일한 액션 등록 방법임을 문서화
