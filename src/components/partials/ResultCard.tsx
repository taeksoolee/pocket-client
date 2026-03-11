import { basename } from 'node:path';

import { workspaceDir } from '../../config';
import type { SnapshotRequest, SnapshotResponse } from '../../utils/snapshot';

const getStatusBadge = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-700 border-green-200';
  if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

export const SuccessCard = ({
  filename,
  request,
  response,
}: {
  filename?: string;
  request: SnapshotRequest;
  response: SnapshotResponse;
}) => {
  const dataString = JSON.stringify(response.data, null, 2);
  const sizeKb = (new Blob([dataString]).size / 1024).toFixed(2);

  return (
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300"
      x-data="{ 
        activeTab: 'res-body',
        copied: false,
        async copy(targetId) {
          const el = document.getElementById(targetId);
          if (!el) return;
          try {
            await navigator.clipboard.writeText(el.innerText);
            this.copied = true;
            setTimeout(() => { this.copied = false }, 2000);
          } catch (err) {
            console.error('Copy failed', err);
          }
        }
      }"
    >
      <div class="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <span
            class={`px-2.5 py-1 rounded text-xs font-black border tracking-wider ${getStatusBadge(response.status)}`}
          >
            {response.status}
          </span>
          <div class="flex items-center gap-3 text-sm font-mono text-slate-500">
            <span class="font-bold text-slate-700">{request.method}</span>
            <span class="text-slate-300">|</span>
            <span class="flex items-center gap-1">⏱️ {response.duration} ms</span>
            <span class="text-slate-300">|</span>
            <span class="flex items-center gap-1">📦 {sizeKb} KB</span>
          </div>
        </div>

        {filename && (
          <button
            type="button"
            x-on:click="copy('res-json')"
            x-bind:class="copied ? 'text-green-600 bg-green-50 border-green-200' : 'text-slate-600 hover:bg-slate-50 border-slate-200'"
            class="text-xs flex items-center gap-1 bg-white px-3 py-1.5 border rounded-lg transition shadow-sm active:scale-95"
          >
            <span x-text="copied ? '✅ Copied!' : '📋 Copy Response'">📋 Copy Response</span>
          </button>
        )}
      </div>

      <div
        class="px-4 py-2 bg-white border-b border-slate-100 text-xs font-mono text-slate-500 truncate"
        title={request.url}
      >
        🌐 {request.url}
      </div>

      <div class="flex border-b border-slate-200 text-xs font-medium bg-slate-50/50 overflow-x-auto">
        {['res-body', 'res-headers', 'req-headers', 'req-body'].map((tab) => (
          <button
            type="button"
            x-on:click={`activeTab = '${tab}'`}
            x-bind:class={`activeTab === '${tab}' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-800'`}
            class="px-5 py-2.5 whitespace-nowrap capitalize"
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div class="p-4 bg-slate-900 text-slate-300 font-mono text-sm overflow-auto max-h-[600px] flex-1">
        <div x-show="activeTab === 'res-body'">
          {filename && (
            <div class="mb-3 text-slate-500 text-xs">
              📄 Saved at: ./{basename(workspaceDir)}/results/{filename}
            </div>
          )}
          <pre id="res-json">{dataString}</pre>
        </div>
        <div x-show="activeTab === 'res-headers'" style="display: none;">
          <table class="w-full text-left border-collapse">
            <tbody>
              {Object.entries(response.headers).map(([key, value]) => (
                <tr class="border-b border-slate-800">
                  <td class="py-2 pr-4 text-indigo-400 font-semibold">{key}</td>
                  <td class="py-2 text-slate-300 break-all">{value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div x-show="activeTab === 'req-headers'" style="display: none;">
          <table class="w-full text-left border-collapse">
            <tbody>
              {Object.entries(request.headers).map(([key, value]) => (
                <tr class="border-b border-slate-800">
                  <td class="py-2 pr-4 text-emerald-400 font-semibold">{key}</td>
                  <td class="py-2 text-slate-300 break-all">{value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div x-show="activeTab === 'req-body'" style="display: none;">
          <pre>{request.body || 'No request body.'}</pre>
        </div>
      </div>
    </div>
  );
};

export const ErrorCard = ({ message }: { message: string }) => (
  <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in fade-in">
    <div class="font-bold mb-1 flex items-center gap-2">
      <span class="text-xl">🚨</span> 요청 실패
    </div>
    <div class="text-sm font-mono mt-2 bg-red-100/50 p-3 rounded border border-red-100 break-all">
      {message}
    </div>
  </div>
);
