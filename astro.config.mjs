import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://zan.org.il',
  devToolbar: { enabled: false },
  session: false,
  integrations: [react()],
  adapter: cloudflare({
    imageService: 'compile',
  }),
  redirects: {
    '/map': '/redgreen',
  },
});
