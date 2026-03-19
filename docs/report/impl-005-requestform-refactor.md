# 구현 결과: 005 - RequestForm.tsx 분리 및 리팩토링

> 구현일: 2026-03-20
> 커밋: `175f937`, `172ad63`
> 계획 문서: [docs/plan/005-requestform-refactor.md](../plan/005-requestform-refactor.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/utils/url.ts` | `resolveUrl()` 순수 함수 신규 생성 |
| `src/utils/code-gen.ts` | `generateFetchCode()` TypeScript 버전 신규 생성 |
| `src/alpine/requestFormState.ts` | Alpine x-data 문자열 생성 함수 신규 생성 |
| `src/components/request-form/FormTabs.tsx` | 탭 UI 컴포넌트 추출 |
| `src/components/request-form/CodeModal.tsx` | 코드 모달 컴포넌트 추출 |
| `src/components/RequestForm.tsx` | 657줄 → 120줄로 감소 |
| `src/components/Toast.tsx` | JSX dot 파싱 오류 수정 (빌드 버그 수정) |

---

## 구현 상세

### 파일 분리 구조

```
src/
├── alpine/
│   └── requestFormState.ts   ← Alpine x-data JS 문자열 생성 (서버사이드)
├── utils/
│   ├── url.ts                ← resolveUrl() 순수 함수
│   └── code-gen.ts           ← generateFetchCode() TypeScript 버전
└── components/
    ├── request-form/
    │   ├── FormTabs.tsx      ← 탭 네비게이션 + 탭 콘텐츠 패널
    │   └── CodeModal.tsx     ← fetch 코드 생성 모달
    └── RequestForm.tsx       ← 조합 레이어 (120줄)
```

### `requestFormState.ts` 패턴

Alpine `x-data`에 들어가는 JavaScript 문자열 전체를 TypeScript 템플릿 리터럴로 생성한다. 서버사이드 데이터(`config`, `initialHeaders`, `uniqueSuggestions`)를 `JSON.stringify()`로 주입하고, 나머지는 브라우저에서 실행될 JS 코드 그대로 포함한다.

```ts
export function requestFormState(
  config: PocketConfig,
  initialHeaders: RequestRow[],
  uniqueSuggestions: string[],
): string {
  return `{
    headers: ${JSON.stringify(initialHeaders)},
    baseUrl: '${config.baseUrl || ''}',
    ...
  }`;
}
```

JSX 내부에서는 `x-data={requestFormState(config, initialHeaders, uniqueSuggestions)}`로 단순 함수 호출로 교체됐다.

### `src/utils/code-gen.ts` — TypeScript 타입 버전

브라우저 Alpine 코드와 별개로, 타입이 있는 TypeScript 버전을 `utils/`에 작성해 향후 테스트나 CLI 도구에서 사용할 수 있도록 했다.

```ts
export interface FetchCodeOptions {
  url: string;
  method: string;
  params: { key: string; value: string; active: boolean }[];
  headers: { key: string; value: string; active: boolean }[];
  bodyType: string;
  bodyContent: string;
}

export function generateFetchCode(opts: FetchCodeOptions): string { ... }
```

### Toast.tsx 빌드 버그 수정

기존 `x-on:show-toast.window` 속성명에 점(`.`)이 포함되어 esbuild JSX 파서가 오류를 냈다. 001 구현 이후 `dist/`가 없었던 이유다.

```tsx
// 수정 전 (JSX 파싱 오류)
x-on:show-toast.window="toasts.push($event.detail); ..."

// 수정 후 (x-init으로 동일 동작)
x-init="window.addEventListener('show-toast', (e) => { toasts.push(e.detail); setTimeout(() => toasts.splice(0, 1), 3000); })"
```

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| `RequestForm.tsx` 200줄 이하로 감소 | ✅ (120줄) |
| Alpine x-data 문자열 별도 파일로 분리 | ✅ (`requestFormState.ts`) |
| `resolveUrl` 순수 함수 추출 | ✅ (`utils/url.ts`) |
| `generateFetchCode` TypeScript 버전 추출 | ✅ (`utils/code-gen.ts`) |
| 빌드 성공 | ✅ |

---

## 계획과 다른 점

- **Toast.tsx 빌드 버그 발견 및 수정**: 계획에 없던 작업이지만 빌드 통과를 위해 함께 수정. `x-on:show-toast.window` → `x-init` 방식으로 전환.
- **`code-gen.ts` 브라우저 공유 없음**: 계획은 TypeScript 버전을 브라우저에서도 활용하는 방향이었으나, Alpine x-data 문자열이 브라우저에서 직접 실행되는 구조라 TypeScript 모듈을 import할 수 없다. `code-gen.ts`는 테스트·CLI용 참조 구현으로만 존재한다. Alpine 쪽 `generateFetchCode()`는 `requestFormState.ts` 안에 JS 문자열로 유지했다.
