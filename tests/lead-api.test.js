'use strict';
// Pruebas de las barreras anti-bot de /api/lead y /api/form-token (Fase 1).
// El destino (n8n) y Cloudflare se simulan con un fetch falso. Datos 100 % sintéticos.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const lead = require('../api/lead.js');
const formTokenHandler = require('../api/form-token.js');
const formToken = require('../api/_lib/form-token.js');
const turnstile = require('../api/_lib/turnstile.js');
const validarLead = require('../api/_lib/validar-lead.js');
const idempotencia = require('../api/_lib/idempotencia.js');
const calidad = require('../api/_lib/calidad.js');

const URL_N8N = 'https://n8n.test.invalid/webhook/lead';
const UUID_NC = '99999999-8888-4777-a666-555555555555';
const URL_CF = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const LLAVES_CONTRATO = ['nombre', 'empresa', 'email', 'telefono', 'mensaje', 'interes_pilar',
  'fuente', 'spam_score', 'spam_flags', 'ip', 'user_agent'].sort();

let reenvios, cabecerasN8n, respuestasN8n, llamadasCf, respuestaCf, logs, warns, errores, fetchOriginal, ipSeq = 0;
const logOriginal = console.log, warnOriginal = console.warn, errorOriginal = console.error;

beforeEach(function () {
  process.env.FORM_TOKEN_SECRET = 'secreto-de-prueba';
  process.env.N8N_WEBHOOK_URL = URL_N8N;
  process.env.FORM_SHARED_SECRET = 'secreto-compartido-de-prueba';
  delete process.env.TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.LEAD_GATE_MODE;
  idempotencia._vaciar();
  // Cola de respuestas de n8n: vacía = 200. Un elemento 'red' simula error de red / timeout.
  respuestasN8n = []; cabecerasN8n = [];
  reenvios = []; llamadasCf = 0; logs = []; warns = []; errores = [];
  respuestaCf = function () { return { ok: true, status: 200, json: async function () { return { success: true }; } }; };
  // DNS simulado: ningún test sale a la red; cada dominio tiene MX salvo que la prueba diga otra cosa
  validarLead._setResolverMx(async function () { return [{ exchange: 'mx.example.invalid', priority: 10 }]; });
  fetchOriginal = global.fetch;
  global.fetch = async function (url, opts) {
    if (url === URL_CF) { llamadasCf++; return respuestaCf(opts); }
    if (url === URL_N8N) {
      reenvios.push(JSON.parse(opts.body));
      cabecerasN8n.push(opts.headers);
      const r = respuestasN8n.length ? respuestasN8n.shift() : 200;
      if (r === 'red') throw new Error('ECONNRESET');
      return { ok: r >= 200 && r < 300, status: r };
    }
    throw new Error('URL inesperada en la prueba: ' + url);
  };
  console.log = function () { logs.push(Array.prototype.join.call(arguments, ' ')); };
  console.warn = function () { warns.push(Array.prototype.join.call(arguments, ' ')); };
  console.error = function () { errores.push(Array.prototype.join.call(arguments, ' ')); };
});

afterEach(function () {
  global.fetch = fetchOriginal;
  console.log = logOriginal; console.warn = warnOriginal; console.error = errorOriginal;
});

function respuestaFalsa() {
  return {
    statusCode: 0, headers: {}, cuerpo: '',
    setHeader: function (k, v) { this.headers[k.toLowerCase()] = v; },
    end: function (b) { this.cuerpo = b || ''; }
  };
}

// Cada llamada usa una IP distinta (TEST-NET-3) para no chocar con el rate limit entre pruebas
async function enviar(body, opciones) {
  const o = opciones || {};
  const res = respuestaFalsa();
  await lead({
    method: 'POST',
    headers: Object.assign({ 'x-form-token': 'rl1', 'x-forwarded-for': o.ip || ('203.0.113.' + (++ipSeq % 250)), 'user-agent': 'node-test' },
      o.cookie ? { cookie: o.cookie } : {}),
    body: body
  }, res);
  return { status: res.statusCode, data: JSON.parse(res.cuerpo), headers: res.headers };
}

function tokenDeHace(ms) { return formToken.emitir(Date.now() - ms); }

// Envío sintético que pasa todas las validaciones de la Fase 2
function cuerpoValido(extra) {
  return Object.assign({
    solicitante: 'empresa',
    nombre: 'Ana Prueba',
    email: 'ana.prueba@example.mx',
    telefono: '+52 55 0000 0000',
    telefono_pais: 'MX',
    empresa: 'Empresa Sintética Uno',
    sitio_web: '',
    tamano: '11_50',
    servicios: ['Implementación de CRM'],
    presupuesto: '10k_25k',
    necesidad: 'Queremos ordenar el seguimiento de prospectos en un CRM.',
    consentimiento: true,
    website_url_2: '',
    form_token: tokenDeHace(20000)
  }, extra || {});
}

function ultimoLog(evento, fuente) {
  const lineas = fuente || logs;
  for (let i = lineas.length - 1; i >= 0; i--) {
    try { const l = JSON.parse(lineas[i]); if (l.evento === evento) return l; } catch (e) { /* línea no JSON */ }
  }
  return null;
}

// --- /api/form-token ---

test('form-token: GET entrega token firmado, sin site key si Turnstile está apagado, y no se cachea', function () {
  const res = respuestaFalsa();
  formTokenHandler({ method: 'GET', headers: {} }, res);
  const d = JSON.parse(res.cuerpo);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.headers['cache-control'], 'no-store');
  assert.strictEqual(formToken.verificar(d.form_token, Date.now() + 5000).estado, 'ok');
  assert.strictEqual(d.turnstile_site_key, null);
});

