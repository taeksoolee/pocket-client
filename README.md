# Pocket Client 🚀

**Embedded API Workspace for Real Engineers.**

Pocket Client는 외부 플랫폼(Postman, Insomnia 등)이나 클라우드에 의존하지 않고, 당신의 프로젝트 폴더 내부에 직접 내장(Embedded)되는 초경량 로컬 API 클라이언트입니다. 모든 요청과 응답은 JSON 파일로 박제되어 당신의 코드와 함께 Git으로 완벽하게 추적 및 관리됩니다.

## ✨ Key Philosophies

- **Embedded**: 프로젝트 루트의 독립된 폴더 안에서 모든 것이 해결됩니다. 무거운 데스크톱 앱 설치가 필요 없습니다.
- **Git-Driven**: API 히스토리(Request/Response)는 커밋 대상입니다. 팀원과 공유하기 위해 컬렉션을 Export/Import 할 필요가 없습니다.
- **Zero-Dependency**: 번들링된 단일 `server.mjs` 파일만 있으면 실행 환경 준비가 끝납니다 (Node.js 환경).
- **File-based Config**: 환경별 URL, 전역 헤더 등의 설정은 `config/` 디렉터리 내의 파일로 분리하여 코드를 건드리지 않고 유연하게 관리합니다.
- **Scriptable Runtime**: 자바스크립트를 이용해 인증 토큰 갱신 루프나 복잡한 상태 제어 로직을 앱 런타임에 직접 프로그래밍하여 주입할 수 있습니다.
- **AI-Ready**: 구조화된 로컬 JSON 데이터는 AI 에이전트가 API 타입을 생성하거나 테스트 코드를 작성하기 위한 최적의 컨텍스트를 제공합니다.

## 🚀 Features

- **Smart Autocomplete**: 과거 실행 기록과 `config`에 정의된 엔드포인트를 분석하여 지능적인 경로 추천 기능을 제공합니다.
- **BaseURL Resolver**: `/`로 시작하는 상대 경로 입력 시, 설정된 `baseUrl`과 자동으로 결합하여 요청을 수행합니다. (실시간 Target URL 프리뷰 지원)
- **Request Timeout**: 설정 파일(`timeout`)을 통해 요청별 최대 대기 시간을 제어하여 무한 대기 현상을 방지합니다.
- **Layered Configuration**: `default.json`을 기본으로 환경별(`POCKET_ENV`) 설정을 병합(Merge)하여 관리할 수 있습니다.
- **Custom Function Engine**: 로컬 환경에 작성된 커스텀 JS 스크립트를 SSR 방식으로 전역에 주입하여, 앱 구동 즉시 동작하는 백그라운드 루프나 UI 수동 조작 버튼을 생성합니다. (개발자 도구 디버깅 완벽 지원)
- **Dynamic Tab UI**: Alpine.js의 선언적 바인딩 객체 문법을 활용한 가볍고 강력한 입력 폼.
- **Complete Snapshots**: 요청(Request)과 응답(Response)의 헤더, 바디, 소요 시간 등을 완벽히 분리하여 캡처 및 저장합니다. (`snapshorts/` 폴더에 저장)
- **Reusable Templates**: 자주 사용하는 요청 형식을 템플릿으로 저장하고 언제든 불러와서 재사용할 수 있습니다. (`templates/` 폴더에 저장)
- **State-driven Sidebar**: HTMX와 Vanilla JS 라이프사이클을 결합하여 갱신 시에도 선택 상태가 유지되는 견고한 히스토리 탐색기.
- **One-click Copy**: 응답 JSON 데이터를 원클릭으로 클립보드에 복사할 수 있습니다.

## 🛠️ Tech Stack

