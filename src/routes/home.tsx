import { Hono } from 'hono';

import { Home } from '../components/Home';
import { getSnapshots } from '../utils/snapshot';

const home = new Hono();

home.get('/', (c) => {
  // 💡 파일 목록을 읽어서 뷰(View)로 전달
  const files = getSnapshots();
  return c.html(<Home files={files} />);
});

export default home;
