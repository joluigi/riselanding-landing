import { defineConfig } from 'astro/config';
import estaticosRaiz from './scripts/vite-estaticos-raiz.mjs';

// Sitio 100 % estático (sin adaptador). build.format 'file' + trailingSlash 'never'
// reproducen la estructura plana que Vercel sirve con cleanUrls: dist/aviso-de-privacidad.html → /aviso-de-privacidad.
export default defineConfig({
  site: 'https://riselanding.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  vite: { plugins: [estaticosRaiz()] }
});
