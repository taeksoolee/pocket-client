# PocketAPI 🚀 (개발중)

**Embedded API Workspace for Real Engineers.**

PocketAPI는 외부 플랫폼이나 클라우드에 의존하지 않고, 당신의 프로젝트 폴더 내부에 직접 내장(Embedded)되는 초경량 API 관리 도구입니다. 모든 요청과 응답은 JSON 파일로 박제되어 당신의 코드와 함께 Git으로 관리됩니다.

## ✨ Key Philosophies

- **Embedded**: 프로젝트 루트의 `./pocket-api/` 폴더 안에서 모든 것이 해결됩니다.
- **Git-Driven**: API 히스토리는 커밋 대상입니다. 팀원과 공유하기 위해 컬렉션을 내보낼 필요가 없습니다.
- **Zero-Dependency**: 번들링된 단일 `server.mjs` 파일만 있으면 실행 환경 준비 끝 (Node.js만 있으면 됩니다).
- **AI-Ready**: 구조화된 로컬 JSON 데이터는 AI 에이전트가 타입 생성 및 테스트 코드를 작성하기 위한 최적의 먹잇감이 됩니다.

## 🛠️ Tech Stack

- **Backend**: [Hono](https://hono.dev/) (Node.js runtime)
- **UI**: Hono JSX (SSR) + [HTMX](https://htmx.org/) + [Alpine.js](https://alpinejs.dev/)
- **Bundler**: [esbuild](https://esbuild.github.io/) (Single-file bundling)

## 🚀 Quick Start (Development)

1. **Clone & Install**
   ```bash
   git clone <your-repo-url>
   npm install
   ```

2. **Build**
   ```bash
   node build.js
   ```

3. **Run**
   ```bash
   node ./a/server.mjs
   ```

## 📂 Structure
- `src/`: Hono 서버 및 UI 소스 (JSX)
- `a/server.mjs`: 빌드된 단일 실행 파일
- `a/results/`: API 스냅샷 JSON 저장소

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
