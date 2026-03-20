import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://quiwieband.vercel.app',
  base: '/',
  adapter: vercel(),
});
