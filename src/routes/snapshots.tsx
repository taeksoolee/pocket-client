import { Hono } from 'hono';

import { deleteSnapshot, getSnapshot } from '../utils/snapshot';

const snapshots = new Hono();

const getStatusBadge = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-700 border-green-200';
  if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

snapshots.get('/:filename', (c) => {
  const filename = c.req.param('filename');
  const snapshot = getSnapshot(filename);

  if (!snapshot) {
    return c.html(<div class="p-4 text-red-500">파일을 찾을 수 없습니다.</div>);
  }

  const { meta, data } = snapshot;
  const status = meta.status || 200;
  const duration = meta.duration || 0;
  const responseHeaders = meta.headers || {};

  // 크기 계산
  const dataString = JSON.stringify(data, null, 2);
  const sizeKb = (new Blob([dataString]).size / 1024).toFixed(2);

  return c.html(
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300"
      x-data="{ activeTab: 'body' }"
    >
      {/* 1. 상단 정보 바 */}
      <div class="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <span
            class={`px-2.5 py-1 rounded text-xs font-black border tracking-wider ${getStatusBadge(status)}`}
          >
            {status}
          </span>
          <div class="flex items-center gap-3 text-sm font-mono text-slate-500">
            <span class="flex items-center gap-1 font-bold text-slate-700">{meta.method}</span>
            <span class="text-slate-300">|</span>
            <span class="flex items-center gap-1">⏱️ {duration} ms</span>
            <span class="text-slate-300">|</span>
            <span class="flex items-center gap-1">📦 {sizeKb} KB</span>
          </div>
        </div>

        <button
          onclick="copyToClipboard(this, 'snapshot-json')"
          class="text-xs flex items-center gap-1 bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm active:scale-95"
        >
          📋 Copy JSON
        </button>
      </div>

      {/* URL 표시 영역 (기록 조회 시 어떤 URL인지 아는게 중요함) */}
      <div
        class="px-4 py-2 bg-white border-b border-slate-100 text-xs font-mono text-slate-500 truncate"
        title={meta.url}
      >
        🌐 {meta.url}
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
          <pre id="snapshot-json">{dataString}</pre>
        </div>

        {/* 🎯 Headers 탭 */}
        <div x-show="activeTab === 'headers'" style="display: none;">
          {Object.keys(responseHeaders).length === 0 ? (
            <div class="text-slate-500 italic">No headers recorded in this snapshot.</div>
          ) : (
            <table class="w-full text-left border-collapse">
              <tbody>
                {Object.entries(responseHeaders).map(([key, value]) => (
                  <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td class="py-2 pr-4 text-indigo-400 font-semibold whitespace-nowrap">{key}</td>
                    <td class="py-2 text-slate-300 break-all">{value as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
  );
});

snapshots.delete('/:filename', (c) => {
  const filename = c.req.param('filename');
  const success = deleteSnapshot(filename);
  if (success) {
    c.header('HX-Trigger', 'snapshotUpdated');
    return c.html(
      '<div class="p-10 text-center text-slate-400 italic">스냅샷이 삭제되었습니다.</div>',
    );
  }
  return c.text('삭제 실패', 500);
});

export default snapshots;
