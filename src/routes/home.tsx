import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Hono } from 'hono';

import { Home } from '../components/Home';
import { SidebarList } from '../components/Sidebar';
import { functionsDir } from '../config'; // 💡 경로 추가
import { getSnapshots, getURLSuggestions } from '../utils/snapshot';

const home = new Hono();

home.get('/', (c) => {
  const files = getSnapshots();
  const suggestions = getURLSuggestions();

  // 💡 커스텀 함수 코드를 객체(Key-Value) 형태로 미리 읽기
  const functionsMap: Record<string, string> = {};
  if (existsSync(functionsDir)) {
    const fFiles = readdirSync(functionsDir).filter((f) => f.endsWith('.js'));
    fFiles.forEach((filename) => {
      const name = filename.replace('.js', '');
      functionsMap[name] = readFileSync(join(functionsDir, filename), 'utf-8');
    });
  }

  return c.html(<Home files={files} suggestions={suggestions} functionsMap={functionsMap} />);
});

home.get('/sidebar', (c) => {
  const files = getSnapshots();
  return c.html(<SidebarList files={files} />);
});

export default home;
