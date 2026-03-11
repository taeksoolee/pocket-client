import { Hono } from 'hono';

import { deleteSnapshot, getSnapshot } from '../utils/snapshot';

const snapshots = new Hono();

snapshots.get('/:filename', (c) => {
  const filename = c.req.param('filename');
  const snapshot = getSnapshot(filename);

  if (!snapshot) {
    return c.html(<div class="p-4 text-red-500">파일을 찾을 수 없습니다.</div>);
  }

  // 💡 JSON 데이터를 문자열로 미리 변환 (속도 및 가독성)
  const jsonString = JSON.stringify(snapshot.data, null, 2);

  return c.html(
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300"
      x-data="{ 
        copied: false, 
        copy() { 
          navigator.clipboard.writeText($refs.jsonContent.innerText); 
          this.copied = true; 
          setTimeout(() => this.copied = false, 2000); 
        } 
      }"
    >
      <div class="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-tight">
            Snapshot Detail
          </span>
          <span class="text-sm font-mono text-indigo-600 font-semibold">{filename}</span>
        </div>

        {/* 💡 복사 버튼 추가 */}
        <button
          x-on:click="copy()"
          class="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all active:scale-95"
        >
          <span x-text="copied ? '✅ Copied!' : '📋 Copy JSON'"></span>
        </button>
      </div>

      <div class="p-4 bg-slate-800 text-slate-300 font-mono text-sm overflow-x-auto max-h-[600px]">
        {/* 💡 x-ref="jsonContent" 를 사용하여 복사 대상을 지정 */}
        <pre x-ref="jsonContent">{jsonString}</pre>
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
