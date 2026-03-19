# Pocket Client - 프로젝트 개요 보고서

> 작성일: 2026-03-19

---

## 1. 프로젝트 한 줄 요약

**Pocket Client**는 프로젝트 폴더 안에 직접 내장할 수 있는 로컬 HTTP API 클라이언트 도구다. 단일 번들 파일(`server.mjs`)로 배포되며, 요청 기록을 Git으로 추적 가능한 JSON 파일로 저장한다.

---

## 2. 왜 만들었나

Postman, Insomnia 같은 외부 클라이언트는 다음 문제를 가진다:

- 요청 기록이 로컬 클라이언트에 갇혀 팀원과 공유가 어렵다
- 프로젝트별 API 컨텍스트(baseUrl, 인증 헤더)를 매번 재설정해야 한다
- 클라우드 동기화를 강제하거나 유료 플랜이 필요하다

Pocket Client는 이를 해결하기 위해:
- 프로젝트 폴더 내 `config/`, `templates/`, `snapshorts/` 폴더로 모든 데이터를 관리
- Git에 함께 커밋 가능한 파일 기반 저장 구조
- 단일 `.mjs` 파일로 어느 프로젝트에나 붙여 넣기 가능한 구조

---

## 3. 기술 스택

| 분류 | 기술 |
|------|------|
| **웹 프레임워크** | [Hono](https://hono.dev/) v4.6 (Node.js 어댑터) |
| **UI 렌더링** | Hono JSX (서버사이드 렌더링) |
| **동적 UI** | [HTMX](https://htmx.org/) v2 + [Alpine.js](https://alpinejs.dev/) v3 |
| **스타일** | [Tailwind CSS](https://tailwindcss.com/) v4 |
| **번들러** | [esbuild](https://esbuild.github.io/) |
| **언어** | TypeScript |
| **패키지 매니저** | pnpm |

> 프로덕션 빌드 시 HTMX, Alpine.js를 인라인으로 번들링해 외부 CDN 의존성 없이 동작한다.

---

## 4. 프로젝트 구조

```
pocket-client/
├── src/
│   ├── index.tsx              # 앱 진입점, 서버 초기화 및 라우트 등록
│   ├── config.ts              # 설정 파일 로더, 경로 헬퍼
│   ├── types/index.ts         # RequestRow, RequestPayload 타입 정의
│   ├── components/
│   │   ├── Layout.tsx         # HTML 레이아웃 (CSS/JS 로드)
│   │   ├── Home.tsx           # 메인 페이지
│   │   ├── RequestForm.tsx    # 핵심 요청 폼 (탭 UI, 자동완성)
│   │   ├── Sidebar.tsx        # 크기 조절 가능한 사이드바
│   │   ├── SidebarList.tsx    # 스냅샷/템플릿 목록 아이템
│   │   ├── FunctionsDropdown.tsx  # 커스텀 함수 액션 드롭다운
│   │   └── partials/
│   │       ├── SuccessCard.tsx    # 성공 응답 뷰
│   │       ├── ErrorCard.tsx      # 에러 응답 뷰
│   │       └── SnapshortCard.tsx  # 스냅샷 카드
│   ├── routes/
│   │   ├── home.tsx           # GET / (메인 페이지, 사이드바)
│   │   ├── request.tsx        # POST /request (HTTP 프록시)
│   │   ├── snapshots.tsx      # GET/DELETE /snapshots/:filename
│   │   └── templates.tsx      # GET/POST/DELETE /templates/:name
│   └── utils/
│       └── snapshot.ts        # 스냅샷 파일 I/O 유틸리티
├── config/                    # 사용자 설정 (default.json, dev.json 등)
├── functions/                 # 커스텀 JS 함수 파일
├── templates/                 # 저장된 요청 템플릿
├── snapshorts/                # 자동 저장된 API 응답 스냅샷
├── build.js                   # 프로덕션 빌드 스크립트
├── dev.js                     # 개발 모드 워치 스크립트
└── tailwind.config.js
```

---

## 5. 핵심 기능

### 5.1 HTTP 요청 빌더

`RequestForm.tsx`가 중심 컴포넌트. Alpine.js로 리액티브 상태를 관리하며 다음 탭을 제공한다:

- **Params**: 쿼리 파라미터를 키-값 쌍으로 편집
- **Headers**: 요청 헤더 편집
- **Body**: 폼 데이터 또는 JSON 바디
- **Raw JSON**: 요청 전체를 JSON으로 직접 편집

GUI 뷰와 Raw JSON 뷰 간 전환 가능하며, URL 미리보기(baseUrl + 경로 합산)를 실시간으로 보여준다.

### 5.2 계층적 설정 관리

```json
// config/default.json
{
  "port": 4000,
  "baseUrl": "https://api.example.com",
  "timeout": 5000,
  "globalHeaders": {
    "Authorization": "Bearer TOKEN"
  },
  "commonEndpoints": ["/auth/login", "/users"]
}
```

`POCKET_ENV=dev` 환경변수를 설정하면 `config/dev.json`을 `default.json` 위에 딥 머지하여 오버라이드한다.

### 5.3 스냅샷 (응답 자동 저장)

매 요청마다 `snapshorts/` 폴더에 JSON 파일로 저장된다.

```
snapshorts/260319143022_GET_users_me.json
```

저장 내용: 요청 메서드/URL/헤더/바디, 응답 상태/헤더/바디/소요시간

### 5.4 템플릿

자주 쓰는 요청을 `templates/` 폴더에 저장해 재사용한다. HTMX로 사이드바에서 즉시 로드 가능하다.

### 5.5 커스텀 함수 엔진

`functions/*.js` 파일을 로드해 실행한다. Pocket API(`setHeader`, `setUrl`, `setMethod`, `registerAction`)에 접근할 수 있어 토큰 자동 갱신, 인증 헤더 주입 등을 스크립트로 자동화할 수 있다.

```js
// functions/auth.js 예시
registerAction('Refresh Token', async () => {
  const token = await fetchNewToken();
  setHeader('Authorization', `Bearer ${token}`);
});
```

DevTools 브레이크포인트 디버깅을 위한 `//# sourceURL=` 매핑도 지원한다.

### 5.6 코드 생성

"Get Code" 버튼 클릭 시 현재 요청을 네이티브 `fetch()` 코드로 변환해 클립보드에 복사한다.

### 5.7 크기 조절 가능한 사이드바

- Snapshots / Templates 탭 전환
- 마우스 드래그로 너비 조절 (280~600px, localStorage 유지)
- HTMX로 아이템 선택 및 삭제

---

## 6. 요청 처리 흐름

```
[브라우저 - Alpine.js]
    ↓ HTMX POST /request
[Hono 라우트 - request.tsx]
    ↓ baseUrl 합산 + globalHeaders 머지
[Node.js fetch()]
    ↓ AbortController 타임아웃 적용
[외부 API 서버]
    ↓ 응답 수신
[snapshot.ts] → snapshorts/*.json 저장
    ↓
[SuccessCard / ErrorCard] → HTMX 응답으로 렌더링
```

---

## 7. 빌드 및 배포

### 개발

```bash
pnpm dev
# esbuild watch + Tailwind watch + 서버 자동 재시작
# 출력: dev/server.mjs (미니파이 없음)
```

### 프로덕션 빌드

```bash
pnpm build
# Tailwind 미니파이 + esbuild 번들 + HTMX/Alpine 인라인 포함
# 출력: dist/server.mjs (단일 파일)
```

### 다른 프로젝트에 적용

```bash
# 1. dist/server.mjs를 대상 프로젝트에 복사
cp dist/server.mjs /my-project/pocket/server.mjs

# 2. 설정 폴더 구성
mkdir -p /my-project/pocket/config
echo '{"baseUrl": "http://localhost:8080"}' > /my-project/pocket/config/default.json

# 3. 실행
node /my-project/pocket/server.mjs
# → http://localhost:3000 접속
```

---

## 8. 현재 개발 상태

최근 커밋 기준으로 RequestForm 컴포넌트 중심의 UI 개선 작업이 진행 중이다:

- URL 미리보기 기능 추가
- 코드 생성 및 클립보드 복사 기능
- 탭 UI 여백 및 버튼 높이 조정
- 기본 URL 표시 및 템플릿 저장 버튼

---

## 9. 코드 품질 기준

| 항목 | 설정 |
|------|------|
| **ESLint** | TypeScript strict, import 자동 정렬, 미사용 코드 감지 |
| **Prettier** | 줄 너비 100자, 들여쓰기 2칸, trailing comma |
| **TypeScript** | strict 모드, Hono JSX |
| **Tailwind** | `src/` 폴더만 콘텐츠 스캔 |

---

## 10. 라이선스

MIT License
