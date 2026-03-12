import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Hono } from 'hono';

import { Home } from '../components/Home';
// 💡 수정: SidebarList 대신 Sidebar 컴포넌트 전체를 가져옵니다.
import { Sidebar } from '../components/Sidebar';
import { functionsDir, templatesDir } from '../config';
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

  // 💡 템플릿 파일 목록 읽어오기
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

// 💡 HTMX가 사이드바 "전체" 갱신을 위해 호출하는 엔드포인트
home.get('/sidebar', (c) => {
  const files = getSnapshots();

  // 💡 추가: 사이드바 전체를 그리려면 템플릿 목록도 필요하므로 다시 읽어옵니다.
  const templates = existsSync(templatesDir)
    ? readdirSync(templatesDir).filter((f) => f.endsWith('.json'))
    : [];

  // 🚨 핵심 수정: 알맹이(SidebarList)가 아니라 뼈대(Sidebar) 전체를 반환합니다.
  return c.html(<Sidebar snapshots={files} templates={templates} />);
});

export default home;
