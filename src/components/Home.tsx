import { Layout } from './Layout';
import { Sidebar } from './Sidebar';

export const Home = ({ files }: { files: string[] }) => (
  <Layout>
    {/* 좌측 사이드바 */}
    <Sidebar files={files} />

    {/* 우측 메인 영역 */}
    <main class="flex-1 h-screen overflow-y-auto p-8 bg-slate-50">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-indigo-600">Pocket Client 🚀</h1>
          <p class="text-slate-500">Embedded Local-first API Tool</p>
        </header>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          {/* 💡 Alpine.js 거대 상태 관리 (x-data) 선언 */}
          <form
            hx-post="/request"
            hx-target="#result"
            hx-disabled-elt="button"
            class="space-y-4"
            x-data="{
              activeTab: 'params',
              params: [{ key: '', value: '', active: true }],
              headers: [{ key: '', value: '', active: true }],
              bodyType: 'none',
              bodyContent: '',
              addRow(type) { this[type].push({ key: '', value: '', active: true }) },
              removeRow(type, index) { this[type].splice(index, 1) }
            }"
          >
            {/* 1. Method & URL 입력 바 */}
            <div class="flex gap-4">
              <select
                name="method"
                class="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 font-bold text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="url"
                name="url"
                required
                class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                placeholder="https://api.example.com/v1/users"
              />
              <button
                type="submit"
                class="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>

            {/* 2. 탭 네비게이션 */}
            <div class="flex border-b border-slate-200 text-sm font-medium mt-6">
              <button
                type="button"
                x-on:click="activeTab = 'params'"
                x-bind:class="activeTab === 'params' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'"
                class="px-5 py-2 transition-colors"
              >
                Params
              </button>
              <button
                type="button"
                x-on:click="activeTab = 'headers'"
                x-bind:class="activeTab === 'headers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'"
                class="px-5 py-2 transition-colors"
              >
                Headers
              </button>
              <button
                type="button"
                x-on:click="activeTab = 'body'"
                x-bind:class="activeTab === 'body' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'"
                class="px-5 py-2 transition-colors"
              >
                Body
              </button>
            </div>

            {/* 3. 탭 컨텐츠 영역 */}
            <div class="bg-slate-50/50 p-4 rounded-b-lg border-x border-b border-slate-200 min-h-[150px]">
              {/* 🎯 Params 탭 */}
              <div x-show="activeTab === 'params'" class="space-y-2">
                <template x-for="(item, index) in params" x-bind:key="index">
                  <div class="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      x-model="item.active"
                      class="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <input
                      type="text"
                      x-model="item.key"
                      placeholder="Key"
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      x-model="item.value"
                      placeholder="Value"
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      x-on:click="removeRow('params', index)"
                      class="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </template>
                <button
                  type="button"
                  x-on:click="addRow('params')"
                  class="text-sm text-indigo-600 font-medium hover:text-indigo-800 mt-2 flex items-center gap-1"
                >
                  + Add Parameter
                </button>
              </div>

              {/* 🎯 Headers 탭 */}
              <div x-show="activeTab === 'headers'" class="space-y-2" style="display: none;">
                <template x-for="(item, index) in headers" x-bind:key="index">
                  <div class="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      x-model="item.active"
                      class="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <input
                      type="text"
                      x-model="item.key"
                      placeholder="Authorization"
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm focus:border-indigo-500 outline-none"
                    />
                    <input
                      type="text"
                      x-model="item.value"
                      placeholder="Bearer token..."
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm focus:border-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      x-on:click="removeRow('headers', index)"
                      class="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </template>
                <button
                  type="button"
                  x-on:click="addRow('headers')"
                  class="text-sm text-indigo-600 font-medium hover:text-indigo-800 mt-2 flex items-center gap-1"
                >
                  + Add Header
                </button>
              </div>

              {/* 🎯 Body 탭 */}
              <div x-show="activeTab === 'body'" style="display: none;">
                <div class="flex gap-4 mb-3 text-sm">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" x-model="bodyType" value="none" class="text-indigo-600" />{' '}
                    None
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" x-model="bodyType" value="json" class="text-indigo-600" />{' '}
                    JSON
                  </label>
                </div>
                <div x-show="bodyType === 'json'">
                  <textarea
                    x-model="bodyContent"
                    class="w-full border border-slate-300 rounded-lg p-3 font-mono text-sm outline-none focus:border-indigo-500 bg-white"
                    rows={5}
                    placeholder='{\n  "key": "value"\n}'
                  ></textarea>
                </div>
                <div x-show="bodyType === 'none'" class="text-slate-400 text-sm italic py-4">
                  This request does not have a body.
                </div>
              </div>
            </div>

            {/* 💡 Step 2: Hono 서버로 Alpine 상태를 보내기 위한 Hidden Input */}
            <input
              type="hidden"
              name="pocket_payload"
              x-bind:value="JSON.stringify({ params, headers, bodyType, bodyContent })"
            />
          </form>
        </div>

        {/* 결과 표시 영역 */}
        <div id="result">
          <div class="text-center text-slate-400 py-10 border-2 border-dashed border-slate-200 rounded-xl">
            🚀 URL을 입력하고 Send를 눌러보세요.
          </div>
        </div>
      </div>
    </main>
  </Layout>
);
