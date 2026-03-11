import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';
import { spawn, execSync } from 'node:child_process';

let serverProcess = null;

function restartServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
  serverProcess = spawn('node', ['dev/server.mjs'], { stdio: 'inherit' });
}

function buildCSS() {
  try {
    console.log('🎨 Tailwind CSS 추출 중...');
    // 💡 esbuild가 읽을 수 있도록 src/ 폴더 안에 임시로 생성
    execSync('pnpm tailwindcss -i ./src/input.css -o ./src/output.css --minify');
    return true;
  } catch (err) {
    console.error('❌ CSS 빌드 실패:', err);
    return false;
  }
}

async function watch() {
  // 1. 초기 라이브러리 소스 로드 (HTMX, Alpine)
  const htmx = await readFile('./node_modules/htmx.org/dist/htmx.min.js', 'utf8');
  const alpine = await readFile('./node_modules/alpinejs/dist/cdn.min.js', 'utf8');

  // 2. 초기 CSS 생성
  buildCSS();

  const ctx = await esbuild.context({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dev/server.mjs',
    external: ['node:*'],
    jsx: 'automatic',
    jsxImportSource: 'hono/jsx',
    // 💡 핵심: .css 파일을 만나면 내용을 문자열(text)로 취급해라!
    loader: {
      '.css': 'text',
    },
    define: {
      'process.env.HTMX_SRC': JSON.stringify(htmx),
      'process.env.ALPINE_SRC': JSON.stringify(alpine),
    },
    plugins: [
      {
        name: 'tailwind-watch-plugin',
        setup(build) {
          // 파일이 바뀌어서 빌드가 시작되기 직전에 Tailwind 실행
          build.onStart(() => {
            buildCSS();
          });
          // 빌드가 끝나면 서버 재시작
          build.onEnd((result) => {
            if (result.errors.length === 0) {
              console.log('🔄 빌드 완료. 서버 재시작...');
              restartServer();
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
  console.log('👀 감시 모드 작동 중...\n');
}

watch().catch((err) => {
  console.error(err);
  process.exit(1);
});
