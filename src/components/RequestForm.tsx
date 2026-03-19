import { config } from '../config';
import type { RequestRow } from '../types';

export const RequestForm = ({
  initialHeaders,
  uniqueSuggestions,
}: {
  initialHeaders: RequestRow[];
  uniqueSuggestions: string[];
}) => (
  <div
    class="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative"
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

      // 💡 Get Code 기능 상태
      showCodeModal: false,
      generatedCode: '',
      isCopied: false,

      runCustomFunctions() {
        window.PocketActions = {};
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
                window.PocketActions[name] = fn.bind(this);
              }
            };

            const finalCode = rawCode + '\\n//# sourceURL=pocket/functions/' + fileName + '.js';
            const runner = new Function('pocket', 'registerAction', 'setHeader', 'setUrl', 'setMethod', 'getHeaders', 'getUrl', finalCode);
            runner(pocket, pocket.registerAction, pocket.setHeader, pocket.setUrl, pocket.setMethod, pocket.getHeaders, pocket.getUrl);
          } catch (e) {
            window.showToast('함수 로딩 실패 [' + fileName + ']: ' + (e instanceof Error ? e.message : String(e)));
          }
        });
      },

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
          console.warn('[PocketClient] Raw JSON 파싱 실패:', e instanceof Error ? e.message : e);
        }
      },

      async saveTemplate() {
        let name = prompt('저장할 템플릿 이름을 입력하세요 (예: user-login)', this.templateName);
        if (!name) return;
        name = name.trim();
        
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
            document.body.dispatchEvent(new Event('templates-updated', { bubbles: true }));
            setTimeout(() => {
              const filename = name.endsWith('.json') ? name : name + '.json';
              window.dispatchEvent(new CustomEvent('template-saved', { detail: { filename } }));
            }, 100);
          }
        } catch(e) {
          window.showToast('템플릿 저장 실패: ' + (e instanceof Error ? e.message : String(e)));
        }
      },

      generateFetchCode() {
        let finalUrl = this.resolvedUrl;
        const activeParams = this.params.filter(p => p.active && p.key.trim() !== '');
        
        if (activeParams.length > 0 && finalUrl) {
          try {
            const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : 'http://local' + (finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl));
            activeParams.forEach(p => urlObj.searchParams.append(p.key.trim(), p.value));
            finalUrl = finalUrl.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
          } catch(e) {
            console.warn('[PocketClient] URL 파라미터 파싱 실패:', e instanceof Error ? e.message : e);
          }
        }

        let lines = [];
        lines.push("fetch('" + finalUrl + "', {");
        lines.push("  method: '" + this.method + "'");
        
        const activeHeaders = this.headers.filter(h => h.active && h.key.trim() !== '');
        let hasContentType = false;
        
        if (activeHeaders.length > 0 || (this.method !== 'GET' && this.bodyType === 'json')) {
          lines[lines.length - 1] += ',';
          lines.push('  headers: {');
          activeHeaders.forEach(h => {
            lines.push('    "' + h.key.trim() + '": "' + h.value.replace(/"/g, '\\\\"') + '",');
            if (h.key.trim().toLowerCase() === 'content-type') hasContentType = true;
          });
          
          if (this.method !== 'GET' && this.bodyType === 'json' && !hasContentType) {
            lines.push('    "Content-Type": "application/json"');
          }
          lines.push('  }');
        }

        if (this.method !== 'GET' && this.bodyType === 'json' && this.bodyContent) {
          lines[lines.length - 1] += ',';
          let bodyStr = this.bodyContent;
          try { bodyStr = JSON.stringify(JSON.parse(this.bodyContent), null, 2); } catch(e){ console.warn('[PocketClient] body JSON 포맷 실패, 원본 사용'); }
          let formattedBody = bodyStr.split('\\n').join('\\n    ');
          lines.push('  body: JSON.stringify(' + formattedBody + ')');
        }

        lines.push('})');
        lines.push('.then(response => response.json())');
        lines.push('.then(data => console.log(data))');
        lines.push('.catch(error => console.error("Error:", error));');

        this.generatedCode = lines.join('\\n');
        this.isCopied = false; 
        this.showCodeModal = true;
      },

      copyCode() {
        navigator.clipboard.writeText(this.generatedCode).then(() => {
          this.isCopied = true;
          if (this.copyTimer) clearTimeout(this.copyTimer);
          this.copyTimer = setTimeout(() => { this.isCopied = false; }, 2000);
        });
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
      
      get modalBackdrop() {
        return {
          ['x-transition:enter']: 'ease-out duration-200',
          ['x-transition:enter-start']: 'opacity-0',
          ['x-transition:enter-end']: 'opacity-100',
          ['x-transition:leave']: 'ease-in duration-150',
          ['x-transition:leave-start']: 'opacity-100',
          ['x-transition:leave-end']: 'opacity-0'
        }
      },
      
      get modalContent() {
        return {
          ['x-on:click.outside']() { this.showCodeModal = false; },
          ['x-transition:enter']: 'ease-out duration-200',
          ['x-transition:enter-start']: 'scale-95 translate-y-2',
          ['x-transition:enter-end']: 'scale-100 translate-y-0'
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
        return this.allSuggestions.filter(item => item.toLowerCase().includes(item.startsWith('/') ? s : s.replace(/^\\/+/, '')) && item !== this.url).slice(0, 10);
      },
      get resolvedUrl() {
        if (this.url.startsWith('http://') || this.url.startsWith('https://')) return this.url;
        if (this.url.startsWith('/') && this.baseUrl) {
          return this.baseUrl.replace(/\\/+$/, '') + '/' + this.url.replace(/^\\/+/, '');
        }
        return this.url;
      },
      addRow(type) { this[type].push({ key: '', value: '', active: true }) },
      removeRow(type, index) { this[type].splice(index, 1) }
    }`}
  >
    <div class="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
      <div class="flex items-center gap-2">
        {config.baseUrl ? (
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider shadow-sm">
            <span class="text-indigo-400">🔗</span>
            <span>Base:</span>
            <span class="font-mono lowercase text-indigo-400">{config.baseUrl}</span>
          </div>
        ) : (
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            New Request
          </div>
        )}
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          x-on:click="generateFetchCode()"
          class="px-3 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <span>💻</span>
          <span>Get Code</span>
        </button>

        <button
          type="button"
          x-on:click="saveTemplate()"
          class="px-3 py-1 text-[11px] font-bold text-indigo-600 bg-white hover:bg-indigo-50 rounded border border-indigo-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <span>💾</span>
          <span>Save Template</span>
        </button>
      </div>
    </div>

    <div class="p-6">
      <form
        hx-post="/request"
        hx-target="#snapshort"
        hx-disabled-elt="button"
        class="space-y-4"
        x-bind="formControl"
      >
        <div class="flex gap-4">
          <select
            name="method"
            x-model="method"
            class="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 font-bold outline-none focus:border-indigo-500 text-sm"
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
            class="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition active:scale-95 text-sm shadow-md"
          >
            Send
          </button>
        </div>

        <div
          class="px-1 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 overflow-hidden"
          x-show="url.trim().length > 0"
          style="display: none; margin-left: 120px;"
        >
          <span class="flex-shrink-0 text-indigo-500 font-black uppercase tracking-tighter">
            Target:
          </span>
          <span class="truncate text-slate-500" x-text="resolvedUrl"></span>
        </div>

        <div class="flex justify-between items-center border-b border-slate-200 mt-6 mb-0">
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
        </div>

        <div class="bg-slate-50/50 p-4 rounded-b-lg border-x border-b border-slate-200 min-h-[150px]">
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

    {/* 💡 핵심 변경: absolute를 fixed로, z-index를 100으로 올려서 진짜 전체화면 팝업 구현 */}
    <div
      x-show="showCodeModal"
      style="display: none;"
      class="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
      x-bind="modalBackdrop"
    >
      <div
        class="bg-[#0d1117] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-slate-700/80 flex flex-col transform transition-transform"
        x-bind="modalContent"
      >
        <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div class="flex items-center gap-4">
            <div class="flex gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div class="text-slate-400 font-mono text-[11px] tracking-wider font-bold">
              fetch-snippet.js
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              x-on:click="copyCode()"
              x-bind:class="isCopied ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'"
              class="px-3 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 outline-none shadow-sm"
            >
              <span x-text="isCopied ? '✅' : '📋'"></span>
              <span x-text="isCopied ? 'Copied!' : 'Copy Code'"></span>
            </button>
            <div class="w-px h-4 bg-slate-700"></div>
            <button
              type="button"
              x-on:click="showCodeModal = false"
              class="p-1 text-slate-500 hover:text-white hover:bg-red-500/80 rounded transition-colors outline-none"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="p-6 overflow-auto max-h-[60vh] custom-scrollbar bg-[#0d1117]">
          <pre class="text-[13px] text-emerald-400 font-mono leading-relaxed">
            <code x-text="generatedCode"></code>
          </pre>
        </div>
      </div>
    </div>
  </div>
);
