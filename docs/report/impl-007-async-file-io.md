# 구현 결과: 007 - 파일 I/O 비동기화 및 자동완성 캐싱

> 구현일: 2026-03-20
> 커밋: `1c1aa0f`
> 계획 문서: [docs/plan/007-async-file-io-caching.md](../plan/007-async-file-io-caching.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/utils/snapshot.ts` | 전체 비동기 전환 + URL 자동완성 캐시 추가 |
| `src/routes/home.tsx` | 함수/템플릿 파일 읽기 비동기 전환 |
| `src/routes/request.tsx` | `saveSnapshot` → `await saveSnapshot` |
| `src/routes/snapshots.tsx` | `getSnapshot`, `deleteSnapshot` await 추가 |
| `src/routes/templates.tsx` | `readFile`, `writeFile`, `unlink` 비동기 전환 |

---

## 구현 상세

### `snapshot.ts` 비동기 전환

모든 동기 fs 호출을 `fs/promises`로 교체하고, `mkdir({ recursive: true })`로 디렉토리 생성도 비동기화했다.

```ts
import { readdir, readFile, unlink, writeFile, mkdir } from 'node:fs/promises';
```

`getURLSuggestions()`는 `Promise.all`로 스냅샷 파일을 병렬 읽기한다:

```ts
await Promise.all(
  files.map(async (file) => {
    try {
      const content = await readFile(path.join(snapshortsDir, file), 'utf-8');
      // ...
    } catch { /* 손상된 파일 건너뜀 */ }
  }),
);
```

### URL 자동완성 캐시

```ts
let suggestionsCache: string[] | null = null;

export function invalidateSuggestionsCache() {
  suggestionsCache = null;
}

export async function getURLSuggestions(): Promise<string[]> {
  if (suggestionsCache) return suggestionsCache;
  // ... 파일 읽기 ...
  suggestionsCache = Array.from(paths);
  return suggestionsCache;
}
```

`saveSnapshot()` 끝에서 `invalidateSuggestionsCache()`를 호출해 새 URL이 다음 조회에 즉시 반영된다.

### `config.ts` 예외 처리

`config.ts`의 `readFileSync` 2건은 서버 시작 시 1회 실행되는 초기화 코드다. 이벤트 루프 블로킹과 무관하므로 유지했다. 나머지 요청 처리 경로의 동기 I/O는 모두 제거됐다.

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| 요청 처리 경로 `readdirSync`/`readFileSync`/`writeFileSync` 0건 | ✅ (config.ts 시작 초기화 제외) |
| `getURLSuggestions` 두 번째 호출부터 캐시 반환 | ✅ |
| 새 스냅샷 저장 후 다음 자동완성에서 새 URL 반영 | ✅ (saveSnapshot → invalidateSuggestionsCache) |
| 동시 요청 시 파일 I/O로 다른 요청 블로킹 없음 | ✅ |
