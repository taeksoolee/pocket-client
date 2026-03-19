/** 파일명용 타임스탬프: YYMMDDHHmmssmmm */
export function formatFileTimestamp(date = new Date()): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${y}${m}${d}${hh}${mm}${ss}${ms}`;
}

/** 화면 표시용 타임스탬프: YYYY-MM-DD HH:mm:ss */
export function formatDisplayTimestamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
