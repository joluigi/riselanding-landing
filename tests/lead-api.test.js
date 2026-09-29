'use strict';
// Pruebas de las barreras anti-bot de /api/lead y /api/form-token (Fase 1).
// El destino (n8n) y Cloudflare se simulan con un fetch falso. Datos 100 % sintéticos.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const lead = require('../api/lead.js');
const formTokenHandler = require('../api/form-token.js');
const formToken = require('../api/_lib/form-token.js');
const turnstile = require('../api/_lib/turnstile.js');

const URL_N8N = 'https://n8n.test.invalid/webhook/lead';
const URL_CF = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const LLAVES_CONTRATO = ['nombre', 'empresa', 'email', 'telefono', 'mensaje', 'interes_pilar',
  'fuente', 'spam_score', 'spam_flags', 'ip', 'user_agent'].sort();

let reenvios, llamadasCf, respuestaCf, logs, warns, fetchOriginal, ipSeq = 0;
const logOriginal = console.log, warnOriginal = console.warn, errorOriginal = console.error;

beforeEach(function () {
  process.env.FORM_TOKEN_SECRET = 'secreto-de-prueba';
  process.env.N8N_WEBHOOK_URL = URL_N8N;
  process.env.FORM_SHARED_SECRET = 'secreto-compartido-de-prueba';
  delete process.env.TURNSTILE_SITE_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  reenvios = []; llamadasCf = 0; logs = []; warns = [];
  respuestaCf = function () { return { ok: true, status: 200, json: async function () { return { success: true }; } }; };
  fetchOriginal = global.fetch;
  global.fetch = async function (url, opts) {
    if (url === URL_CF) { llamadasCf++; return respuestaCf(opts); }
    if (url === URL_N8N) { reenvios.push(JSON.parse(opts.body)); return { ok: true, status: 200 }; }
    throw new Error('URL inesperada en la prueba: ' + url);
  };
  console.log = function () { logs.push(Array.prototype.join.call(arguments, ' ')); };
  console.warn = function () { warns.push(Array.prototype.join.call(arguments, ' ')); };
  console.error = function () {};
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
    headers: { 'x-form-token': 'rl1', 'x-forwarded-for': o.ip || ('203.0.113.' + (++ipSeq % 250)), 'user-agent': 'node-test' },
    body: body
  }, res);
  return { status: res.statusCode, data: JSON.parse(res.cuerpo), headers: res.headers };
}

function tokenDeHace(ms) { return formToken.emitir(Date.now() - ms); }

function cuerpoValido(extra) {
  return Object.assign({
    nombre: 'Ana Prueba',
    empresa: 'Empresa Sintética Uno',
    email: 'ana.prueba@example.mx',
    telefono: '+52 55 0000 0000',
    mensaje: 'Servicios: Implementación de CRM · Tamaño: 11–50 personas',
    interes_pilar: 'CRM + Automatización',
    fuente: 'Sitio Web',
    website_url_2: '',
    form_token: tokenDeHace(20000)
  }, extra || {});
}

function ultimoLog(evento) {
  for (let i = logs.length - 1; i >= 0; i--) {
    try { const l = JSON.parse(logs[i]); if (l.evento === evento) return l; } catch (e) { /* línea no JSON */ }
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
  assert.deepStrictEqual(r.data, { success: true });
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

test('Cloudflare con 5xx, error de red o error de configuración → fail-open con turnstile_unavailable', async function () {
  activarTurnstile();
  const escenarios = [
    function () { return { ok: false, status: 503, json: async function () { return {}; } }; },
    function () { throw new Error('ECONNRESET'); },
    function () { return { ok: true, status: 200, json: async function () { return { success: false, 'error-codes': ['invalid-input-secret'] }; } }; }
  ];
  for (let i = 0; i < escenarios.length; i++) {
    respuestaCf = escenarios[i];
    const r = await enviar(cuerpoValido({ turnstile_token: 'tok' }));
    assert.strictEqual(r.status, 200);
    assert.strictEqual(reenvios.length, i + 1, 'escenario ' + i + ' debió reenviarse');
    assert.ok(reenvios[i].spam_flags.indexOf('turnstile_unavailable') !== -1);
    assert.ok(ultimoLog('turnstile_unavailable'));
  }
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
  assert.strictEqual(reenvios.length, 5);
});
