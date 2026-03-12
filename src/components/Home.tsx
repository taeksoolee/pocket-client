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

      <Sidebar snapshots={snapshots} templates={templates} />

      <main class="flex-1 h-screen overflow-y-auto p-8 bg-slate-50 text-slate-800">
        <div class="max-w-4xl mx-auto">
          <header class="mb-8 flex justify-between items-end relative">
            <div>
              <h1 class="text-3xl font-bold text-indigo-600">Pocket Client 🚀</h1>
              <p class="text-slate-500 font-medium">Embedded Local-first Http Client Tool</p>
            </div>

            {/* 💡 이식된 Functions 드롭다운 메뉴 */}
            <div
              class="relative"
              x-data={`{ 
                showFunctions: false, 
                actions: [],
                
                get dropdownSetup() {
                  return {
                    ['x-init']() {
                      // 동기식 스크립트를 위해 초기 1회 로드 (비동기는 클릭 시 다시 갱신됨)
                      setTimeout(() => { this.actions = Object.keys(window.PocketActions || {}) }, 300);
                    },
                    ['x-on:click.outside']() { 
                      this.showFunctions = false; 
                    }
                  }
                },
                
                // 💡 트랜지션 효과도 일관성 있게 바인딩으로 처리
                get dropdownTransition() {
                  return {
                    ['x-transition:enter']: 'transition ease-out duration-200',
                    ['x-transition:enter-start']: 'opacity-0 translate-y-2',
                    ['x-transition:enter-end']: 'opacity-100 translate-y-0'
                  }
                }
              }`}
              x-bind="dropdownSetup"
            >
              <button
                type="button"
                // 🚨 핵심 수정: 버튼을 누를 때마다 PocketActions 목록을 실시간으로 다시 읽어옵니다!
                x-on:click="showFunctions = !showFunctions; actions = Object.keys(window.PocketActions || {})"
                x-bind:class="showFunctions ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'"
                class="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
              >
                <span>⚡</span>
                <span class="text-sm">Functions</span>
                <svg
                  class="w-4 h-4 transition-transform"
                  x-bind:class="showFunctions ? 'rotate-180' : ''"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                x-show="showFunctions"
                x-bind="dropdownTransition"
                class="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4"
                style="display: none;"
              >
                <div class="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>Custom Actions</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <template x-for="name in actions" x-bind:key="name">
                    <button
                      type="button"
                      x-on:click="window.PocketActions[name](); showFunctions = false"
                      class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all group"
                    >
                      <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors shadow-sm">
                        <span class="text-xs font-black text-indigo-400 group-hover:text-white">
                          ƒ
                        </span>
                      </div>
                      <span
                        class="text-[11px] font-mono text-slate-600 group-hover:text-indigo-700 truncate w-full text-center"
                        x-text="name"
                      ></span>
                    </button>
                  </template>

                  <div
                    x-show="actions.length === 0"
                    class="col-span-2 py-4 text-center text-xs text-slate-400 italic"
                  >
                    등록된 액션이 없습니다.
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <form
              hx-post="/request"
              hx-target="#result"
              hx-disabled-elt="button"
              class="space-y-4"
              x-data={`{
                activeTab: 'params',
                viewMode: 'gui',
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
                
                rawJsonString: '',
                templateName: '',

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

                // 💡 수정됨: Raw 모드일 때 타이핑 중 커서 튐 현상 방지
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
                    // 문법 오류 무시
                  }
                },

                // 💡 수정됨: 저장 시 사이드바 즉시 갱신 이벤트 발송 추가
                async saveTemplate() {
                  let name = prompt('저장할 템플릿 이름을 입력하세요 (예: user-login)', this.templateName);
                  if (!name) return;
                  name = name.trim();
                  
                  // GUI 모드일 때만 폼 데이터를 JSON으로 포맷팅 (Raw 모드 공백 보존)
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
                      // alert('저장되었습니다.');

                      // 💡 HTMX가 사이드바를 다시 불러오도록 강제로 이벤트를 발생시킴! (bubbles: true 필수)
                      document.body.dispatchEvent(new Event('templates-updated', { bubbles: true }));

                      // 💡 2. 신규 추가: 사이드바가 갱신될 시간을 아주 잠깐(100ms) 준 뒤, 
                      // 방금 저장한 템플릿(.json)을 Active 상태로 만들라고 명령 발송
                      setTimeout(() => {
                        const filename = name.endsWith('.json') ? name : name + '.json';
                        window.dispatchEvent(new CustomEvent('template-saved', { detail: { filename } }));
                      }, 100);
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
                      
                      this.$watch('params', () => this.updateRawJson(), { deep: true });
                      this.$watch('headers', () => this.updateRawJson(), { deep: true });
                      this.$watch('bodyType', () => this.updateRawJson());
                      this.$watch('bodyContent', () => this.updateRawJson());
                      
                      this.runCustomFunctions();
                      this.updateRawJson(); 
                    },
                    
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
                      
                      this.templateName = ''; 
                      // 스냅샷 로드 시 viewMode 무시하고 덮어씌움
                      const oldMode = this.viewMode;
                      this.viewMode = 'gui';
                      this.updateRawJson();
                      this.viewMode = oldMode;
                    },

                    ['x-on:fill-template-form.window']($event) {
                      const data = $event.detail;
                      this.rawJsonString = JSON.stringify(data, null, 2);
                      this.parseRawJson(); 
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
                addRow(type) { this[type].push({ key: '', value: '', active: true }) },
                removeRow(type, index) { this[type].splice(index, 1) }
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
                      <template x-for="(s, index) in filteredSuggestions">
                        <div
                          x-on:click="url = s; showSuggestions = false; selectedIndex = -1"
                          x-on:mouseenter="selectedIndex = index"
                          x-bind:data-active="selectedIndex === index"
                          x-bind:class="selectedIndex === index ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'"
                          class="px-4 py-2 cursor-pointer font-mono text-xs border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <span
                            x-bind:class="selectedIndex === index ? 'text-indigo-600' : 'text-indigo-400'"
                            class="font-bold"
                          >
                            ↳
                          </span>{' '}
                          <span x-text="s"></span>
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
                  {/* 💡 탭 전환 시점 동기화 방어 */}
                  <button
                    type="button"
                    x-on:click="updateRawJson(); viewMode = 'raw'"
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
                    </svg>
                    Raw JSON
                  </button>
                </div>

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

                {/* === Raw JSON 모드 === */}
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
