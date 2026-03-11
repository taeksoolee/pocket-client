import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { config, workspaceDir } from './config';
import homeRoute from './routes/home';
import requestRoute from './routes/request';
import snapshots from './routes/snapshots';

const app = new Hono();

// 1. 라우터 모듈 등록
app.route('/', homeRoute);
app.route('/request', requestRoute);
app.route('/snapshots', snapshots);

// 2. 서버 실행
serve({ fetch: app.fetch, port: config.port }, (info) => {
  const loadedEnv = (config as any).loadedEnv ? ` [Env: ${(config as any).loadedEnv}]` : '';

  console.log(`\n🚀 Pocket Client is running!${loadedEnv}`);
  console.log(`🔗 Local: http://localhost:${info.port}`);
  console.log(`📁 Workspace: ${workspaceDir}`);
  console.log(
    `⚙️  Config: Port ${config.port}, Global Headers: ${Object.keys(config.globalHeaders).length} items\n`,
  );
});
