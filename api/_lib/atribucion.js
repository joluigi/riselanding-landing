// api/_lib/atribucion.js — Atribución para el LOG del servidor (nunca para el payload de n8n).
// Se lee de la cookie rl_attr que escribe el bootstrap de index.html y que el navegador manda
// con el POST same-origin. Como el contenido lo controla el cliente, se filtra con una lista
// blanca de llaves y longitudes; el referrer se reduce a su origen.
'use strict';

const CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
const LLAVES_TOQUE = ['source', 'medium', 'campaign', 'content', 'term', 'utm_id', 'referrer', 'landing_page', 'timestamp'];
const MAX = 200;

function corto(v) {
  return (typeof v === 'string' && v) ? v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, MAX) : null;
}

function origen(v) {
  const s = corto(v);
  if (!s) return null;
  const m = s.match(/^(https?:\/\/[^/?#\s]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function toque(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
  const out = {};
  LLAVES_TOQUE.forEach(function (k) {
    const v = k === 'referrer' ? origen(t[k]) : corto(t[k]);
    if (v) out[k] = v;
  });
  return Object.keys(out).length ? out : null;
}

// headerCookie: req.headers.cookie. Devuelve un objeto (vacío si no hay cookie o es inválida).
function desdeCookie(headerCookie) {
  const m = String(headerCookie || '').match(/(?:^|;\s*)rl_attr=([^;]*)/);
  if (!m) return {};
  let a;
  try { a = JSON.parse(decodeURIComponent(m[1])); } catch (e) { return {}; }
  if (!a || typeof a !== 'object' || Array.isArray(a)) return {};
  const out = {};
  CLICK_IDS.forEach(function (k) { const v = corto(a[k]); if (v) out[k] = v; });
  const ft = toque(a.ft), lt = toque(a.lt);
  if (ft) out.first_touch = ft;
  if (lt) out.last_touch = lt;
  if (typeof a.tc === 'number' && isFinite(a.tc)) out.touch_count = Math.max(0, Math.floor(a.tc));
  return out;
}

module.exports = { desdeCookie: desdeCookie };
