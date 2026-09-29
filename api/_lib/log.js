// api/_lib/log.js — Log estructurado sin PII: una línea JSON por evento.
// Correo y teléfono solo como SHA-256 de su valor normalizado; nunca en claro.
'use strict';

const crypto = require('crypto');
const schema = require('../../lib/lead-quality/schema.js');

function sha256(valor) {
  const v = String(valor || '').trim().toLowerCase();
  return v ? crypto.createHash('sha256').update(v).digest('hex') : null;
}

// El teléfono se hashea con sus dígitos en forma E.164 sin "+": un número mexicano
// válido siempre como 52 + 10 dígitos ("55 …", "+52 55 …" y "+52 1 55 …" dan el mismo
// hash); cualquier otro, con los dígitos tal cual.
function sha256Telefono(valor) {
  const mx = schema.digitosMX(valor);
  return sha256(mx ? '52' + mx : String(valor || '').replace(/\D/g, ''));
}

function registrar(evento, datos) {
  const linea = Object.assign({ timestamp: new Date().toISOString(), level: 'info', evento: evento }, datos || {});
  console.log(JSON.stringify(linea));
}

// Mismo formato, pero por console.error: Vercel lo marca como error y se puede filtrar/alertar
function registrarError(evento, datos) {
  const linea = Object.assign({ timestamp: new Date().toISOString(), level: 'error', evento: evento }, datos || {});
  console.error(JSON.stringify(linea));
}

module.exports = { sha256: sha256, sha256Telefono: sha256Telefono, registrar: registrar, registrarError: registrarError };
