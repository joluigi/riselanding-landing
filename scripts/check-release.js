// scripts/check-release.js — Verificaciones que deben pasar ANTES de publicar en producción.
// Uso: npm run check:release  (no forma parte de `npm test` porque falla a propósito mientras
// falte preparar el release).
'use strict';
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const fallas = [];

const aviso = fs.readFileSync(path.join(raiz, 'aviso-de-privacidad.html'), 'utf8');
if (aviso.indexOf('[FECHA DEL RELEASE]') !== -1) {
  fallas.push('aviso-de-privacidad.html: reemplaza "[FECHA DEL RELEASE]" por la fecha real (p. ej. "6 DE OCTUBRE DE 2026").');
}
if (!/ÚLTIMA ACTUALIZACIÓN · \d{1,2} DE [A-ZÁÉÍÓÚ]+ DE \d{4}</.test(aviso)) {
  fallas.push('aviso-de-privacidad.html: la fecha de última actualización no tiene el formato "D DE MES DE AAAA".');
}

if (fallas.length) {
  console.error('✖ El release no está listo:\n- ' + fallas.join('\n- '));
  process.exit(1);
}
console.log('✔ Listo para release.');
