import { Hono } from 'hono';

import { deleteSnapshot, getSnapshot } from '../utils/snapshot';

const snapshots = new Hono();

// 조회 API
snapshots.get('/:filename', (c) => {
  const filename = c.req.param('filename');
  const snapshot = getSnapshot(filename);

  if (!snapshot) {
    return c.html(<div class="p-4 text-red-500">파일을 찾을 수 없습니다.</div>);
  }

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
        <pre>{JSON.stringify(snapshot.data, null, 2)}</pre>
      </div>
    </div>,
  );
});

// 💡 삭제 API 추가
snapshots.delete('/:filename', (c) => {
  const filename = c.req.param('filename');
  const success = deleteSnapshot(filename);

  if (success) {
    // 삭제 성공 시 사이드바 갱신 트리거 발송!
    c.header('HX-Trigger', 'snapshotUpdated');
    // 결과창은 비워주기 (조각 반환)
    return c.html(
      '<div class="p-10 text-center text-slate-400 italic">스냅샷이 삭제되었습니다.</div>',
    );
  }

  return c.text('삭제 실패', 500);
});

export default snapshots;
