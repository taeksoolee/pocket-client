export const Toast = () => (
  <div
    id="toast-container"
    x-data="{ toasts: [] }"
    x-init="window.addEventListener('show-toast', (e) => { toasts.push(e.detail); setTimeout(() => toasts.splice(0, 1), 3000); })"
    class="fixed bottom-4 right-4 flex flex-col gap-2 z-[200] pointer-events-none"
    style="display: flex;"
  >
    <template x-for="t in toasts" x-bind:key="t.id">
      <div
        x-text="t.message"
        x-bind:class="t.type === 'warn' ? 'bg-amber-500' : 'bg-red-600'"
        class="text-white text-sm px-4 py-2.5 rounded-lg shadow-lg pointer-events-auto max-w-sm"
      ></div>
    </template>
  </div>
);
