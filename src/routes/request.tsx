import { Hono } from 'hono';

import { ErrorCard, SuccessCard } from '../components/partials/ResultCard';
import { saveSnapshot } from '../utils/snapshot';

const request = new Hono();

request.post('/', async (c) => {
  const body = await c.req.parseBody();
  const targetUrl = body.url as string;
  const method = body.method as string;

  try {
    const startTime = Date.now();

    // 1. 실제 외부 API 호출
    const response = await fetch(targetUrl, { method });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    const duration = Date.now() - startTime;

    // 2. utils/snapshot.ts 의 저장 로직 호출 (관심사 분리)
    const { filename } = saveSnapshot({
      url: targetUrl,
      method,
      status: response.status,
      duration,
      data,
    });

    // 3. 성공 UI 조각(Partial) 리턴
    return c.html(<SuccessCard duration={duration} filename={filename} data={data} />);
  } catch (err: any) {
    // 4. 에러 UI 조각 리턴
    return c.html(<ErrorCard message={err.message || String(err)} />);
  }
});

export default request;
