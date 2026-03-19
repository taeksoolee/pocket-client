# 구현 결과: 008 - 스냅샷 보존 정책

> 구현일: 2026-03-20
> 커밋: `ee69ea8`
> 계획 문서: [docs/plan/008-snapshot-retention-policy.md](../plan/008-snapshot-retention-policy.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/config.ts` | `PocketConfig`에 `maxSnapshots` 추가, `validateConfig` 반영 |
| `src/utils/snapshot.ts` | `pruneSnapshots()` 추가, 파일명 밀리초 추가 |

---

## 구현 상세

### `maxSnapshots` 설정

`PocketConfig`에 추가:
```ts
maxSnapshots?: number; // 0 = 무제한, 기본 200
```

`INTERNAL_DEFAULT`에서 기본값 200으로 설정. `validateConfig()`에도 `typeof raw.maxSnapshots === 'number'` 검증 추가.

`config/default.json`에서 `"maxSnapshots": 0`으로 설정하면 무제한, 설정 파일이 없으면 200개 유지.

### `pruneSnapshots()` 로직

```ts
async function pruneSnapshots(dir: string, max: number): Promise<void> {
  if (max === 0) return;
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  if (files.length <= max) return;
  const toDelete = files.slice(0, files.length - max);
  await Promise.all(toDelete.map((f) => unlink(path.join(dir, f)).catch(() => {})));
}
```

파일명이 `YYMMDDHHmmssmmm_METHOD_URL.json` 형태의 타임스탬프 기반이므로 `sort()`로 정렬하면 자동으로 시간순이 된다. 앞에서부터 초과분을 잘라낸다. `unlink`에 `.catch(() => {})` 처리로 이미 삭제된 파일이 있어도 전체 작업이 실패하지 않는다.

`saveSnapshot()` 내부에서 저장 직후 호출:
```ts
await writeFile(...);
await pruneSnapshots(snapshortsDir, config.maxSnapshots ?? 200);
invalidateSuggestionsCache();
```

### 파일명 밀리초 추가

```ts
// 수정 전: YYMMDDHHmmss (12자리)
const formattedDate = `${y}${m}${d}${hh}${mm}${ss}`;

// 수정 후: YYMMDDHHmmssmmm (15자리)
const ms = timestamp.getMilliseconds().toString().padStart(3, '0');
const formattedDate = `${y}${m}${d}${hh}${mm}${ss}${ms}`;
```

같은 밀리초 내 중복 요청 가능성은 실용적으로 무시할 수준이다.

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| `maxSnapshots: 200` 설정 시 201번째 저장 때 가장 오래된 것 삭제 | ✅ |
| `maxSnapshots: 0` 시 삭제 없음 (무제한) | ✅ |
| 같은 초에 여러 요청 저장해도 파일명 충돌 없음 | ✅ (밀리초 단위) |

---

## 계획과 다른 점

- **`request.tsx` 변경 없음**: `saveSnapshot`에 `maxSnapshots`를 파라미터로 전달하는 대신 `snapshot.ts` 내에서 `config`를 직접 import해서 사용. 호출부 API를 단순하게 유지.
- **사이드바 개수 표시 미구현**: 계획의 Step 4(선택 항목)는 현재 사이드바 구조가 Alpine.js 상태로 동작하므로 서버사이드 숫자를 전달하기 복잡하다. 우선순위가 낮아 생략.
