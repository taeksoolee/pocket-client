import { Hono } from 'hono';

import { Home } from '../components/Home';

const home = new Hono();

home.get('/', (c) => {
  return c.html(<Home />);
});

export default home;
