import { config } from '../config';
import { Layout } from './Layout';
import { Sidebar } from './Sidebar';

export const Home = ({
  files,
  suggestions = [],
  functionsMap = {},
}: {
  files: string[];
  suggestions?: string[];
  functionsMap?: Record<string, string>;
}) => {
  // Config에 정의된 글로벌 헤더 초기화
  const initialHeaders = Object.entries(config.globalHeaders).map(([key, value]) => ({
    key,
    value,
    active: true,
  }));

  if (initialHeaders.length === 0) {
    initialHeaders.push({ key: '', value: '', active: true });
  }

  // 중복이 제거된 자동완성 제안 목록
  const uniqueSuggestions = [...new Set([...(config.commonEndpoints || []), ...suggestions])];

  return (
    <Layout>
      {/* [전역 스크립트 주입 (SSR)]
        서버사이드에서 로컬 파일 시스템을 읽어 만든 functionsMap 객체를 클라이언트 런타임에 전달합니다.
        별도의 API 호출(fetch) 없이 초기 로드 시점부터 즉시 커스텀 로직을 가동하기 위함입니다.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__POCKET_CODES = ${JSON.stringify(functionsMap)};`,
        }}
      />

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
                headers: ${JSON.stringify(initialHeaders)},
                bodyType: 'none',
                bodyContent: '',
                method: 'GET',
                url: '',
                baseUrl: '${config.baseUrl || ''}',
                allSuggestions: ${JSON.stringify(uniqueSuggestions)},
                showSuggestions: false,
                selectedIndex: -1,
                
                // ===========================================================================
                // [커스텀 함수 런타임 엔진]
                // window.__POCKET_CODES에 주입된 스크립트들을 파싱하고 실행하는 샌드박스 엔진입니다.
                // ===========================================================================
                runCustomFunctions() {
                  const scriptsMap = window.__POCKET_CODES || {};
                  
                  Object.entries(scriptsMap).forEach(([fileName, rawCode]) => {
                    try {
                      // 스크립트 내에서 폼 상태를 제어할 수 있도록 주입되는 API 메서드 컨텍스트
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

                      // 스크립트 파일 내에 정의된 첫 번째 함수명 추출 (async 함수 및 일반 함수 지원)
                      const allMatches = Array.from(rawCode.matchAll(/(?:async\\s+)?function\\s+([a-zA-Z_$][\\w$]*)/g));
                      const funcNames = allMatches.map(m => m[1]);

                      if (funcNames.length === 0) {
                        console.warn(\`⚠️ [Pocket] \${fileName}.js에서 명명된 함수를 찾을 수 없습니다.\`);
                        return;
                      }

                      const primaryFunc = funcNames[0];

                      try {
                        // 추출한 함수명으로 즉시 실행 구문 조립
                        // 브라우저 DevTools의 Sources 탭에서 독립된 파일처럼 디버깅할 수 있도록 sourceURL 매핑
                        const finalCode = \`\${rawCode}\\n\\nif(typeof \${primaryFunc} === 'function') \${primaryFunc}(pocket);\\n//# sourceURL=pocket/functions/\${fileName}.js\`;
                        
                        const runner = new Function('pocket', finalCode);
                        runner(pocket);
                        
                        console.log(\`✅ [Pocket] \${fileName}.js 가동 완료\`);
                      } catch (runtimeError) {
                        // 스크립트 런타임 내에서 발생한 에러를 명확한 그룹으로 묶어 로깅
                        console.group(\`❌ [Pocket] Runtime Error in '\${fileName}.js'\`);
                        console.error('함수명:', primaryFunc);
                        console.error('에러 메시지:', runtimeError.message);
                        console.groupEnd();
                      }
                    } catch (e) { 
                      console.error(\`❌ [Pocket] \${fileName}.js 엔진 처리 중 예외 발생:\`, e); 
                    }
                  });
                },

                // ===========================================================================
                // [폼 컨트롤러]
                // 입력 필드의 상태 변화를 감시하고 전역 이벤트(ex: 스냅샷 불러오기)를 처리합니다.
                // ===========================================================================
                get formControl() {
                  return {
                    ['x-init']() {
                      // GET 메서드 선택 시 Body 탭 비활성화 및 Params 탭으로 이동
                      this.$watch('method', (val) => {
                        if (val === 'GET' && this.activeTab === 'body') { this.activeTab = 'params'; }
                      });
                      
                      // URL 변경 시 자동완성 스크롤 상태 초기화
                      this.$watch('url', () => {
                        this.selectedIndex = -1;
                        if (this.$refs.suggestionBox) { this.$refs.suggestionBox.scrollTop = 0; }
                      });

                      // Alpine.js 컴포넌트 마운트 즉시 커스텀 엔진 구동
                      this.runCustomFunctions();
                    },
                    
                    // 사이드바에서 스냅샷 클릭 시 폼 데이터를 덮어쓰는 이벤트 리스너
                    ['x-on:fill-request-form.window']($event) {
                      const data = $event.detail;
                      this.method = data.method;
                      const decodedBody = decodeURIComponent(data.body || '');
                      this.bodyContent = decodedBody;
                      this.bodyType = decodedBody ? 'json' : 'none';

                      try {
                        const decodedUrl = decodeURIComponent(data.url);
                        const urlObj = new URL(decodedUrl);
                        
                        // baseUrl이 존재하고 도메인이 일치하면 pathname만 노출
                        if (this.baseUrl && decodedUrl.startsWith(this.baseUrl)) {
                          this.url = urlObj.pathname;
                        } else {
                          this.url = decodedUrl.split('?')[0];
                        }
                        
                        // URL 파라미터를 추출하여 폼 테이블에 매핑
                        const searchParams = Array.from(urlObj.searchParams.entries());
                        this.params = searchParams.length > 0 
                          ? searchParams.map(([key, value]) => ({ key, value, active: true }))
                          : [{ key: '', value: '', active: true }];
                      } catch(e) { 
                        this.url = decodeURIComponent(data.url); 
                      }

                      // 헤더 데이터를 추출하여 폼 테이블에 매핑
                      const headerEntries = Object.entries(data.headers || {});
                      this.headers = headerEntries.length > 0 
                        ? headerEntries.map(([key, value]) => ({ key, value: String(value), active: true }))
                        : [{ key: '', value: '', active: true }];
                    }
                  }
                },

                // ===========================================================================
                // [자동완성 UI 제어기]
                // ===========================================================================
                get suggestionContainer() { 
                  return { 
                    ['x-on:click.outside']() { 
                      this.showSuggestions = false; 
                      this.selectedIndex = -1; 
                    } 
                  } 
                },
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
                
                // 실제 요청 시 전송될 최종 도메인 조합 URL
                get resolvedUrl() {
                  if (this.url.startsWith('http')) return this.url;
                  return this.baseUrl.replace(/\\/+$/, '') + '/' + this.url.replace(/^\\/+/, '');
                },
                
                // 동적 리스트 조작 헬퍼
                addRow(type) { this[type].push({ key: '', value: '', active: true }) },
                removeRow(type, index) { this[type].splice(index, 1) }
              }`}
              x-bind="formControl"
            >
              {/* === 상단 요청 설정 영역 === */}
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

                    {/* 자동완성 드롭다운 */}
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

              {/* === 하단 상세 파라미터 영역 탭 === */}
              <div class="flex border-b border-slate-200 text-sm font-medium mt-6">
                {['params', 'headers', 'body'].map((tab) => (
                  <button
                    type="button"
                    x-show={`'${tab}' !== 'body' || method !== 'GET'`}
                    x-on:click={`activeTab = '${tab}'`}
                    x-bind:class={`activeTab === '${tab}' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'`}
                    class="px-5 py-2 capitalize transition-all"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div class="bg-slate-50/50 p-4 rounded-b-lg border-x border-b border-slate-200 min-h-[150px]">
                {/* Query Params 설정 */}
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

                {/* Headers 설정 */}
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

                {/* Request Body 설정 (GET 제외) */}
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

              {/* 서버 전송을 위한 폼 페이로드 병합 필드 */}
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
};
