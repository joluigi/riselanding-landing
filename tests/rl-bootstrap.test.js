// Extrae el <script id="rl-bootstrap"> de index.html y lo ejecuta en un
// sandbox de node:vm con document/location/sessionStorage falsos.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/<script id="rl-bootstrap">([\s\S]*?)<\/script>/);

function run(opts) {
  opts = opts || {};
  const jar = Object.assign({}, opts.cookies); // name → valor YA codificado
  const attrs = {}; // name → string COMPLETO del `document.cookie = ...` (con Max-Age/Path/SameSite/Secure)
  const stored = Object.assign({}, opts.sessionStorage);
  const sandbox = {
    document: {
      get cookie() {
        return Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; ');
      },
      set cookie(str) {
        const pair = str.split(';')[0];
        const i = pair.indexOf('=');
        const name = pair.slice(0, i).trim();
        jar[name] = pair.slice(i + 1).trim();
        attrs[name] = str;
      },
      referrer: opts.referrer || ''
    },
    location: { search: opts.search || '', pathname: '/', hostname: ('hostname' in opts) ? opts.hostname : 'riselanding.com' },
    sessionStorage: opts.blockStorage ? {
      getItem: function () { throw new Error('storage blocked'); },
      setItem: function () { throw new Error('storage blocked'); }
    } : {
      getItem: function (k) { return (k in stored) ? stored[k] : null; },
      setItem: function (k, v) { stored[k] = String(v); }
    },
    crypto: require('node:crypto').webcrypto,
    URLSearchParams, URL, Date, Math, JSON, RegExp, Array, Object, Uint8Array,
    encodeURIComponent, decodeURIComponent
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(match[1], sandbox);
  return { dl: sandbox.dataLayer, jar, rl: sandbox.__rl, stored, attrs };
}

function ctxEvent(dl) {
  return dl.find(function (e) { return e && e.event === 'rl_context_ready'; });
}
function consentArgs(dl) {
  // gtag() empuja objetos `arguments`: [ 'consent', 'default', {...} ]
  const entry = dl.find(function (e) { return e && e[0] === 'consent' && e[1] === 'default'; });
  return entry ? entry[2] : null;
}
function seed(obj) { return encodeURIComponent(JSON.stringify(obj)); }

test('script rl-bootstrap existe en index.html antes del snippet GTM', function () {
  assert.ok(match, 'falta <script id="rl-bootstrap"> en index.html');
  assert.ok(html.indexOf('id="rl-bootstrap"') < html.indexOf('googletagmanager.com/gtm.js'),
    'el bootstrap debe ir ANTES del snippet GTM');
});

test('primera visita directa: contexto completo, sesión 1, touch directo', function () {
  const r = run();
  const ctx = ctxEvent(r.dl);
  assert.ok(ctx, 'no se empujó rl_context_ready');
  assert.strictEqual(ctx.rl_schema_version, '2.1.0');
  assert.match(ctx.user.lead_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.strictEqual(ctx.user.session_count, 1);
  assert.strictEqual(ctx.user.is_returning, false);
  assert.strictEqual(ctx.user.is_internal, false);
  assert.strictEqual(ctx.page.type, 'landing');
  assert.strictEqual(ctx.page.target_segment, 'general_b2b_mx');
  assert.strictEqual(ctx.site.environment, 'production');
  assert.strictEqual(ctx.traffic.touch_count, 1);
  assert.strictEqual(ctx.traffic.first_touch.source, '(direct)');
  assert.ok(r.jar.rl_lid, 'no se escribió la cookie rl_lid');
  assert.ok(r.rl && r.rl.leadId === ctx.user.lead_id, 'window.__rl.leadId debe coincidir');
});

test('gclid se captura en traffic y en la cookie rl_attr', function () {
  const r = run({ search: '?gclid=test123' });
  const ctx = ctxEvent(r.dl);
  assert.strictEqual(ctx.traffic.gclid, 'test123');
  assert.strictEqual(ctx.traffic.last_touch.source, 'google');
  assert.strictEqual(ctx.traffic.last_touch.medium, 'cpc');
  assert.ok(decodeURIComponent(r.jar.rl_attr).indexOf('test123') !== -1);
});

test('segunda sesión: first_touch intacto, last_touch nuevo, contadores suben', function () {
  const first = { source: 'google', medium: 'cpc', campaign: 'rl-lead-x', content: null, term: null, timestamp: '2026-08-01T00:00:00.000Z', landing_page: '/' };
  const r = run({
    cookies: {
      rl_lid: seed({ id: '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30', fs: '2026-08-01T00:00:00.000Z', sc: 1 }),
      rl_attr: seed({ ft: first, lt: first, tc: 1, gclid: 'test123' })
    },
    search: '?utm_source=meta&utm_medium=paid_social'
  });
  const ctx = ctxEvent(r.dl);
  assert.strictEqual(ctx.user.lead_id, '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30');
  assert.strictEqual(ctx.user.session_count, 2);
  assert.strictEqual(ctx.user.is_returning, true);
  assert.deepStrictEqual(ctx.traffic.first_touch, first, 'first_touch NUNCA se sobrescribe');
  assert.strictEqual(ctx.traffic.last_touch.source, 'meta');
  assert.strictEqual(ctx.traffic.touch_count, 2);
  assert.ok(ctx.traffic.days_since_first_touch >= 0);
});

test('recarga en la misma sesión: contadores NO suben', function () {
  const r1 = run();
  const r2 = run({ cookies: r1.jar, sessionStorage: r1.stored });
  const ctx = ctxEvent(r2.dl);
  assert.strictEqual(ctx.user.session_count, 1);
  assert.strictEqual(ctx.traffic.touch_count, 1);
});

test('?rl_internal=1 marca is_internal y persiste vía cookie', function () {
  const r1 = run({ search: '?rl_internal=1' });
  assert.strictEqual(ctxEvent(r1.dl).user.is_internal, true);
  const r2 = run({ cookies: r1.jar });
  assert.strictEqual(ctxEvent(r2.dl).user.is_internal, true);
});

test('consent: DE → denied, MX → granted, sin cookie → granted', function () {
  const de = run({ cookies: { rl_geo: 'DE' } });
  assert.strictEqual(consentArgs(de.dl).ad_storage, 'denied');
  assert.strictEqual(ctxEvent(de.dl).user.consent_state, 'denied');
  const mx = run({ cookies: { rl_geo: 'MX' } });
  assert.strictEqual(consentArgs(mx.dl).ad_storage, 'granted');
  const sin = run();
  assert.strictEqual(consentArgs(sin.dl).analytics_storage, 'granted');
});

test('el consent default se empuja ANTES de rl_context_ready', function () {
  const r = run();
  const iConsent = r.dl.findIndex(function (e) { return e && e[0] === 'consent'; });
  const iCtx = r.dl.findIndex(function (e) { return e && e.event === 'rl_context_ready'; });
  assert.ok(iConsent !== -1 && iConsent < iCtx);
});

test('cookies rl_lid/rl_attr/rl_internal llevan los atributos correctos (Max-Age, Path, SameSite, Secure)', function () {
  const r = run({ search: '?rl_internal=1' });
  assert.ok(r.attrs.rl_lid.indexOf('Max-Age=34560000') !== -1, 'rl_lid debe tener Max-Age=34560000 (D400)');
  assert.ok(r.attrs.rl_lid.indexOf('Path=/') !== -1, 'rl_lid debe tener Path=/');
  assert.ok(r.attrs.rl_lid.indexOf('SameSite=Lax') !== -1, 'rl_lid debe tener SameSite=Lax');
  assert.ok(r.attrs.rl_lid.indexOf('Secure') !== -1, 'rl_lid debe tener Secure');
  assert.ok(r.attrs.rl_attr.indexOf('Max-Age=7776000') !== -1, 'rl_attr debe tener Max-Age=7776000 (D90)');
  assert.ok(r.attrs.rl_internal.indexOf('Max-Age=34560000') !== -1, 'rl_internal debe tener Max-Age=34560000 (D400)');
});

test('sessionStorage bloqueado: rl_context_ready igual se dispara, session_count y touch_count en 1', function () {
  const r = run({ blockStorage: true });
  const ctx = ctxEvent(r.dl);
  assert.ok(ctx, 'no se empujó rl_context_ready aun con sessionStorage bloqueado');
  assert.strictEqual(ctx.user.session_count, 1);
  assert.strictEqual(ctx.traffic.touch_count, 1);
});

test('site.environment: production solo en el dominio real (guarda G5)', function () {
  function env(host) { return ctxEvent(run({ hostname: host }).dl).site.environment; }
  assert.strictEqual(env('riselanding.com'), 'production');
  assert.strictEqual(env('www.riselanding.com'), 'production');
  assert.strictEqual(env('riselanding-landing-git-feat-rl-tracking-joluigis-projects.vercel.app'), 'staging');
  assert.strictEqual(env('riselanding.com.evil.test'), 'staging');
  assert.strictEqual(env('localhost'), 'development');
  assert.strictEqual(env('127.0.0.1'), 'development');
  assert.strictEqual(env(''), 'development');
});
