import { basename } from 'node:path';

import { workspaceDir } from '../../config';

// 1. 성공 시 렌더링할 UI 조각
export const SuccessCard = ({
  duration,
  filename,
  data,
}: {
  duration: number;
  filename: string;
  data: any;
}) => (
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="bg-green-50 border-b border-green-100 p-4 flex justify-between items-center">
      <span class="text-green-700 font-medium">✅ 스냅샷 저장 완료!</span>
      <span class="text-sm font-mono text-slate-500">{duration}ms</span>
    </div>
    <div class="p-4 bg-slate-800 text-slate-300 font-mono text-sm overflow-x-auto">
      <div class="mb-2 text-slate-400">
        📄 Saved at: ./{basename(workspaceDir)}/results/{filename}
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  </div>
);

// 2. 에러 시 렌더링할 UI 조각
export const ErrorCard = ({ message }: { message: string }) => (
  <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
    <div class="font-bold mb-1">❌ 요청 실패</div>
    <div class="text-sm font-mono">{message}</div>
  </div>
);
