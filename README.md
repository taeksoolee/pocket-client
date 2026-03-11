# PocketAPI 🚀 (개발중)

**Embedded API Workspace for Real Engineers.**

PocketAPI는 외부 플랫폼이나 클라우드에 의존하지 않고, 당신의 프로젝트 폴더 내부에 직접 내장(Embedded)되는 초경량 API 관리 도구입니다. 모든 요청과 응답은 JSON 파일로 박제되어 당신의 코드와 함께 Git으로 관리됩니다.

## ✨ Key Philosophies

- **Embedded**: 프로젝트 루트의 `./pocket-api/` 폴더 안에서 모든 것이 해결됩니다. (별도의 외부 툴 설치 불필요)
- **Git-Driven**: API 히스토리는 커밋 대상입니다. 팀원과 공유하기 위해 컬렉션을 내보낼 필요가 없습니다.
- **Zero-Dependency**: 번들링된 단일 `server.mjs` 파일만 있으면 실행 환경 준비 끝 (Node.js만 있으면 됩니다).
- **AI-Ready**: 구조화된 로컬 JSON 데이터는 AI 에이전트가 타입 생성 및 테스트 코드를 작성하기 위한 최적의 먹잇감이 됩니다.

## 🛠️ Tech Stack

- **Backend**: [Hono](https://hono.dev/) (Node.js runtime)
- **UI**: Hono JSX (SSR) + [HTMX](https://htmx.org/) + [Alpine.js](https://alpinejs.dev/)
- **Bundler**: [esbuild](https://esbuild.github.io/) (Single-file bundling)

---

## 📦 Getting Started (사용자용 가이드)

PocketAPI는 단일 파일로 배포됩니다. 복잡한 `npm install` 없이 당신의 프로젝트에 바로 내장하세요.

1. **다운로드**: [GitHub Releases](https://github.com/your-repo/releases)에서 최신 `server.mjs` 파일을 다운로드합니다.
2. **배치**: 프로젝트 루트에 `pocket-api/` 폴더를 생성하고 다운로드한 파일을 넣습니다.
3. **실행**:
   ```bash
   node ./pocket-api/server.mjs
   # 실행 후 http://localhost:3000 에 접속하세요.
   ```
> **💡 Tip**: 팀원들과 API 스냅샷을 공유하려면 생성된 `./pocket-api/results/` 폴더를 Git 추적 대상에 포함하세요. 반대로 실행 파일인 `server.mjs`는 `.gitignore`에 추가하는 것을 권장합니다.

---

## 👨‍💻 Development (개발자/기여자용 가이드)

PocketAPI 자체를 수정하거나 기여하고 싶다면 아래 워크플로우를 따르세요.

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   npm install
   ```

2. **Live Development (Watch Mode)**
   ```bash
   npm run dev
   # 코드를 수정하면 자동으로 재빌드(dev/server.mjs) 및 서버가 재시작됩니다.
   ```

3. **Build for Release**
   ```bash
   npm run build
   # dist/server.mjs 파일이 생성됩니다. (GitHub Actions 연동 예정)
   ```

## 📂 Repository Structure
- `src/`: Hono 서버 및 UI 소스 코드 (JSX)
- `dev/`: 로컬 개발용 빌드 결과물 및 테스트 데이터 격리 폴더 (Git 무시됨)
- `dist/`: 최종 배포용 단일 실행 파일 생성 위치 (Git 무시됨)

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.