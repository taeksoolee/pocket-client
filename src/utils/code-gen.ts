export interface FetchCodeOptions {
  url: string;
  method: string;
  params: { key: string; value: string; active: boolean }[];
  headers: { key: string; value: string; active: boolean }[];
  bodyType: string;
  bodyContent: string;
}

export function generateFetchCode(opts: FetchCodeOptions): string {
  let finalUrl = opts.url;
  const activeParams = opts.params.filter((p) => p.active && p.key.trim() !== '');

  if (activeParams.length > 0 && finalUrl) {
    try {
      const urlObj = new URL(
        finalUrl.startsWith('http')
          ? finalUrl
          : 'http://local' + (finalUrl.startsWith('/') ? finalUrl : '/' + finalUrl),
      );
      activeParams.forEach((p) => urlObj.searchParams.append(p.key.trim(), p.value));
      finalUrl = finalUrl.startsWith('http') ? urlObj.toString() : urlObj.pathname + urlObj.search;
    } catch {
      // use finalUrl as-is
    }
  }

  const lines: string[] = [];
  lines.push(`fetch('${finalUrl}', {`);
  lines.push(`  method: '${opts.method}'`);

  const activeHeaders = opts.headers.filter((h) => h.active && h.key.trim() !== '');
  let hasContentType = false;

  if (activeHeaders.length > 0 || (opts.method !== 'GET' && opts.bodyType === 'json')) {
    lines[lines.length - 1] += ',';
    lines.push('  headers: {');
    activeHeaders.forEach((h) => {
      lines.push(`    "${h.key.trim()}": "${h.value.replace(/"/g, '\\"')}",`);
      if (h.key.trim().toLowerCase() === 'content-type') hasContentType = true;
    });
    if (opts.method !== 'GET' && opts.bodyType === 'json' && !hasContentType) {
      lines.push('    "Content-Type": "application/json"');
    }
    lines.push('  }');
  }

  if (opts.method !== 'GET' && opts.bodyType === 'json' && opts.bodyContent) {
    lines[lines.length - 1] += ',';
    let bodyStr = opts.bodyContent;
    try {
      bodyStr = JSON.stringify(JSON.parse(opts.bodyContent), null, 2);
    } catch {
      // use bodyStr as-is
    }
    const formattedBody = bodyStr.split('\n').join('\n    ');
    lines.push(`  body: JSON.stringify(${formattedBody})`);
  }

  lines.push('})');
  lines.push('.then(response => response.json())');
  lines.push('.then(data => console.log(data))');
  lines.push('.catch(error => console.error("Error:", error));');

  return lines.join('\n');
}
