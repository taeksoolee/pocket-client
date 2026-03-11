import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { workspaceDir } from './config';
import homeRoute from './routes/home';
import requestRoute from './routes/request';

const app = new Hono();

// 1. 라우터 모듈 등록
app.route('/', homeRoute);
app.route('/request', requestRoute);

// 2. 서버 실행
serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`\n🚀 PocketAPI is running!`);
  console.log(`🔗 Local: http://localhost:${info.port}`);
  console.log(`📁 Workspace: ${workspaceDir}\n`);
});
