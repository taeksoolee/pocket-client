import { Hono } from 'hono';

import { Home } from '../components/Home';
import { SidebarList } from '../components/Sidebar';
import { getSnapshots, getURLSuggestions } from '../utils/snapshot';

const home = new Hono();

home.get('/', (c) => {
  const files = getSnapshots();
  const suggestions = getURLSuggestions(); // 💡 히스토리 스캔
  return c.html(<Home files={files} suggestions={suggestions} />);
});

// 💡 사이드바 갱신 시에도 추천 데이터는 필요할 수 있으므로 나중에 확장 가능
home.get('/sidebar', (c) => {
  const files = getSnapshots();
  // SidebarList는 files만 필요하므로 기존 유지
  return c.html(<SidebarList files={files} />);
});

export default home;
