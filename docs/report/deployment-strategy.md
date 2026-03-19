# Pocket Client - 배포 전략

> 작성일: 2026-03-19

---

## 목표

```bash
npx pocket-client --path ./pocket-client
```

이 명령어 한 줄로:
1. 지정한 경로에 `server.mjs` 자동 복사
2. 대상 프로젝트의 `package.json`에 실행 스크립트 자동 추가
3. 기본 설정 파일(`config/default.json`) 자동 생성

---

## npx 방식 가능한가?

**가능하다.** npx는 npm registry에 올라간 패키지를 임시로 다운로드해 실행한다. `package.json`에 `bin` 필드를 지정하면 된다.

```json
// npm 패키지의 package.json
{
  "name": "pocket-client",
  "bin": {
    "pocket-client": "./cli.mjs"
  },
  "files": [
    "dist/server.mjs",   // 실제 서버 번들
    "cli.mjs"            // CLI 진입점
  ]
}
```

`npx pocket-client` 실행 시 → npm이 패키지 다운로드 → `cli.mjs` 실행 → 사용자 프로젝트에 `server.mjs` 복사.

---

## 패키지 구조 (npm 배포 기준)

현재 구조에서 npm 배포용으로 분리해야 할 파일:

```
pocket-client/          ← npm에 올라가는 패키지
├── dist/
│   └── server.mjs      ← pnpm build로 생성된 번들 (핵심 산출물)
├── cli.mjs             ← npx 실행 진입점 (새로 만들 파일)
└── package.json        ← bin, files 필드 추가 필요
```

`src/`, `node_modules/`, `dev/` 등은 npm에 올리지 않는다. `files` 필드로 배포 대상만 명시한다.

---

## CLI 동작 설계

### 명령어 인터페이스

```bash
# 기본 사용
npx pocket-client --path ./pocket-client

# 옵션
npx pocket-client --path ./tools/api-client --port 4000 --no-script
```

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `--path` | `./pocket-client` | server.mjs를 설치할 경로 |
| `--port` | `3000` | 기본 포트 (config에 반영) |
| `--no-script` | - | package.json 수정 건너뜀 |

### CLI가 하는 일 (순서대로)

```
1. --path 디렉토리 생성 (없으면 mkdir -p)
2. dist/server.mjs → {path}/server.mjs 복사
3. {path}/config/ 폴더 생성
4. {path}/config/default.json 생성 (없는 경우에만)
5. 상위 package.json 탐색 → scripts에 pocket 항목 추가
6. 완료 메시지 출력
```

### package.json 자동 수정 결과

```json
// 사용자 프로젝트의 package.json (수정 전)
{
  "name": "my-project",
  "scripts": {
    "dev": "vite"
  }
}

// 수정 후
{
  "name": "my-project",
  "scripts": {
    "dev": "vite",
    "pocket": "node ./pocket-client/server.mjs",
    "pocket:dev": "POCKET_ENV=dev node ./pocket-client/server.mjs"
  }
}
```

### 생성되는 config/default.json

```json
{
  "port": 3000,
  "baseUrl": "",
  "timeout": 10000,
  "globalHeaders": {},
  "commonEndpoints": []
}
```

---

## CLI 구현 포인트

### package.json 탐색 로직

`--path`가 `./pocket-client`라면, `process.cwd()`의 `package.json`을 수정 대상으로 삼는다. 없으면 상위 디렉토리로 올라가며 탐색 (monorepo 대응).

