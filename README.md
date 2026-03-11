# Pocket Client 🚀 (개발중)

**Embedded API Workspace for Real Engineers.**

Pocket Client는 외부 플랫폼(Postman, Insomnia 등)이나 클라우드에 의존하지 않고, 당신의 프로젝트 폴더 내부에 직접 내장(Embedded)되는 초경량 로컬 API 클라이언트입니다. 모든 요청과 응답은 JSON 파일로 박제되어 당신의 코드와 함께 Git으로 완벽하게 추적 및 관리됩니다.

## ✨ Key Philosophies

- **Embedded**: 프로젝트 루트의 독립된 폴더 안에서 모든 것이 해결됩니다. 무거운 데스크톱 앱 설치가 필요 없습니다.
- **Git-Driven**: API 히스토리(Request/Response)는 커밋 대상입니다. 팀원과 공유하기 위해 컬렉션을 Export/Import 할 필요가 없습니다.
- **Zero-Dependency**: 번들링된 단일 `server.mjs` 파일만 있으면 실행 환경 준비가 끝납니다 (Node.js 환경).
- **File-based Config**: 환경별 URL, 전역 헤더 등의 설정은 `config/` 디렉터리 내의 파일로 분리하여 코드를 건드리지 않고 유연하게 관리합니다.
- **AI-Ready**: 구조화된 로컬 JSON 데이터는 AI 에이전트가 API 타입을 생성하거나 테스트 코드를 작성하기 위한 최적의 컨텍스트를 제공합니다.

## 🚀 Features

- **Dynamic Tab UI**: Alpine.js를 활용한 가볍고 강력한 파라미터/헤더/바디 입력 폼 제공.
- **Complete Snapshots**: 요청(Request)과 응답(Response)의 헤더, 바디, 상태 코드, 소요 시간 등을 완벽히 분리하여 캡처 및 저장.
- **State-driven Sidebar**: HTMX와 Vanilla JS 라이프사이클을 결합하여 렌더링 꼬임 없는 견고한 과거 기록(History) 탐색 지원.
- **One-click Copy**: 결과 뷰어에서 응답 JSON을 원클릭으로 클립보드에 복사.

## 🛠️ Tech Stack

- **Backend**: [Hono](https://hono.dev/) (Node.js runtime)
- **UI**: Hono JSX (SSR) + [HTMX](https://htmx.org/) + [Alpine.js](https://alpinejs.dev/)
- **Bundler**: [esbuild](https://esbuild.github.io/) (Single-file bundling)

---

## 📦 Getting Started (사용자용 가이드)

Pocket Client는 단일 파일로 배포됩니다. 복잡한 `npm install` 없이 당신의 프로젝트에 바로 내장하세요.

1. **다운로드**: [GitHub Releases](https://github.com/your-repo/releases)에서 최신 `server.mjs` 파일을 다운로드합니다.
2. **배치**: 프로젝트 루트에 `pocket/` (또는 원하는 이름) 폴더를 생성하고 다운로드한 파일을 넣습니다.
3. **실행**:
   ```bash
   node ./pocket/server.mjs
   # 실행 후 http://localhost:3000 에 접속하세요.
   ```
   > **💡 Tip**: 팀원들과 API 스냅샷을 공유하려면 생성된 `./pocket/results/` 폴더를 Git 추적 대상에 포함하세요. 반대로 실행 파일인 `server.mjs` 자체는 `.gitignore`에 추가하는 것을 권장합니다.

---

## ⚙️ Configuration (환경 설정)

Pocket Client는 실행되는 `server.mjs`와 같은 레벨의 `config/` 디렉터리에서 설정 파일을 자동으로 읽어옵니다. 이를 통해 환경별 Base URL이나 전역 인증 헤더 등을 쉽게 주입할 수 있습니다.

**디렉터리 구조 예시:**

```text
pocket/
 ├── server.mjs         # 다운로드한 실행 파일
 ├── config/            # 💡 설정 디렉터리
 │    ├── default.json  # 포트, 기본 환경 설정 등
 │    └── dev.json      # (선택) 개발 환경 전용 토큰/Base URL 등
 └── results/           # API 실행 시 생성되는 스냅샷 파일들
```

_(상세한 Config 파일 작성 가이드 및 포맷은 추가 예정입니다.)_

---

## 👨‍💻 Development (개발자/기여자용 가이드)

Pocket Client 자체를 수정하거나 기여하고 싶다면 아래 워크플로우를 따르세요.

1. **Clone & Install**

   ```bash
   git clone <your-repo-url>
   pnpm install
   ```

2. **Live Development (Watch Mode)**

   ```bash
   pnpm run dev
   # 코드를 수정하면 자동으로 재빌드(dev/server.mjs) 및 서버가 재시작됩니다.
   ```

3. **Build for Release**
   ```bash
   pnpm run build
   # dist/server.mjs 파일이 생성됩니다. (GitHub Actions 연동 예정)
   ```

## 📂 Repository Structure

프로젝트의 핵심 비즈니스 로직과 UI는 모두 `src/` 내부에 역할별로 분리되어 있습니다.

```text
.
├── src/                    # 비즈니스 로직 및 UI 컴포넌트 (Hono + JSX)
│   ├── index.tsx           # 🚀 앱 초기화, 라우트 등록, Config 로딩, 서버 실행
│   ├── config.ts           # ⚙️ 내부 환경 설정 및 외부 config/ 디렉터리 파싱 로직
│   ├── utils/              # 💾 파일 시스템(fs) 스냅샷 제어 및 유틸리티
│   ├── components/         # 🎨 Hono JSX 기반 화면 레이아웃 및 UI 컴포넌트
│   └── routes/             # 🔗 API 엔드포인트 라우터 컨트롤러 (프록시 로직)
├── dev/                    # 🚧 로컬 개발용 빌드 결과물 및 스냅샷 저장소 (Git 무시됨)
└── dist/                   # 📦 최종 배포용 단일 실행 파일(server.mjs) 위치 (Git 무시됨)
```

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
