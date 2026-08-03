// api/lead.js — Guardián del formulario de leads (función serverless de Vercel).
// CommonJS, cero dependencias: solo built-ins de Node.
//
// Capas, en orden:
//   1. Señales bot-ciertas (honeypot, firma, envío < 2.5 s) → "fake success":
//      200 {"success":true} SIN reenviar a n8n, para que el bot no aprenda. Cada
//      descarte queda logueado completo ([spam-blocked]) por si hay que rescatar
//      un falso positivo desde los logs de Vercel.
//   2. Validación de campos → 422 con mensaje claro (esto sí lo ve el usuario real).
//   3. Rate limit en memoria (best-effort: bajo Fluid Compute las instancias se
//      reutilizan pero no es durable; la capa firme es el WAF de Vercel).
//   4. Scoring suave: NUNCA bloquea. Solo etiqueta (spam_score, prefijo ⚠️ en el
//      mensaje) y reenvía; el humano decide en Notion.
//   5. Turnstile dormido: solo actúa si existe TURNSTILE_SECRET_KEY.
'use strict';

const crypto = require('crypto');

// --- Constantes compartidas con index.html (deben coincidir EXACTO) ---
const SALT = 'rl-diag-2026';
const FORM_TOKEN = 'rl1';

const N8N_URL_DEFECTO = 'https://n8n-production-417ba.up.railway.app/webhook/lead-capture';
const LIMITE_BODY = 50 * 1024; // 50 KB
const TIMEOUT_N8N_MS = 10000;
const MIN_ENVIO_MS = 2500; // por debajo de esto, el envío es imposiblemente rápido para un humano

// Rate limit en memoria
const VENTANA_RATE_MS = 10 * 60 * 1000;
const MAX_ENVIOS_VENTANA = 4;
const MAX_IPS_MAPA = 500;
const mapaRate = new Map(); // ip → [timestamps de envíos aceptados]

const PILARES_VALIDOS = ['Google Ads', 'Sitio Web + SEO', 'CRM + Automatización', 'Bundle Completo'];

const DOMINIOS_DESECHABLES = [
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org', 'tempmail.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', 'getnada.com', 'dispostable.com',
  'maildrop.cc', 'mintemail.com', 'throwawaymail.com', 'fakeinbox.com', 'mohmal.com',
  'emailondeck.com', 'mailnesia.com', 'mytemp.email', 'tempr.email', 'discard.email',
  'mailcatch.com', 'tempmailo.com', 'moakt.com', 'tmpmail.org', 'correotemporal.org',
  'luxusmail.org', 'mailpoof.com', 'tempail.com', 'cuvox.de', 'dayrep.com',
  'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'superrito.com', 'teleworm.us', 'armyspy.com'
];

// OJO: nada de términos legítimos de esta agencia (seo, sem, crm, marketing, ads,
// publicidad, automatización, dashboards) — generarían falsos positivos en cada lead real.
const KEYWORDS_SPAM = [
  'casino', 'viagra', 'cialis', 'porn', 'xxx', 'forex',
  'guest post', 'link insertion', 'gana dinero', 'make money fast',
  'lottery', 'lotería', 'préstamo urgente', 'loan approved',
  'hacking service', 'seguidores baratos', 'buy followers',
  'recover your funds', 'crypto investment', 'inversión en cripto'
];

// Con límite de palabra: 'xxx' o 'forex' dentro de una palabra más larga no puntúan
const RE_KEYWORDS = KEYWORDS_SPAM.map(function (k) {
  return new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
});

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// URL: http(s)://, www. o dominio.tld con TLDs habituales del spam (lista cerrada
// para no marcar abreviaturas tipo "S.A. de C.V.")
const RE_URL = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9][a-z0-9.-]*\.(?:com|net|org|info|biz|io|co|ru|cn|xyz|top|site|online|club|shop|store|live|vip|link|click|icu|buzz|work|space|pro)\b/i;
const RE_URL_G = new RegExp(RE_URL.source, 'gi');
const RE_CIRILICO_CJK = /[Ѐ-ӿ一-鿿]/; // Ѐ-ӿ (cirílico) y 一-鿿 (CJK)