test('form-token: con las dos claves de Turnstile entrega la site key; con una sola, ninguna + warning', function () {
  process.env.TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
  process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
  let res = respuestaFalsa();
  formTokenHandler({ method: 'GET', headers: {} }, res);
  assert.strictEqual(JSON.parse(res.cuerpo).turnstile_site_key, '1x00000000000000000000AA');

  delete process.env.TURNSTILE_SECRET_KEY;
  res = respuestaFalsa();
  formTokenHandler({ method: 'GET', headers: {} }, res);
  assert.strictEqual(JSON.parse(res.cuerpo).turnstile_site_key, null);
  assert.ok(warns.some(function (w) { return /Solo hay una/.test(w); }), 'debe advertir la configuración incompleta');
});

test('form-token: POST → 405; sin FORM_TOKEN_SECRET devuelve form_token null', function () {
  let res = respuestaFalsa();
  formTokenHandler({ method: 'POST', headers: {} }, res);
  assert.strictEqual(res.statusCode, 405);
  delete process.env.FORM_TOKEN_SECRET;
  res = respuestaFalsa();
  formTokenHandler({ method: 'GET', headers: {} }, res);
  assert.strictEqual(JSON.parse(res.cuerpo).form_token, null);
});

// --- Envío válido y contrato ---

test('envío válido: 200, se reenvía una vez y el payload conserva exactamente las 11 llaves', async function () {
  const r = await enviar(cuerpoValido());
  assert.strictEqual(r.status, 200);
  // Respuesta con el veredicto del servidor (el cliente lo publica en rl_lead_submit)
  const sinIds = Object.assign({}, r.data); delete sinIds.event_id; delete sinIds.lead_id;
  assert.deepStrictEqual(sinIds, { success: true, lead_quality_flag: 'clean', lead_score: 83, lead_tier: 'A', email_domain_type: 'corporate' });
  assert.ok(idempotencia.esUuid(r.data.event_id) && idempotencia.esUuid(r.data.lead_id));
  assert.strictEqual(reenvios.length, 1);
  assert.deepStrictEqual(Object.keys(reenvios[0]).sort(), LLAVES_CONTRATO);
  assert.strictEqual(typeof reenvios[0].spam_score, 'number');
  assert.ok(Array.isArray(reenvios[0].spam_flags));
});

// --- Honeypot ---

test('honeypot website_url_2 lleno → éxito genérico, no se reenvía y el log no trae PII', async function () {
  const r = await enviar(cuerpoValido({ website_url_2: 'https://spam.invalid' }));
  assert.deepStrictEqual([r.status, r.data], [200, { success: true }]);
  assert.strictEqual(reenvios.length, 0);
  const l = ultimoLog('lead_blocked');
  assert.strictEqual(l.reason, 'honeypot');
  assert.match(l.email_sha256, /^[0-9a-f]{64}$/);
  const todo = logs.join('\n');
  assert.ok(todo.indexOf('ana.prueba@example.mx') === -1, 'correo en claro en el log');
  assert.ok(todo.indexOf('0000 0000') === -1 && todo.indexOf('5500000000') === -1, 'teléfono en claro en el log');
});

test('honeypot heredado (website / b_comments de páginas abiertas antes del deploy) también descarta', async function () {
  await enviar(cuerpoValido({ website: 'x' }));
  await enviar(cuerpoValido({ b_comments: 'x' }));
  assert.strictEqual(reenvios.length, 0);
});

// --- Token de formulario y tiempo mínimo ---

test('sin token → bad_form_token, éxito genérico sin reenvío', async function () {
  const r = await enviar(cuerpoValido({ form_token: undefined }));
  assert.deepStrictEqual([r.status, r.data], [200, { success: true }]);
  assert.strictEqual(reenvios.length, 0);
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'bad_form_token');
});

test('token con firma alterada o de otro secreto → bad_form_token', async function () {
  const t = tokenDeHace(20000);
  await enviar(cuerpoValido({ form_token: t.slice(0, -2) + (t.slice(-2) === 'AA' ? 'BB' : 'AA') }));
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'bad_form_token');
  process.env.FORM_TOKEN_SECRET = 'otro-secreto';
  const ajeno = formToken.emitir(Date.now() - 20000);
  process.env.FORM_TOKEN_SECRET = 'secreto-de-prueba';
  await enviar(cuerpoValido({ form_token: ajeno }));
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'bad_form_token');
  assert.strictEqual(reenvios.length, 0);
});

test('envío a menos de 4 s de emitido el token → too_fast; a 4.1 s sí pasa', async function () {
  await enviar(cuerpoValido({ form_token: tokenDeHace(1500) }));
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'too_fast');
  assert.strictEqual(reenvios.length, 0);
  const r = await enviar(cuerpoValido({ form_token: tokenDeHace(4100) }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios.length, 1);
});

test('token de más de 2 h → 409 form_expired (pide reenvío), no es spam ni se reenvía', async function () {
  const r = await enviar(cuerpoValido({ form_token: tokenDeHace(2 * 60 * 60 * 1000 + 60000) }));
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.data.code, 'form_expired');
  assert.strictEqual(r.data.success, false);
  assert.match(r.data.message, /contacto@riselanding\.com/);
  assert.strictEqual(reenvios.length, 0);
  assert.strictEqual(ultimoLog('lead_blocked'), null);
});

test('pestaña con el formulario anterior (ts + sig, sin token) → 409 pedir recargar, no spam', async function () {
  const r = await enviar(cuerpoValido({ form_token: undefined, ts: Date.now() - 30000, sig: 'a'.repeat(64) }));
  assert.strictEqual(r.status, 409);
  assert.strictEqual(r.data.code, 'form_expired');
  assert.strictEqual(ultimoLog('lead_blocked'), null);
});

