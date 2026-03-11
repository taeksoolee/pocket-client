// dev.js
import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

let serverProcess = null;

// 서버를 (재)시작하는 함수
function restartServer() {
  if (serverProcess) {
    serverProcess.kill(); // 기존 프로세스 종료
  }
  // 새 프로세스 실행 (터미널 로그 공유)
  serverProcess = spawn('node', ['dev/server.mjs'], { stdio: 'inherit' });
}

async function watch() {
  const htmx = await readFile('./node_modules/htmx.org/dist/htmx.min.js', 'utf8');
  const alpine = await readFile('./node_modules/alpinejs/dist/cdn.min.js', 'utf8');

  // esbuild.context를 사용하면 Watch 모드를 켤 수 있음
  const ctx = await esbuild.context({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dev/server.mjs',
    external: ['node:*'],
    jsx: 'automatic',
    jsxImportSource: 'hono/jsx',
    define: {
      'process.env.HTMX_SRC': JSON.stringify(htmx),
      'process.env.ALPINE_SRC': JSON.stringify(alpine),
    },
    plugins: [
      {
        name: 'watch-plugin',
        setup(build) {
          // 빌드가 끝날 때마다 훅(Hook)이 실행됨
          build.onEnd(result => {
            if (result.errors.length > 0) {
              console.error('❌ 빌드 에러 발생:', result.errors);
            } else {
              console.log('🔄 코드가 변경되었습니다. 서버를 재시작합니다...');
              restartServer();
            }
          });
        },
      },
    ],
  });

  // Watch 모드 시작 (파일 변경 감지)
  await ctx.watch();
  console.log('👀 소스 코드 변경을 감시하는 중입니다...\n');
}

watch();