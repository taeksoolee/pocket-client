import { Hono } from 'hono';

import { getSnapshot } from '../utils/snapshot';

const snapshots = new Hono();

snapshots.get('/:filename', (c) => {
  const filename = c.req.param('filename');
  const snapshot = getSnapshot(filename);

  if (!snapshot) {
    return c.html(
      <div class="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
        파일을 찾을 수 없습니다.
      </div>,
    );
  }

  // 저장 성공 시 UI와 비슷하지만 '조회 전용' 느낌으로 렌더링
  return c.html(
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div class="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-tight">
            Snapshot Detail
          </span>
          <span class="text-sm font-mono text-indigo-600 font-semibold">{filename}</span>
        </div>
        <span class="text-xs text-slate-400">{snapshot.meta.timestamp}</span>
      </div>
      <div class="p-4 bg-slate-800 text-slate-300 font-mono text-sm overflow-x-auto max-h-[600px]">
        <div class="mb-4 grid grid-cols-2 gap-2 pb-4 border-b border-slate-700">
          <div>
            <span class="text-slate-500">Method:</span> {snapshot.meta.method}
          </div>
          <div>
            <span class="text-slate-500">Status:</span> {snapshot.meta.status}
          </div>
          <div class="col-span-2 truncate">
            <span class="text-slate-500">URL:</span> {snapshot.meta.url}
          </div>
        </div>
        <pre>{JSON.stringify(snapshot.data, null, 2)}</pre>
      </div>
    </div>,
  );
});

export default snapshots;
