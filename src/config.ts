import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 💡 타입 정의: 설정 파일의 구조
export interface PocketConfig {
  port: number;
  globalHeaders: Record<string, string>;
  baseUrl?: string;
  timeout?: number;
}

const __filename = fileURLToPath(import.meta.url);
export const workspaceDir = dirname(__filename);

// 기본 내부 설정 (Fallback)
const INTERNAL_DEFAULT: PocketConfig = {
  port: 3000,
  globalHeaders: {},
};

function loadConfig(): PocketConfig {
  const configDir = join(workspaceDir, 'config');
  let finalConfig = { ...INTERNAL_DEFAULT };

  try {
    // 1. default.json 읽기
    const defaultPath = join(configDir, 'default.json');
    if (existsSync(defaultPath)) {
      const defaultData = JSON.parse(readFileSync(defaultPath, 'utf-8'));
      finalConfig = { ...finalConfig, ...defaultData };
    }

    // 2. 환경별 설정 읽기 (예: POCKET_ENV=dev 환경변수 시 dev.json 읽음)
    const env = process.env.POCKET_ENV;
    if (env) {
      const envPath = join(configDir, `${env}.json`);
      if (existsSync(envPath)) {
        const envData = JSON.parse(readFileSync(envPath, 'utf-8'));
        // 깊은 병합(Deep Merge)은 아니지만, 1단계 속성들은 덮어씌움
        finalConfig = { ...finalConfig, ...envData };
        (finalConfig as any).loadedEnv = env;
      }
    }
  } catch (err) {
    console.warn('⚠️ 설정을 읽는 중 오류 발생, 기본 설정을 사용합니다:', (err as Error).message);
  }

  return finalConfig;
}

// 전역에서 쓸 config 객체 익스포트
export const config = loadConfig();

// 라이브러리 경로 및 CSS 설정 (기존 유지)
export const HTMX_LIB = process.env.HTMX_SRC || '';
export const ALPINE_LIB = process.env.ALPINE_SRC || '';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import TAILWIND_RAW from './output.css';
export const TAILWIND_CSS = TAILWIND_RAW;