- **Backend**: [Hono](https://hono.dev/) (Node.js runtime)
- **UI**: Hono JSX (SSR) + [HTMX](https://htmx.org/) + [Alpine.js](https://alpinejs.dev/)
- **Bundler**: [esbuild](https://esbuild.github.io/) (Single-file bundling)
- **CSS**: [Tailwind CSS](https://tailwindcss.com/)

---

## 📦 Getting Started (사용자용 가이드)

Pocket Client는 단일 파일로 배포됩니다. 복잡한 `npm install` 없이 당신의 프로젝트에 바로 내장하세요.

1. **다운로드**: [GitHub Releases](https://github.com/your-repo/releases)에서 최신 `server.mjs` 파일을 다운로드합니다.
2. **배치**: 프로젝트 루트에 `pocket/` 폴더를 생성하고 다운로드한 파일을 넣습니다.
3. **구조**: `server.mjs`와 동일한 위치에 필요한 폴더들이 자동으로 생성되거나 직접 생성하여 관리할 수 있습니다.
   ```text
   your-project/
   └── pocket/
       ├── server.mjs        # 실행 파일
       ├── config/           # 설정 파일 (.json)
       ├── functions/        # 커스텀 스크립트 (.js)
       ├── snapshorts/       # 실행 결과 스냅샷 (.json)
       └── templates/        # 요청 템플릿 (.json)
   ```
4. **실행**:
   ```bash
   node ./pocket/server.mjs
   # 실행 후 http://localhost:3000 에 접속하세요.
   ```

---

## ⚙️ Configuration (환경 설정)

Pocket Client는 실행 파일과 같은 레벨의 `config/` 디렉터리에서 설정을 자동으로 읽어옵니다.

### `config/default.json` 예시

```json
{
  "port": 4000,
  "baseUrl": "https://api.example.com/v1",
  "timeout": 5000,
  "globalHeaders": {
    "Authorization": "Bearer YOUR_TOKEN",
    "Accept": "application/json"
  },
  "commonEndpoints": ["/auth/login", "/users/me"]
}
```

- **Timeout**: 밀리초(ms) 단위로 설정하며, 서버 응답이 설정 시간을 초과하면 요청을 자동으로 중단합니다.
- **Global Headers**: 설정에 등록된 헤더는 모든 요청에 기본으로 포함되며, UI에서 직접 입력한 헤더가 있을 경우 덮어씌워집니다.
- **Environment Merge**: `POCKET_ENV=dev node server.mjs` 실행 시 `dev.json`이 `default.json`을 덮어씁니다.

---

## ⚡ Custom Functions (런타임 스크립트)

단순한 정적 설정을 넘어, 주기적인 토큰 갱신이나 복잡한 환경 셋업이 필요하다면 `functions/` 디렉터리에 자바스크립트 파일을 작성하세요. Pocket Client가 구동될 때 자동으로 스크립트를 로드하여 샌드박스 환경에서 실행합니다.

### `functions/auth.js` 예시

IDE의 완벽한 자동완성을 지원받기 위해 상단에 JSDoc을 선언하고 로직을 작성합니다.

```javascript
/**
 * @typedef {Object} PocketContext
 * @property {(key: string, value: string) => void} setHeader - 헤더 설정/업데이트
 * @property {(url: string) => void} setUrl - Target URL 변경
 * @property {(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE') => void} setMethod - HTTP 메서드 변경
 * @property {(name: string, fn: Function) => void} registerAction - 사이드바에 수동 실행 버튼 등록
 */

/** @param {PocketContext} pocket */
async function auth(pocket) {
  // 1. 앱 시작 시 즉시 실행될 로직
  pocket.setHeader('X-Custom-Auth', 'Initialized');

  // 2. 백그라운드 동작 (예: 15분마다 토큰 갱신)
  setInterval(() => {
    console.log('토큰 갱신 체크 중...');
  }, 1000 * 60 * 15);

  // 3. 사이드바 UI에 수동 조작 버튼 등록
  pocket.registerAction('Admin Login', () => {
    pocket.setHeader('Authorization', 'Bearer admin-token-123');
    alert('관리자 모드로 세팅되었습니다.');
  });
}
```

> **💡 Pro Tip**: 주입된 스크립트는 `sourceURL`이 매핑되어 브라우저 개발자 도구(DevTools)의 **Sources 탭**에서 실제 로컬 파일처럼 조회하고 브레이크포인트(Breakpoint)를 걸며 디버깅할 수 있습니다.

---

## 🛠️ Development (개발자용 가이드)

Pocket Client 자체를 수정하고 빌드하는 방법입니다.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 이상 권장)
- [pnpm](https://pnpm.io/)

### Installation
```bash
pnpm install
```

### Development Mode
소스 코드 수정 시 자동으로 빌드되고 서버가 재시작됩니다.
```bash
pnpm dev
# http://localhost:3000 접속
# 개발 중 생성되는 모든 데이터는 dev/ 폴더에 저장됩니다.
```

### Build
배포용 단일 파일을 생성합니다.
```bash
pnpm build
# 결과물: dist/server.mjs
```

### Lint & Format
```bash
pnpm lint        # 코드 스타일 체크
pnpm lint:fix    # 코드 스타일 자동 수정
pnpm format      # Prettier 포맷팅
```

---

## 📂 Repository Structure

```text
.
├── src/                    # 비즈니스 로직 및 UI 컴포넌트 (Hono JSX)
│   ├── index.tsx           # 🚀 앱 엔트리 및 서버 초기화
│   ├── config.ts           # ⚙️ 설정 로더 및 경로 계산
│   ├── components/         # 🎨 UI 컴포넌트 (HTMX + Alpine.js)
│   ├── routes/             # 🔗 프록시 및 관리 API 라우터
│   └── utils/              # 💾 Snapshot 저장 및 유틸리티
├── config/                 # ⚙️ 기본 설정 파일 폴더
├── functions/              # ⚡ 커스텀 런타임 스크립트 폴더
├── templates/              # 📋 저장된 요청 템플릿 폴더
├── build.js                # 📦 배포 빌드 스크립트 (esbuild)
├── dev.js                  # 🚧 개발 모드 워처 스크립트
├── tailwind.config.js      # 🎨 Tailwind CSS 설정
└── tsconfig.json           # 📘 TypeScript 설정
```

## ⚖️ License

This project is licensed under the MIT License.
