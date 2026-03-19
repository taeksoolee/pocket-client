# 구현 결과: 010 - 오타 및 코드 일관성 정리

> 구현일: 2026-03-20
> 커밋: `4013049`
> 계획 문서: [docs/plan/010-typo-and-consistency.md](../plan/010-typo-and-consistency.md)

---

## 변경 파일

| 파일 | 작업 |
|------|------|
| `src/components/partials/SnapshortCard.tsx` | → `SnapshotCard.tsx`로 파일명 변경 |
| `src/utils/snapshot.ts` | 디렉토리 경로 `snapshorts` → `snapshots`, 날짜 유틸 사용 |
| `src/routes/snapshots.tsx` | import 경로 수정, 날짜 유틸 사용 |
| `src/routes/request.tsx` | 날짜 유틸 사용 |
| `src/components/RequestForm.tsx` | `hx-target="#snapshot"` |
| `src/components/SidebarList.tsx` | `hx-target="#snapshot"` |
| `src/components/Home.tsx` | `id="snapshot"` |
| `src/components/Sidebar.tsx` | `🕒 Snapshots` |
| `src/components/partials/SuccessCard.tsx` | `snapshots/` 경로 표시 수정 |
| `src/components/Layout.tsx` | `lang="en"` |
| `src/index.tsx` | 마이그레이션 코드 추가 |
| `src/utils/date.ts` | 신규 — 날짜 포맷 유틸 |

---

## 구현 상세

### `snapshort` → `snapshot` 전면 교체

영향 범위:

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일명 | `SnapshortCard.tsx` | `SnapshotCard.tsx` |
| 디렉토리 | `snapshorts/` | `snapshots/` |
| HTMX target | `#snapshort` | `#snapshot` |
| HTML id | `id="snapshort"` | `id="snapshot"` |
| UI 텍스트 | `🕒 Snapshorts` | `🕒 Snapshots` |
| SuccessCard 경로 | `snapshorts/{filename}` | `snapshots/{filename}` |

### 기존 데이터 자동 마이그레이션 (`index.tsx`)

서버 시작 시 `snapshorts/` 폴더가 존재하고 `snapshots/`가 없으면 자동 rename:

```ts
const legacySnapshotsDir = join(workspaceDir, 'snapshorts');
const snapshotsDir = join(workspaceDir, 'snapshots');
if (existsSync(legacySnapshotsDir) && !existsSync(snapshotsDir)) {
  renameSync(legacySnapshotsDir, snapshotsDir);
  console.log('📦 snapshorts → snapshots 폴더 자동 이름 변경 완료');
}
```

### 날짜 포맷 유틸 통합 (`src/utils/date.ts`)

```ts
export function formatFileTimestamp(date = new Date()): string { ... }   // YYMMDDHHmmssmmm
export function formatDisplayTimestamp(date = new Date()): string { ... } // YYYY-MM-DD HH:mm:ss
```

`snapshot.ts`, `request.tsx`, `snapshots.tsx` 세 곳에서 중복으로 작성하던 날짜 포맷 코드를 모두 이 함수로 대체했다.

### `lang="en"` 수정

`Layout.tsx`의 `<html lang="ko">` → `<html lang="en">`. 도구 자체는 언어 독립적이므로 `en`이 적절하다.

---

## 완료 기준 달성 여부

| 기준 | 결과 |
|------|------|
| 코드베이스 `snapshort` (주석/마이그레이션 변수 제외) 0건 | ✅ |
| 기존 `snapshorts/` 폴더 데이터 자동 마이그레이션 | ✅ |
| 날짜 포맷 코드 중복 제거 | ✅ |
| `lang="en"` 수정 | ✅ |
