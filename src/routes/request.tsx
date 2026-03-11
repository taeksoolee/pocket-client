import { Hono } from 'hono';

import { ErrorCard, SuccessCard } from '../components/partials/ResultCard';
import { config } from '../config';
import { saveSnapshot } from '../utils/snapshot';

const request = new Hono();

request.post('/', async (c) => {
  try {
    const body = await c.req.parseBody();
    let rawUrl = body.url as string;
    const method = body.method as string;
    const payloadStr = body.pocket_payload as string;

    // 💡 URL 결합: '/'로 시작하면 baseUrl 자동 병합
    if (rawUrl.startsWith('/') && config.baseUrl) {
      const base = config.baseUrl.replace(/\/+$/, '');
      const path = rawUrl.replace(/^\/+/, '');
      rawUrl = `${base}/${path}`;
    }

    const payload = payloadStr
      ? JSON.parse(payloadStr)
      : { params: [], headers: [], bodyType: 'none', bodyContent: '' };
    const urlObj = new URL(rawUrl);
    payload.params.forEach((p: any) => {
      if (p.active && p.key.trim() !== '') urlObj.searchParams.append(p.key.trim(), p.value);
    });
    const finalUrl = urlObj.toString();

    const fetchHeaders = new Headers();
    const reqHeadersObj: Record<string, string> = {};

    // 전역 헤더 -> 사용자 입력 헤더 순서로 병합
    Object.entries(config.globalHeaders).forEach(([k, v]) => {
      fetchHeaders.set(k, v);
      reqHeadersObj[k] = v;
    });
    payload.headers.forEach((h: any) => {
      if (h.active && h.key.trim() !== '') {
        fetchHeaders.set(h.key.trim(), h.value);
        reqHeadersObj[h.key.trim()] = h.value;
      }
    });

    let fetchBody: string | undefined = undefined;
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) &&
      payload.bodyType === 'json'
    ) {
      fetchBody = payload.bodyContent;
      if (!fetchHeaders.has('Content-Type')) fetchHeaders.set('Content-Type', 'application/json');
    }

    const startTime = Date.now();
    const response = await fetch(finalUrl, { method, headers: fetchHeaders, body: fetchBody });
    const resHeadersObj: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      resHeadersObj[k] = v;
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
