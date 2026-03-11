export const SidebarList = ({ files }: { files: string[] }) => (
  <ul id="snapshot-list" class="space-y-1">
    {files.length === 0 ? (
      <div class="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-600 rounded-lg mt-2">
        아직 스냅샷이 없습니다.
      </div>
    ) : (
      files.map((file) => (
        <li class="group flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 transition-colors animate-in slide-in-from-left-2 duration-200">
          {/* 조회 버튼 */}
          <button
            hx-get={`/snapshots/${file}`}
            hx-target="#result"
            class="flex-1 text-left text-[11px] font-mono text-slate-300 hover:text-indigo-300 truncate outline-none"
            title={file}
          >
            {file}
          </button>

          {/* 💡 삭제 버튼 (HTMX) */}
          <button
            hx-delete={`/snapshots/${file}`}
            hx-confirm={`'${file}' 스냅샷을 삭제하시겠습니까?`}
            hx-target="#result"
            class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all hover:scale-110"
            title="삭제"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </li>
      ))
    )}
  </ul>
);

export const Sidebar = ({ files }: { files: string[] }) => (
  <aside class="w-64 bg-slate-800 text-slate-300 h-screen overflow-y-auto flex-shrink-0 flex flex-col border-r border-slate-700">
    <div class="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
      <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">📁 Snapshots</h2>
    </div>
    <div
      class="p-2 flex-1"
      // 💡 핵심: 'snapshotUpdated' 이벤트가 발생하면 '/sidebar'로 GET 요청을 보내서 자신을 갱신함
      hx-get="/sidebar"
      hx-trigger="snapshotUpdated from:body"
    >
      <SidebarList files={files} />
    </div>
  </aside>
);
