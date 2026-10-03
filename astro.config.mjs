import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { shareImages } from './src/share/images.ts';

export default defineConfig({
  site: 'https://zan.org.il',
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  session: false,
  integrations: [react(), shareImages()],
  adapter: cloudflare({
    imageService: 'compile',
  }),
  redirects: {
    '/map': '/redgreen',
  },
});