test('sin FORM_TOKEN_SECRET la capa se desactiva y el envío sin token pasa', async function () {
  delete process.env.FORM_TOKEN_SECRET;
  const r = await enviar(cuerpoValido({ form_token: undefined }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios.length, 1);
});

// --- Turnstile ---

function activarTurnstile() {
  process.env.TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
  process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
}

test('Turnstile OK → se reenvía; la verificación manda secret, token e IP', async function () {
  activarTurnstile();
  let enviado = '';
  respuestaCf = function (opts) { enviado = opts.body; return { ok: true, status: 200, json: async function () { return { success: true }; } }; };
  const r = await enviar(cuerpoValido({ turnstile_token: 'tok-ok' }), { ip: '198.51.100.7' });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios.length, 1);
  const p = new URLSearchParams(enviado);
  assert.deepStrictEqual([p.get('response'), p.get('remoteip')], ['tok-ok', '198.51.100.7']);
  assert.ok(p.get('secret'));
});

test('Turnstile fallido o sin token → turnstile_failed, éxito genérico sin reenvío', async function () {
  activarTurnstile();
  respuestaCf = function () { return { ok: true, status: 200, json: async function () { return { success: false, 'error-codes': ['invalid-input-response'] }; } }; };
  let r = await enviar(cuerpoValido({ turnstile_token: 'tok-malo' }));
  assert.deepStrictEqual([r.status, r.data], [200, { success: true }]);
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'turnstile_failed');
  r = await enviar(cuerpoValido());
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'turnstile_failed');
  assert.strictEqual(reenvios.length, 0);
});

test('Cloudflare con 5xx, error de red o internal-error → fail-open con turnstile_unavailable (nivel info)', async function () {
  activarTurnstile();
  const escenarios = [
    function () { return { ok: false, status: 503, json: async function () { return {}; } }; },
    function () { throw new Error('ECONNRESET'); },
    function () { return { ok: true, status: 200, json: async function () { return { success: false, 'error-codes': ['internal-error'] }; } }; }
  ];
  for (let i = 0; i < escenarios.length; i++) {
    respuestaCf = escenarios[i];
    const r = await enviar(cuerpoValido({ turnstile_token: 'tok' }));
    assert.strictEqual(r.status, 200);
    assert.strictEqual(reenvios.length, i + 1, 'escenario ' + i + ' debió reenviarse');
    assert.ok(reenvios[i].spam_flags.indexOf('turnstile_unavailable') !== -1);
    assert.strictEqual(ultimoLog('turnstile_unavailable').level, 'info');
  }
  assert.strictEqual(ultimoLog('turnstile_misconfigured', errores), null);
});

test('siteverify rechaza nuestro secreto → fail-open con turnstile_misconfigured en nivel error, distinto de unavailable', async function () {
  activarTurnstile();
  const codigos = ['invalid-input-secret', 'missing-input-secret'];
  for (let i = 0; i < codigos.length; i++) {
    respuestaCf = function () { return { ok: true, status: 200, json: async function () { return { success: false, 'error-codes': [codigos[i]] }; } }; };
    const r = await enviar(cuerpoValido({ turnstile_token: 'tok' }));
    assert.strictEqual(r.status, 200);
    assert.strictEqual(reenvios.length, i + 1, codigos[i] + ' debió reenviarse');
    assert.ok(reenvios[i].spam_flags.indexOf('turnstile_misconfigured') !== -1);
    assert.ok(reenvios[i].spam_flags.indexOf('turnstile_unavailable') === -1);
    const l = ultimoLog('turnstile_misconfigured', errores);
    assert.strictEqual(l.level, 'error');
    assert.deepStrictEqual(l.codes, [codigos[i]]);
  }
  assert.strictEqual(ultimoLog('turnstile_unavailable'), null);
  assert.strictEqual(ultimoLog('lead_blocked'), null);
});

test('Cloudflare sin responder: la verificación aborta a los 3 s y el envío sigue (fail-open)', async function () {
  activarTurnstile();
  respuestaCf = function (opts) {
    return new Promise(function (resolve, reject) {
      opts.signal.addEventListener('abort', function () { reject(new Error('AbortError')); });
    });
  };
  const inicio = Date.now();
  const r = await enviar(cuerpoValido({ turnstile_token: 'tok' }));
  const dur = Date.now() - inicio;
  assert.ok(dur >= turnstile.TIMEOUT_MS - 50 && dur < turnstile.TIMEOUT_MS + 1500, 'duró ' + dur + ' ms');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios.length, 1);
});

test('Turnstile con una sola clave → capa apagada: no se llama a Cloudflare y el envío pasa', async function () {
  process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
  const r = await enviar(cuerpoValido());
  assert.strictEqual(r.status, 200);
  assert.strictEqual(llamadasCf, 0);
  assert.strictEqual(reenvios.length, 1);
});

test('un 422 de validación no consume el token de Turnstile (no se llama a Cloudflare)', async function () {
  activarTurnstile();
  const r = await enviar(cuerpoValido({ email: 'no-es-correo', turnstile_token: 'tok' }));
  assert.strictEqual(r.status, 422);
  assert.strictEqual(llamadasCf, 0);
});

// --- Rate limit ---

test('rate limit: 5 envíos por IP en 10 min pasan, el 6.º recibe 429', async function () {
  const ip = '192.0.2.55';
  for (let i = 0; i < 5; i++) {
    const r = await enviar(cuerpoValido(), { ip: ip });
    assert.strictEqual(r.status, 200, 'envío ' + (i + 1));
  }
  const r6 = await enviar(cuerpoValido(), { ip: ip });
  assert.strictEqual(r6.status, 429);
  assert.strictEqual(r6.data.code, 'rate_limited');
  assert.match(r6.data.message, /contacto@riselanding\.com/);
  assert.strictEqual(reenvios.length, 5);
});

