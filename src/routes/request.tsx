import { Hono } from 'hono';

import { ErrorCard, SuccessCard } from '../components/partials/ResultCard';
import { config } from '../config';
import { saveSnapshot } from '../utils/snapshot';

const request = new Hono();

request.post('/', async (c) => {
  // 💡 타임아웃 설정을 위한 AbortController 준비
  const timeoutMs = config.timeout || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

    // 💡 fetch에 signal을 전달하여 타임아웃 감시
    const response = await fetch(finalUrl, {
      method,
      headers: fetchHeaders,
      body: fetchBody,
      signal: controller.signal,
    });

    // 💡 요청 성공 시 타이머 해제
    clearTimeout(timeoutId);

    const resHeadersObj: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      resHeadersObj[k] = v;
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();
    const duration = Date.now() - startTime;

    // 💡 인간 친화적인 타임스탬프 생성 (YYYY-MM-DD HH:mm:ss)
    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const requestData = { method, url: finalUrl, headers: reqHeadersObj, body: fetchBody };
    const responseDataObj = {
      status: response.status,
      duration,
      headers: resHeadersObj,
      data: responseData,
    };

    const { filename } = saveSnapshot({ request: requestData, response: responseDataObj });

    // 💡 수정: 단순히 신호만 보내는 게 아니라, 생성된 파일명을 객체에 담아 이벤트로 발생시킴
    c.header('HX-Trigger', JSON.stringify({ 'snapshot-updated': { filename } }));

    return c.html(
      <SuccessCard
        filename={filename}
        request={requestData}
        response={responseDataObj}
        timestamp={formattedTimestamp} // 💡 시간 정보 전달
      />,
    );
  } catch (err: any) {
    // 💡 에러 발생 시 타이머 해제
    clearTimeout(timeoutId);

    // 💡 타임아웃 에러(AbortError)인 경우 별도 메시지 처리
    if (err.name === 'AbortError') {
      return c.html(
        <ErrorCard
          message={`⏱️ 요청 시간 초과: ${timeoutMs}ms 동안 응답이 없어 중단되었습니다.`}
        />,
      );
    }

    return c.html(<ErrorCard message={err.message || String(err)} />);
  }
});

export default request;
