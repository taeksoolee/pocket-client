import { existsSync } from 'node:fs';
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { config, workspaceDir } from '../config';

export interface SnapshotRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface SnapshotResponse {
  status: number;
  duration: number;
  headers: Record<string, string>;
  data: unknown;
}

interface LegacySnapshotMeta {
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  headers?: Record<string, string>;
}

export interface Snapshot {
  timestamp: string;
  request?: SnapshotRequest;
  response?: SnapshotResponse;
  /** @deprecated 구 포맷 호환용 */
  meta?: LegacySnapshotMeta;
  /** @deprecated 구 포맷 호환용 */
  data?: unknown;
}

export interface SnapshotParams {
  request: SnapshotRequest;
  response: SnapshotResponse;
}

// ─── URL 자동완성 캐시 ───────────────────────────────────────────────────────

let suggestionsCache: string[] | null = null;

export function invalidateSuggestionsCache() {
  suggestionsCache = null;
}

// ─── 저장 ───────────────────────────────────────────────────────────────────

export async function saveSnapshot(params: SnapshotParams) {
  const snapshortsDir = path.join(workspaceDir, 'snapshorts');
  await mkdir(snapshortsDir, { recursive: true });

  const timestamp = new Date();

  const y = timestamp.getFullYear().toString().slice(-2);
  const m = (timestamp.getMonth() + 1).toString().padStart(2, '0');
  const d = timestamp.getDate().toString().padStart(2, '0');
  const hh = timestamp.getHours().toString().padStart(2, '0');
  const mm = timestamp.getMinutes().toString().padStart(2, '0');
  const ss = timestamp.getSeconds().toString().padStart(2, '0');
  const ms = timestamp.getMilliseconds().toString().padStart(3, '0');
  const formattedDate = `${y}${m}${d}${hh}${mm}${ss}${ms}`;

  const decodedUrl = decodeURIComponent(params.request.url);
  const safeUrl = decodedUrl.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50);
  const filename = `${formattedDate}_${params.request.method}_${safeUrl}.json`;
  const filePath = path.join(snapshortsDir, filename);

  const snapshot: Snapshot = {
    timestamp: timestamp.toISOString(),
    request: params.request,
    response: params.response,
  };

  await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  await pruneSnapshots(snapshortsDir, config.maxSnapshots ?? 200);
  invalidateSuggestionsCache();
  return { filename, filePath };
}

async function pruneSnapshots(dir: string, max: number): Promise<void> {
  if (max === 0) return; // 0 = 무제한
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  if (files.length <= max) return;
  const toDelete = files.slice(0, files.length - max);
  await Promise.all(toDelete.map((f) => unlink(path.join(dir, f)).catch(() => {})));
}

// ─── 조회 ───────────────────────────────────────────────────────────────────

export async function getSnapshots(): Promise<string[]> {
  const snapshortsDir = path.join(workspaceDir, 'snapshorts');
  if (!existsSync(snapshortsDir)) return [];
  const files = await readdir(snapshortsDir);
  return files.filter((f) => f.endsWith('.json')).sort((a, b) => b.localeCompare(a));
}

export async function getURLSuggestions(): Promise<string[]> {
  if (suggestionsCache) return suggestionsCache;

  const snapshortsDir = path.join(workspaceDir, 'snapshorts');
  if (!existsSync(snapshortsDir)) return [];

  const files = (await readdir(snapshortsDir)).filter((f) => f.endsWith('.json'));
  const paths = new Set<string>();

  await Promise.all(
    files.map(async (file) => {
      try {
        const content = await readFile(path.join(snapshortsDir, file), 'utf-8');
        const data = JSON.parse(content) as Snapshot;
        const url = data.request?.url ?? data.meta?.url;
        if (url) {
          const urlObj = new URL(url);
          paths.add(decodeURIComponent(urlObj.pathname));
        }
      } catch {
        // 손상된 파일은 건너뜀
      }
    }),
  );

  suggestionsCache = Array.from(paths);
  return suggestionsCache;
}

export async function getSnapshot(filename: string): Promise<Snapshot | null> {
  const filePath = path.join(workspaceDir, 'snapshorts', filename);
  if (!existsSync(filePath)) return null;
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as Snapshot;
}

export async function deleteSnapshot(filename: string): Promise<boolean> {
  const filePath = path.join(workspaceDir, 'snapshorts', filename);
  if (!existsSync(filePath)) return false;
  await unlink(filePath);
  return true;
}
