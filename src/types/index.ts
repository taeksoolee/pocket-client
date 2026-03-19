export interface RequestRow {
  key: string;
  value: string;
  active: boolean;
}

export interface RequestPayload {
  method: string;
  url: string;
  headers: RequestRow[];
  params: RequestRow[];
  bodyType: 'none' | 'json';
  bodyContent: string;
}

// ─── 런타임 타입 가드 ────────────────────────────────────────────────────────

export function isString(v: unknown): v is string {
  return typeof v === 'string';
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ─── 요청 바디 인터페이스 ────────────────────────────────────────────────────

export interface RequestFormBody {
  url: string;
  method: string;
  pocket_payload: string;
}

export function isValidRequestFormBody(
  body: Record<string, string | File>,
): body is Record<string, string> & RequestFormBody {
  return (
    typeof body.url === 'string' &&
    body.url.trim() !== '' &&
    typeof body.method === 'string' &&
    body.method.trim() !== ''
  );
}
