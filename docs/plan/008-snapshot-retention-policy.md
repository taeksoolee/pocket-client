# 008 - 스냅샷 보존 정책

> 우선순위: Medium | 난이도: 낮음 | 예상 파일: 3개

---

## 문제

스냅샷이 매 요청마다 저장되는데 삭제 정책이 없다. 하루에 100번 요청하면 한 달에 3,000개. 수동으로 지우거나 사이드바에서 하나씩 삭제하지 않으면 폴더가 계속 커진다.

또한 파일명 생성 로직에 충돌 가능성이 있다:

```ts
// 현재 파일명 패턴
// YYMMDDHHmmss_METHOD_URL.substring(0, 50).json
// → 260319143022_GET_users_profile_settings.json
```

같은 초 안에 여러 요청이 들어오면 파일명이 겹친다. 기존 파일을 덮어쓴다.

---

## 해결 방향

1. 설정에 `maxSnapshots` 옵션 추가 - 초과 시 오래된 것부터 삭제
2. 파일명에 밀리초 또는 카운터 추가로 충돌 방지

---

## 구현 계획

### Step 1. `config/default.json`에 `maxSnapshots` 추가

```json
{
  "port": 3000,
  "baseUrl": "",
  "timeout": 10000,
  "globalHeaders": {},
  "commonEndpoints": [],
  "maxSnapshots": 200
}
```

`0` 또는 필드 없으면 무제한. `PocketConfig` 타입에도 추가:

```ts
export interface PocketConfig {
  // ...기존 필드
  maxSnapshots: number; // 0 = 무제한
}
```

### Step 2. `snapshot.ts` - 저장 후 정리 로직

```ts
async function pruneSnapshots(max: number): Promise<void> {
  if (max === 0) return; // 무제한

  const files = await readdir(snapshotsDir);
  const jsonFiles = files
    .filter(f => f.endsWith('.json'))
    .sort(); // 파일명이 타임스탬프 기반이므로 정렬 = 시간순

  if (jsonFiles.length <= max) return;

  const toDelete = jsonFiles.slice(0, jsonFiles.length - max);
  await Promise.all(
    toDelete.map(f => unlink(join(snapshotsDir, f)).catch(() => {}))
  );
}

export async function saveSnapshot(data: SnapshotData, maxSnapshots: number): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2));
  await pruneSnapshots(maxSnapshots);
  invalidateSuggestionsCache();
}
```

### Step 3. 파일명 충돌 방지

```ts
// 현재
const timestamp = `${yy}${mm}${dd}${HH}${MM}${SS}`;

// 수정: 밀리초 추가
const ms = String(now.getMilliseconds()).padStart(3, '0');
const timestamp = `${yy}${mm}${dd}${HH}${MM}${SS}${ms}`;
// → 260319143022123_GET_users.json
```

같은 밀리초 충돌 가능성이 남지만 실용적으로 충분함. 완벽히 막으려면 UUID 접미사를 추가할 수 있으나 파일명 가독성이 떨어지므로 밀리초로 충분하다.

### Step 4. 사이드바에 현재 스냅샷 개수 표시 (선택)

```tsx
// Sidebar.tsx - 탭 헤더에 개수 표시
<span class="text-xs text-gray-400">({snapshotCount}/{maxSnapshots || '∞'})</span>
```

---

## 수정 파일 목록

- `src/config.ts` - `maxSnapshots` 필드 추가 및 기본값 설정
- `src/types/index.ts` - `PocketConfig`에 `maxSnapshots` 추가
- `src/utils/snapshot.ts` - `pruneSnapshots` 함수 추가, 파일명 밀리초 추가
- `src/routes/request.tsx` - `saveSnapshot` 호출 시 `config.maxSnapshots` 전달
- `config/default.json` (사용자 폴더) - 필드 추가 예시 문서화

---

## 완료 기준

- `maxSnapshots: 200` 설정 시 201번째 저장 때 가장 오래된 것 자동 삭제
- `maxSnapshots: 0` 시 삭제 없음 (무제한)
- 같은 초에 여러 요청 저장해도 파일명 충돌 없음
- 기존 스냅샷 파일은 건드리지 않음 (새로 저장되는 것부터 적용)
