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
