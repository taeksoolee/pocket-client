import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { jsx } from 'hono/jsx';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// 💡 핵심 변경점: ESM 환경에서 현재 실행 중인 파일(server.mjs)의 위치를 동적으로 추적
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 빌드 타임에 esbuild가 치환해 줄 라이브러리 소스 코드
const HTMX_LIB = process.env.HTMX_SRC || '';
const ALPINE_LIB = process.env.ALPINE_SRC || '';

const app = new Hono();

// 1. 공통 레이아웃 컴포넌트 (SSR)
const Layout = ({ children }: { children: any }) => (
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>PocketAPI Workspace</title>
      <script dangerouslySetInnerHTML={{ __html: HTMX_LIB }}></script>
      <script defer dangerouslySetInnerHTML={{ __html: ALPINE_LIB }}></script>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 text-slate-900 font-sans p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-indigo-600">PocketAPI 🚀</h1>
          <p class="text-slate-500">Embedded Local-first API Tool</p>
        </header>
        {children}
      </div>
    </body>
  </html>
);

// 2. 메인 화면 라우트
app.get('/', (c) => {
  return c.html(
    <Layout>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form hx-post="/request" hx-target="#result" hx-disabled-elt="button">
          <div class="flex gap-4">
            <select name="method" class="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="url"
              name="url"
              required
              class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="https://jsonplaceholder.typicode.com/todos/1"
            />
            <button
              type="submit"
              class="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <div id="result">
        <div class="text-center text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-xl">
          요청을 보내면 여기에 결과와 저장 경로가 표시됩니다.
        </div>
      </div>
    </Layout>
  );
});

// 3. API 요청 처리 및 파일 저장 라우트
app.post('/request', async (c) => {
  const body = await c.req.parseBody();
  const targetUrl = body.url as string;
  const method = body.method as string;

  try {
    const startTime = Date.now();

    // 실제 외부 API 호출
    const response = await fetch(targetUrl, { method });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    const duration = Date.now() - startTime;

    // 💡 변경점: 무조건 루트가 아니라, 현재 파일(server.mjs)이 있는 폴더 기준 내부에 results 생성
    const resultDir = join(__dirname, 'results');
    mkdirSync(resultDir, { recursive: true });

    // 파일명 생성 로직
    const urlObj = new URL(targetUrl);
    const safeDomain = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
    const filename = `${method}-${safeDomain}-${Date.now()}.json`;
    const filePath = join(resultDir, filename);

    // 스냅샷 데이터 구조
    const snapshot = {
      meta: {
        url: targetUrl,
        method,
        status: response.status,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      data: data,
    };
    writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

    return c.html(
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-green-50 border-b border-green-100 p-4 flex justify-between items-center">
          <span class="text-green-700 font-medium">✅ 스냅샷 저장 완료!</span>
          <span class="text-sm font-mono text-slate-500">{duration}ms</span>
        </div>
        <div class="p-4 bg-slate-800 text-slate-300 font-mono text-sm overflow-x-auto">
          {/* 사용자에게 파일이 어디에 저장됐는지 명확히 보여줌 */}
          <div class="mb-2 text-slate-400">
            📄 Saved at: ./{basename(__dirname)}/results/{filename}
          </div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    );
  } catch (err: any) {
    return c.html(
      <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div class="font-bold mb-1">❌ 요청 실패</div>
        <div class="text-sm font-mono">{err.message || String(err)}</div>
      </div>
    );
  }
});

// 4. 서버 실행
serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`\n🚀 PocketAPI is running!`);
  console.log(`🔗 Local: http://localhost:${info.port}`);
  console.log(`📁 Workspace: ${__dirname}\n`);
});
