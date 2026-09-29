// api/lead.js — Guardián del formulario de leads (función serverless de Vercel).
// CommonJS. Única dependencia: libphonenumber-js (validación de teléfonos fuera de México).
//
// Capas, en orden:
//   1. Señales bot-ciertas (honeypot, token HMAC ausente/inválido, envío < 4 s
//      desde la emisión del token) → "fake success": 200 {"success":true} SIN
//      reenviar a n8n, para que el bot no aprenda. Cada descarte queda en el log
//      como JSON sin PII (correo y teléfono hasheados).
//   2. Validación de campos → 422 con un mensaje por campo (esto sí lo ve el usuario
//      real). Esquema compartido con el navegador (lib/lead-quality/schema.js) + MX del
//      correo + libphonenumber fuera de México.
//   3. Rate limit en memoria (best-effort: bajo Fluid Compute las instancias se
//      reutilizan pero no es durable ni compartido; la capa firme es el WAF de Vercel).
//   4. Turnstile: solo si existen TURNSTILE_SITE_KEY y TURNSTILE_SECRET_KEY. Fallo →
//      fake success; Cloudflare caído → sigue (turnstile_unavailable); secreto
//      inválido → sigue con log de error (turnstile_misconfigured). Va después de
//      validar para no consumir el token de un solo uso en un envío que devuelve 422.
//   5. Solicitantes no comerciales (proyecto personal, empleo, proveedor): mensaje propio,
//      log con su lead_quality_flag y SIN reenvío a n8n.
//   6. Scoring suave: NUNCA bloquea. Solo etiqueta (spam_score, prefijo ⚠️ en el
//      mensaje) y reenvía; el humano decide en Notion.
//   Las capas 1 y 4 (honeypot, token, Turnstile fallido) NUNCA reenvían, sea cual sea
//   LEAD_GATE_MODE: ese modo solo gobierna el veredicto del motor de calidad.
'use strict';

const formToken = require('./_lib/form-token');
const { validarLead } = require('./_lib/validar-lead');
const contrato = require('./_lib/contrato-n8n');
const schema = require('../lib/lead-quality/schema.js');
const turnstile = require('./_lib/turnstile');
const log = require('./_lib/log');

// --- Constante compartida con index.html (debe coincidir EXACTO) ---
const FORM_TOKEN = 'rl1';

const N8N_URL_DEFECTO = 'https://n8n-production-417ba.up.railway.app/webhook/lead-capture';
const LIMITE_BODY = 50 * 1024; // 50 KB
const TIMEOUT_N8N_MS = 10000;

// Rate limit en memoria
const VENTANA_RATE_MS = 10 * 60 * 1000;
const MAX_ENVIOS_VENTANA = 5;
const MAX_IPS_MAPA = 500;
const mapaRate = new Map(); // ip → [timestamps de envíos aceptados]

// Mantener en sincronía con DISPOSABLE_DOMAINS de js/rl-tracking.js
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

// URL: http(s)://, www. o dominio.tld con TLDs habituales del spam (lista cerrada
// para no marcar abreviaturas tipo "S.A. de C.V.")
const RE_URL = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9][a-z0-9.-]*\.(?:com|net|org|info|biz|io|co|ru|cn|xyz|top|site|online|club|shop|store|live|vip|link|click|icu|buzz|work|space|pro)\b/i;
const RE_URL_G = new RegExp(RE_URL.source, 'gi');
const RE_CIRILICO_CJK = /[Ѐ-ӿ一-鿿]/; // Ѐ-ӿ (cirílico) y 一-鿿 (CJK)

