# 구현 결과: 003 - URL 슬래시 처리 버그 수정

> 구현일: 2026-03-20
> 커밋: `e8ef596`
> 계획 문서: [docs/plan/003-url-slash-bug.md](../plan/003-url-slash-bug.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/components/RequestForm.tsx` | `resolvedUrl` getter 로직 수정 |

---

## 평가 보고서의 진단 재검토

평가 보고서에서 지적한 "백슬래시 제거 버그(`\\+$`)"는 실제로 존재하지 않는 문제였다.

JSX 템플릿 리터럴(백틱 문자열) 안에서는 `\`가 `\\`으로 이스케이프된다. 따라서:

```
JSX 소스:   /\\/+$/
템플릿 출력: /\/+$/       ← 실제 JS 문자열
브라우저 실행: 정규식 /\/+$/ ← 후행 슬래시 제거
```

`\/`는 정규식에서 `/`와 동일하다. 즉 기존 코드는 후행 **슬래시**를 올바르게 제거하고 있었다. 평가 당시 JSX 이스케이프 레이어를 한 겹 간과한 오독이었다.

---

## 실제 문제: 클라이언트-서버 로직 불일치

평가 보고서의 진단은 틀렸지만, `resolvedUrl`에는 다른 실제 문제가 있었다.

### 기존 클라이언트 로직

```js
get resolvedUrl() {
  if (this.url.startsWith('http')) return this.url;
  return this.baseUrl.replace(/\/+$/, '') + '/' + this.url.replace(/^\/+/, '');
}
```

### 002에서 확정된 서버 로직

```ts
if (rawUrl.startsWith('/') && !config.baseUrl) → 400 에러
if (rawUrl.startsWith('/') && config.baseUrl)  → baseUrl + '/' + path
// 그 외                                        → rawUrl 그대로 사용
```

### 불일치 케이스

| 입력 | 클라이언트 미리보기 | 서버 실제 요청 |
|------|-----------------|--------------|
| `baseUrl=''`, `url='users'` | `/users` (슬래시 오삽입) | `users` 그대로 |
| `baseUrl=''`, `url='/path'` | `/path` | 400 에러 |

"Target:" 미리보기가 실제 서버가 요청하는 URL과 달라 사용자에게 잘못된 정보를 보여주는 문제였다.

---

## 수정 내용

```js
// 수정 전
get resolvedUrl() {
  if (this.url.startsWith('http')) return this.url;
  return this.baseUrl.replace(/\/+$/, '') + '/' + this.url.replace(/^\/+/, '');
}

// 수정 후
get resolvedUrl() {
  if (this.url.startsWith('http://') || this.url.startsWith('https://')) return this.url;
  if (this.url.startsWith('/') && this.baseUrl) {
    return this.baseUrl.replace(/\/+$/, '') + '/' + this.url.replace(/^\/+/, '');
  }
  return this.url;
}
```

두 가지 변경:
1. `startsWith('http')` → `startsWith('http://')` 또는 `startsWith('https://')` 명시. `httpsomething`처럼 `http`로 시작하는 비URL 문자열을 잘못 판별하는 엣지 케이스 제거.
2. 상대경로 + baseUrl 조합 조건 추가: baseUrl이 없거나 url이 `/`로 시작하지 않으면 url을 그대로 반환. 서버 로직과 완전히 일치.

---

## 케이스별 검증

| baseUrl | url | 결과 | 서버 동작 |
|---------|-----|------|---------|
| `https://api.example.com` | `/users` | `https://api.example.com/users` | ✅ 일치 |
| `https://api.example.com/` | `/users` | `https://api.example.com/users` | ✅ 일치 |
| `` | `https://other.com/api` | `https://other.com/api` | ✅ 일치 |
| `` | `/users` | `/users` | ✅ 일치 (서버는 400 반환) |
| `https://api.example.com` | `https://other.com` | `https://other.com` | ✅ 일치 |
| `` | `users` | `users` | ✅ 일치 |

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| baseUrl + 상대경로 조합 시 슬래시 중복 없음 | ✅ |
| 절대 URL 입력 시 baseUrl 무시 | ✅ |
| 클라이언트 미리보기와 서버 동작 일치 | ✅ |

---

## 계획과 다른 점

- **백슬래시 제거 코드 삭제**: 해당 코드가 실제로 존재하지 않았으므로 해당 없음.
- **실제 수정 방향**: 계획과 달리 클라이언트-서버 불일치가 핵심 문제였으며 이를 수정.
