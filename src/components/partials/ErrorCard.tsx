export const ErrorCard = ({ message }: { message: string }) => (
  <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in fade-in">
    <div class="font-bold mb-1 flex items-center gap-2">
      <span class="text-xl">🚨</span> 요청 실패
    </div>
    <div class="text-sm font-mono mt-2 bg-red-100/50 p-3 rounded border border-red-100 break-all">
      {message}
    </div>
  </div>
);
