# 010 - 오타 및 코드 일관성 정리

> 우선순위: Low | 난이도: 낮음 | 예상 파일: 다수 (기계적 수정)

---

## 문제

### 1. "Snapshort" 오타

`snapshot`이 맞는 영어인데 코드 전체에 `snapshort`로 통일되어 있다.

```
snapshorts/                     ← 폴더명
SnapshortCard.tsx               ← 컴포넌트 파일명
/snapshorts/:filename           ← 라우트 경로
hx-get="/snapshorts/..."        ← HTMX 속성
```

의도적인 브랜딩인지 오타인지 불명확하다. **오타로 판단하고 수정**한다.

### 2. `lang="ko"` 하드코딩

```tsx
// Layout.tsx
<html lang="ko">
```

영어 환경 사용자나 다른 언어 환경에서 어색하다. 도구 자체가 언어 종속적인 이유가 없다.

### 3. 파일명 대소문자 불일치

```
src/components/partials/SnapshortCard.tsx   ← Snapshort (오타)
src/components/partials/SuccessCard.tsx
src/components/partials/ErrorCard.tsx
```

### 4. 날짜 포맷 코드 중복

`request.tsx`와 `snapshot.ts` 양쪽에 날짜 포맷 코드가 각자 있다.

```ts
// request.tsx
const yy = String(now.getFullYear()).slice(-2);
const mm = String(now.getMonth() + 1).padStart(2, '0');
// ...

// snapshot.ts에도 유사한 코드
```

---

## 해결 방향

- `snapshort` → `snapshot` 전면 교체 (파일명, 라우트, 변수명, 주석)
- `lang="ko"` 제거 또는 `lang="en"`으로 변경
- 날짜 포맷 유틸 함수로 통합

---

## 구현 계획

### Step 1. `snapshort` → `snapshot` 전면 교체

**영향 범위:**

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 폴더명 | `snapshorts/` | `snapshots/` |
| 라우트 | `/snapshorts/:filename` | `/snapshots/:filename` |
| 파일명 | `SnapshortCard.tsx` | `SnapshotCard.tsx` |
| 컴포넌트명 | `SnapshortCard` | `SnapshotCard` |
| 변수명 | `snapshort`, `snapshorts` | `snapshot`, `snapshots` |
| HTML 속성 | `hx-get="/snapshorts/..."` | `hx-get="/snapshots/..."` |
| `config.ts` | `snapshortsDir` | `snapshotsDir` |

**주의:** 폴더명 변경 시 기존 `snapshorts/` 폴더의 데이터 마이그레이션 필요.

```ts
// src/index.tsx - 기존 snapshorts 폴더가 있으면 snapshots로 이동
import { existsSync, renameSync } from 'node:fs';

const legacyDir = join(basePath, 'snapshorts');
const newDir = join(basePath, 'snapshots');
if (existsSync(legacyDir) && !existsSync(newDir)) {
  renameSync(legacyDir, newDir);
  console.log('snapshorts → snapshots 폴더 이름 자동 변경 완료');
}
```

### Step 2. `lang` 속성 수정

```tsx
// Layout.tsx
// 변경 전
<html lang="ko">

// 변경 후
<html lang="en">
```

UI 텍스트가 한국어 혼재라면 추후 i18n 작업에서 정리. 지금은 `en`이 더 적절.

### Step 3. 날짜 포맷 유틸 통합

```ts
// src/utils/date.ts (신규)
export function formatTimestamp(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  const SS = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${yy}${mm}${dd}${HH}${MM}${SS}${ms}`;
}
```

`request.tsx`, `snapshot.ts` 양쪽에서 이 함수를 import해 사용.

---

## 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `src/components/partials/SnapshortCard.tsx` | 파일명 변경 → `SnapshotCard.tsx`, 컴포넌트명 변경 |
| `src/routes/snapshots.tsx` | 라우트 경로 변경 (이미 `snapshots`인지 확인) |
| `src/config.ts` | `snapshortsDir` → `snapshotsDir` |
| `src/components/Layout.tsx` | `lang="ko"` → `lang="en"` |
| `src/components/SidebarList.tsx` | HTMX URL 경로 변경 |
| `src/components/Home.tsx` | 관련 변수명 변경 |
| `src/index.tsx` | 폴더 마이그레이션 코드 추가 |
| `src/utils/date.ts` | 날짜 포맷 유틸 신규 생성 |
| `src/routes/request.tsx` | 날짜 포맷 코드 → `formatTimestamp()` 사용 |
| `src/utils/snapshot.ts` | 날짜 포맷 코드 → `formatTimestamp()` 사용 |

---

## 완료 기준

- 코드베이스에서 `snapshort` (단수/복수) 0건
- 기존 `snapshorts/` 폴더 데이터 자동 마이그레이션
- 날짜 포맷 코드 중복 제거
- `lang="en"` 또는 적절한 값으로 수정
