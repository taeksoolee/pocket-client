import fs from 'node:fs';
import path from 'node:path';

import { workspaceDir } from '../config';

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
  data: any;
}

export interface SnapshotParams {
  request: SnapshotRequest;
  response: SnapshotResponse;
}

export function saveSnapshot(params: SnapshotParams) {
  const resultsDir = path.join(workspaceDir, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const timestamp = new Date();
  const safeUrl = params.request.url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const filename = `${timestamp.toISOString().replace(/[:.]/g, '-')}_${params.request.method}_${safeUrl}.json`;
  const filePath = path.join(resultsDir, filename);

  const snapshot = {
    timestamp: timestamp.toISOString(),
    request: params.request,
    response: params.response,
  };

  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return { filename, filePath };
}

export function getSnapshots() {
  const resultsDir = path.join(workspaceDir, 'results');
  if (!fs.existsSync(resultsDir)) return [];
  const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith('.json'));
  return files.sort((a, b) => b.localeCompare(a));
}

export function getSnapshot(filename: string) {
  const filePath = path.join(workspaceDir, 'results', filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function deleteSnapshot(filename: string) {
  const filePath = path.join(workspaceDir, 'results', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
