import { basename } from 'node:path';

import { workspaceDir } from '../../config';

export const SuccessCard = ({
  duration,
  filename,
  data,
}: {
  duration: number;
  filename: string;
  data: any;
}) => {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      x-data="{ 
        copied: false, 
        copy() { 
          navigator.clipboard.writeText($refs.resultJson.innerText); 
          this.copied = true; 
          setTimeout(() => this.copied = false, 2000); 
        } 
      }"
    >
      <div class="bg-green-50 border-b border-green-100 p-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <span class="text-green-700 font-medium">✅ 스냅샷 저장 완료!</span>
          <span class="text-sm font-mono text-slate-500">{duration}ms</span>
        </div>

        {/* 💡 복사 버튼 */}
        <button
          x-on:click="copy()"
          class="text-xs flex items-center gap-1 bg-white px-2 py-1 border border-green-200 rounded text-green-700 hover:bg-green-100 transition shadow-sm"
        >
          <span x-text="copied ? '✅ Copied!' : '📋 Copy'"></span>
        </button>
      </div>

      <div class="p-4 bg-slate-800 text-slate-300 font-mono text-sm overflow-x-auto">
        <div class="mb-2 text-slate-400 text-xs">
          📄 Saved at: ./{basename(workspaceDir)}/results/{filename}
        </div>
        {/* 💡 x-ref="resultJson" 지정 */}
        <pre x-ref="resultJson">{jsonString}</pre>
      </div>
    </div>
  );
};

export const ErrorCard = ({ message }: { message: string }) => (
  <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
    <div class="font-bold mb-1">❌ 요청 실패</div>
    <div class="text-sm font-mono">{message}</div>
  </div>
);