// --- Fase 2: validación del servidor, contrato con n8n y solicitantes no comerciales ---

// Réplica exacta de cómo armaba el payload el index.html anterior (commit 1e2184a), que tenía
// Nombre y Apellido por separado: c._viejo trae lo que la persona habría tecleado en cada uno.
function payloadClienteAnterior(c) {
  const viejo = c._viejo || { nombre: 'Ana', apellido: 'Prueba' };
  const servicios = c.servicios;
  function pilar(s) {
    const ads = s.indexOf('Publicidad Digital') !== -1;
    const web = s.some(function (x) { return /SEO|web/i.test(x); });
    const ops = s.some(function (x) { return /CRM|Automatizaci|Dashboards/i.test(x); });
    if ((ads + web + ops) >= 2 || s.length >= 3) return 'Bundle Completo';
    if (ads) return 'Google Ads';
    if (web) return 'Sitio Web + SEO';
    if (ops) return 'CRM + Automatización';
    return 'Bundle Completo';
  }
  const tamanos = { '1_10': '1–10 personas', '11_50': '11–50 personas', '51_200': '51–200 personas', '200_plus': 'Más de 200 personas' };
  const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(function (k) { return c[k] ? k + '=' + c[k] : null; }).filter(Boolean).join(' ');
  return {
    nombre: (viejo.nombre + ' ' + viejo.apellido).trim(),
    empresa: c.empresa.trim(),
    email: c.email.trim(),
    telefono: c.telefono.trim(),
    mensaje: 'Servicios: ' + (servicios.join(', ') || 'no indicó') + (tamanos[c.tamano] ? ' · Tamaño: ' + tamanos[c.tamano] : '') + (utm ? ' · ' + utm : ''),
    interes_pilar: pilar(servicios),
    fuente: 'Sitio Web'
  };
}

test('contrato: nombre, empresa, email, teléfono, mensaje, interes_pilar y fuente idénticos al cliente anterior', async function () {
  const casos = [
    {},
    { servicios: ['Publicidad Digital', 'SEO y Posicionamiento'], tamano: '200_plus', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'marca-sintetica' },
    { servicios: ['SEO y Posicionamiento', 'Reediseño / Desarrollo página web'], tamano: '1_10', utm_source: 'meta' },
    { servicios: SERVICIOS_TODOS(), tamano: '51_200', email: 'Ana.Prueba@Example.MX' },
    { servicios: ['Implementación de CRM', 'Automatización de procesos', 'Dashboards y reportes'], empresa: '  Empresa Sintética Dos  ' },
    // Nombre completo de varias palabras: primera = nombre, resto = apellido
    { nombre: '  María de la O Ruiz ', _viejo: { nombre: 'María', apellido: 'de la O Ruiz' } }
  ];
  for (let i = 0; i < casos.length; i++) {
    const c = cuerpoValido(casos[i]);
    const viejo = c._viejo; delete c._viejo;
    await enviar(c);
    c._viejo = viejo;
    const saliente = Object.assign({}, reenvios[i]);
    // Única diferencia permitida en modo shadow (por defecto): el sufijo " · Calidad: flag/tier score"
    assert.match(saliente.mensaje, / · Calidad: [a-z_]+\/[ABC] \d+$/);
    saliente.mensaje = saliente.mensaje.replace(/ · Calidad: [a-z_]+\/[ABC] \d+$/, '');
    const esperado = payloadClienteAnterior(c);
    Object.keys(esperado).forEach(function (k) { assert.strictEqual(saliente[k], esperado[k], 'caso ' + i + ', llave ' + k); });
    assert.deepStrictEqual(Object.keys(saliente).sort(), LLAVES_CONTRATO);
  }
});
function SERVICIOS_TODOS() { return require('../lib/lead-quality/schema.js').SERVICIOS.slice(); }

test('422 con el error de cada campo y el primero como message; no se reenvía', async function () {
  const r = await enviar(cuerpoValido({ nombre: 'T T', telefono: '55 1234 567', empresa: 'Nada', servicios: [], necesidad: 'corto', consentimiento: false }));
  assert.strictEqual(r.status, 422);
  assert.strictEqual(r.data.code, 'validation');
  // En el orden del formulario de 2 pasos: primero los del paso 1, luego los de contacto
  assert.deepStrictEqual(Object.keys(r.data.errors), ['servicios', 'necesidad', 'nombre', 'telefono', 'empresa', 'consentimiento']);
  assert.strictEqual(r.data.errors.telefono, 'Escribe tu número a 10 dígitos');
  assert.strictEqual(r.data.errors.empresa, 'Escribe el nombre de tu empresa o negocio');
  assert.strictEqual(r.data.errors.nombre, 'Escribe tu nombre completo, no solo la inicial.');
  assert.strictEqual(r.data.message, r.data.errors.servicios);
  const una = await enviar(cuerpoValido({ nombre: 'Ana' }));
  assert.strictEqual(una.data.errors.nombre, 'Escribe tu nombre y apellido.');
  assert.strictEqual(reenvios.length, 0);
});

test('teléfonos MX de 7, 8, 9 u 11 dígitos, o con lada que empieza en 1 → 422', async function () {
  const malos = ['5500000', '55000000', '550000000', '55000000000', '1500000000'];
  for (let i = 0; i < malos.length; i++) {
    const r = await enviar(cuerpoValido({ telefono: malos[i] }));
    assert.strictEqual(r.status, 422, malos[i]);
    assert.strictEqual(r.data.errors.telefono, 'Escribe tu número a 10 dígitos');
  }
  assert.strictEqual(reenvios.length, 0);
});

