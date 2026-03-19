# 개선 계획 인덱스

> 기반 문서: [평가 보고서](../report/evaluation.md)
> 작성일: 2026-03-19

---

## 작업 순서

앞 번호 작업이 뒤 번호 작업의 기반이 된다. 특히 001~004는 005(리팩토링) 전에 완료해야 한다.

```
001 → 002 → 003 → 004 ─┐
                        ├→ 005 → 006 → 007 → 008 → 009 → 010
```

---

## 작업 목록

| 번호 | 제목 | 우선순위 | 난이도 | 상태 |
|------|------|----------|--------|------|
| [001](./001-silent-error-handling.md) | 무음 실패(Silent Failure) 제거 | Critical | 낮음 | 대기 |
| [002](./002-request-input-validation.md) | request.tsx 입력 검증 강화 | Critical | 낮음 | 대기 |
| [003](./003-url-slash-bug.md) | URL 슬래시 처리 버그 수정 | Critical | 낮음 | 대기 |
| [004](./004-custom-function-arrow-support.md) | 커스텀 함수 화살표 함수 지원 | High | 중간 | 대기 |
| [005](./005-request-form-refactor.md) | RequestForm.tsx 분리 및 리팩토링 | High | 높음 | 대기 |
| [006](./006-type-safety.md) | 타입 안전성 강화 | Medium | 중간 | 대기 |
| [007](./007-async-file-io-caching.md) | 파일 I/O 비동기화 및 자동완성 캐싱 | Medium | 중간 | 대기 |
| [008](./008-snapshot-retention-policy.md) | 스냅샷 보존 정책 | Medium | 낮음 | 대기 |
| [009](./009-request-cancel-button.md) | 요청 중단 버튼 UI | Medium | 낮음 | 대기 |
| [010](./010-typo-and-consistency.md) | 오타 및 코드 일관성 정리 | Low | 낮음 | 대기 |

---

## 작업별 영향 파일 요약

| 파일 | 관련 작업 |
|------|----------|
| `src/components/RequestForm.tsx` | 001, 002, 003, 004, 005, 009 |
| `src/routes/request.tsx` | 002, 007, 008, 009 |
| `src/utils/snapshot.ts` | 007, 008, 010 |
| `src/types/index.ts` | 002, 006, 008 |
| `src/config.ts` | 006, 008 |
| `src/components/Layout.tsx` | 001, 010 |
| `src/components/SidebarList.tsx` | 001, 010 |
| `src/components/FunctionsDropdown.tsx` | 004 |
| `src/routes/home.tsx` | 007 |
| `src/routes/templates.tsx` | 006 |

---

## 완료 시 기대 효과

- **에러 피드백**: 모든 실패 상황에서 사용자가 이유를 알 수 있음
- **안정성**: 잘못된 입력으로 런타임 에러 없음
- **유지보수성**: RequestForm.tsx 200줄 이하, 로직이 타입 체크 가능한 구조
- **성능**: 자동완성 캐싱, 파일 I/O 비동기화
- **기능**: 요청 중단, 스냅샷 자동 정리
- **일관성**: 오타 제거, 중복 코드 제거
