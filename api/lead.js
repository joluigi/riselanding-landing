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
//   5. Solicitantes no comerciales (proyecto personal, empleo, proveedor): se resuelven antes
//      de validar, sin datos de contacto (el formulario no los pide): mensaje propio, log con su
//      lead_quality_flag y SIN reenvío a n8n.
//   6. Idempotencia por event_id (10 min, en memoria de la instancia: parcial).
//   7. Motor de calidad (lib/lead-quality/engine.js) + LEAD_GATE_MODE:
//      - shadow (por defecto): reenvía todo lo que evalúa el motor y agrega
//        " · Calidad: flag/tier score" al mensaje.
//      - enforce: no reenvía spam ni competitor (agency-denylist); suspect y clean sí.
//      spam_score = spam_points, spam_flags = signals, prefijo ⚠️ si el flag es spam.
//   8. Reenvío a n8n (N8N_WEBHOOK_URL + header x-form-secret = FORM_SHARED_SECRET, ambas
//      obligatorias y sin valor de respaldo) con un reintento (backoff 1 s). Si faltan → 503;
//      si falla dos veces → 502; ambos con contacto alterno: nunca se muestra éxito a un lead
//      que debía llegar y no llegó.
//   Las capas 1 y 4 (honeypot, token, Turnstile fallido) y los no comerciales autodeclarados
//   NUNCA se reenvían, sea cual sea LEAD_GATE_MODE.
'use strict';

const formToken = require('./_lib/form-token');
const { validarLead } = require('./_lib/validar-lead');
const contrato = require('./_lib/contrato-n8n');
const schema = require('../lib/lead-quality/schema.js');
const turnstile = require('./_lib/turnstile');
const calidad = require('./_lib/calidad');
const idempotencia = require('./_lib/idempotencia');
const atribucion = require('./_lib/atribucion');
const crypto = require('crypto');
const log = require('./_lib/log');

// --- Constante compartida con index.html (debe coincidir EXACTO) ---
const FORM_TOKEN = 'rl1';

const LIMITE_BODY = 50 * 1024; // 50 KB
const TIMEOUT_N8N_MS = 8000;     // por intento
const INTENTOS_N8N = 2;          // intento + 1 reintento
const BACKOFF_N8N_MS = 1000;

// Destino: SOLO por variables de entorno, sin valores de respaldo en el código (los anteriores
// quedaron inservibles tras la rotación del webhook). Devuelve { url, secreto } o { faltan: [...] }.
function configDestino() {
  const url = String(process.env.N8N_WEBHOOK_URL || '').trim();
  const secreto = String(process.env.FORM_SHARED_SECRET || '').trim();
  const faltan = [];
  if (!/^https:\/\/[^\s/]+\/\S*$/i.test(url)) faltan.push('N8N_WEBHOOK_URL');
  if (!secreto) faltan.push('FORM_SHARED_SECRET');
  return faltan.length ? { faltan: faltan } : { url: url, secreto: secreto };
}

// LEAD_GATE_MODE: 'shadow' (por defecto) reenvía todo lo que evalúa el motor; 'enforce' no reenvía
// estos veredictos. Los rechazos duros y los no comerciales autodeclarados nunca se reenvían.
const BLOQUEADOS_EN_ENFORCE = ['spam', 'competitor', 'student', 'job_seeker'];
let modoAvisado = '';
function modoGate() {
  const m = String(process.env.LEAD_GATE_MODE || '').trim().toLowerCase();
  if (m === 'enforce' || m === 'shadow') return m;
  if (m && modoAvisado !== m) {
    modoAvisado = m;
    console.warn('[lead] LEAD_GATE_MODE="' + m + '" no es válido (shadow | enforce): se usa shadow.');
  }
  return 'shadow';
}

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
function registrarDescarte(motivo, body) {
  log.registrar('lead_blocked', {
    reason: motivo,
    email_sha256: log.sha256(body.email),
    phone_sha256: log.sha256Telefono(body.telefono)
  });
}