test('correo cuyo dominio no tiene MX → 422; timeout o error del DNS no bloquea', async function () {
  validarLead._setResolverMx(async function () { const e = new Error('no'); e.code = 'ENOTFOUND'; throw e; });
  let r = await enviar(cuerpoValido({ email: 'ana@dominio-sin-correo.invalid' }));
  assert.strictEqual(r.status, 422);
  assert.strictEqual(r.data.errors.email, 'Revisa tu correo: ese dominio no recibe correos.');

  validarLead._setResolverMx(async function () { return [{ exchange: '.', priority: 0 }]; }); // MX nulo (RFC 7505)
  r = await enviar(cuerpoValido({ email: 'ana@mx-nulo.invalid' }));
  assert.strictEqual(r.status, 422);

  validarLead._setResolverMx(async function () { const e = new Error('x'); e.code = 'ESERVFAIL'; throw e; });
  r = await enviar(cuerpoValido());
  assert.strictEqual(r.status, 200);

  validarLead._setResolverMx(function () { return new Promise(function () {}); }); // nunca responde
  const inicio = Date.now();
  r = await enviar(cuerpoValido({ email: 'ana@lento.invalid' }));
  assert.strictEqual(r.status, 200);
  assert.ok(Date.now() - inicio >= 1900 && Date.now() - inicio < 3500, 'timeout de 2 s');
  assert.strictEqual(reenvios.length, 2);
});

test('correo desechable → 422; Gmail sí pasa', async function () {
  let r = await enviar(cuerpoValido({ email: 'qa1@mailinator.com' }));
  assert.strictEqual(r.status, 422);
  r = await enviar(cuerpoValido({ email: 'ana.prueba.sintetica@gmail.com' }));
  assert.strictEqual(r.status, 200);
});

test('teléfono fuera de México: libphonenumber valida; al saliente se antepone el código si falta', async function () {
  let r = await enviar(cuerpoValido({ telefono_pais: 'US', telefono: '202 555 0123' }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios[0].telefono, '+1 202 555 0123');
  r = await enviar(cuerpoValido({ telefono_pais: 'INTL', telefono: '+57 601 5550000' }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios[1].telefono, '+57 601 5550000');
  r = await enviar(cuerpoValido({ telefono_pais: 'CO', telefono: '999999' }));
  assert.strictEqual(r.status, 422);
  assert.strictEqual(reenvios.length, 2);
});

test('solicitantes no comerciales: solo con el tipo (sin datos de contacto), mensaje propio, log sin PII y sin reenvío', async function () {
  delete process.env.VENDOR_CONTACT_EMAIL;
  const casos = [
    ['personal', 'student', /trabajamos con empresas y negocios/i],
    ['empleo', 'job_seeker', /^Gracias por tu interés\. Por ahora no tenemos vacantes abiertas; puedes seguirnos en @riselanding$/],
    ['proveedor', 'competitor', /no estamos buscando proveedores/]
  ];
  for (let i = 0; i < casos.length; i++) {
    // Lo que manda el paso 1 del formulario: solo el tipo + señales anti-bot
    const r = await enviar({ solicitante: casos[i][0], form_token: tokenDeHace(20000), website_url_2: '', event_id: UUID_NC });
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual([r.data.success, r.data.outcome, r.data.lead_quality_flag, r.data.event_id], [true, 'no_comercial', casos[i][1], UUID_NC]);
    assert.match(r.data.message, casos[i][2]);
    const l = ultimoLog('lead_not_forwarded');
    assert.strictEqual(l.lead_quality_flag, casos[i][1]);
    assert.ok(!('email_sha256' in l) && !('phone_sha256' in l), 'el log no lleva datos personales');
  }
  assert.strictEqual(reenvios.length, 0);

  // Aunque un cliente viejo mande datos de contacto, no se validan ni se registran
  const r = await enviar(cuerpoValido({ solicitante: 'empleo', nombre: 'T', telefono: '5500' }));
  assert.strictEqual(r.data.outcome, 'no_comercial');
  assert.ok(logs.join('\n').indexOf('ana.prueba@example.mx') === -1);
  assert.ok(!('email_sha256' in ultimoLog('lead_not_forwarded')));

  process.env.VENDOR_CONTACT_EMAIL = 'proveedores@example.invalid';
  const pr = await enviar({ solicitante: 'proveedor', form_token: tokenDeHace(20000) });
  assert.match(pr.data.message, /proveedores@example\.invalid/);
  delete process.env.VENDOR_CONTACT_EMAIL;
});

test('no comercial: siguen aplicando honeypot, token y rate limit; Turnstile no (no hay nada que guardar)', async function () {
  let r = await enviar({ solicitante: 'empleo', form_token: tokenDeHace(20000), website_url_2: 'x' });
  assert.deepStrictEqual(r.data, { success: true });
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'honeypot');
  r = await enviar({ solicitante: 'empleo' });
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'bad_form_token');
  r = await enviar({ solicitante: 'empleo', form_token: tokenDeHace(1000) });
  assert.strictEqual(ultimoLog('lead_blocked').reason, 'too_fast');
  activarTurnstile();
  r = await enviar({ solicitante: 'empleo', form_token: tokenDeHace(20000) });
  assert.strictEqual(r.data.outcome, 'no_comercial');
  assert.strictEqual(llamadasCf, 0);
  const ip = '192.0.2.77';
  for (let i = 0; i < 5; i++) await enviar({ solicitante: 'personal', form_token: tokenDeHace(20000) }, { ip: ip });
  r = await enviar({ solicitante: 'personal', form_token: tokenDeHace(20000) }, { ip: ip });
  assert.strictEqual(r.status, 429);
});

