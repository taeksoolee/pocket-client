import { Hono } from 'hono';

import { Home } from '../components/Home';
import { SidebarList } from '../components/Sidebar'; // 💡 SidebarList 임포트
import { getSnapshots } from '../utils/snapshot';

const home = new Hono();

// 전체 페이지 렌더링
home.get('/', (c) => {
  const files = getSnapshots();
  return c.html(<Home files={files} />);
});

// 💡 핵심: 사이드바 리스트 조각만 렌더링하는 라우트 추가
home.get('/sidebar', (c) => {
  const files = getSnapshots();
  return c.html(<SidebarList files={files} />);
});

export default home;
