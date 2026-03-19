import { config } from '../config';
import type { RequestRow } from '../types';
import { requestFormState } from '../alpine/requestFormState';
import { FormTabs } from './request-form/FormTabs';
import { CodeModal } from './request-form/CodeModal';

export const RequestForm = ({
  initialHeaders,
  uniqueSuggestions,
}: {
  initialHeaders: RequestRow[];
  uniqueSuggestions: string[];
}) => (
  <div
    class="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden relative"
    x-data={requestFormState(config, initialHeaders, uniqueSuggestions)}
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
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Request</div>
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
              placeholder={config.baseUrl ? '/api/v1 (baseUrl 자동결합)' : 'https://api.example.com'}
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
                  <span x-bind:class="selectedIndex === index ? 'text-indigo-600' : 'text-indigo-400'" class="font-bold">↳</span>{' '}
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
          <span class="flex-shrink-0 text-indigo-500 font-black uppercase tracking-tighter">Target:</span>
          <span class="truncate text-slate-500" x-text="resolvedUrl"></span>
        </div>

        <FormTabs />

        <input type="hidden" name="pocket_payload" x-bind:value="rawJsonString" />
      </form>
    </div>

    <CodeModal />
  </div>
);
