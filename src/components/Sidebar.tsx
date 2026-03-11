export const SidebarList = ({ files }: { files: string[] }) => (
  <ul id="snapshot-list" class="space-y-1">
    {files.length === 0 ? (
      <div class="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-600 rounded-lg mt-2">
        아직 스냅샷이 없습니다.
      </div>
    ) : (
      files.map((file) => (
        <li
          /* 💡 activeFile 상태에 따른 스타일 바인딩 */
          x-bind:class={`activeFile === '${file}' ? 'bg-slate-700 ring-1 ring-slate-600' : 'hover:bg-slate-700'`}
          class="group flex items-center rounded transition-colors animate-in slide-in-from-left-2 duration-200"
        >
          {/* 조회 버튼 (클릭 영역) */}
          <button
            hx-get={`/snapshots/${file}`}
            hx-target="#result"
            x-on:click={`activeFile = '${file}'`}
            x-bind:class={`activeFile === '${file}' ? 'text-indigo-300 font-bold' : 'text-slate-300 hover:text-indigo-300'`}
            class="flex-1 text-left px-3 py-2 text-[11px] font-mono truncate outline-none"
            title={file}
          >
            {file}
          </button>

          {/* 삭제 버튼 (HTMX) */}
          <button
            hx-delete={`/snapshots/${file}`}
            hx-confirm={`'${file}' 스냅샷을 삭제하시겠습니까?`}
            hx-target="#result"
            class="opacity-0 group-hover:opacity-100 p-2 mr-1 text-slate-500 hover:text-red-400 transition-all hover:scale-110"
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
  <aside
    class="w-64 bg-slate-800 text-slate-300 h-screen overflow-y-auto flex-shrink-0 flex flex-col border-r border-slate-700"
    /* 💡 최상단 상태 및 바인딩 객체 선언 */
    x-data={`{ 
      activeFile: '',
      get sidebarEvents() {
        return {
          ['x-on:snapshot-updated.window']($event) {
            // 💡 수정: 헤더를 통해 인코딩되어 넘어온 파일명을 디코딩하여 상태 업데이트
            if($event.detail.filename) this.activeFile = decodeURIComponent($event.detail.filename);
          }
        }
      }
    }`}
    /* 💡 바인드 객체 적용 */
    x-bind="sidebarEvents"
  >
    <div class="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
      <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">📁 Snapshots</h2>
    </div>

    <div class="p-2 flex-1" hx-get="/sidebar" hx-trigger="snapshot-updated from:body">
      <SidebarList files={files} />
    </div>
  </aside>
);
