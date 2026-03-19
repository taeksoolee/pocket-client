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
              hx-target="#snapshot"
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
                  .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
                  .then(data => $dispatch('fill-template-form', data))
                  .catch(e => window.showToast('템플릿 로드 실패: ' + e.message))
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
            hx-target={type === 'snapshots' ? '#snapshot' : null}
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