test('log: el mismo teléfono mexicano da el mismo phone_sha256 en cualquier formato y evento', async function () {
  const log = require('../api/_lib/log.js');
  const h = log.sha256Telefono('55 0000 0000');
  ['5500000000', '+52 55 0000 0000', '+52 1 55 0000 0000', '+525500000000'].forEach(function (t) {
    assert.strictEqual(log.sha256Telefono(t), h, t);
  });
  await enviar(cuerpoValido({ website_url_2: 'x', telefono: '55 0000 0000' }));
  const bloqueado = ultimoLog('lead_blocked').phone_sha256;
  await enviar(cuerpoValido({ telefono: '+52 1 55 0000 0000' }));
  assert.strictEqual(ultimoLog('lead_evaluated').phone_sha256, bloqueado);
  assert.strictEqual(bloqueado, h);
});

// --- Fase 3: motor de calidad en la ruta ---

test('motor: spam_score = spam_points, spam_flags = signals; prefijo ⚠️ solo si el flag es spam', async function () {
  // Empresa numérica pasa la validación (2+ caracteres, no está en la lista) pero suma +3 → spam
  let r = await enviar(cuerpoValido({ empresa: '12345' }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.lead_quality_flag, 'spam');
  let s = reenvios[0];
  assert.strictEqual(s.spam_score, 3);
  assert.deepStrictEqual(s.spam_flags, ['company_numeric']);
  assert.strictEqual(s.mensaje, '⚠️ Posible spam (score 3: company_numeric) · Servicios: Implementación de CRM · Tamaño: 11–50 personas · Calidad: spam/B 63');

  // Par repetido en empresa: +1, suspect, se reenvía SIN prefijo
  r = await enviar(cuerpoValido({ empresa: 'Papelería Papalote' }));
  assert.strictEqual(r.data.lead_quality_flag, 'suspect');
  s = reenvios[1];
  assert.deepStrictEqual([s.spam_score, s.spam_flags], [1, ['company_pair_repeat']]);
  assert.strictEqual(s.mensaje, 'Servicios: Implementación de CRM · Tamaño: 11–50 personas · Calidad: suspect/A 83');
  assert.deepStrictEqual(Object.keys(s).sort(), LLAVES_CONTRATO);
});

test('motor: señales de auditoría de la ruta (sin puntos) y log lead_evaluated sin PII', async function () {
  const r = await enviar(cuerpoValido({ form_token: tokenDeHace(5000) }), {});
  assert.strictEqual(r.data.lead_quality_flag, 'clean');
  assert.ok(reenvios[0].spam_flags.indexOf('fast_submit_lt_8s') !== -1);
  assert.strictEqual(reenvios[0].spam_score, 0);
  const l = ultimoLog('lead_evaluated');
  assert.deepStrictEqual([l.lead_quality_flag, l.lead_tier, l.forwarded, l.destination_status], ['clean', 'A', true, 200]);
  assert.match(l.email_sha256, /^[0-9a-f]{64}$/);
  assert.ok(logs.join('\n').indexOf('ana.prueba@example.mx') === -1);
});

test('rechazos duros siguen respondiendo solo {success:true}, sin veredicto', async function () {
  let r = await enviar(cuerpoValido({ website_url_2: 'x' }));
  assert.deepStrictEqual(r.data, { success: true });
  activarTurnstile();
  respuestaCf = function () { return { ok: true, status: 200, json: async function () { return { success: false }; } }; };
  r = await enviar(cuerpoValido({ turnstile_token: 'malo' }));
  assert.deepStrictEqual(r.data, { success: true });
});

// --- Fase 4: modos shadow/enforce, idempotencia y reintento hacia n8n ---

const UUID_A = '11111111-2222-4333-8444-555555555555';
const UUID_B = '66666666-7777-4888-9999-aaaaaaaaaaaa';

// Un envío por tipo de veredicto. "competitor inferido" usa la agency-denylist (dominio del correo).
const CASOS_VEREDICTO = [
  { tipo: 'clean', cuerpo: {} },
  { tipo: 'suspect', cuerpo: { empresa: 'Papelería Papalote' } },
  { tipo: 'spam (motor)', cuerpo: { empresa: '12345' }, flag: 'spam' },
  { tipo: 'competitor (agency-denylist)', cuerpo: { email: 'ana@agencia-rival.example' }, flag: 'competitor', denylist: true },
  { tipo: 'student (autodeclarado)', cuerpo: { solicitante: 'personal' }, flag: 'student' },
  { tipo: 'job_seeker (autodeclarado)', cuerpo: { solicitante: 'empleo' }, flag: 'job_seeker' },
  { tipo: 'competitor (autodeclarado)', cuerpo: { solicitante: 'proveedor' }, flag: 'competitor' },
  { tipo: 'rechazo duro (honeypot)', cuerpo: { website_url_2: 'x' } },
  { tipo: 'rechazo duro (too_fast)', cuerpo: { form_token: 'se-reemplaza' }, tooFast: true }
];
// ¿Se reenvía a n8n? [shadow, enforce]
const TABLA_REENVIO = {
  'clean': [true, true],
  'suspect': [true, true],
  'spam (motor)': [true, false],
  'competitor (agency-denylist)': [true, false],
  'student (autodeclarado)': [false, false],
  'job_seeker (autodeclarado)': [false, false],
  'competitor (autodeclarado)': [false, false],
  'rechazo duro (honeypot)': [false, false],
  'rechazo duro (too_fast)': [false, false]
};

test('tabla de reenvío por modo y veredicto (y todos responden 200 al navegador)', async function () {
  const modos = ['shadow', 'enforce'];
  for (let m = 0; m < modos.length; m++) {
    process.env.LEAD_GATE_MODE = modos[m];
    for (const caso of CASOS_VEREDICTO) {
      reenvios = [];
      if (caso.denylist) calidad.LISTAS_MOTOR.agencyDenylist.push('agencia-rival.example');
      const extra = Object.assign({}, caso.cuerpo);
      if (caso.tooFast) extra.form_token = tokenDeHace(1000);
      try {
        const r = await enviar(cuerpoValido(extra));
        assert.strictEqual(r.status, 200, caso.tipo);
        assert.strictEqual(reenvios.length > 0, TABLA_REENVIO[caso.tipo][m], caso.tipo + ' en ' + modos[m]);
        if (caso.flag) assert.strictEqual(r.data.lead_quality_flag, caso.flag, caso.tipo);
      } finally {
        if (caso.denylist) calidad.LISTAS_MOTOR.agencyDenylist.pop();
      }
    }
  }
});

test('enforce: lo que no se reenvía recibe el mismo éxito que un lead real, con su veredicto, y queda en el log', async function () {
  process.env.LEAD_GATE_MODE = 'enforce';
  const r = await enviar(cuerpoValido({ empresa: '12345', event_id: UUID_A }));
  assert.strictEqual(reenvios.length, 0);
  assert.deepStrictEqual(Object.keys(r.data).sort(), ['email_domain_type', 'event_id', 'lead_id', 'lead_quality_flag', 'lead_score', 'lead_tier', 'success']);
  assert.deepStrictEqual([r.data.success, r.data.lead_quality_flag, r.data.event_id], [true, 'spam', UUID_A]);
  const l = ultimoLog('lead_evaluated');
  assert.deepStrictEqual([l.mode, l.forwarded, l.destination_status, l.event_id], ['enforce', false, 'blocked_by_enforce', UUID_A]);
});

test('sufijo " · Calidad: flag/tier score" solo en shadow; en enforce el mensaje va como siempre', async function () {
  await enviar(cuerpoValido());
  assert.strictEqual(reenvios[0].mensaje, 'Servicios: Implementación de CRM · Tamaño: 11–50 personas · Calidad: clean/A 83');
  process.env.LEAD_GATE_MODE = 'enforce';
  await enviar(cuerpoValido());
  assert.strictEqual(reenvios[1].mensaje, 'Servicios: Implementación de CRM · Tamaño: 11–50 personas');
  assert.strictEqual(ultimoLog('lead_evaluated').mode, 'enforce');
});

test('LEAD_GATE_MODE inválido → shadow con warning', async function () {
  process.env.LEAD_GATE_MODE = 'bloquear-todo';
  await enviar(cuerpoValido({ empresa: '12345' }));
  assert.strictEqual(reenvios.length, 1);
  assert.strictEqual(ultimoLog('lead_evaluated').mode, 'shadow');
  assert.ok(warns.some(function (w) { return /LEAD_GATE_MODE="bloquear-todo"/.test(w); }));
});

test('la respuesta devuelve event_id y lead_id del cliente; si faltan o no son UUID, el servidor los genera', async function () {
  let r = await enviar(cuerpoValido({ event_id: UUID_A, lead_id: UUID_B }));
  assert.deepStrictEqual([r.data.event_id, r.data.lead_id], [UUID_A, UUID_B]);
  assert.strictEqual(cabecerasN8n[0]['x-rl-event-id'], UUID_A);
  r = await enviar(cuerpoValido({ event_id: 'no-es-uuid' }));
  assert.ok(idempotencia.esUuid(r.data.event_id) && r.data.event_id !== 'no-es-uuid');
  r = await enviar(cuerpoValido({ solicitante: 'empleo', event_id: UUID_B }));
  assert.strictEqual(r.data.event_id, UUID_B);
});

test('idempotencia: el mismo event_id no se reenvía dos veces y recibe la misma respuesta', async function () {
  const a = await enviar(cuerpoValido({ event_id: UUID_A }));
  const b = await enviar(cuerpoValido({ event_id: UUID_A }));
  assert.strictEqual(reenvios.length, 1);
  assert.deepStrictEqual(b.data, a.data);
  assert.ok(ultimoLog('lead_duplicate'));
  // Otro event_id sí se reenvía
  await enviar(cuerpoValido({ event_id: UUID_B }));
  assert.strictEqual(reenvios.length, 2);
});

test('idempotencia: dos envíos simultáneos con el mismo event_id → un solo reenvío', async function () {
  const r = await Promise.all([enviar(cuerpoValido({ event_id: UUID_A })), enviar(cuerpoValido({ event_id: UUID_A }))]);
  assert.strictEqual(reenvios.length, 1);
  assert.deepStrictEqual(r[0].data, r[1].data);
});

test('idempotencia: tras un fallo de n8n el mismo event_id se puede reintentar', async function () {
  respuestasN8n = [500, 500];
  const falla = await enviar(cuerpoValido({ event_id: UUID_A }));
  assert.strictEqual(falla.status, 502);
  const ok = await enviar(cuerpoValido({ event_id: UUID_A }));
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(reenvios.length, 3); // 2 intentos fallidos + 1 bueno
});

test('reintento: n8n falla una vez y responde al segundo intento (tras ~1 s) → éxito', async function () {
  respuestasN8n = [503];
  const inicio = Date.now();
  const r = await enviar(cuerpoValido());
  assert.strictEqual(r.status, 200);
  assert.strictEqual(reenvios.length, 2);
  assert.ok(Date.now() - inicio >= 950, 'backoff de 1 s');
  assert.deepStrictEqual(reenvios[0], reenvios[1], 'el reintento manda el mismo payload');
  assert.strictEqual(ultimoLog('lead_evaluated').attempts, 2);
});

test('reintento: si n8n falla dos veces (HTTP o red) → 502 con contacto alterno, NUNCA éxito', async function () {
  const escenarios = [[500, 502], ['red', 'red'], [401, 'red']];
  for (const esc of escenarios) {
    reenvios = [];
    respuestasN8n = esc.slice();
    const r = await enviar(cuerpoValido());
    assert.strictEqual(r.status, 502, JSON.stringify(esc));
    assert.strictEqual(r.data.success, false);
    assert.strictEqual(r.data.code, 'destination_error');
    assert.match(r.data.message, /Inténtalo de nuevo/);
    assert.match(r.data.message, /WhatsApp/);
    assert.strictEqual(reenvios.length, 2);
    const e = ultimoLog('destination_failed', errores);
    assert.strictEqual(e.level, 'error');
    assert.strictEqual(e.attempts, 2);
  }
  // El 502 libera el cupo del rate limit: el reintento del usuario no se topa con un 429
});

test('spam del motor en shadow: si n8n falla también recibe 502 (en shadow sí debía llegar)', async function () {
  respuestasN8n = [500, 500];
  const r = await enviar(cuerpoValido({ empresa: '12345' }));
  assert.strictEqual(r.status, 502);
});

// --- Destino sin valores de respaldo (tras la rotación del webhook) ---

test('el header x-form-secret lleva exactamente FORM_SHARED_SECRET', async function () {
  await enviar(cuerpoValido());
  assert.strictEqual(cabecerasN8n[0]['x-form-secret'], 'secreto-compartido-de-prueba');
});

test('sin N8N_WEBHOOK_URL / FORM_SHARED_SECRET (o URL no https): 503 con contacto, log de error y NUNCA éxito', async function () {
  const escenarios = [
    ['N8N_WEBHOOK_URL', undefined, ['N8N_WEBHOOK_URL']],
    ['FORM_SHARED_SECRET', undefined, ['FORM_SHARED_SECRET']],
    ['N8N_WEBHOOK_URL', 'http://n8n.test.invalid/webhook/lead', ['N8N_WEBHOOK_URL']],
    ['FORM_SHARED_SECRET', '   ', ['FORM_SHARED_SECRET']]
  ];
  for (const [variable, valor, faltan] of escenarios) {
    const previo = process.env[variable];
    if (valor === undefined) delete process.env[variable]; else process.env[variable] = valor;
    try {
      reenvios = [];
      const r = await enviar(cuerpoValido());
      assert.strictEqual(r.status, 503, variable);
      assert.deepStrictEqual([r.data.success, r.data.code], [false, 'destination_error']);
      assert.match(r.data.message, /contacto@riselanding\.com/);
      assert.strictEqual(reenvios.length, 0, 'no se intenta ningún reenvío');
      const e = ultimoLog('destination_misconfigured', errores);
      assert.deepStrictEqual([e.level, e.missing], ['error', faltan]);
    } finally {
      process.env[variable] = previo;
    }
  }
});

test('sin destino configurado, lo que nunca se reenvía sigue respondiendo igual (no depende del destino)', async function () {
  delete process.env.N8N_WEBHOOK_URL;
  assert.deepStrictEqual((await enviar(cuerpoValido({ website_url_2: 'x' }))).data, { success: true });
  assert.strictEqual((await enviar(cuerpoValido({ solicitante: 'empleo' }))).data.outcome, 'no_comercial');
  process.env.LEAD_GATE_MODE = 'enforce';
  assert.strictEqual((await enviar(cuerpoValido({ empresa: '12345' }))).status, 200);
  assert.strictEqual(reenvios.length, 0);
});

// --- Fase 6: atribución en el log del servidor, nunca en el payload de n8n ---

function cookieAttr(obj) { return 'rl_lid=x; rl_attr=' + encodeURIComponent(JSON.stringify(obj)) + '; otra=1'; }

test('Fase 6: lead_evaluated y lead_not_forwarded llevan la atribución filtrada; n8n no la recibe', async function () {
  const attr = {
    gclid: 'gclid-sintetico', fbclid: 'x'.repeat(500), basura: 'no-debe-pasar',
    ft: { source: 'google', medium: 'cpc', campaign: 'marca', utm_id: '123', referrer: 'https://www.google.com/search?q=ana%40example.mx', landing_page: '/', extra: 'fuera' },
    lt: { source: 'meta', medium: 'paid_social', referrer: 'javascript:alert(1)' },
    tc: 3
  };
  await enviar(cuerpoValido(), { cookie: cookieAttr(attr) });
  const l = ultimoLog('lead_evaluated');
  assert.deepStrictEqual(l.attribution, {
    gclid: 'gclid-sintetico', fbclid: 'x'.repeat(200),
    first_touch: { source: 'google', medium: 'cpc', campaign: 'marca', utm_id: '123', referrer: 'https://www.google.com', landing_page: '/' },
    last_touch: { source: 'meta', medium: 'paid_social' },
    touch_count: 3
  });
  assert.deepStrictEqual(Object.keys(reenvios[0]).sort(), LLAVES_CONTRATO);
  assert.ok(JSON.stringify(reenvios[0]).indexOf('gclid-sintetico') === -1, 'la atribución no viaja a n8n');
  assert.ok(logs.join('\n').indexOf('ana%40example') === -1 && logs.join('\n').indexOf('ana@example') === -1);

  await enviar(cuerpoValido({ solicitante: 'personal' }), { cookie: cookieAttr(attr) });
  assert.strictEqual(ultimoLog('lead_not_forwarded').attribution.gclid, 'gclid-sintetico');
});

test('Fase 6: sin cookie o con cookie corrupta, attribution = {} y el envío sigue', async function () {
  let r = await enviar(cuerpoValido());
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(ultimoLog('lead_evaluated').attribution, {});
  r = await enviar(cuerpoValido(), { cookie: 'rl_attr=%7Bnope' });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(ultimoLog('lead_evaluated').attribution, {});
});
