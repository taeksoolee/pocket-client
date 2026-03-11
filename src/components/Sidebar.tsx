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
    x-bind:style="`width: ${width}px`"
    x-bind:class="isResizing ? 'select-none transition-none' : 'transition-[width] duration-75'"
    class="relative bg-slate-800 text-slate-300 h-screen flex-shrink-0 flex flex-col border-r border-slate-700"
    x-data={`{ 
      activeFile: '',
      width: parseInt(localStorage.getItem('sidebar-width')) || 256,
      minW: 200,
      maxW: 600,
      isResizing: false,

      get sidebarEvents() {
        return {
          ['x-init']() {
            this.$watch('width', val => localStorage.setItem('sidebar-width', val));
          },
          ['x-on:snapshot-updated.window']($event) {
            if($event.detail.filename) this.activeFile = decodeURIComponent($event.detail.filename);
          }
        }
      },

      startResize(e) {
        this.isResizing = true;
        const startX = e.clientX;
        const startWidth = this.width;

        const onMouseMove = (moveEvent) => {
          if (!this.isResizing) return;
          const nextWidth = startWidth + (moveEvent.clientX - startX);
          if (nextWidth >= this.minW && nextWidth <= this.maxW) {
            this.width = nextWidth;
          }
        };

        const onMouseUp = () => {
          this.isResizing = false;
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    }`}
    x-bind="sidebarEvents"
  >
    {/* 헤더 고정 */}
    <div class="p-4 border-b border-slate-700 bg-slate-800 z-10 flex-shrink-0">
      <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">📁 Snapshots</h2>
    </div>

    {/* 목록 영역 스크롤 */}
    <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
      <SidebarList files={files} />
    </div>

    {/* 💡 굵기를 키운 리사이저 핸들 */}
    <div
      x-on:mousedown="startResize($event)"
      /* 클릭 반응 영역을 w-4로 확장 */
      class="absolute top-0 -right-[6px] bottom-0 w-4 group/resizer cursor-col-resize z-50 flex items-center justify-center"
    >
      {/* 리사이저 라인 가이드 */}
      <div class="absolute inset-y-0 right-[6px] w-[2px] group-hover/resizer:bg-indigo-500/50 transition-colors"></div>

      {/* 💡 핸들 두께를 w-3으로 더 굵게 수정 */}
      <div class="relative z-10 w-3 h-20 bg-slate-600 rounded-full group-hover/resizer:bg-indigo-500 group-hover/resizer:h-28 transition-all duration-200 shadow-xl flex flex-col items-center justify-center gap-1.5 border border-slate-700/50">
        <div class="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/resizer:bg-white/90"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/resizer:bg-white/90"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/resizer:bg-white/90"></div>
      </div>
    </div>
  </aside>
);
