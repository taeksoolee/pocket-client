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
  timestamp,
}: {
  filename?: string;
  request: SnapshotRequest;
  response: SnapshotResponse;
  timestamp?: string;
}) => {
  const dataString =
    typeof response.data === 'object' && response.data !== null
      ? JSON.stringify(response.data, null, 2)
      : String(response.data);

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
      {/* 1. 상단 헤더 (Copy 버튼 제거되어 깔끔해짐) */}
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
      </div>

      {/* 2. URL 및 요청시간 라인 */}
      <div class="px-4 py-2 bg-white border-b border-slate-100 text-[11px] font-mono text-slate-500 flex justify-between items-center gap-4">
        <div class="truncate" title={request.url}>
          🌐 {request.url}
        </div>
        {timestamp && (
          <div class="flex-shrink-0 text-slate-400">
            <span class="font-sans mr-1">요청시간:</span>
            <span>{timestamp}</span>
          </div>
        )}
      </div>

      {/* 3. 탭 네비게이션 */}
      <div class="flex border-b border-slate-200 text-xs font-medium bg-slate-50/50 overflow-x-auto">
        {['res-body', 'res-headers', 'req-headers', 'req-body'].map((tab) => (
          <button
            type="button"
            x-on:click={`activeTab = '${tab}'`}
            x-bind:class={`activeTab === '${tab}' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-800'`}
            class="px-5 py-2.5 whitespace-nowrap capitalize transition-all"
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* 4. 컨텐츠 영역 (Floating 버튼 포함) */}
      <div class="relative group bg-slate-900 flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* 💡 Floating Copy Button: 마우스를 올렸을 때만 나타남 */}
        <div
          x-show="activeTab === 'res-body'"
          class="absolute top-3 right-3 z-10 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
        >
          <button
            type="button"
            x-on:click="copy('res-json')"
            x-bind:class="copied ? 'bg-green-600 border-green-500' : 'bg-slate-800/80 hover:bg-slate-700 border-slate-600'"
            class="flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-white text-[10px] font-bold backdrop-blur-sm transition-all active:scale-95 shadow-xl"
          >
            <span x-text="copied ? '✅' : '📋'">📋</span>
            <span x-text="copied ? 'Copied!' : 'Copy'">Copy</span>
          </button>
        </div>

        <div class="p-4 text-slate-300 font-mono text-sm overflow-auto flex-1 custom-scrollbar">
          <div x-show="activeTab === 'res-body'">
            <pre id="res-json" class="leading-relaxed whitespace-pre-wrap break-all">
              {dataString}
            </pre>
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
            <pre class="leading-relaxed whitespace-pre-wrap break-all">
              {request.body || 'No request body.'}
            </pre>
          </div>
        </div>
      </div>

      {/* 5. 하단 푸터 */}
      {filename && (
        <div class="px-4 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div class="flex items-center gap-1.5">
            <span class="text-slate-300">📁</span>
            <span class="font-sans uppercase font-bold text-slate-500 tracking-tighter">
              Snapshot Path:
            </span>
            <span class="bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-500">
              ./{basename(workspaceDir)}/snapshorts/{filename}
            </span>
          </div>
          <div class="text-[9px] uppercase font-bold tracking-widest text-slate-300">
            Local Persistence Active
          </div>
        </div>
      )}
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
