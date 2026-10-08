// api/form-token.js — GET: token HMAC del formulario + site key de Turnstile.
// El HTML es estático (no hay variables de entorno públicas), así que la site key
// viaja por aquí; el widget solo se pinta si llega una.
'use strict';

const formToken = require('./_lib/form-token');
const turnstile = require('./_lib/turnstile');

let avisadoSinSecreto = false;

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store'); // cada visitante necesita su propio token
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, message: 'Método no permitido.' }));
  }
  const token = formToken.emitir();
  if (!token && !avisadoSinSecreto) {
    avisadoSinSecreto = true;
    console.warn('[form-token] Sin FORM_TOKEN_SECRET: capa de token y tiempo mínimo desactivada.');
  }
  const ts = turnstile.config();
  res.statusCode = 200;
  return res.end(JSON.stringify({
    form_token: token,
    turnstile_site_key: ts.activo ? ts.siteKey : null
  }));
};
