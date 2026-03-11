import { Hono } from 'hono';

import { ErrorCard, SuccessCard } from '../components/partials/ResultCard';
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

    const urlObj = new URL(rawUrl);
    payload.params.forEach((p: any) => {
      if (p.active && p.key.trim() !== '') urlObj.searchParams.append(p.key.trim(), p.value);
    });
    const finalUrl = urlObj.toString();

    // 💡 Request Headers 추출
    const fetchHeaders = new Headers();
    const reqHeadersObj: Record<string, string> = {}; // 저장용 객체
    payload.headers.forEach((h: any) => {
      if (h.active && h.key.trim() !== '') {
        fetchHeaders.append(h.key.trim(), h.value);
        reqHeadersObj[h.key.trim()] = h.value;
      }
    });

    let fetchBody: string | undefined = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      if (payload.bodyType === 'json' && payload.bodyContent.trim() !== '') {
        fetchBody = payload.bodyContent;
        if (!fetchHeaders.has('Content-Type') && !fetchHeaders.has('content-type')) {
          fetchHeaders.set('Content-Type', 'application/json');
          reqHeadersObj['Content-Type'] = 'application/json';
        }
      }
    }

    const startTime = Date.now();
    const fetchOptions: RequestInit = { method, headers: fetchHeaders, body: fetchBody };
    const response = await fetch(finalUrl, fetchOptions);

    // 💡 Response Headers 추출
    const resHeadersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      resHeadersObj[key] = value;
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();
    const duration = Date.now() - startTime;

    // 💡 구조화된 데이터 객체
    const requestData = { method, url: finalUrl, headers: reqHeadersObj, body: fetchBody };
    const responseDataObj = {
      status: response.status,
      duration,
      headers: resHeadersObj,
      data: responseData,
    };

    const { filename } = saveSnapshot({
      request: requestData,
      response: responseDataObj,
    });

    c.header('HX-Trigger', 'snapshotUpdated');

    return c.html(
      <SuccessCard filename={filename} request={requestData} response={responseDataObj} />,
    );
  } catch (err: any) {
    return c.html(<ErrorCard message={err.message || String(err)} />);
  }
});

export default request;