```js
// cli.mjs 핵심 로직 (의사코드)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    path: { type: 'string', default: './pocket-client' },
    port: { type: 'string', default: '3000' },
    'no-script': { type: 'boolean', default: false },
  }
});

// 1. 설치 경로 준비
const installPath = resolve(process.cwd(), values.path);
mkdirSync(installPath, { recursive: true });
mkdirSync(resolve(installPath, 'config'), { recursive: true });

// 2. server.mjs 복사
const bundlePath = resolve(dirname(fileURLToPath(import.meta.url)), 'dist/server.mjs');
copyFileSync(bundlePath, resolve(installPath, 'server.mjs'));

// 3. config/default.json 생성 (기존 파일 보존)
const configPath = resolve(installPath, 'config/default.json');
if (!existsSync(configPath)) {
  writeFileSync(configPath, JSON.stringify({ port: Number(values.port), ... }, null, 2));
}

// 4. package.json 수정
if (!values['no-script']) {
  const pkgPath = findPackageJson(process.cwd());  // 상위 탐색
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.scripts ??= {};
  pkg.scripts.pocket = `node ./${values.path}/server.mjs`;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}
```

`node:util`의 `parseArgs`는 Node.js 18.3+부터 내장 제공. 외부 의존성(commander, yargs) 없이 구현 가능하다.

---

## 빌드 파이프라인 변경사항

현재 `build.js`는 `dist/server.mjs`만 생성한다. npm 배포를 위해 `cli.mjs`를 추가해야 한다.

```
현재:  pnpm build → dist/server.mjs

변경:  pnpm build → dist/server.mjs
                  → cli.mjs (별도 작성, 빌드 불필요 - 순수 Node.js ESM)
```

`cli.mjs`는 Node.js 내장 모듈만 사용하므로 번들링 없이 그대로 배포 가능하다.

---

## npm 배포 절차

### 1. package.json 수정

```json
{
  "name": "pocket-client",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "pocket-client": "./cli.mjs"
  },
  "files": [
    "dist/server.mjs",
    "cli.mjs"
  ],
  "engines": {
    "node": ">=18.3.0"
  }
}
```

### 2. 배포 전 체크리스트

```bash
# 빌드 먼저
pnpm build

# 배포될 파일 목록 확인
npm pack --dry-run

# 로컬 테스트
npm link
npx pocket-client --path ./test-install

# 배포
npm publish
```

### 3. 버전 관리 전략

| 변경 종류 | 버전 올림 | 예시 |
|----------|----------|------|
| 버그 수정, 스타일 변경 | patch | 1.0.0 → 1.0.1 |
| 새 기능 (하위 호환) | minor | 1.0.0 → 1.1.0 |
| 설정 구조 변경, 호환성 파괴 | major | 1.0.0 → 2.0.0 |

---

## 업그레이드 흐름

사용자가 이미 설치한 뒤 버전업하는 경우:

```bash
# 재실행하면 server.mjs만 덮어씌움
npx pocket-client@latest --path ./pocket-client

# config/default.json은 기존 파일 유지 (덮어쓰지 않음)
# package.json scripts는 이미 있으면 수정하지 않음
```

→ 멱등성(idempotency) 보장: 같은 명령어를 여러 번 실행해도 안전.

---

## 대안 비교

| 방식 | 장점 | 단점 |
|------|------|------|
| **npx (권장)** | 설치 불필요, 항상 최신 버전 | 최초 실행 시 다운로드 시간 |
| `npm i -g pocket-client` | 오프라인 사용 가능 | 전역 설치 오염, 버전 관리 번거로움 |
| `npm i -D pocket-client` | 프로젝트 의존성으로 관리 | devDependency 무거워짐, 서버 번들이 node_modules에 중복 |
| 직접 server.mjs 복사 | 의존성 없음 | 업데이트 수동 |

npx 방식이 "설치 없이 즉시 실행, 항상 최신"이라는 목표에 가장 맞다.

---

## 구현 순서 제안

1. `cli.mjs` 작성
2. `package.json`에 `bin`, `files`, `engines` 추가
3. `npm pack --dry-run`으로 배포 파일 확인
4. 로컬에서 `npm link` + `npx pocket-client` 테스트
5. npm registry 배포 (`npm publish`)
6. GitHub Actions로 `pnpm build && npm publish` 자동화 (선택)
