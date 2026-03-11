// 💡 리스트만 따로 렌더링하는 컴포넌트 (서버에서 이 조각만 따로 요청할 것임)
export const SidebarList = ({ files }: { files: string[] }) => (
  <ul id="snapshot-list" class="space-y-1">
    {files.length === 0 ? (
      <div class="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-600 rounded-lg mt-2">
        아직 스냅샷이 없습니다.
      </div>
    ) : (
      files.map((file) => (
        <li>
          <button
            hx-get={`/snapshots/${file}`}
            hx-target="#result"
            hx-push-url="false"
            class="w-full text-left text-[11px] font-mono px-3 py-2 rounded hover:bg-slate-700 hover:text-indigo-300 transition truncate group flex justify-between items-center"
            title={file}
          >
            <span class="truncate">{file}</span>
            <span class="opacity-0 group-hover:opacity-100 text-indigo-500 text-[10px]">View</span>
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
