import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. 현재 실행 중인 파일(server.mjs)의 디렉토리 경로 동적 계산
const __filename = fileURLToPath(import.meta.url);
export const workspaceDir = dirname(__filename);

// 2. 빌드 타임에 주입될 라이브러리 소스 (esbuild define)
export const HTMX_LIB = process.env.HTMX_SRC || '';
export const ALPINE_LIB = process.env.ALPINE_SRC || '';
