export const CodeModal = () => (
  <div
    x-show="showCodeModal"
    style="display: none;"
    class="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity"
    x-bind="modalBackdrop"
  >
    <div
      class="bg-[#0d1117] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-slate-700/80 flex flex-col transform transition-transform"
      x-bind="modalContent"
    >
      <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div class="flex items-center gap-4">
          <div class="flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div class="text-slate-400 font-mono text-[11px] tracking-wider font-bold">fetch-snippet.js</div>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            x-on:click="copyCode()"
            x-bind:class="isCopied ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'"
            class="px-3 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 outline-none shadow-sm"
          >
            <span x-text="isCopied ? '✅' : '📋'"></span>
            <span x-text="isCopied ? 'Copied!' : 'Copy Code'"></span>
          </button>
          <div class="w-px h-4 bg-slate-700"></div>
          <button
            type="button"
            x-on:click="showCodeModal = false"
            class="p-1 text-slate-500 hover:text-white hover:bg-red-500/80 rounded transition-colors outline-none"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-auto max-h-[60vh] custom-scrollbar bg-[#0d1117]">
        <pre class="text-[13px] text-emerald-400 font-mono leading-relaxed">
          <code x-text="generatedCode"></code>
        </pre>
      </div>
    </div>
  </div>
);