function descartar(res, motivo, body) {
  registrarDescarte(motivo, body);
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

  // 3b) Solicitante que se declara no comercial (proyecto personal, empleo, proveedor): se
  // resuelve en el paso 1 del formulario, SIN datos de contacto. Solo cuenta el tipo; no se
  // valida contacto, no aplica Turnstile (no hay nada que guardar) y nunca se reenvía.
  const tipoSolicitante = schema.SOLICITANTES[campo(body.solicitante)];
  if (tipoSolicitante && !tipoSolicitante.comercial) {
    return responderNoComercial(req, res, body, headers, ip, ahora, tipoSolicitante.flag);
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

  // 5) Idempotencia: el mismo event_id en 10 min devuelve la misma respuesta sin reenviar
  const eventId = idempotencia.esUuid(body.event_id) ? body.event_id.toLowerCase() : crypto.randomUUID();
  const leadId = idempotencia.esUuid(body.lead_id) ? body.lead_id.toLowerCase() : crypto.randomUUID();
  let reserva = null;
  if (idempotencia.esUuid(body.event_id)) {
    // Mientras haya un envío previo con este id, se espera su resultado; si terminó en fallo
    // (liberado → null), este envío toma el relevo y se procesa.
    for (;;) {
      const t = idempotencia.tomar(eventId, ahora);
      if (t.reserva) { reserva = t.reserva; break; }
      const anterior = await t.previo;
      if (anterior) {
        log.registrar('lead_duplicate', { event_id: eventId, status: anterior.status });
        return send(res, anterior.status, anterior.cuerpo);
      }
    }
  }
  let r;
  try {
    r = await decidir({ body: body, datos: datos, ip: ip, headers: headers, ahora: ahora, tk: tk, sinToken: sinToken, eventId: eventId, leadId: leadId });
  } catch (e) {
    if (reserva) reserva.liberar();
    throw e;
  }
  // Solo se recuerda lo resuelto (200); un 429 o un fallo de n8n deben poder reintentarse
  if (reserva) { if (r.status === 200) reserva.completar(r); else reserva.liberar(); }
  if (r.retryAfter) res.setHeader('Retry-After', r.retryAfter);
  return send(res, r.status, r.cuerpo);
}

// Solicitante no comercial: mensaje propio + log con su lead_quality_flag. Sin datos personales:
// el log no lleva hashes de correo ni teléfono (el formulario ya no los pide en este caso).
function responderNoComercial(req, res, body, headers, ip, ahora, flag) {
  if (superaRateLimit(ip, ahora)) {
    res.setHeader('Retry-After', '600');
    return send(res, 429, { success: false, code: 'rate_limited', message: 'Recibimos varios envíos seguidos desde tu conexión. Espera unos minutos para volver a intentarlo, o escríbenos a contacto@riselanding.com o por WhatsApp.' });
  }
  const eventId = idempotencia.esUuid(body.event_id) ? body.event_id.toLowerCase() : crypto.randomUUID();
  const leadId = idempotencia.esUuid(body.lead_id) ? body.lead_id.toLowerCase() : crypto.randomUUID();
  log.registrar('lead_not_forwarded', {
    event_id: eventId,
    lead_quality_flag: flag,
    attribution: atribucion.desdeCookie(headers.cookie)
  });
  return send(res, 200, {
    success: true,
    outcome: 'no_comercial',
    lead_quality_flag: flag,
    message: mensajeNoComercial(flag),
    event_id: eventId,
    lead_id: leadId
  });
}

// Pasos 6–10: rate limit, Turnstile, solicitantes no comerciales, motor de calidad, modo del
// gate y reenvío. Devuelve { status, cuerpo } para que la idempotencia pueda recordarlo.
async function decidir(c) {
  const body = c.body, datos = c.datos, ip = c.ip, ahora = c.ahora;
  const nombre = contrato.nombreSaliente(body);
  const empresa = campo(body.empresa);
  const email = campo(body.email);
  const telefono = contrato.telefonoSaliente(body, datos);
  const ids = { event_id: c.eventId, lead_id: c.leadId };
  // Atribución (cookie rl_attr, filtrada) solo para el log: nunca viaja a n8n
  const attribution = atribucion.desdeCookie(c.headers.cookie);

  // 6) Rate limit por IP
  if (superaRateLimit(ip, ahora)) {
    return { status: 429, retryAfter: '600', cuerpo: { success: false, code: 'rate_limited', message: 'Recibimos varios envíos seguidos desde tu conexión. Espera unos minutos para volver a intentarlo, o escríbenos a contacto@riselanding.com o por WhatsApp.' } };
  }

  // 7) Turnstile: fallo → fake success; Cloudflare caído o mal configurado → fail-open con señal
  const cfgTurnstile = turnstile.config();
  let senalTurnstile = '';
  if (cfgTurnstile.activo) {
    const resultado = await turnstile.verificar(body.turnstile_token, ip, cfgTurnstile.secret);
    if (resultado.estado === 'fallido') {
      registrarDescarte('turnstile_failed', body);
      return { status: 200, cuerpo: { success: true } };
    }
    if (resultado.estado === 'no_disponible') {
      senalTurnstile = 'turnstile_unavailable';
      log.registrar(senalTurnstile, { codes: resultado.codigos, email_sha256: log.sha256(email) });
    } else if (resultado.estado === 'mal_configurado') {
      senalTurnstile = 'turnstile_misconfigured';
      log.registrarError(senalTurnstile, { codes: resultado.codigos, email_sha256: log.sha256(email) });
    }
  }

  // 9) Motor de calidad (lib/lead-quality/engine.js). Las señales de la ruta van como
  // auditoría sin puntos.
  const extras = [];
  if (senalTurnstile) extras.push(senalTurnstile);
  if (c.tk.edadMs !== null && c.tk.edadMs < 8000) extras.push('fast_submit_lt_8s');
  if (c.sinToken) extras.push('missing_form_header');
  const veredicto = calidad.evaluar(datos, extras);
  const modo = modoGate();
  const reenviar = modo === 'shadow' || BLOQUEADOS_EN_ENFORCE.indexOf(veredicto.lead_quality_flag) === -1;

  // Respuesta con el veredicto del servidor: el cliente lo publica en rl_lead_submit. Un envío
  // que enforce no reenvía recibe el mismo éxito que un lead real (no se le enseña qué lo delató).
  const exito = {
    status: 200,
    cuerpo: Object.assign({
      success: true,
      lead_quality_flag: veredicto.lead_quality_flag,
      lead_score: veredicto.lead_score,
      lead_tier: veredicto.lead_tier,
      email_domain_type: veredicto.email_domain_type
    }, ids)
  };
  const baseLog = {
    event_id: c.eventId,
    mode: modo,
    lead_quality_flag: veredicto.lead_quality_flag,
    lead_score: veredicto.lead_score,
    lead_tier: veredicto.lead_tier,
    spam_points: veredicto.spam_points,
    signals: veredicto.signals,
    email_domain_type: veredicto.email_domain_type,
    attribution: attribution,
    email_sha256: log.sha256(datos.email),
    phone_sha256: log.sha256Telefono(datos.telefonoE164 || datos.telefono)
  };

  if (!reenviar) {
    log.registrar('lead_evaluated', Object.assign({}, baseLog, { forwarded: false, destination_status: 'blocked_by_enforce' }));
    return exito;
  }

  const mensaje = contrato.mensajeBase(datos, body);
  let mensajeFinal = mensaje;
  if (veredicto.lead_quality_flag === 'spam') {
    // Prefijo visible en Notion sin tocar n8n: el humano decide
    mensajeFinal = '⚠️ Posible spam (score ' + veredicto.spam_points + ': ' + veredicto.signals.join(', ') + ') · ' + mensaje;
  }
  if (modo === 'shadow') {
    // Rastro persistente del veredicto en "Notas iniciales" mientras el gate solo observa
    mensajeFinal += ' · Calidad: ' + veredicto.lead_quality_flag + '/' + veredicto.lead_tier + ' ' + veredicto.lead_score;
  }

  // 10) Reenvío a n8n con el contrato de siempre (mismas 11 llaves), con un reintento
  const reenvio = {
    nombre: nombre,
    empresa: empresa,
    email: email,
    telefono: telefono,
    mensaje: mensajeFinal,
    interes_pilar: schema.pilar(datos.servicios), // siempre hay al menos un servicio
    fuente: 'Sitio Web', // forzado server-side: el cliente no decide la fuente
    spam_score: veredicto.spam_points,
    spam_flags: veredicto.signals,
    ip: ip,
    user_agent: String(c.headers['user-agent'] || '')
  };
  // Sin destino configurado no hay a dónde mandar el lead: error visible, nunca éxito falso
  const destino = configDestino();
  if (destino.faltan) {
    liberarSlotRate(ip, ahora);
    log.registrarError('destination_misconfigured', {
      event_id: c.eventId, missing: destino.faltan,
      detail: 'Faltan o son inválidas variables de entorno del destino del lead; el envío NO llegó a n8n.',
      email_sha256: baseLog.email_sha256, phone_sha256: baseLog.phone_sha256
    });
    return {
      status: 503,
      cuerpo: { success: false, code: 'destination_error', message: 'No pudimos registrar tu solicitud. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp o a contacto@riselanding.com.' }
    };
  }

  const envio = await reenviarAN8n(reenvio, c.eventId, destino);
  log.registrar('lead_evaluated', Object.assign({}, baseLog, {
    forwarded: envio.ok, destination_status: envio.status, attempts: envio.intentos
  }));
  if (envio.ok) return exito;

  // Nunca se muestra éxito si un lead que debía llegar no llegó: error visible + contacto alterno
  liberarSlotRate(ip, ahora);
  log.registrarError('destination_failed', {
    event_id: c.eventId, attempts: envio.intentos, destination_status: envio.status,
    email_sha256: baseLog.email_sha256, phone_sha256: baseLog.phone_sha256
  });
  return {
    status: 502,
    cuerpo: { success: false, code: 'destination_error', message: 'No pudimos registrar tu solicitud. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp o a contacto@riselanding.com.' }
  };
}

function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

// POST a n8n con un reintento tras BACKOFF_N8N_MS. { ok, status, intentos }; status es el código
// HTTP de la última respuesta o 'sin_respuesta' (timeout / red).
async function reenviarAN8n(payload, eventId, destino) {
  let status = 'sin_respuesta';
  for (let intento = 1; intento <= INTENTOS_N8N; intento++) {
    if (intento > 1) await esperar(BACKOFF_N8N_MS);
    const controlador = new AbortController();
    const temporizador = setTimeout(function () { controlador.abort(); }, TIMEOUT_N8N_MS);
    try {
      const resp = await fetch(destino.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-form-secret': destino.secreto, // n8n v5 lo exige (Header Auth); sin él responde 403
          // Para que n8n pueda deduplicar si un intento llegó pero su respuesta se perdió
          'x-rl-event-id': eventId
        },
        body: JSON.stringify(payload),
        signal: controlador.signal
      });
      status = resp.status;
      if (resp.ok) return { ok: true, status: status, intentos: intento };
    } catch (e) {
      status = 'sin_respuesta';
    } finally {
      clearTimeout(temporizador);
    }
  }
  return { ok: false, status: status, intentos: INTENTOS_N8N };
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
