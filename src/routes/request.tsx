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

    // 1. 프론트엔드에서 묶어 보낸 Alpine.js 상태 파싱 (안전장치 포함)
    const payload = payloadStr
      ? JSON.parse(payloadStr)
      : { params: [], headers: [], bodyType: 'none', bodyContent: '' };

    // 2. URL 조립 (Query Parameters 붙이기)
    const urlObj = new URL(rawUrl);
    payload.params.forEach((p: any) => {
      // 체크박스가 켜져 있고(active), 키 값이 비어있지 않은 것만 쿼리에 추가
      if (p.active && p.key.trim() !== '') {
        urlObj.searchParams.append(p.key.trim(), p.value);
      }
    });
    const finalUrl = urlObj.toString(); // 파라미터가 완벽하게 붙은 최종 URL

    // 3. Request Headers 세팅
    const fetchHeaders = new Headers();
    payload.headers.forEach((h: any) => {
      if (h.active && h.key.trim() !== '') {
        fetchHeaders.append(h.key.trim(), h.value);
      }
    });

    // 4. Request Body 세팅 (GET 요청 등은 Body를 무시함)
    let fetchBody: string | undefined = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      if (payload.bodyType === 'json' && payload.bodyContent.trim() !== '') {
        fetchBody = payload.bodyContent;

        // 사용자가 명시적으로 Content-Type을 넣지 않았다면 JSON으로 강제 세팅
        if (!fetchHeaders.has('Content-Type') && !fetchHeaders.has('content-type')) {
          fetchHeaders.set('Content-Type', 'application/json');
        }
      }
    }

    // 5. 실제 타겟 서버로 API 요청 날리기!
    const startTime = Date.now();
    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
      body: fetchBody,
    };

    const response = await fetch(finalUrl, fetchOptions);

    // 💡 6. 응답 헤더 추출 (ResultCard에 넘겨주기 위해 일반 객체로 변환)
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    // 7. 응답 데이터 파싱 (JSON인지 Text인지 확인)
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const responseData = isJson ? await response.json() : await response.text();
    const duration = Date.now() - startTime;

    // 8. 스냅샷 저장 (최종 조립된 URL을 저장하는 게 디버깅에 좋음)
    const { filename } = saveSnapshot({
      url: finalUrl,
      method,
      status: response.status,
      duration,
      data: responseData,
      headers: headersObj, // 💡 응답 헤더도 스냅샷에 저장
    });

    // 9. 사이드바 실시간 갱신 신호 발송
    c.header('HX-Trigger', 'snapshotUpdated');

    // 10. 성공 UI 카드 렌더링 (업그레이드된 속성들 포함)
    return c.html(
      <SuccessCard
        duration={duration}
        filename={filename}
        data={responseData}
        status={response.status}
        responseHeaders={headersObj}
      />,
    );
  } catch (err: any) {
    // URL 파싱 에러나 네트워크 에러 등 발생 시 에러 UI 조각 리턴
    return c.html(<ErrorCard message={err.message || String(err)} />);
  }
});

export default request;
