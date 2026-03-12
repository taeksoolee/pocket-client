import { config } from '../config';
import { Layout } from './Layout';
import { Sidebar } from './Sidebar';

export const Home = ({
  snapshots,
  templates,
  suggestions = [],
  functionsMap = {},
}: {
  snapshots: string[];
  templates: string[];
  suggestions?: string[];
  functionsMap?: Record<string, string>;
}) => {
  const initialHeaders = Object.entries(config.globalHeaders).map(([key, value]) => ({
    key,
    value,
    active: true,
  }));

  if (initialHeaders.length === 0) {
    initialHeaders.push({ key: '', value: '', active: true });
  }

  const uniqueSuggestions = [...new Set([...(config.commonEndpoints || []), ...suggestions])];

  return (
    <Layout>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__POCKET_CODES = ${JSON.stringify(functionsMap)};`,
        }}
      />

      {/* 💡 Sidebar Props 수정 */}
      <Sidebar snapshots={snapshots} templates={templates} />

      <main class="flex-1 h-screen overflow-y-auto p-8 bg-slate-50 text-slate-800">
        <div class="max-w-4xl mx-auto">
          <header class="mb-8 flex justify-between items-end">
            <div>
              <h1 class="text-3xl font-bold text-indigo-600">Pocket Client 🚀</h1>
              <p class="text-slate-500 font-medium">Embedded Local-first Http Client Tool</p>
            </div>
          </header>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <form
              hx-post="/request"
              hx-target="#result"
              hx-disabled-elt="button"
              class="space-y-4"
              x-data={`{
                activeTab: 'params', // 'params' | 'headers' | 'body' | 'raw'
                viewMode: 'gui', // 'gui' | 'raw'
                params: [{ key: '', value: '', active: true }],
                headers: ${JSON.stringify(initialHeaders)},
                bodyType: 'none',
                bodyContent: '',
                method: 'GET',
                url: '',
                baseUrl: '${config.baseUrl || ''}',
                allSuggestions: ${JSON.stringify(uniqueSuggestions)},
                showSuggestions: false,
                selectedIndex: -1,
                
                // 💡 Raw JSON 문자열 상태 (양방향 바인딩용)
                rawJsonString: '',
                templateName: '', // 저장할 파일명

                runCustomFunctions() {
                  const scriptsMap = window.__POCKET_CODES || {};
                  
                  Object.entries(scriptsMap).forEach(([fileName, rawCode]) => {
                    try {
                      const pocket = {
                        config: ${JSON.stringify(config)},
                        setHeader: (key, value) => {
                          const existing = this.headers.find(h => h.key.toLowerCase() === key.toLowerCase());
                          if (existing) { existing.value = value; existing.active = true; }
                          else { this.headers.push({ key, value, active: true }); }
                        },
                        getHeaders: () => this.headers,
                        setUrl: (val) => this.url = val,
                        getUrl: () => this.url,
                        setMethod: (val) => this.method = val,
                        registerAction: (name, fn) => {
                          window.PocketActions = window.PocketActions || {};
                          window.PocketActions[name] = fn.bind(this);
                        }
                      };

                      const allMatches = Array.from(rawCode.matchAll(/(?:async\\s+)?function\\s+([a-zA-Z_$][\\w$]*)/g));
                      const funcNames = allMatches.map(m => m[1]);

                      if (funcNames.length === 0) return;

                      const primaryFunc = funcNames[0];

                      try {
                        const finalCode = \`\${rawCode}\\n\\nif(typeof \${primaryFunc} === 'function') \${primaryFunc}(pocket);\\n//# sourceURL=pocket/functions/\${fileName}.js\`;
                        const runner = new Function('pocket', finalCode);
                        runner(pocket);
                      } catch (runtimeError) {
                        console.error(\`❌ [\${fileName}.js] Error:\`, runtimeError.message);
                      }
                    } catch (e) {}
                  });
                },

                // 💡 GUI 상태를 Raw JSON 문자열로 변환
                updateRawJson() {
                  if (this.viewMode === 'raw') return; 

                  const payload = {
                    method: this.method,
                    url: this.url,
                    headers: this.headers.filter(h => h.key.trim() !== ''),
                    params: this.params.filter(p => p.key.trim() !== ''),
                    bodyType: this.bodyType,
                    bodyContent: this.bodyContent
                  };
                  this.rawJsonString = JSON.stringify(payload, null, 2);
                },

                // 💡 Raw JSON 텍스트 에어리어 입력 시 GUI 폼 동기화
                parseRawJson() {
                  try {
                    const parsed = JSON.parse(this.rawJsonString);
                    this.method = parsed.method || 'GET';
                    this.url = parsed.url || '';
                    this.bodyType = parsed.bodyType || 'none';
                    this.bodyContent = parsed.bodyContent || '';
                    
                    this.headers = (parsed.headers && parsed.headers.length > 0) 
                      ? parsed.headers : [{ key: '', value: '', active: true }];
                    
                    this.params = (parsed.params && parsed.params.length > 0) 
                      ? parsed.params : [{ key: '', value: '', active: true }];
                  } catch (e) {
                    // 입력 중 문법 오류가 나면 무시 (완성될 때 파싱)
                  }
                },

                // 💡 현재 템플릿을 서버에 저장
                async saveTemplate() {
                  let name = prompt('저장할 템플릿 이름을 입력하세요 (예: user-login)', this.templateName);
                  if (!name) return;
                  name = name.trim();
                  
                  // 저장 전 최신 상태 반영
                  if (this.viewMode === 'gui') {
                    this.updateRawJson();
                  }
                  
                  try {
                    const res = await fetch(\`/templates/\${encodeURIComponent(name)}\`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: this.rawJsonString
                    });
                    if (res.ok) {
                      this.templateName = name;
                      alert('저장되었습니다.');
                      // 💡 fetch는 HTMX 트리거를 무시하므로, 브라우저 이벤트를 직접 강제로 쏴서 사이드바를 리로드시킵니다!
                      window.dispatchEvent(new CustomEvent('templates-updated'));
                    }
                  } catch(e) {
                    alert('저장 실패!');
                  }
                },

                get formControl() {
                  return {
                    ['x-init']() {
                      this.$watch('method', (val) => {
                        if (val === 'GET' && this.activeTab === 'body') { this.activeTab = 'params'; }
                        this.updateRawJson();
                      });
                      this.$watch('url', () => {
                        this.selectedIndex = -1;
                        if (this.$refs.suggestionBox) { this.$refs.suggestionBox.scrollTop = 0; }
                        this.updateRawJson();
                      });
                      
                      // 입력값 변경 시 Raw JSON 실시간 동기화
                      this.$watch('params', () => this.updateRawJson(), { deep: true });
                      this.$watch('headers', () => this.updateRawJson(), { deep: true });
                      this.$watch('bodyType', () => this.updateRawJson());
                      this.$watch('bodyContent', () => this.updateRawJson());
                      
                      this.runCustomFunctions();
                      this.updateRawJson(); // 초기화 시 1회 동기화
                    },
                    
                    // 💡 사이드바의 스냅샷 클릭 이벤트
                    ['x-on:fill-request-form.window']($event) {
                      const data = $event.detail;
                      this.method = data.method;
                      const decodedBody = decodeURIComponent(data.body || '');
                      this.bodyContent = decodedBody;
                      this.bodyType = decodedBody ? 'json' : 'none';

                      try {
                        const decodedUrl = decodeURIComponent(data.url);
                        const urlObj = new URL(decodedUrl);
                        if (this.baseUrl && decodedUrl.startsWith(this.baseUrl)) {
                          this.url = urlObj.pathname;
                        } else {
                          this.url = decodedUrl.split('?')[0];
                        }
                        const searchParams = Array.from(urlObj.searchParams.entries());
                        this.params = searchParams.length > 0 
                          ? searchParams.map(([key, value]) => ({ key, value, active: true }))
                          : [{ key: '', value: '', active: true }];
                      } catch(e) { this.url = decodeURIComponent(data.url); }

                      const headerEntries = Object.entries(data.headers || {});
                      this.headers = headerEntries.length > 0 
                        ? headerEntries.map(([key, value]) => ({ key, value: String(value), active: true }))
                        : [{ key: '', value: '', active: true }];
                      
                      this.templateName = ''; // 스냅샷 로드 시 템플릿 이름 초기화
                      this.updateRawJson();
                    },

                    // 💡 사이드바의 템플릿(Raw JSON) 클릭 이벤트
                    ['x-on:fill-template-form.window']($event) {
                      const data = $event.detail;
                      this.rawJsonString = JSON.stringify(data, null, 2);
                      this.parseRawJson(); // JSON -> GUI로 파싱
                    }
                  }
                },
                get suggestionContainer() { return { ['x-on:click.outside']() { this.showSuggestions = false; this.selectedIndex = -1; } } },
                scrollToSelected() {
                  this.$nextTick(() => {
                    const box = this.$refs.suggestionBox;
                    if (!box) return;
                    const activeEl = box.querySelector('[data-active="true"]');
                    if (activeEl) { activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
                  });
                },
                get urlInput() {
                  return {
                    ['x-on:focus']() { this.showSuggestions = true },
                    ['x-on:input']() { this.showSuggestions = true },
                    ['x-on:keydown.escape']() { this.showSuggestions = false; this.selectedIndex = -1; },
                    ['x-on:keydown.down.prevent']() {
                      if (!this.showSuggestions) return;
                      this.selectedIndex = (this.selectedIndex + 1) % this.filteredSuggestions.length;
                      this.scrollToSelected();
                    },
                    ['x-on:keydown.up.prevent']() {
                      if (!this.showSuggestions) return;
                      this.selectedIndex = (this.selectedIndex - 1 + this.filteredSuggestions.length) % this.filteredSuggestions.length;
                      this.scrollToSelected();
                    },
                    ['x-on:keydown.enter']($event) {
                      if (this.showSuggestions && this.selectedIndex !== -1) {
                        $event.preventDefault();
                        this.url = this.filteredSuggestions[this.selectedIndex];
                        this.showSuggestions = false;
                        this.selectedIndex = -1;
                      }
                    }
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
              }`}
              x-bind="formControl"
            >
              <div class="space-y-2">
                {config.baseUrl && (
                  <div class="flex items-center px-0.5">
                    <div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-wider shadow-sm">
                      <span class="text-indigo-400">🔗</span>
                      <span>Base:</span>
                      <span class="font-mono lowercase text-indigo-500">{config.baseUrl}</span>
                    </div>
                  </div>
                )}
                <div class="flex gap-4">
                  <select
                    name="method"
                    x-model="method"
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
                        config.baseUrl ? '/api/v1 (baseUrl 자동결합)' : 'https://api.example.com'
                      }
                    />
                    <div
                      x-ref="suggestionBox"
                      x-show="showSuggestions && filteredSuggestions.length > 0"
                      class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                      style="display: none;"
                    >
                      {/* 자동완성 드롭다운 */}
                    </div>
                  </div>
                  <button
                    type="submit"
                    class="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition active:scale-95"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* === 탭 UI === */}
              <div class="flex justify-between items-center border-b border-slate-200 mt-6">
                <div class="flex text-sm font-medium">
                  {['params', 'headers', 'body'].map((tab) => (
                    <button
                      type="button"
                      x-show={`'${tab}' !== 'body' || method !== 'GET'`}
                      x-on:click={`activeTab = '${tab}'; viewMode = 'gui'`}
                      x-bind:class={`activeTab === '${tab}' && viewMode === 'gui' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'`}
                      class="px-5 py-2 capitalize transition-all"
                    >
                      {tab}
                    </button>
                  ))}
                  <button
                    type="button"
                    x-on:click="updateRawJson(); viewMode = 'raw';"
                    x-bind:class="viewMode === 'raw' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-500 hover:text-slate-800'"
                    class="px-5 py-2 flex items-center gap-1 transition-all font-mono"
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                    </svg>{' '}
                    Raw JSON
                  </button>
                </div>

                {/* 💡 Save 버튼 */}
                <button
                  type="button"
                  x-on:click="saveTemplate()"
                  class="px-3 py-1 mb-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors flex items-center gap-1"
                >
                  💾 Save Template
                </button>
              </div>

              <div class="bg-slate-50/50 p-4 rounded-b-lg border-x border-b border-slate-200 min-h-[150px]">
                {/* === GUI 모드 === */}
                <div x-show="viewMode === 'gui'">
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
                      class="text-xs text-indigo-600 font-bold hover:underline mt-2 flex items-center gap-1"
                    >
                      + Add Parameter
                    </button>
                  </div>

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
                      class="text-xs text-indigo-600 font-bold hover:underline mt-2 flex items-center gap-1"
                    >
                      + Add Header
                    </button>
                  </div>

                  <div x-show="activeTab === 'body' && method !== 'GET'" style="display: none;">
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
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* === 💡 Raw JSON 모드 === */}
                <div x-show="viewMode === 'raw'" style="display: none;">
                  <p class="text-xs text-slate-500 mb-2">
                    이 JSON 텍스트를 수정하면 상단 URL 및 파라미터 폼에 즉시 반영됩니다.
                  </p>
                  <textarea
                    x-model="rawJsonString"
                    x-on:input="parseRawJson()"
                    class="w-full border border-slate-300 rounded-lg p-3 font-mono text-xs outline-none focus:border-slate-500 bg-slate-800 text-green-400 min-h-[250px]"
                    spellcheck={false}
                  ></textarea>
                </div>
              </div>
              <input type="hidden" name="pocket_payload" x-bind:value="rawJsonString" />
            </form>
          </div>
          <div id="result"></div>
        </div>
      </main>
    </Layout>
  );
};
