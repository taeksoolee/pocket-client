import type { PocketConfig } from '../config';
import type { RequestRow } from '../types';

export function requestFormState(
  config: PocketConfig,
  initialHeaders: RequestRow[],
  uniqueSuggestions: string[],
): string {
  return `{
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

      showCodeModal: false,
      generatedCode: '',
      isCopied: false,

      isLoading: false,

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
        if (this.viewMode === 'gui') { this.updateRawJson(); }
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

      cancelRequest() {
        htmx.trigger(this.$refs.requestForm, 'htmx:abort');
        this.isLoading = false;
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
            this.$el.addEventListener('htmx:beforeRequest', () => { this.isLoading = true; });
            this.$el.addEventListener('htmx:afterRequest', () => { this.isLoading = false; });
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
    }`;
}
