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
//   6. Motor de calidad (lib/lead-quality/engine.js): lead_quality_flag, lead_score,
//      lead_tier, spam_points y signals. Hoy solo etiqueta (spam_score = spam_points,
//      spam_flags = signals, prefijo ⚠️ si el flag es spam) y reenvía; el humano decide.
//   Las capas 1 y 4 (honeypot, token, Turnstile fallido) NUNCA reenvían, sea cual sea
//   LEAD_GATE_MODE: ese modo solo gobierna el veredicto del motor de calidad.
'use strict';

const formToken = require('./_lib/form-token');
const { validarLead } = require('./_lib/validar-lead');
const contrato = require('./_lib/contrato-n8n');
const schema = require('../lib/lead-quality/schema.js');
const turnstile = require('./_lib/turnstile');
const calidad = require('./_lib/calidad');
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

  // 8) Motor de calidad (lib/lead-quality/engine.js). Por ahora solo etiqueta: el reenvío no
  // depende del veredicto (LEAD_GATE_MODE llega en la Fase 4). Las señales de la ruta van como
  // auditoría sin puntos.
  const extras = [];
  if (senalTurnstile) extras.push(senalTurnstile);
  if (tk.edadMs !== null && tk.edadMs < 8000) extras.push('fast_submit_lt_8s');
  if (sinToken) extras.push('missing_form_header');
  const veredicto = calidad.evaluar(datos, extras);

  const mensaje = contrato.mensajeBase(datos, body);
  let mensajeFinal = mensaje;
  if (veredicto.lead_quality_flag === 'spam') {
    // Prefijo visible en Notion sin tocar n8n: el humano decide
    mensajeFinal = '⚠️ Posible spam (score ' + veredicto.spam_points + ': ' + veredicto.signals.join(', ') + ') · ' + mensaje;
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
    spam_score: veredicto.spam_points,
    spam_flags: veredicto.signals,
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

  const reenviado = !!(respuestaN8n && respuestaN8n.ok);
  log.registrar('lead_evaluated', {
    lead_quality_flag: veredicto.lead_quality_flag,
    lead_score: veredicto.lead_score,
    lead_tier: veredicto.lead_tier,
    spam_points: veredicto.spam_points,
    signals: veredicto.signals,
    email_domain_type: veredicto.email_domain_type,
    email_sha256: log.sha256(datos.email),
    phone_sha256: log.sha256Telefono(datos.telefonoE164 || datos.telefono),
    forwarded: reenviado,
    destination_status: respuestaN8n ? respuestaN8n.status : 'sin_respuesta'
  });

  if (reenviado) {
    // El cliente publica rl_lead_submit con este veredicto (el del servidor, nunca uno propio)
    return send(res, 200, {
      success: true,
      lead_quality_flag: veredicto.lead_quality_flag,
      lead_score: veredicto.lead_score,
      lead_tier: veredicto.lead_tier,
      email_domain_type: veredicto.email_domain_type
    });
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
