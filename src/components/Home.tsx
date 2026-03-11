import { Layout } from './Layout';
import { Sidebar } from './Sidebar';

// 💡 props로 files 배열을 받도록 수정
export const Home = ({ files }: { files: string[] }) => (
  <Layout>
    {/* 좌측 사이드바 */}
    <Sidebar files={files} />

    {/* 우측 메인 영역 */}
    <main class="flex-1 h-screen overflow-y-auto p-8">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-indigo-600">PocketAPI 🚀</h1>
          <p class="text-slate-500">Embedded Local-first API Tool</p>
        </header>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          {/* HTMX 폼 제출 시, 결과를 갈아끼울 뿐만 아니라 전체 페이지 리로드를 위해 잠시 타겟 설정을 우회할 수도 있지만, 일단 결과만 업데이트 유지 */}
          <form hx-post="/request" hx-target="#result" hx-disabled-elt="button">
            <div class="flex gap-4">
              <select
                name="method"
                class="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50"
              >
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
      </div>
    </main>
  </Layout>
);
