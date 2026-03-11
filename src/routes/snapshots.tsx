import { Hono } from 'hono';

import { SuccessCard } from '../components/partials/ResultCard';
import { deleteSnapshot, getSnapshot } from '../utils/snapshot';

const snapshots = new Hono();

snapshots.get('/:filename', (c) => {
  const filename = c.req.param('filename');
  const snapshot = getSnapshot(filename);

  if (!snapshot) {
    return c.html(<div class="p-4 text-red-500">파일을 찾을 수 없습니다.</div>);
  }

  // 💡 데이터 매핑 (하위 호환성 유지)
  let requestData = snapshot.request;
  let responseData = snapshot.response;

  if (!requestData) {
    requestData = {
      method: snapshot.meta?.method || 'GET',
      url: snapshot.meta?.url || '',
      headers: {},
      body: '',
    };
    responseData = {
      status: snapshot.meta?.status || 200,
      duration: snapshot.meta?.duration || 0,
      headers: snapshot.meta?.headers || {},
      data: snapshot.data || {},
    };
  }

  // 타임스탬프 포맷팅
  let formattedTimestamp = '';
  if (snapshot.timestamp) {
    const d = new Date(snapshot.timestamp);
    formattedTimestamp = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  }

  // 💡 핵심: 폼을 채우기 위한 이벤트를 발생시킴.
  // 요청 데이터를 그대로 'fill-request-form' 이벤트에 담아서 보냄.
  c.header(
    'HX-Trigger',
    JSON.stringify({
      'fill-request-form': {
        method: requestData.method,
        url: requestData.url,
        headers: requestData.headers,
        body: requestData.body,
      },
    }),
  );

  return c.html(
    <SuccessCard
      filename={filename}
      request={requestData}
      response={responseData}
      timestamp={formattedTimestamp}
    />,
  );
});

snapshots.delete('/:filename', (c) => {
  const filename = c.req.param('filename');
  const success = deleteSnapshot(filename);

  if (success) {
    c.header('HX-Trigger', 'snapshotUpdated');
    return c.html(
      <div class="flex items-center justify-center h-full text-slate-400 italic font-medium animate-in fade-in">
        🗑️ 스냅샷이 삭제되었습니다.
      </div>,
    );
  }
  return c.text('Not found', 404);
});

export default snapshots;
