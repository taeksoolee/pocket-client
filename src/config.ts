import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 💡 esbuild의 text 로더가 이 파일의 내용을 문자열로 치환해줌
// @ts-expect-error - 타입스크립트는 이 파일이 문자열로 대체된다는 사실을 알 수 없으므로 에러 발생
import TAILWIND_RAW from './output.css';

const __filename = fileURLToPath(import.meta.url);
export const workspaceDir = dirname(__filename);

export const HTMX_LIB = process.env.HTMX_SRC || '';
export const ALPINE_LIB = process.env.ALPINE_SRC || '';
export const TAILWIND_CSS = TAILWIND_RAW; // 주입된 문자열 사용
