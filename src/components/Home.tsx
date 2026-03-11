import { config } from '../config';
import { Layout } from './Layout';
import { Sidebar } from './Sidebar';

export const Home = ({ files, suggestions = [] }: { files: string[]; suggestions?: string[] }) => (
  <Layout>
    <Sidebar files={files} />
    <main class="flex-1 h-screen overflow-y-auto p-8 bg-slate-50 text-slate-800">
      <div class="max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-indigo-600">Pocket Client 🚀</h1>
          <p class="text-slate-500 font-medium">Embedded Local-first Http Client Tool</p>
        </header>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <form
            hx-post="/request"
            hx-target="#result"
            hx-disabled-elt="button"
            class="space-y-4"
            x-data={`{
              activeTab: 'params',
              params: [{ key: '', value: '', active: true }],
              headers: [{ key: '', value: '', active: true }],
              bodyType: 'none',
              bodyContent: '',
              url: '',
              baseUrl: '${config.baseUrl || ''}',
              allSuggestions: ${JSON.stringify([...(config.commonEndpoints || []), ...suggestions])},
              showSuggestions: false,

              // 💡 선언적 바인딩 객체
              get suggestionContainer() { return { ['x-on:click.outside']() { this.showSuggestions = false } } },
              get urlInput() {
                return {
                  ['x-on:focus']() { this.showSuggestions = true },
                  ['x-on:input']() { this.showSuggestions = true },
                  ['x-on:keydown.escape']() { this.showSuggestions = false }
                }
              },
              get filteredSuggestions() {
                if (!this.url.startsWith('/')) return [];
                const s = this.url.toLowerCase();
                return this.allSuggestions.filter(item => item.toLowerCase().includes(s) && item !== this.url).slice(0, 10);
              },
              get resolvedUrl() {
                if (this.url.startsWith('http')) return this.url;
                return this.baseUrl.replace(/\\/+$/, '') + '/' + this.url.replace(/^\\/+/, '');
              },

              addRow(type) { this[type].push({ key: '', value: '', active: true }) },
              removeRow(type, index) { this[type].splice(index, 1) }
            }`}
          >
            <div class="space-y-2">
              <div class="flex gap-4">
                <select
                  name="method"
                  class="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 font-bold outline-none focus:border-indigo-500"
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                    <option value={m}>{m}</option>
                  ))}
                </select>

                <div class="flex-1 relative" x-bind="suggestionContainer">
                  <input
                    type="text"
                    name="url"
                    x-model="url"
                    x-bind="urlInput"
                    required
                    autocomplete="off"
                    class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                    placeholder={
                      config.baseUrl ? '/api/v1 (baseUrl 설정됨)' : 'https://api.example.com'
                    }
                  />

                  <div
                    x-show="showSuggestions && filteredSuggestions.length > 0"
                    class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    style="display: none;"
                  >
                    <template x-for="s in filteredSuggestions">
                      <div
                        x-on:click="url = s; showSuggestions = false"
                        class="px-4 py-2 hover:bg-indigo-50 cursor-pointer font-mono text-xs text-slate-600 border-b border-slate-50 last:border-0 transition-colors"
                      >
                        <span class="text-indigo-500 font-bold">↳</span> <span x-text="s"></span>
                      </div>
                    </template>
                  </div>
                </div>
                <button
                  type="submit"
                  class="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition active:scale-95"
                >
                  Send
                </button>
              </div>
              <div
                x-show="url.startsWith('/') && baseUrl"
                class="text-[10px] font-mono text-slate-400 pl-32 truncate italic"
                style="display: none;"
              >
                <span class="text-indigo-500 not-italic font-black">🎯 Target:</span>{' '}
                <span x-text="resolvedUrl"></span>
              </div>
            </div>

            <div class="flex border-b border-slate-200 text-sm font-medium mt-6">
              {['params', 'headers', 'body'].map((tab) => (
                <button
                  type="button"
                  x-on:click={`activeTab = '${tab}'`}
                  x-bind:class={`activeTab === '${tab}' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'`}
                  class="px-5 py-2 capitalize transition-all"
                >
                  {tab}
                </button>
              ))}
            </div>

            <div class="bg-slate-50/50 p-4 rounded-b-lg border-x border-b border-slate-200 min-h-[150px]">
              {/* 🎯 Params */}
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
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      x-model="item.value"
                      placeholder="Value"
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm outline-none focus:border-indigo-500"
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
                  class="text-xs text-indigo-600 font-bold hover:underline mt-2"
                >
                  + Add Parameter
                </button>
              </div>

              {/* 🎯 Headers */}
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
                      placeholder="Header"
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      x-model="item.value"
                      placeholder="Value"
                      class="flex-1 border border-slate-300 rounded p-1.5 font-mono text-sm outline-none focus:border-indigo-500"
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
                  class="text-xs text-indigo-600 font-bold hover:underline mt-2"
                >
                  + Add Header
                </button>
              </div>

              {/* 🎯 Body */}
              <div x-show="activeTab === 'body'" style="display: none;">
                <div class="flex gap-4 mb-3 text-xs font-bold text-slate-500 uppercase">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" x-model="bodyType" value="none" /> None
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" x-model="bodyType" value="json" /> JSON
                  </label>
                </div>
                <div x-show="bodyType === 'json'">
                  <textarea
                    x-model="bodyContent"
                    class="w-full border border-slate-300 rounded-lg p-3 font-mono text-xs outline-none focus:border-indigo-500 bg-white"
                    rows={6}
                    placeholder='{\n  "hello": "world"\n}'
                  ></textarea>
                </div>
              </div>
            </div>

            <input
              type="hidden"
              name="pocket_payload"
              x-bind:value="JSON.stringify({ params, headers, bodyType, bodyContent })"
            />
          </form>
        </div>
        <div id="result"></div>
      </div>
    </main>
  </Layout>
);
