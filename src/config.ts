import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 💡 설정 인터페이스 확장
export interface PocketConfig {
  port: number;
  globalHeaders: Record<string, string>;
  baseUrl?: string; // 기본 API 도메인
  commonEndpoints?: string[]; // 자주 쓰는 엔드포인트 수동 설정
  timeout?: number;
}

const __filename = fileURLToPath(import.meta.url);
export const workspaceDir = dirname(__filename);

// 기본 내부 설정 (Fallback)
const INTERNAL_DEFAULT: PocketConfig = {
  port: 3000,
  globalHeaders: {},
  commonEndpoints: [],
};

function loadConfig(): PocketConfig {
  const configDir = join(workspaceDir, 'config');
  let finalConfig = { ...INTERNAL_DEFAULT };

  try {
    // 1. default.json 로드
    const defaultPath = join(configDir, 'default.json');
    if (existsSync(defaultPath)) {
      const defaultData = JSON.parse(readFileSync(defaultPath, 'utf-8'));
      finalConfig = { ...finalConfig, ...defaultData };
    }

    // 2. POCKET_ENV 환경변수에 따른 로드 (예: dev.json)
    const env = process.env.POCKET_ENV;
    if (env) {
      const envPath = join(configDir, `${env}.json`);
      if (existsSync(envPath)) {
        const envData = JSON.parse(readFileSync(envPath, 'utf-8'));
        finalConfig = { ...finalConfig, ...envData };
        (finalConfig as any).loadedEnv = env;
      }
    }
  } catch (err) {
    console.warn('⚠️ 설정 로딩 실패, 기본값을 사용합니다:', (err as Error).message);
  }

  return finalConfig;
}

export const config = loadConfig();
export const HTMX_LIB = process.env.HTMX_SRC || '';
export const ALPINE_LIB = process.env.ALPINE_SRC || '';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import TAILWIND_RAW from './output.css';
export const TAILWIND_CSS = TAILWIND_RAW;
