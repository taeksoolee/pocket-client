export const Sidebar = ({ files }: { files: string[] }) => (
  <aside class="w-64 bg-slate-800 text-slate-300 h-screen overflow-y-auto flex-shrink-0 flex flex-col border-r border-slate-700">
    <div class="p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
      <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
        📁 Snapshots
      </h2>
    </div>
    <div class="p-2 flex-1">
      {files.length === 0 ? (
        <div class="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-600 rounded-lg mt-2">
          아직 저장된 API 스냅샷이 없습니다.
        </div>
      ) : (
        <ul class="space-y-1">
          {files.map((file) => (
            <li>
              {/* 나중에 클릭하면 상세 내용을 볼 수 있도록 HTMX를 붙일 버튼 */}
              <button
                class="w-full text-left text-xs font-mono px-3 py-2 rounded hover:bg-slate-700 hover:text-white transition truncate"
                title={file}
              >
                {file}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </aside>
);
