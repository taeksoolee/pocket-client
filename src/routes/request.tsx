import { Hono } from 'hono';

import { ErrorCard, SuccessCard } from '../components/partials/ResultCard';
import { config } from '../config'; // 💡 설정 임포트
import { saveSnapshot } from '../utils/snapshot';

const request = new Hono();

request.post('/', async (c) => {
  try {
    const body = await c.req.parseBody();
    const rawUrl = body.url as string;
    const method = body.method as string;
    const payloadStr = body.pocket_payload as string;

    const payload = payloadStr
      ? JSON.parse(payloadStr)
      : { params: [], headers: [], bodyType: 'none', bodyContent: '' };

    // 1. URL 조립
    const urlObj = new URL(rawUrl);
    payload.params.forEach((p: any) => {
      if (p.active && p.key.trim() !== '') urlObj.searchParams.append(p.key.trim(), p.value);
    });
    const finalUrl = urlObj.toString();

    // 💡 2. Request Headers 조립 (설정 파일의 전역 헤더 포함)
    const fetchHeaders = new Headers();
    const reqHeadersObj: Record<string, string> = {};

    // 2-1. 먼저 설정 파일의 전역 헤더 주입
    Object.entries(config.globalHeaders).forEach(([key, value]) => {
      fetchHeaders.set(key, value);
      reqHeadersObj[key] = value;
    });

    // 2-2. 사용자가 입력한 헤더 주입 (전역 헤더를 덮어씀)
    payload.headers.forEach((h: any) => {
      if (h.active && h.key.trim() !== '') {
        fetchHeaders.set(h.key.trim(), h.value);
        reqHeadersObj[h.key.trim()] = h.value;
      }
    });

    // 3. Body 처리
    let fetchBody: string | undefined = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      if (payload.bodyType === 'json' && payload.bodyContent.trim() !== '') {
        fetchBody = payload.bodyContent;
        if (!fetchHeaders.has('Content-Type')) {
          fetchHeaders.set('Content-Type', 'application/json');
          reqHeadersObj['Content-Type'] = 'application/json';
        }
      }
    }

    // 4. 요청 실행
    const startTime = Date.now();
    const response = await fetch(finalUrl, { method, headers: fetchHeaders, body: fetchBody });

    // 5. 응답 분석 및 저장
    const resHeadersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      resHeadersObj[key] = value;
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();
    const duration = Date.now() - startTime;

    const requestData = { method, url: finalUrl, headers: reqHeadersObj, body: fetchBody };
    const responseDataObj = {
      status: response.status,
      duration,
      headers: resHeadersObj,
      data: responseData,
    };

    const { filename } = saveSnapshot({ request: requestData, response: responseDataObj });

    c.header('HX-Trigger', 'snapshotUpdated');
    return c.html(
      <SuccessCard filename={filename} request={requestData} response={responseDataObj} />,
    );
  } catch (err: any) {
    return c.html(<ErrorCard message={err.message || String(err)} />);
  }
});

export default request;
