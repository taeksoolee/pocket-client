import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path'; // 💡 basename 임포트 필수

import { Hono } from 'hono';

import { templatesDir } from '../config';
import { isRecord } from '../types';

const templates = new Hono();

// 💡 안전한 파일명 추출 헬퍼 함수 (Path Traversal 탈출 공격 완벽 차단)
const getSafeFilePath = (rawName: string) => {
  const decoded = decodeURIComponent(rawName);
  // basename은 '../../../경로/파일' 에서 오직 '파일'만 뽑아냅니다.
  const cleanName = basename(decoded).replace(/\.json$/, '') + '.json';
  return join(templatesDir, cleanName);
};

// 1. 특정 템플릿(JSON) 불러오기
templates.get('/:name', (c) => {
  const filePath = getSafeFilePath(c.req.param('name'));

  if (!existsSync(filePath)) {
    return c.json({ error: 'Template not found' }, 404);
  }

  try {
    const fileData = readFileSync(filePath, 'utf-8');
    return c.json(JSON.parse(fileData));
  } catch (err) {
    return c.json({ error: 'Invalid JSON format' }, 500);
  }
});

// 2. 새로운 템플릿(JSON) 저장하기
templates.post('/:name', async (c) => {
  const filePath = getSafeFilePath(c.req.param('name'));

  try {
    const body: unknown = await c.req.json().catch(() => null);
    if (!isRecord(body)) {
      return c.json({ error: '유효한 JSON 객체가 필요합니다' }, 400);
    }

    // 💡 나중에 에디터나 CLI에서 보기 좋도록 2칸 들여쓰기로 예쁘게 저장 (Pretty Print)
    writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');

    // HTMX 요청일 경우를 대비해 헤더는 남겨둡니다.
    c.header('HX-Trigger', JSON.stringify({ 'templates-updated': true }));
    return c.json({ success: true, message: 'Template saved successfully' });
  } catch (err) {
    return c.json({ error: 'Failed to save template' }, 500);
  }
});

// 3. 템플릿 삭제하기
templates.delete('/:name', (c) => {
  const filePath = getSafeFilePath(c.req.param('name'));

  if (existsSync(filePath)) {
    unlinkSync(filePath);
    // 💡 삭제는 Sidebar의 hx-delete로 쏘기 때문에 이 트리거가 즉시 작동하여 사이드바가 갱신됩니다.
    c.header('HX-Trigger', JSON.stringify({ 'templates-updated': true }));
  }

  // 삭제 후 빈 텍스트를 반환하여 UI 깜빡임 방지
  return c.text('');
});

export default templates;
