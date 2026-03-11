export const Sidebar = ({ files }: { files: string[] }) => (
  <aside class="w-64 bg-slate-800 text-slate-300 h-screen overflow-y-auto flex-shrink-0 flex flex-col border-r border-slate-700">
    <div class="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
      <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
        📁 Snapshots
      </h2>
    </div>
    <div class="p-2 flex-1">
      {files.length === 0 ? (
        <div class="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-600 rounded-lg mt-2">
          아직 스냅샷이 없습니다.
        </div>
      ) : (
        <ul class="space-y-1">
          {files.map((file) => (
            <li>
              <button
                hx-get={`/snapshots/${file}`} // 👈 여기!
                hx-target="#result" // 👈 우측 결과 영역에 꽂기
                hx-push-url="false" // URL은 안 바뀌게
                class="w-full text-left text-[11px] font-mono px-3 py-2 rounded hover:bg-slate-700 hover:text-indigo-300 transition truncate group flex justify-between items-center"
                title={file}
              >
                <span class="truncate">{file}</span>
                <span class="opacity-0 group-hover:opacity-100 text-indigo-500 text-[10px]">
                  View
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </aside>
);
