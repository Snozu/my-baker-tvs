// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [preact(), tailwind()],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    }
  },
  // Asegurarse de que todas las páginas sean estáticas
  build: {
    format: 'file'
  }
});