// Responder SIEMPRE por aquí: fija Content-Type y Cache-Control y evita doble respuesta.
function send(res, status, obj) {
  if (res._leadRespondido) return;
  res._leadRespondido = true;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

// Rechazo duro con "fake success": el bot recibe un 200 idéntico al de un envío real.
function descartar(res, motivo, ip, body) {
  console.log('[spam-blocked]', motivo, ip, JSON.stringify(body).slice(0, 1500));
  return send(res, 200, { success: true });
}

function campo(v) {
  if (typeof v === 'string') return v.trim();
  if (v === null || typeof v === 'undefined') return '';
  return String(v).trim();
}

function ipCliente(req, headers) {
  const xff = String(headers['x-forwarded-for'] || '');
  if (xff) return xff.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '';
}

// Lee el body como stream cuando no hay helpers de Vercel.
// Resuelve con el texto crudo, o con null si supera LIMITE_BODY (seguimos drenando
// sin almacenar para poder responder 413 en vez de cortar el socket).
function leerStream(req) {
  return new Promise(function (resolve, reject) {
    if (typeof req.on !== 'function') { resolve(''); return; }
    let total = 0;
    let excedido = false;
    const trozos = [];
    req.on('data', function (t) {
      const buf = Buffer.isBuffer(t) ? t : Buffer.from(t);
      total += buf.length;
      if (excedido) return;
      if (total > LIMITE_BODY) { excedido = true; trozos.length = 0; return; }
      trozos.push(buf);
    });
    req.on('end', function () {
      resolve(excedido ? null : Buffer.concat(trozos).toString('utf8'));
    });
    req.on('error', function (e) { reject(e); });
  });
}

// true si esta IP ya agotó sus envíos de la ventana (el envío bloqueado no se registra).
function superaRateLimit(ip, ahora) {
  const clave = ip || 'sin-ip';
  const previos = mapaRate.get(clave) || [];
  const vigentes = [];
  for (let i = 0; i < previos.length; i++) {
    if (ahora - previos[i] < VENTANA_RATE_MS) vigentes.push(previos[i]);
  }
  if (vigentes.length >= MAX_ENVIOS_VENTANA) {
    mapaRate.set(clave, vigentes);
    return true;
  }
  vigentes.push(ahora);
  mapaRate.set(clave, vigentes);
  podarMapaRate(ahora);
  return false;
}

// Devuelve el slot recién consumido: si n8n falla, el reintento del usuario no debe toparse con el 429
function liberarSlotRate(ip, marca) {
  const lista = mapaRate.get(ip || 'sin-ip');
  if (!lista) return;
  const i = lista.lastIndexOf(marca);
  if (i !== -1) lista.splice(i, 1);
}

function podarMapaRate(ahora) {
  if (mapaRate.size <= MAX_IPS_MAPA) return;
  // Primero fuera las IPs sin actividad dentro de la ventana…
  for (const par of mapaRate) {
    const marcas = par[1];
    if (!marcas.length || ahora - marcas[marcas.length - 1] >= VENTANA_RATE_MS) mapaRate.delete(par[0]);
  }
  // …y si aún excede, las entradas más antiguas (orden de inserción del Map).
  for (const clave of mapaRate.keys()) {
    if (mapaRate.size <= MAX_IPS_MAPA) break;
    mapaRate.delete(clave);
  }
}

function esEmailDesechable(email) {
  const dominio = (email.split('@')[1] || '').toLowerCase();
  if (!dominio) return '';
  for (let i = 0; i < DOMINIOS_DESECHABLES.length; i++) {
    const d = DOMINIOS_DESECHABLES[i];
    if (dominio === d || dominio.slice(-(d.length + 1)) === '.' + d) return dominio;
  }
  return '';
}

function nombreSospechoso(nombre) {
  if (!nombre) return false;
  if (/\d/.test(nombre)) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(nombre)) return true;
  const letras = nombre.replace(/[^a-záéíóúüñ]/gi, '');
  return letras.length > 6 && !/[aeiouáéíóúü]/i.test(letras);
}

