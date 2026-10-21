// scripts/vite-estaticos-raiz.mjs: en `astro dev` sirve /js, /lib/lead-quality y /Assets
// desde la raíz del repo, con la misma allowlist que scripts/copiar-estaticos.js usa en el build.
import fs from 'node:fs';
import path from 'node:path';
import estaticos from './copiar-estaticos.js';

const TIPOS = {
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

export default function estaticosRaiz() {
  return {
    name: 'riselanding-estaticos-raiz',
    configureServer(server) {
      server.middlewares.use(function (req, res, next) {
        const ruta = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\//, '');
        // La lista se recalcula en cada petición para reflejar archivos nuevos en js/ sin reiniciar.
        if (!estaticos.rutasEstaticas().includes(ruta)) return next();
        const archivo = path.join(estaticos.RAIZ, ruta);
        res.setHeader('Content-Type', TIPOS[path.extname(archivo)] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        fs.createReadStream(archivo).pipe(res);
      });
    }
  };
}
