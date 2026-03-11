import { Layout } from './Layout';

export const Home = () => (
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

    {/* HTMX가 응답 결과를 꽂아넣을 타겟 영역 */}
    <div id="result">
      <div class="text-center text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-xl">
        요청을 보내면 여기에 결과와 저장 경로가 표시됩니다.
      </div>
    </div>
  </Layout>
);
