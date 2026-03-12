import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Hono } from 'hono';

import { Home } from '../components/Home';
import { SidebarList } from '../components/SidebarList';
import { functionsDir, templatesDir } from '../config';
import { getSnapshots, getURLSuggestions } from '../utils/snapshot';

const home = new Hono();

home.get('/', (c) => {
  const files = getSnapshots();
  const suggestions = getURLSuggestions();

  const functionsMap: Record<string, string> = {};
  if (existsSync(functionsDir)) {
    const fFiles = readdirSync(functionsDir).filter((f) => f.endsWith('.js'));
    fFiles.forEach((filename) => {
      const name = filename.replace('.js', '');
      functionsMap[name] = readFileSync(join(functionsDir, filename), 'utf-8');
    });
  }

  const templates = existsSync(templatesDir)
    ? readdirSync(templatesDir).filter((f) => f.endsWith('.json'))
    : [];

  return c.html(
    <Home
      snapshots={files}
      templates={templates}
      suggestions={suggestions}
      functionsMap={functionsMap}
    />,
  );
});

// 💡 HTMX가 알맹이 갱신을 위해 호출하는 엔드포인트
home.get('/sidebar', (c) => {
  const files = getSnapshots();
  const templates = existsSync(templatesDir)
    ? readdirSync(templatesDir).filter((f) => f.endsWith('.json'))
    : [];

  // 💡 사이드바 뼈대를 부수지 않고, 안쪽의 리스트 알맹이 2개만 반환합니다.
  return c.html(
    <>
      <div x-show="activeTab === 'snapshots'">
        <SidebarList items={files} type="snapshots" />
      </div>
      <div x-show="activeTab === 'templates'" style="display: none;">
        <SidebarList items={templates} type="templates" />
      </div>
    </>,
  );
});

export default home;
