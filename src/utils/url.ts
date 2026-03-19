export function resolveUrl(baseUrl: string, rawUrl: string): string {
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  if (rawUrl.startsWith('/') && baseUrl) {
    return baseUrl.replace(/\/+$/, '') + '/' + rawUrl.replace(/^\/+/, '');
  }
  return rawUrl;
}
