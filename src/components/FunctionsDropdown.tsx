export const FunctionsDropdown = () => (
  <div
    class="relative"
    x-data={`{ 
      showFunctions: false, 
      actions: [],
      
      get dropdownSetup() {
        return {
          ['x-init']() {
            // 동기식 스크립트를 위해 초기 1회 로드 (비동기는 클릭 시 다시 갱신됨)
            setTimeout(() => { this.actions = Object.keys(window.PocketActions || {}) }, 300);
          },
          ['x-on:click.outside']() { 
            this.showFunctions = false; 
          }
        }
      },
      
      // 💡 트랜지션 효과도 일관성 있게 바인딩으로 처리
      get dropdownTransition() {
        return {
          ['x-transition:enter']: 'transition ease-out duration-200',
          ['x-transition:enter-start']: 'opacity-0 translate-y-2',
          ['x-transition:enter-end']: 'opacity-100 translate-y-0'
        }
      }
    }`}
    x-bind="dropdownSetup"
  >
    <button
      type="button"
      // 🚨 핵심 수정: 버튼을 누를 때마다 PocketActions 목록을 실시간으로 다시 읽어옵니다!
      x-on:click="showFunctions = !showFunctions; actions = Object.keys(window.PocketActions || {})"
      x-bind:class="showFunctions ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'"
      class="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all"
    >
      <span>⚡</span>
      <span class="text-sm">Functions</span>
      <svg
        class="w-4 h-4 transition-transform"
        x-bind:class="showFunctions ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      x-show="showFunctions"
      x-bind="dropdownTransition"
      class="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4"
      style="display: none;"
    >
      <div class="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <span>Custom Actions</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <template x-for="name in actions" x-bind:key="name">
          <button
            type="button"
            x-on:click="window.PocketActions[name](); showFunctions = false"
            class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-all group"
          >
            <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors shadow-sm">
              <span class="text-xs font-black text-indigo-400 group-hover:text-white">ƒ</span>
            </div>
            <span
              class="text-[11px] font-mono text-slate-600 group-hover:text-indigo-700 truncate w-full text-center"
              x-text="name"
            ></span>
          </button>
        </template>

        <div
          x-show="actions.length === 0"
          class="col-span-2 py-4 text-center text-xs text-slate-400 italic"
        >
          등록된 액션이 없습니다.
        </div>
      </div>
    </div>
  </div>
);
