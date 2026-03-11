import { basename } from 'node:path';

import { workspaceDir } from '../../config';

// 💡 상태 코드에 따른 색상을 반환하는 헬퍼 함수
const getStatusBadge = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-700 border-green-200';
  if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

export const SuccessCard = ({
  duration,
  filename,
  data,
  status = 200, // 추가됨: HTTP 상태 코드
  responseHeaders = {}, // 추가됨: 응답 헤더 객체
}: {
  duration: number;
  filename: string;
  data: any;
  status?: number;
  responseHeaders?: Record<string, string>;
}) => {
  // 💡 응답 데이터의 대략적인 크기 계산 (KB)
  const dataString = JSON.stringify(data, null, 2);
  const sizeKb = (new Blob([dataString]).size / 1024).toFixed(2);

  return (
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300"
      x-data="{ activeTab: 'body' }"
    >
      {/* 1. 응답 메타 정보 헤더 */}
      <div class="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <span
            class={`px-2.5 py-1 rounded text-xs font-black border tracking-wider ${getStatusBadge(status)}`}
          >
            {status}
          </span>
          <div class="flex items-center gap-3 text-sm font-mono text-slate-500">
            <span class="flex items-center gap-1" title="Time">
              ⏱️ {duration} ms
            </span>
            <span class="text-slate-300">|</span>
            <span class="flex items-center gap-1" title="Size">
              📦 {sizeKb} KB
            </span>
          </div>
        </div>

        {/* 바닐라 JS 복사 버튼 */}
        <button
          onclick="copyToClipboard(this, 'result-json')"
          class="text-xs flex items-center gap-1 bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm active:scale-95"
        >
          📋 Copy JSON
        </button>
      </div>

      {/* 2. 탭 네비게이션 */}
      <div class="flex border-b border-slate-200 text-xs font-medium bg-slate-50/50">
        <button
          type="button"
          x-on:click="activeTab = 'body'"
          x-bind:class="activeTab === 'body' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-800'"
          class="px-5 py-2.5 transition-colors"
        >
          Response Body
        </button>
        <button
          type="button"
          x-on:click="activeTab = 'headers'"
          x-bind:class="activeTab === 'headers' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-800'"
          class="px-5 py-2.5 transition-colors"
        >
          Headers
        </button>
      </div>

      {/* 3. 탭 컨텐츠 영역 */}
      <div class="p-4 bg-slate-900 text-slate-300 font-mono text-sm overflow-auto max-h-[600px] flex-1">
        {/* 🎯 Body 탭 */}
        <div x-show="activeTab === 'body'">
          <div class="mb-3 text-slate-500 text-xs">
            📄 Saved at: ./{basename(workspaceDir)}/results/{filename}
          </div>
          <pre id="result-json">{dataString}</pre>
        </div>

        {/* 🎯 Headers 탭 */}
        <div x-show="activeTab === 'headers'" style="display: none;">
          {Object.keys(responseHeaders).length === 0 ? (
            <div class="text-slate-500 italic">No headers available.</div>
          ) : (
            <table class="w-full text-left border-collapse">
              <tbody>
                {Object.entries(responseHeaders).map(([key, value]) => (
                  <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td class="py-2 pr-4 text-indigo-400 font-semibold whitespace-nowrap">{key}</td>
                    <td class="py-2 text-slate-300 break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
