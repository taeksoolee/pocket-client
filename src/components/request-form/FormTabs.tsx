export const FormTabs = () => (
  <>
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
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
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
              <input type="checkbox" x-model="item.active" class="w-4 h-4 rounded border-slate-300 text-indigo-600" />
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
              <button type="button" x-on:click="removeRow('params', index)" class="p-1.5 text-slate-400 hover:text-red-500">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </template>
          <button type="button" x-on:click="addRow('params')" class="text-xs text-indigo-600 font-bold hover:underline mt-2 flex items-center gap-1">
            + Add Parameter
          </button>
        </div>

        <div x-show="activeTab === 'headers'" class="space-y-2" style="display: none;">
          <template x-for="(item, index) in headers" x-bind:key="index">
            <div class="flex gap-2 items-center">
              <input type="checkbox" x-model="item.active" class="w-4 h-4 rounded border-slate-300 text-indigo-600" />
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
              <button type="button" x-on:click="removeRow('headers', index)" class="p-1.5 text-slate-400 hover:text-red-500">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </template>
          <button type="button" x-on:click="addRow('headers')" class="text-xs text-indigo-600 font-bold hover:underline mt-2 flex items-center gap-1">
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
  </>
);
