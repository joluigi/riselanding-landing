// api/_lib/log.js — Log estructurado sin PII: una línea JSON por evento.
// Correo y teléfono solo como SHA-256 de su valor normalizado; nunca en claro.
'use strict';

const crypto = require('crypto');

function sha256(valor) {
  const v = String(valor || '').trim().toLowerCase();
  return v ? crypto.createHash('sha256').update(v).digest('hex') : null;
}

// El teléfono se hashea solo con sus dígitos para que "+52 55…" y "5255…" coincidan
function sha256Telefono(valor) {
  return sha256(String(valor || '').replace(/\D/g, ''));
}

function registrar(evento, datos) {
  const linea = Object.assign({ timestamp: new Date().toISOString(), evento: evento }, datos || {});
  console.log(JSON.stringify(linea));
}

module.exports = { sha256: sha256, sha256Telefono: sha256Telefono, registrar: registrar };
