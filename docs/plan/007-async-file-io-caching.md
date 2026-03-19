# 007 - 파일 I/O 비동기화 및 자동완성 캐싱

> 우선순위: Medium | 난이도: 중간 | 예상 파일: 2개

---

## 문제

### 1. 동기 파일 읽기로 요청 블로킹

`src/utils/snapshot.ts`의 `getURLSuggestions()`가 스냅샷 파일 전체를 동기로 읽는다.

```ts
// snapshot.ts
const files = readdirSync(snapshotsDir);         // 동기
files.forEach(file => {
  const data = readFileSync(join(...), 'utf8');  // 동기, 매번 전부
  // ...
});
```

스냅샷이 100개만 넘어도 자동완성 요청이 느려진다. Node.js 이벤트 루프를 막으므로 그 동안 다른 요청도 처리되지 않는다.

### 2. 캐싱 없음

자동완성을 요청할 때마다 파일을 전부 다시 읽는다. 스냅샷 목록은 새 요청이 저장될 때만 변하는데, 그 사이의 매 조회에서 전체 파일을 읽는 건 낭비다.

### 3. `src/routes/home.tsx`도 동기

```ts
// home.tsx
const functionFiles = readdirSync(functionsDir);         // 동기
const functions = functionFiles.map(f => readFileSync()); // 동기
```

---

## 해결 방향

1. 모든 파일 I/O를 `async/await` 기반으로 전환
2. URL 제안 목록을 메모리에 캐싱, 스냅샷 저장 시 무효화

---

## 구현 계획

### Step 1. `src/utils/snapshot.ts` 비동기 전환

```ts
import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';

// 기존 동기
export function getURLSuggestions(): string[] { ... }

// 수정: 비동기
export async function getURLSuggestions(): Promise<string[]> {
  const files = await readdir(snapshotsDir).catch(() => []);
  const suggestions = new Set<string>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const raw = await readFile(join(snapshotsDir, file), 'utf8');
        const data = JSON.parse(raw);
        const url = data.request?.url ?? data.meta?.url;
        if (url) suggestions.add(url);
      } catch {
        // 손상된 파일은 건너뜀
      }
    })
  );

  return [...suggestions];
}
```

`Promise.all`로 병렬 읽기하면 직렬 동기 읽기보다 훨씬 빠르다.

### Step 2. 메모리 캐시 추가

```ts
// snapshot.ts
let suggestionsCache: string[] | null = null;

export function invalidateSuggestionsCache() {
  suggestionsCache = null;
}

export async function getURLSuggestions(): Promise<string[]> {
  if (suggestionsCache) return suggestionsCache;

  // ... 파일 읽기 로직 ...

  suggestionsCache = [...suggestions];
  return suggestionsCache;
}

// saveSnapshot 함수 끝에 추가
export async function saveSnapshot(...) {
  // ... 기존 저장 로직 ...
  invalidateSuggestionsCache(); // 저장 후 캐시 무효화
}
```

### Step 3. `src/routes/home.tsx` 비동기 전환

```ts
import { readdir, readFile } from 'node:fs/promises';

// 기존 동기
const functionFiles = readdirSync(functionsDir);

// 수정: 비동기 (Hono 핸들러는 async 지원)
app.get('/', async (c) => {
  const functionFiles = await readdir(functionsDir).catch(() => []);
  const functions = await Promise.all(
    functionFiles
      .filter(f => f.endsWith('.js'))
      .map(async (f) => ({
        name: f,
        code: await readFile(join(functionsDir, f), 'utf8'),
      }))
  );
  // ...
});
```

### Step 4. `saveSnapshot`, `loadSnapshot` 비동기 전환

```ts
// 기존
export function saveSnapshot(data: SnapshotData): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 수정
export async function saveSnapshot(data: SnapshotData): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2));
  invalidateSuggestionsCache();
}
```

`request.tsx` 라우트도 `await saveSnapshot(...)` 으로 업데이트 필요.

---

## 수정 파일 목록

- `src/utils/snapshot.ts` - 전체 비동기 전환 + 캐시 추가
- `src/routes/home.tsx` - 함수 파일 읽기 비동기 전환
- `src/routes/request.tsx` - `saveSnapshot` await 추가
- `src/routes/snapshots.tsx` - `loadSnapshot` await 확인

---

## 완료 기준

- `readdirSync`, `readFileSync`, `writeFileSync` 사용 0건
- `getURLSuggestions` 두 번째 호출부터 캐시 반환
- 새 스냅샷 저장 후 다음 자동완성 요청에서 새 URL 반영
- 동시 요청이 들어와도 파일 I/O로 다른 요청이 블로킹되지 않음
