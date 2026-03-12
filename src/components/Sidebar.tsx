export const SidebarList = ({
  items,
  type,
}: {
  items: string[];
  type: 'snapshots' | 'templates';
}) => (
  <ul id={`${type}-list`} class="space-y-1">
    {items.length === 0 ? (
      <div class="text-sm text-slate-500 p-4 text-center border border-dashed border-slate-600 rounded-lg mt-2">
        {type === 'snapshots' ? '아직 스냅샷이 없습니다.' : '저장된 템플릿이 없습니다.'}
      </div>
    ) : (
      items.map((item) => (
        <li
          x-bind:class={`activeFile === '${item}' ? 'bg-slate-700 ring-1 ring-slate-600' : 'hover:bg-slate-700'`}
          class="group flex items-center rounded transition-colors animate-in slide-in-from-left-2 duration-200"
        >
          {type === 'snapshots' ? (
            <button
              hx-get={`/snapshots/${item}`}
              hx-target="#result"
              x-on:click={`activeFile = '${item}'`}
              x-bind:class={`activeFile === '${item}' ? 'text-indigo-300 font-bold' : 'text-slate-300 hover:text-indigo-300'`}
              class="flex-1 text-left px-3 py-2 text-[11px] font-mono truncate outline-none"
              title={item}
            >
              {item}
            </button>
          ) : (
            <button
              x-on:click={`
                activeFile = '${item}';
                fetch('/templates/${item}')
                  .then(res => res.json())
                  .then(data => $dispatch('fill-template-form', data))
              `}
              x-bind:class={`activeFile === '${item}' ? 'text-indigo-300 font-bold' : 'text-slate-300 hover:text-indigo-300'`}
              class="flex-1 text-left px-3 py-2 text-[11px] font-mono truncate outline-none"
              title={item}
            >
              {item}
            </button>
          )}

          <button
            hx-delete={`/${type}/${item}`}
            hx-confirm={`'${item}' 을(를) 삭제하시겠습니까?`}
            hx-target={type === 'snapshots' ? '#result' : null}
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

export const Sidebar = ({ snapshots, templates }: { snapshots: string[]; templates: string[] }) => (
  <aside
    x-bind:style="`width: ${width}px`"
    x-bind:class="isResizing ? 'select-none transition-none' : 'transition-[width] duration-75'"
    class="relative bg-slate-800 text-slate-300 h-screen flex-shrink-0 flex flex-col border-r border-slate-700"
    x-data={`{ 
      activeTab: 'snapshots',
      activeFile: '',
      width: parseInt(localStorage.getItem('sidebar-width')) || 256,
      minW: 200,
      maxW: 600,
      isResizing: false,
      showFunctions: false,
      actions: [],

      get sidebarEvents() {
        return {
          ['x-init']() {
            this.$watch('width', val => localStorage.setItem('sidebar-width', val));
            setTimeout(() => {
              if (window.PocketActions) { this.actions = Object.keys(window.PocketActions); }
            }, 1000);
          },
          ['x-on:snapshot-updated.window']($event) {
            if($event.detail.filename) {
              this.activeTab = 'snapshots';
              this.activeFile = decodeURIComponent($event.detail.filename);
            }
          },
          ['x-on:template-saved.window']($event) {
            this.activeTab = 'templates';
            this.activeFile = $event.detail.filename;
          }
        }
      },

      get functionLayer() {
        return {
          ['x-on:click.outside']() { this.showFunctions = false }
        }
      },

      startResize(e) {
        this.isResizing = true;
        const startX = e.clientX;
        const startWidth = this.width;
        const onMouseMove = (m) => {
          if (!this.isResizing) return;
          const nextW = startWidth + (m.clientX - startX);
          if (nextW >= this.minW && nextW <= this.maxW) this.width = nextW;
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
    <div class="p-4 border-b border-slate-700 bg-slate-800 z-10 flex-shrink-0 flex justify-between items-center">
      <div class="flex gap-2">
        <button
          x-on:click="activeTab = 'snapshots'"
          x-bind:class="activeTab === 'snapshots' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
          class="text-xs uppercase tracking-wider transition-colors"
        >
          🕒 History
        </button>
        <span class="text-slate-600">|</span>
        <button
          x-on:click="activeTab = 'templates'"
          x-bind:class="activeTab === 'templates' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
          class="text-xs uppercase tracking-wider transition-colors"
        >
          💾 Saved
        </button>
      </div>

      <button
        x-on:click="showFunctions = !showFunctions"
        x-bind:class="showFunctions ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:text-white hover:bg-slate-600'"
        class="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-black uppercase transition-all"
      >
        <span>⚡</span>
        <span>Functions</span>
      </button>
    </div>

    <div
      x-show="showFunctions"
      x-bind="functionLayer"
      x-transition:enter="transition ease-out duration-200"
      x-transition:enter-start="opacity-0 -translate-y-2"
      x-transition:enter-end="opacity-100 translate-y-0"
      class="absolute top-[58px] left-2 right-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-4"
      style="display: none;"
    >
      <div class="text-[9px] font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
        <span>Custom Actions</span>
        <span class="text-indigo-500">Manual Run</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <template x-for="name in actions" x-bind:key="name">
          <button
            x-on:click="window.PocketActions[name](); showFunctions = false"
            class="flex flex-col items-center justify-center p-3 rounded-md bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-slate-700 transition-all group"
          >
            <div class="w-7 h-7 rounded bg-slate-700 flex items-center justify-center mb-1.5 group-hover:bg-indigo-600 transition-colors shadow-inner">
              <span class="text-[10px] font-black text-indigo-400 group-hover:text-white">f</span>
            </div>
            <span
              class="text-[10px] font-mono text-slate-300 truncate w-full text-center"
              x-text="name"
            ></span>
          </button>
        </template>

        <div
          x-show="actions.length === 0"
          class="col-span-2 py-4 text-center text-[10px] text-slate-500 italic"
        >
          No manual actions registered.
        </div>
      </div>
    </div>

    {/* 💡 알맹이(리스트) 영역만 HTMX로 갱신되도록 복구 완료 */}
    <div
      id="sidebar-lists"
      hx-get="/sidebar"
      hx-trigger="snapshot-updated from:body, templates-updated from:body"
      hx-target="#sidebar-lists"
      hx-swap="innerHTML"
      class="flex-1 overflow-y-auto p-2 custom-scrollbar relative"
    >
      <div x-show="activeTab === 'snapshots'">
        <SidebarList items={snapshots} type="snapshots" />
      </div>
      <div x-show="activeTab === 'templates'" style="display: none;">
        <SidebarList items={templates} type="templates" />
      </div>
    </div>

    {/* 💡 삭제되었던 너비 조절(리사이즈) 바 복구 완료 */}
    <div
      x-on:mousedown="startResize($event)"
      class="absolute top-0 -right-[6px] bottom-0 w-4 group/resizer cursor-col-resize z-50 flex items-center justify-center"
    >
      <div class="absolute inset-y-0 right-[6px] w-[2px] group-hover/resizer:bg-indigo-500/50 transition-colors"></div>
      <div class="relative z-10 w-3 h-20 bg-slate-600 rounded-full group-hover/resizer:bg-indigo-500 group-hover/resizer:h-28 transition-all duration-200 shadow-xl flex flex-col items-center justify-center gap-1.5 border border-slate-700/50">
        <div class="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/resizer:bg-white/90"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/resizer:bg-white/90"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/resizer:bg-white/90"></div>
      </div>
    </div>
  </aside>
);
