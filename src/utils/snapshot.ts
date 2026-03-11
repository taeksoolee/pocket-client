import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { workspaceDir } from '../config.js';

export interface SnapshotParams {
  url: string;
  method: string;
  status: number;
  duration: number;
  data: any;
}

export function saveSnapshot(params: SnapshotParams) {
  const { url, method, status, duration, data } = params;

  // results 폴더 생성 (없으면 자동 생성)
  const resultDir = join(workspaceDir, 'results');
  mkdirSync(resultDir, { recursive: true });

  // 파일명 안전하게 생성: Method-Domain-Timestamp.json
  const urlObj = new URL(url);
  const safeDomain = urlObj.hostname.replace(/[^a-z0-9]/gi, '_');
  const filename = `${method}-${safeDomain}-${Date.now()}.json`;
  const filePath = join(resultDir, filename);

  // 저장할 스냅샷 객체 구조
  const snapshot = {
    meta: {
      url,
      method,
      status,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    },
    data,
  };

  // 로컬 파일 시스템에 JSON 쓰기
  writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

  return { filename, filePath };
}

export function getSnapshots(): string[] {
  const resultDir = join(workspaceDir, 'results');
  try {
    // 폴더 내의 파일들을 읽어서 json 파일만 필터링하고, 수정 시간(mtime) 기준으로 내림차순 정렬
    const files = readdirSync(resultDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = join(resultDir, file);
        const stats = statSync(filePath);
        return { file, mtime: stats.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .map((item) => item.file);

    return files;
  } catch (e) {
    // results 폴더가 아직 없거나 읽기 에러 시 빈 배열 반환
    return [];
  }
}
