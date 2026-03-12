import { existsSync, mkdirSync } from 'node:fs';

import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { config, functionsDir, templatesDir, workspaceDir } from './config';
import homeRoute from './routes/home';
import requestRoute from './routes/request';
import snapshots from './routes/snapshots';
import templatesRoute from './routes/templates';

if (!existsSync(functionsDir)) {
  mkdirSync(functionsDir, { recursive: true });
}
// 💡 초기 실행 시 templates 폴더가 없으면 자동 생성
if (!existsSync(templatesDir)) {
  mkdirSync(templatesDir, { recursive: true });
}

const app = new Hono();

// 1. 라우터 모듈 등록
app.route('/', homeRoute);
app.route('/request', requestRoute);
app.route('/snapshots', snapshots);
app.route('/templates', templatesRoute);

// 2. 서버 실행
serve({ fetch: app.fetch, port: config.port }, (info) => {
  const loadedEnv = config.loadedEnv ? ` [Env: ${config.loadedEnv}]` : '';

  console.log(`\n🚀 Pocket Client is running!${loadedEnv}`);
  console.log(`🔗 Local: http://localhost:${info.port}`);
  console.log(`📁 Workspace: ${workspaceDir}`);
  console.log(`⚙️  Functions: ${functionsDir}`);
  console.log(`📝 Templates: ${templatesDir}\n`);
});
