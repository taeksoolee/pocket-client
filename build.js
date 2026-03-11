import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

async function build() {
  try {
    console.log('🚀 배포용 빌드 시작...');

    // 1. Tailwind CSS 추출
    console.log('🎨 Tailwind CSS 최적화 추출 중...');
    execSync('pnpm tailwindcss -i ./src/input.css -o ./src/output.css --minify');

    // 2. 라이브러리 소스 로드
    const htmx = await readFile('./node_modules/htmx.org/dist/htmx.min.js', 'utf8');
    const alpine = await readFile('./node_modules/alpinejs/dist/cdn.min.js', 'utf8');

    // 3. 번들링
    await esbuild.build({
      entryPoints: ['src/index.tsx'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/server.mjs',
      minify: true,
      external: ['node:*'],
      jsx: 'automatic',
      jsxImportSource: 'hono/jsx',
      loader: {
        '.css': 'text', // 💡 CSS 내용을 문자열로 박아넣음
      },
      define: {
        'process.env.HTMX_SRC': JSON.stringify(htmx),
        'process.env.ALPINE_SRC': JSON.stringify(alpine),
      },
    });

    console.log('✅ 빌드 성공: dist/server.mjs');
  } catch (err) {
    console.error('❌ 빌드 실패:', err);
    process.exit(1);
  }
}

build();
