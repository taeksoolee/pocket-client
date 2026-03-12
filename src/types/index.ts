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
