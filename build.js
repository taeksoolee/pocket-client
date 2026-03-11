import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';

async function build() {
  try {
    console.log('⏳ 빌드 준비 중...');

    // 1. node_modules에서 라이브러리 소스를 텍스트로 긁어옴
    const htmx = await readFile('./node_modules/htmx.org/dist/htmx.min.js', 'utf8');
    const alpine = await readFile('./node_modules/alpinejs/dist/cdn.min.js', 'utf8');

    // 2. esbuild 번들링 실행
    await esbuild.build({
      entryPoints: ['src/index.tsx'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/server.mjs',
      minify: true,             // 코드 압축 (용량 최소화)
      external: ['node:*'],     // Node 내장 모듈(fs, path 등)은 번들링 제외
      
      // esbuild에게 Hono JSX를 어떻게 변환할지 직접 지시
      jsx: 'automatic',
      jsxImportSource: 'hono/jsx',
      
      // 긁어온 소스코드를 index.tsx의 process.env 변수에 문자열로 치환(주입)
      define: {
        'process.env.HTMX_SRC': JSON.stringify(htmx),
        'process.env.ALPINE_SRC': JSON.stringify(alpine),
      },
    });

    console.log('✅ 빌드 완료: dist/server.mjs 파일이 생성되었습니다.');
  } catch (err) {
    console.error('❌ 빌드 실패:', err);
    process.exit(1);
  }
}

build();