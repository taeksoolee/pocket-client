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
  loadedEnv?: string;
}

const __filename = fileURLToPath(import.meta.url);
export const workspaceDir = dirname(__filename);

// 💡 디렉토리 경로 정의 (templatesDir 추가)
export const functionsDir = join(workspaceDir, 'functions');
export const templatesDir = join(workspaceDir, 'templates');

// 기본 내부 설정 (Fallback)
const INTERNAL_DEFAULT: PocketConfig = {
  port: 3000,
  globalHeaders: {},
  commonEndpoints: [],
  timeout: 10000, // 💡 기본 타임아웃 10초 추가
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateConfig(raw: unknown, base: PocketConfig): PocketConfig {
  if (!isRecord(raw)) return base;
  const result = { ...base };
  if (typeof raw.port === 'number') result.port = raw.port;
  if (typeof raw.baseUrl === 'string') result.baseUrl = raw.baseUrl;
  if (typeof raw.timeout === 'number') result.timeout = raw.timeout;
  if (typeof raw.loadedEnv === 'string') result.loadedEnv = raw.loadedEnv;
  if (isRecord(raw.globalHeaders)) {
    result.globalHeaders = Object.fromEntries(
      Object.entries(raw.globalHeaders).filter(([, v]) => typeof v === 'string') as [string, string][],
    );
  }
  if (Array.isArray(raw.commonEndpoints)) {
    result.commonEndpoints = raw.commonEndpoints.filter((v): v is string => typeof v === 'string');
  }
  return result;
}

function loadConfig(): PocketConfig {
  const configDir = join(workspaceDir, 'config');
  let finalConfig = { ...INTERNAL_DEFAULT };

  try {
    // 1. default.json 로드
    const defaultPath = join(configDir, 'default.json');
    if (existsSync(defaultPath)) {
      const defaultData: unknown = JSON.parse(readFileSync(defaultPath, 'utf-8'));
      finalConfig = validateConfig(defaultData, finalConfig);
    }

    // 2. POCKET_ENV 환경변수에 따른 로드 (예: dev.json)
    const env = process.env.POCKET_ENV;
    if (env) {
      const envPath = join(configDir, `${env}.json`);
      if (existsSync(envPath)) {
        const envData: unknown = JSON.parse(readFileSync(envPath, 'utf-8'));
        // globalHeaders는 날아가지 않도록 깊은 병합 후 검증
        const merged = isRecord(envData) && isRecord(envData.globalHeaders)
          ? { ...envData, globalHeaders: { ...finalConfig.globalHeaders, ...envData.globalHeaders }, loadedEnv: env }
          : { ...(isRecord(envData) ? envData : {}), loadedEnv: env };
        finalConfig = validateConfig(merged, finalConfig);
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
