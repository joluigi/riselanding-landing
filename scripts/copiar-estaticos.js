// scripts/copiar-estaticos.js: copia a dist/ los estáticos que viven en la raíz del repo.
// js/ y lib/ no se mueven a public/ porque api/** y las pruebas los requieren por ruta relativa.
// Corre después de `astro build` (ver script "build" en package.json).
// La misma lista la usa scripts/vite-estaticos-raiz.mjs para servirlos en `astro dev`.
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');

// Allowlist explícita de Assets/: solo archivos versionados (no el zip ni la carpeta sin versionar).
const ASSETS = [
  'RISELANDING_Isoltipo_white.png',
  'RISELANDING_Isoltipo_white.svg',
  'RISELANDING_logo_black.png',
  'RISELANDING_logo_white.png',
  'apple-touch-icon.png',
  'favicon-192.png',
  'favicon-32.png',
  'logo-horizontal.png',
  'logo-naranja.png',
  'logo-white-horizontal.png',
  'og-image.png'
];

// Lista de rutas públicas (relativas a la raíz) que se publican tal cual.
function rutasEstaticas() {
  const js = fs.readdirSync(path.join(RAIZ, 'js'))
    .filter(function (f) { return f.endsWith('.js'); })
    .map(function (f) { return 'js/' + f; });
  const datos = fs.readdirSync(path.join(RAIZ, 'lib/lead-quality/data'))
    .filter(function (f) { return f.endsWith('.json'); })
    .map(function (f) { return 'lib/lead-quality/data/' + f; });
  const assets = ASSETS.map(function (f) { return 'Assets/' + f; });
  return js.concat(['lib/lead-quality/schema.js'], datos, assets);
}

function copiar() {
  if (!fs.existsSync(DIST)) {
    console.error('✖ No existe dist/: corre primero `astro build`.');
    process.exit(1);
  }
  const faltan = [];
  const rutas = rutasEstaticas();
  rutas.forEach(function (rel) {
    const origen = path.join(RAIZ, rel);
    if (!fs.existsSync(origen)) { faltan.push(rel); return; }
    const destino = path.join(DIST, rel);
    if (fs.existsSync(destino)) {
      console.error('✖ ' + rel + ' ya existe en dist/ (colisión con la salida de Astro).');
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(origen, destino);
  });
  if (faltan.length) {
    console.error('✖ Faltan archivos de la allowlist:\n- ' + faltan.join('\n- '));
    process.exit(1);
  }
  console.log('✔ ' + rutas.length + ' estáticos copiados a dist/.');
}

module.exports = { ASSETS: ASSETS, rutasEstaticas: rutasEstaticas, RAIZ: RAIZ };

if (require.main === module) copiar();