// Mensaje para quien declaró no ser prospecto comercial (student / job_seeker / competitor)
function mensajeNoComercial(flag) {
  if (flag === 'job_seeker') {
    return 'Gracias por tu interés. Por ahora no tenemos vacantes abiertas; puedes seguirnos en @riselanding';
  }
  if (flag === 'competitor') {
    const correo = (process.env.VENDOR_CONTACT_EMAIL || '').trim();
    return correo
      ? 'Gracias por tu interés. Las propuestas de proveedores y agencias las recibimos en ' + correo + '.'
      : 'Gracias por tu interés. Por ahora no estamos buscando proveedores ni agencias.';
  }
  return 'Gracias por escribirnos. Trabajamos con empresas y negocios, así que no podemos ayudarte con proyectos personales o escolares. Si más adelante emprendes o trabajas en una empresa, aquí estaremos.';
}

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
// El log no lleva el body: solo el motivo y los hashes de correo y teléfono.
function descartar(res, motivo, body) {
  log.registrar('lead_blocked', {
    reason: motivo,
    email_sha256: log.sha256(body.email),
    phone_sha256: log.sha256Telefono(body.telefono)
  });
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

  // Edad del token (reloj del servidor); menos de 4 s ya se descartó como too_fast
  if (datos.edadMs !== null && datos.edadMs < 8000) { score += 1; flags.push('envío en menos de 8 s'); }

  if (datos.sinToken) { score += 2; flags.push('sin header de formulario'); }

  return { score: score, flags: flags };
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

  // 3) Señales bot-ciertas → fake success (nunca reenvían).
  // website_url_2 es el honeypot actual; website/b_comments, el de páginas viejas aún abiertas.
  if (body.website_url_2 || body.website || body.b_comments) {
    return descartar(res, 'honeypot', body);
  }
  // El header X-Form-Token NO es rechazo duro: una extensión de privacidad que lo
  // recorte no debe costar un lead real; su ausencia solo suma al score.
  const sinToken = (headers['x-form-token'] || '') !== FORM_TOKEN;

  const ahora = Date.now();
  const tk = formToken.verificar(body.form_token, ahora);
  if (tk.estado === 'ausente' && body.sig) {
    // Pestaña abierta antes del despliegue (firma ts+sig anterior): pedir reenvío, no spam
    return send(res, 409, { success: false, code: 'form_expired', message: 'Actualizamos el formulario. Recarga la página y vuelve a enviarlo; si no funciona, escríbenos a contacto@riselanding.com o por WhatsApp.' });
  }
  if (tk.estado === 'ausente' || tk.estado === 'invalido') {
    return descartar(res, 'bad_form_token', body);
  }
  if (tk.estado === 'rapido') {
    return descartar(res, 'too_fast', body);
  }
  if (tk.estado === 'expirado') {
    return send(res, 409, { success: false, code: 'form_expired', message: 'El formulario expiró por seguridad. Vuelve a enviarlo; si el aviso se repite, recarga la página o escríbenos a contacto@riselanding.com o por WhatsApp.' });
  }

  // 4) Validación de campos → 422 con el error de cada campo (esquema compartido + MX y
  // libphonenumber). El cliente pinta cada mensaje junto a su campo.
  const validacion = await validarLead(body);
  if (!validacion.ok) {
    const errores = {};
    validacion.errores.forEach(function (e) { errores[e.campo] = e.mensaje; });
    return send(res, 422, { success: false, code: 'validation', errors: errores, message: validacion.errores[0].mensaje });
  }
  const datos = validacion.datos;
  const nombre = contrato.nombreSaliente(body);
  const empresa = campo(body.empresa);
  const email = campo(body.email);
  const telefono = contrato.telefonoSaliente(body, datos);

  // 5) Rate limit por IP
  if (superaRateLimit(ip, ahora)) {
    res.setHeader('Retry-After', '600');
    return send(res, 429, { success: false, code: 'rate_limited', message: 'Recibimos varios envíos seguidos desde tu conexión. Espera unos minutos para volver a intentarlo, o escríbenos a contacto@riselanding.com o por WhatsApp.' });
  }

  // 6) Turnstile: fallo → fake success; Cloudflare caído o mal configurado → fail-open con señal
  const cfgTurnstile = turnstile.config();
  let senalTurnstile = '';
  if (cfgTurnstile.activo) {
    const resultado = await turnstile.verificar(body.turnstile_token, ip, cfgTurnstile.secret);
    if (resultado.estado === 'fallido') {
      return descartar(res, 'turnstile_failed', body);
    }
    if (resultado.estado === 'no_disponible') {
      senalTurnstile = 'turnstile_unavailable';
      log.registrar(senalTurnstile, { codes: resultado.codigos, email_sha256: log.sha256(email) });
    } else if (resultado.estado === 'mal_configurado') {
      senalTurnstile = 'turnstile_misconfigured';
      log.registrarError(senalTurnstile, { codes: resultado.codigos, email_sha256: log.sha256(email) });
    }
  }

  // 7) Solicitantes que no son prospecto comercial: no se crea lead en n8n (en ningún modo).
  // Se responde con su mensaje específico y queda en el log con su lead_quality_flag.
  if (!datos.comercial) {
    log.registrar('lead_not_forwarded', {
      lead_quality_flag: datos.flagSolicitante,
      email_sha256: log.sha256(datos.email),
      phone_sha256: log.sha256Telefono(datos.telefonoE164 || datos.telefono)
    });
    return send(res, 200, {
      success: true,
      outcome: 'no_comercial',
      lead_quality_flag: datos.flagSolicitante,
      message: mensajeNoComercial(datos.flagSolicitante)
    });
  }

  // 8) Scoring suave: etiqueta sin bloquear
  const mensaje = contrato.mensajeBase(datos, body);
  const puntuacion = puntuarSpam({
    nombre: nombre,
    empresa: empresa,
    email: email,
    telefono: telefono,
    mensaje: datos.necesidad,
    edadMs: tk.edadMs,
    sinToken: sinToken
  });
  // Señal de auditoría sin puntos: el envío no pasó por la verificación de Cloudflare
  if (senalTurnstile) puntuacion.flags.push(senalTurnstile);

  let mensajeFinal = mensaje;
  if (puntuacion.score >= 3) {
    // Prefijo visible en Notion sin tocar n8n: el humano decide
    mensajeFinal = '⚠️ Posible spam (score ' + puntuacion.score + ': ' + puntuacion.flags.join(', ') + ') · ' + mensaje;
  }

  // Siempre hay al menos un servicio (validación): el pilar sale de los servicios marcados
  const interesPilar = schema.pilar(datos.servicios);

  // 9) Reenvío a n8n con el contrato de siempre + campos extra (n8n ignora los que no mapea)
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
    // Nunca un crash sin respuesta
    console.error('[lead] error inesperado:', (err && err.stack) || err);
    return send(res, 500, { success: false, message: 'Error interno. Escríbenos a contacto@riselanding.com.' });
  }
};
