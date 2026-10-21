// scripts/check-release.js: verificaciones que deben pasar ANTES de publicar en producción.
// Uso: npm run check:release  (no forma parte de `npm test` porque falla a propósito mientras
// falte preparar el release).
// Desde F4 (Astro) la fecha del aviso vive en src/data/legal.js; si existe dist/, también se
// verifica que el aviso generado la muestre.
'use strict';
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const fallas = [];

const legal = fs.readFileSync(path.join(raiz, 'src', 'data', 'legal.js'), 'utf8');
const m = legal.match(/ultimaActualizacion:\s*'([^']*)'/);
const fecha = m ? m[1] : '';
if (!m) {
  fallas.push('src/data/legal.js: falta `ultimaActualizacion: \'D DE MES DE AAAA\'`.');
} else if (fecha.indexOf('[FECHA DEL RELEASE]') !== -1) {
  fallas.push('src/data/legal.js: reemplaza "[FECHA DEL RELEASE]" por la fecha real (p. ej. "6 DE OCTUBRE DE 2026").');
} else if (!/^\d{1,2} DE [A-ZÁÉÍÓÚ]+ DE \d{4}$/.test(fecha)) {
  fallas.push('src/data/legal.js: la fecha de última actualización no tiene el formato "D DE MES DE AAAA".');
}

const avisoDist = path.join(raiz, 'dist', 'aviso-de-privacidad.html');
if (fecha && fs.existsSync(avisoDist)) {
  const aviso = fs.readFileSync(avisoDist, 'utf8');
  if (aviso.indexOf('ÚLTIMA ACTUALIZACIÓN · ' + fecha + '<') === -1) {
    fallas.push('dist/aviso-de-privacidad.html no muestra "ÚLTIMA ACTUALIZACIÓN · ' + fecha + '": corre npm run build.');
  }
}

if (fallas.length) {
  console.error('✖ El release no está listo:\n- ' + fallas.join('\n- '));
  process.exit(1);
}
console.log('✔ Listo para release.');
