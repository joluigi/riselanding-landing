// api/_lib/form-token.js — Token de formulario firmado con HMAC-SHA256.
// Lo emite GET /api/form-token al montar el formulario y lo valida POST /api/lead.
// Contiene el instante de emisión (reloj del servidor): así el tiempo mínimo de
// llenado no depende del reloj del cliente ni de una sal pública.
// Los archivos con prefijo _ dentro de api/ no se publican como funciones en Vercel.
'use strict';

const crypto = require('crypto');

const VIGENCIA_MS = 2 * 60 * 60 * 1000; // 2 h: más viejo → pedir reenvío, sin marcar spam
const MIN_LLENADO_MS = 4000;            // menos de 4 s desde la emisión → too_fast
const DESFASE_MS = 5000;                // tolerancia entre relojes de instancias

function secreto() {
  return process.env.FORM_TOKEN_SECRET || '';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function firma(cuerpo, clave) {
  return b64url(crypto.createHmac('sha256', clave).update(cuerpo).digest());
}

// Devuelve el token, o null si la capa está desactivada (falta FORM_TOKEN_SECRET).
function emitir(ahora) {
  const clave = secreto();
  if (!clave) return null;
  const cuerpo = b64url(JSON.stringify({ iat: typeof ahora === 'number' ? ahora : Date.now(), n: crypto.randomBytes(8).toString('hex') }));
  return cuerpo + '.' + firma(cuerpo, clave);
}

// estado: 'desactivado' | 'ok' | 'ausente' | 'invalido' | 'rapido' | 'expirado'
function verificar(token, ahora) {
  const clave = secreto();
  if (!clave) return { estado: 'desactivado', edadMs: null };
  if (typeof token !== 'string' || !token) return { estado: 'ausente', edadMs: null };

  const partes = token.split('.');
  if (partes.length !== 2 || !partes[0] || !partes[1]) return { estado: 'invalido', edadMs: null };
  const esperada = Buffer.from(firma(partes[0], clave));
  const recibida = Buffer.from(partes[1]);
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) {
    return { estado: 'invalido', edadMs: null };
  }

  let datos;
  try {
    datos = JSON.parse(Buffer.from(partes[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  } catch (e) {
    return { estado: 'invalido', edadMs: null };
  }
  const iat = datos && Number(datos.iat);
  if (!isFinite(iat)) return { estado: 'invalido', edadMs: null };

  const edadMs = (typeof ahora === 'number' ? ahora : Date.now()) - iat;
  if (edadMs < -DESFASE_MS) return { estado: 'invalido', edadMs: edadMs };
  if (edadMs < MIN_LLENADO_MS) return { estado: 'rapido', edadMs: edadMs };
  if (edadMs > VIGENCIA_MS) return { estado: 'expirado', edadMs: edadMs };
  return { estado: 'ok', edadMs: edadMs };
}

module.exports = { emitir: emitir, verificar: verificar, VIGENCIA_MS: VIGENCIA_MS, MIN_LLENADO_MS: MIN_LLENADO_MS };