// Scoring suave: solo etiqueta, jamás decide un bloqueo.
function puntuarSpam(datos) {
  let score = 0;
  const flags = [];

  if (RE_URL.test(datos.nombre)) { score += 2; flags.push('URL en nombre'); }
  if (RE_URL.test(datos.empresa)) { score += 2; flags.push('URL en empresa'); }
  if (RE_URL.test(datos.telefono)) { score += 2; flags.push('URL en teléfono'); }

  const urlsMensaje = (datos.mensaje.match(RE_URL_G) || []).length;
  if (urlsMensaje > 0) {
    score += Math.min(urlsMensaje, 3);
    flags.push(urlsMensaje > 1 ? 'URL en mensaje ×' + urlsMensaje : 'URL en mensaje');
  }

  const dominioDesechable = esEmailDesechable(datos.email);
  if (dominioDesechable) { score += 2; flags.push('email desechable (' + dominioDesechable + ')'); }

  const texto = (datos.nombre + ' ' + datos.empresa + ' ' + datos.mensaje).toLowerCase();
  for (let i = 0; i < KEYWORDS_SPAM.length; i++) {
    if (RE_KEYWORDS[i].test(texto)) { score += 2; flags.push('palabra spam: ' + KEYWORDS_SPAM[i]); }
  }

  if (RE_CIRILICO_CJK.test(datos.nombre + datos.empresa + datos.mensaje)) {
    score += 1; flags.push('caracteres cirílicos/CJK');
  }

  if (nombreSospechoso(datos.nombre)) { score += 1; flags.push('nombre sospechoso'); }

  if (datos.elapsed !== null) {
    if (datos.elapsed >= MIN_ENVIO_MS && datos.elapsed < 8000) { score += 1; flags.push('envío en menos de 8 s'); }
    if (datos.elapsed > 24 * 3600 * 1000) { score += 2; flags.push('formulario abierto más de 24 h'); }
    if (datos.elapsed < -(10 * 60 * 1000)) { score += 1; flags.push('reloj del cliente desfasado'); }
  }

  if (datos.sig === 'nocrypto') { score += 3; flags.push('navegador sin Web Crypto'); }

  if (datos.sinToken) { score += 2; flags.push('sin header de formulario'); }

  return { score: score, flags: flags };
}

// Verificación Cloudflare Turnstile (solo se llama si TURNSTILE_SECRET_KEY existe).
async function verificarTurnstile(token, ip) {
  const controlador = new AbortController();
  const temporizador = setTimeout(function () { controlador.abort(); }, 8000);
  try {
    const params = new URLSearchParams();
    params.append('secret', process.env.TURNSTILE_SECRET_KEY);
    params.append('response', token);
    if (ip) params.append('remoteip', ip);
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controlador.signal
    });
    const data = await resp.json();
    return !!(data && data.success);
  } catch (e) {
    return false; // con Turnstile activado, un fallo de verificación no deja pasar
  } finally {
    clearTimeout(temporizador);
  }
}

async function procesar(req, res) {
  // 1) Solo POST
  if (req.method !== 'POST') {
    return send(res, 405, { success: false, message: 'Método no permitido.' });
  }

  const headers = req.headers || {};
  const ip = ipCliente(req, headers);

  // 2) Body robusto con y sin helpers de Vercel (límite 50 KB)
  let body;
  let bodyDeHelper = false;
  try {
    // En Vercel `req.body` es un getter perezoso que LANZA si el JSON está malformado
    const b = req.body;
    if (typeof b !== 'undefined') { bodyDeHelper = true; body = b; }
  } catch (e) {
    return send(res, 400, { success: false, message: 'Solicitud inválida.' });
  }
  if (!bodyDeHelper) {
    let crudo;
    try {
      crudo = await leerStream(req);
    } catch (e) {
      return send(res, 400, { success: false, message: 'Solicitud inválida.' });
    }
    if (crudo === null) {
      return send(res, 413, { success: false, message: 'La solicitud es demasiado grande.' });
    }
    body = crudo;
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8'); // helper de Vercel sin Content-Type JSON
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > LIMITE_BODY) {
      return send(res, 413, { success: false, message: 'La solicitud es demasiado grande.' });
    }
    try {
      body = JSON.parse(body);
    } catch (e) {
      return send(res, 400, { success: false, message: 'Solicitud inválida.' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return send(res, 400, { success: false, message: 'Solicitud inválida.' });
  }
  if (bodyDeHelper && Buffer.byteLength(JSON.stringify(body), 'utf8') > LIMITE_BODY) {
    return send(res, 413, { success: false, message: 'La solicitud es demasiado grande.' });
  }

  // 3) Señales bot-ciertas → fake success (nunca reenvían)
  if (body.website || body.b_comments) {
    return descartar(res, 'honeypot', ip, body);
  }
  // El header X-Form-Token NO es rechazo duro: una extensión de privacidad que lo
  // recorte no debe costar un lead real; su ausencia solo suma al score (los bots
  // que omiten headers casi siempre fallan también la firma).
  const sinToken = (headers['x-form-token'] || '') !== FORM_TOKEN;

  const sig = typeof body.sig === 'string' ? body.sig.toLowerCase() : '';
  if (!sig) {
    return descartar(res, 'sig-ausente', ip, body);
  }
  if (sig !== 'nocrypto') {
    const esperada = crypto.createHash('sha256').update(String(body.ts) + ':' + SALT).digest('hex');
    if (sig !== esperada) {
      return descartar(res, 'sig-invalida', ip, body);
    }
  }

  const ahora = Date.now();
  const ts = Number(body.ts);
  const elapsed = isFinite(ts) ? ahora - ts : null;
  // Envío imposiblemente rápido → bot. Elapsed negativo (reloj adelantado) NO rechaza.
  if (elapsed !== null && elapsed >= 0 && elapsed < MIN_ENVIO_MS) {
    return descartar(res, 'envio-rapido', ip, body);
  }

  // Turnstile dormido: sin TURNSTILE_SECRET_KEY este bloque no hace nada
  if (process.env.TURNSTILE_SECRET_KEY) {
    const tokenValido = body.turnstile_token && await verificarTurnstile(String(body.turnstile_token), ip);
    if (!tokenValido) {
      return descartar(res, 'turnstile', ip, body);
    }
  }

  // 4) Validación de campos → 422 (esto SÍ lo ve el usuario real en el aviso inline)
  const nombre = campo(body.nombre);
  const empresa = campo(body.empresa);
  const email = campo(body.email);
  const telefono = campo(body.telefono);
  const mensaje = campo(body.mensaje);

  if (!nombre) {
    return send(res, 422, { success: false, message: 'Escribe tu nombre para poder contactarte.' });
  }
  if (nombre.length > 200) {
    return send(res, 422, { success: false, message: 'El nombre es demasiado largo (máximo 200 caracteres).' });
  }
  if (!email) {
    return send(res, 422, { success: false, message: 'Escribe tu email para poder responderte.' });
  }
  if (email.length > 320 || !RE_EMAIL.test(email)) {
    return send(res, 422, { success: false, message: 'Revisa tu email: parece incompleto o mal escrito.' });
  }
  if (!telefono) {
    return send(res, 422, { success: false, message: 'Escribe tu teléfono para poder contactarte.' });
  }
  if (telefono.length > 30) {
    return send(res, 422, { success: false, message: 'Revisa tu teléfono: es demasiado largo.' });
  }
  if (telefono.replace(/\D/g, '').length < 7) {
    return send(res, 422, { success: false, message: 'Revisa tu teléfono: debe tener al menos 7 dígitos.' });
  }
  if (empresa.length > 200) {
    return send(res, 422, { success: false, message: 'El nombre de la empresa es demasiado largo (máximo 200 caracteres).' });
  }
  if (mensaje.length > 2000) {
    return send(res, 422, { success: false, message: 'El mensaje es demasiado largo (máximo 2000 caracteres).' });
  }

  // 5) Rate limit por IP
  if (superaRateLimit(ip, ahora)) {
    res.setHeader('Retry-After', '600');
    return send(res, 429, { success: false, message: 'Ya recibimos tu solicitud. Si necesitas agregar algo, escríbenos a contacto@riselanding.com.' });
  }

  // 6) Scoring suave: etiqueta sin bloquear
  const puntuacion = puntuarSpam({
    nombre: nombre,
    empresa: empresa,
    email: email,
    telefono: telefono,
    mensaje: mensaje,
    sig: sig,
    elapsed: elapsed,
    sinToken: sinToken
  });

  let mensajeFinal = mensaje;
  if (puntuacion.score >= 3) {
    // Prefijo visible en Notion sin tocar n8n: el humano decide
    mensajeFinal = '⚠️ Posible spam (score ' + puntuacion.score + ': ' + puntuacion.flags.join(', ') + ') · ' + mensaje;
  }

  const interesCliente = campo(body.interes_pilar);
  const interesPilar = PILARES_VALIDOS.indexOf(interesCliente) !== -1 ? interesCliente : 'Bundle Completo';

  // 7) Reenvío a n8n con el contrato de siempre + campos extra (n8n ignora los que no mapea)
  const reenvio = {
    nombre: nombre,
    empresa: empresa,
    email: email,
    telefono: telefono,
    mensaje: mensajeFinal,
    interes_pilar: interesPilar,
    fuente: 'Sitio Web', // forzado server-side: el cliente no decide la fuente
    spam_score: puntuacion.score,
    spam_flags: puntuacion.flags,
    ip: ip,
    user_agent: String(headers['user-agent'] || '')
  };

  const destino = process.env.N8N_WEBHOOK_URL || N8N_URL_DEFECTO;
  const controlador = new AbortController();
  const temporizador = setTimeout(function () { controlador.abort(); }, TIMEOUT_N8N_MS);
  let respuestaN8n = null;
  try {
    respuestaN8n = await fetch(destino, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-form-secret': process.env.FORM_SHARED_SECRET || 'riselanding-form-v1'
      },
      body: JSON.stringify(reenvio),
      signal: controlador.signal
    });
  } catch (e) {
    respuestaN8n = null;
  } finally {
    clearTimeout(temporizador);
  }

  if (respuestaN8n && respuestaN8n.ok) {
    return send(res, 200, { success: true });
  }

  // Un lead real nunca se pierde en silencio: ve el error y tiene fallback de contacto
  liberarSlotRate(ip, ahora);
  console.error('[lead] n8n no respondió ok:', respuestaN8n ? respuestaN8n.status : 'sin respuesta/timeout');
  return send(res, 502, { success: false, message: 'No pudimos registrar tu solicitud. Escríbenos a contacto@riselanding.com o por WhatsApp.' });
}

module.exports = async function handler(req, res) {
  try {
    return await procesar(req, res);
  } catch (err) {
    // 9) Nunca un crash sin respuesta
    console.error('[lead] error inesperado:', (err && err.stack) || err);
    return send(res, 500, { success: false, message: 'Error interno. Escríbenos a contacto@riselanding.com.' });
  }
};
