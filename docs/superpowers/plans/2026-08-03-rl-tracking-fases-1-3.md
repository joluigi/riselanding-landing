# Tracking rl_* Fases 1–3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar los eventos `rl_*` al dataLayer de riselanding.com (Capa 1 de la guía de tracking v2.1) para que el contenedor GTM-P3WZC7MV dispare cada tag en el momento correcto.

**Architecture:** Bootstrap inline en `<head>` antes del snippet GTM (cookies de identidad/atribución, Consent Mode v2, `rl_context_ready`) + `js/rl-tracking.js` con `defer` (núcleo puro testeable `window.RL` + listeners de engagement y conversión) + `middleware.js` de Vercel que entrega el país en la cookie `rl_geo`. El submit handler existente del formulario se extiende; `api/lead.js` no se toca.

**Tech Stack:** HTML/JS vanilla estilo ES5 (sin build step), Vercel Routing Middleware (`@vercel/functions`), tests con `node:test` + `node:vm` (cero dependencias de test). Node ≥20.

**Spec:** `docs/superpowers/specs/2026-08-03-rl-tracking-fases-1-3-design.md` — leerlo antes de empezar.

## Global Constraints

- JS estilo del sitio: `var`/`function`, IIFEs, sin transpilación. `node --check` debe pasar en todo archivo `.js` nuevo.
- El contrato con `/api/lead` NO cambia: claves `nombre/empresa/email/telefono/mensaje/interes_pilar/fuente/website/ts/sig`, header `X-Form-Token: rl1`, honeypot `b_comments`→`website`.
- Cookies exactas: `rl_lid` (400 días = Max-Age 34560000), `rl_attr` (90 días = 7776000), `rl_internal` (34560000), `rl_geo` (cookie de sesión, sin Max-Age). Todas `Path=/; SameSite=Lax; Secure`.
- Antes de CADA push de evento: `dataLayer.push({ rl_event_data: null })` (C-13). Cada evento lleva `event_id` UUIDv4 único (C-15). Cada evento dispara 1× por carga (scroll: 1× por umbral).
- PII jamás en texto plano en el dataLayer: solo SHA-256 de valores normalizados (C-14).
- Taxonomía exacta: `page.type 'landing'` · `service_line 'paquete_integral'` · `vertical_fit 'horizontal'` · `target_segment 'general_b2b_mx'` · `template 'lp_home_v1'` · `form_id 'agenda_diagnostico'` · `form_location 'contacto'` · `assigned_partner 'ambos'` · `rl_schema_version '2.1.0'`.
- lead_score: base 15 · corporativo +25 / gratuito +5 / desechable −30 · empresa +15 · tamaño 51_200|200_plus +15, 11_50 +10, 1_10 +5 · teléfono MX válido +10 · ≥1 servicio +5 · clamp [0,100] · A ≥70, B 40–69, C <40 · honeypot → score 0/tier C/flag spam.
- Commits en español con el estilo del repo (`feat(...):`, `test(...):`, `chore(...):`).
- Correr los tests con `npm test` (= `node --test tests/`).

---

### Task 1: Middleware geo + package.json

**Files:**
- Create: `package.json`, `middleware.js`, `.gitignore`

**Interfaces:**
- Produces: cookie de sesión `rl_geo=<ISO-3166 alpha-2>` en la respuesta de rutas de documento (la lee el bootstrap de Task 2 vía `document.cookie`).

- [ ] **Step 1: Crear `.gitignore` y `package.json`, instalar dependencia**

`.gitignore`:

```
node_modules/
.vercel
.DS_Store
```

`package.json` (sin `"type"`: `api/lead.js` es CommonJS y debe seguir siéndolo):

```json
{
  "name": "riselanding-page",
  "private": true,
  "scripts": {
    "test": "node --test tests/"
  }
}
```

Run: `npm install @vercel/functions`
Expected: agrega `dependencies` a package.json y crea package-lock.json sin errores.

- [ ] **Step 2: Crear `middleware.js`**

```js
// middleware.js — Vercel Routing Middleware (solo rutas de documento).
// Copia el país del visitante a la cookie de sesión rl_geo; el bootstrap
// inline de index.html la lee para decidir el default de Consent Mode v2.
// Sin país (p. ej. `vercel dev` local) no escribe cookie: el bootstrap
// asume 'granted' (default MX/LATAM de la guía, caveat C-25).
import { next, geolocation } from '@vercel/functions';

export default function middleware(request) {
  const { country } = geolocation(request);
  if (!country) return next();
  return next({
    headers: {
      'Set-Cookie': 'rl_geo=' + country + '; Path=/; SameSite=Lax; Secure'
    }
  });
}

export const config = {
  // Solo documentos: excluye /api, assets y cualquier ruta con extensión de archivo.
  matcher: ['/((?!api/|Assets/|js/|.*\\.[a-zA-Z0-9]+$).*)']
};
```

- [ ] **Step 3: Verificar sintaxis y comportamiento local**

Run: `npx vercel dev --listen 3000` (en background) y luego:

```bash
curl -sI http://localhost:3000/ | grep -i 'set-cookie\|HTTP/'
```

Expected: `HTTP/1.1 200` y **sin** `Set-Cookie: rl_geo` (local no tiene header geo — es el camino "sin país"). La página debe seguir sirviéndose normal (`curl -s http://localhost:3000/ | head -5` muestra el doctype).

Nota: el camino positivo (cookie presente) solo es verificable en un deploy de Vercel; queda cubierto en Task 6.

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json package-lock.json middleware.js
git commit -m "feat(tracking): middleware geo que entrega rl_geo para Consent Mode v2"
```

---

### Task 2: Bootstrap inline en `<head>` (Fase 1)

**Files:**
- Modify: `index.html` (insertar `<script id="rl-bootstrap">` ANTES del snippet GTM, que hoy empieza en la línea 5 con `<!-- Google Tag Manager -->`)
- Test: `tests/rl-bootstrap.test.js`

**Interfaces:**
- Consumes: cookie `rl_geo` (Task 1).
- Produces: cookies `rl_lid`/`rl_attr`/`rl_internal`; push de `rl_context_ready`; y `window.__rl = { leadId: string, sessionId: string, sessionCount: number, isInternal: boolean, touchCount: number, daysSinceFirstTouch: number, consentState: 'granted'|'denied' }` — lo consumen Tasks 3–5.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/rl-bootstrap.test.js`:

```js
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
  const stored = Object.assign({}, opts.sessionStorage);
  const sandbox = {
    document: {
      get cookie() {
        return Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; ');
      },
      set cookie(str) {
        const pair = str.split(';')[0];
        const i = pair.indexOf('=');
        jar[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
      },
      referrer: opts.referrer || ''
    },
    location: { search: opts.search || '', pathname: '/', hostname: 'riselanding.com' },
    sessionStorage: {
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
  return { dl: sandbox.dataLayer, jar, rl: sandbox.__rl, stored };
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
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test`
Expected: FAIL — `falta <script id="rl-bootstrap"> en index.html` (y el resto por `match` null).

- [ ] **Step 3: Insertar el bootstrap en `index.html`**

En `index.html`, entre `<head>` (línea 4) y `<!-- Google Tag Manager -->` (línea 5), insertar:

```html
  <!-- RL Bootstrap: identidad, atribución y Consent Mode v2. DEBE ir antes de GTM.
       Contrato: Guía de Tracking v2.1 §2.2 · spec docs/superpowers/specs/2026-08-03 -->
  <script id="rl-bootstrap">
(function () {
  var now = new Date();

  function uuid() {
    if (window.crypto && crypto.getRandomValues) {
      var b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
      var h = '';
      for (var i = 0; i < 16; i++) h += ('0' + b[i].toString(16)).slice(-2);
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function setCookie(name, value, maxAge) {
    document.cookie = name + '=' + encodeURIComponent(value) + '; Path=/; Max-Age=' + maxAge + '; SameSite=Lax; Secure';
  }
  function getJSON(name) { try { return JSON.parse(getCookie(name) || 'null'); } catch (e) { return null; } }

  var D400 = 34560000, D90 = 7776000;
  var qs = new URLSearchParams(location.search);

  // --- rl_internal (guarda G1): ?rl_internal=1 marca la cookie para siempre ---
  if (qs.get('rl_internal') === '1') setCookie('rl_internal', '1', D400);
  var isInternal = getCookie('rl_internal') === '1';

  // --- rl_lid: lead_id persistente + sesión ---
  var lid = getJSON('rl_lid');
  if (!lid || !lid.id) lid = { id: uuid(), fs: now.toISOString(), sc: 0 };
  var sid = '', newSession = false;
  try {
    sid = sessionStorage.getItem('rl_sid') || '';
    if (!sid) {
      newSession = true;
      sid = Math.floor(now.getTime() / 1000) + '.' + uuid().slice(0, 5);
      sessionStorage.setItem('rl_sid', sid);
    }
  } catch (e) { sid = Math.floor(now.getTime() / 1000) + '.noses'; }
  if (newSession) lid.sc = (lid.sc || 0) + 1;
  setCookie('rl_lid', JSON.stringify(lid), D400);

  // --- rl_attr: click IDs + first/last touch. first_touch JAMÁS se sobrescribe ---
  var attr = getJSON('rl_attr') || {};
  var ids = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid'];
  var hasClickId = false;
  for (var i = 0; i < ids.length; i++) {
    var v = qs.get(ids[i]);
    if (v) { attr[ids[i]] = v; hasClickId = true; }
  }
  var ref = document.referrer || '';
  var refExterno = !!ref && ref.indexOf(location.hostname) === -1;
  var identificable = !!(qs.get('utm_source') || qs.get('utm_medium') || hasClickId || refExterno);
  function touchActual() {
    var src = qs.get('utm_source'), med = qs.get('utm_medium');
    if (!src) {
      if (qs.get('gclid') || qs.get('gbraid') || qs.get('wbraid')) { src = 'google'; med = med || 'cpc'; }
      else if (qs.get('fbclid')) { src = 'meta'; med = med || 'paid_social'; }
      else if (qs.get('msclkid')) { src = 'bing'; med = med || 'cpc'; }
      else if (refExterno) {
        try { src = new URL(ref).hostname; } catch (e) { src = 'referral'; }
        med = med || 'referral';
      }
    }
    return {
      source: src || '(direct)', medium: med || '(none)',
      campaign: qs.get('utm_campaign') || null, content: qs.get('utm_content') || null,
      term: qs.get('utm_term') || null, timestamp: now.toISOString(), landing_page: location.pathname
    };
  }
  if (newSession) {
    attr.tc = (attr.tc || 0) + 1;
    if (identificable || !attr.lt) attr.lt = touchActual();
    if (!attr.ft) attr.ft = attr.lt;
  }
  setCookie('rl_attr', JSON.stringify(attr), D90);
  var nm = { referrer: ref || null };
  if (qs.get('rl_net')) nm.network = qs.get('rl_net');
  if (qs.get('rl_mt')) nm.match_type = qs.get('rl_mt');
  if (qs.get('rl_dev')) nm.device = qs.get('rl_dev');

  // --- Consent Mode v2 (C-25): denied solo EEA/UK vía cookie rl_geo del middleware ---
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  var EEA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB'];
  var consentState = EEA.indexOf(getCookie('rl_geo').toUpperCase()) !== -1 ? 'denied' : 'granted';
  gtag('consent', 'default', {
    ad_storage: consentState, ad_user_data: consentState,
    ad_personalization: consentState, analytics_storage: consentState
  });
  gtag('set', 'url_passthrough', true);
  if (consentState === 'denied') gtag('set', 'ads_data_redaction', true);

  // --- rl_context_ready (§2.2) ---
  var days = Math.max(0, Math.floor((now.getTime() - Date.parse(lid.fs)) / 86400000)) || 0;
  window.dataLayer.push({
    event: 'rl_context_ready',
    rl_schema_version: '2.1.0',
    site: { environment: 'production', domains: ['riselanding.com', 'www.riselanding.com'], currency: 'MXN' },
    page: {
      type: 'landing', service_line: 'paquete_integral', vertical_fit: 'horizontal',
      target_segment: 'general_b2b_mx', language: 'es-MX', template: 'lp_home_v1',
      path: location.pathname, publish_date: '2026-07-06', is_landing_page: true,
      experiment_id: null, variant_id: null
    },
    user: {
      lead_id: lid.id, session_id: sid, user_type: 'anonymous', consent_state: consentState,
      is_internal: isInternal, is_returning: lid.sc > 1, session_count: lid.sc
    },
    traffic: {
      gclid: attr.gclid || null, gbraid: attr.gbraid || null, wbraid: attr.wbraid || null,
      fbclid: attr.fbclid || null, msclkid: attr.msclkid || null,
      first_touch: attr.ft || null, last_touch: attr.lt || null, network_meta: nm,
      touch_count: attr.tc || 0, days_since_first_touch: days
    }
  });

  // Handoff para js/rl-tracking.js
  window.__rl = {
    leadId: lid.id, sessionId: sid, sessionCount: lid.sc, isInternal: isInternal,
    touchCount: attr.tc || 0, daysSinceFirstTouch: days, consentState: consentState
  };
})();
  </script>
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test`
Expected: PASS los 8 tests de `tests/rl-bootstrap.test.js`.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/rl-bootstrap.test.js
git commit -m "feat(tracking): bootstrap rl_context_ready + cookies de atribución + Consent Mode v2"
```

---

### Task 3: Núcleo puro `window.RL` (scoring, normalización, push)

**Files:**
- Create: `js/rl-tracking.js` (solo el núcleo; los listeners DOM llegan en Task 4)
- Test: `tests/rl-core.test.js`

**Interfaces:**
- Consumes: `window.__rl` (Task 2) y `window.dataLayer`.
- Produces (usado por Tasks 4–5 y por el submit handler):
  - `RL.uuid() → string`
  - `RL.pushEvent(name: string, data: object) → object` (resetea `rl_event_data`, agrega `event_id` si falta, empuja `{event, rl_event_data}`; devuelve el payload)
  - `RL.emailDomainType(email) → 'corporate'|'free'|'disposable'`
  - `RL.phoneE164MX(raw) → '+52##########' | null`
  - `RL.leadScore({emailType, hasCompany, sizeBucket, phoneValid, servicesCount, honeypotFilled}) → {score: number, tier: 'A'|'B'|'C', flag: 'clean'|'suspect'|'spam'}`
  - `RL.serviceLineFromPilar(pilar) → string`
  - `RL.prefilledRef(leadId) → 'RL-' + 8 chars`
  - `RL.sha256hex(str) → Promise<string|null>`
  - En Node (`node --test`): `module.exports = RL`.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/rl-core.test.js`:

```js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const RL = require('../js/rl-tracking.js');

test('uuid: formato UUIDv4', function () {
  assert.match(RL.uuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notStrictEqual(RL.uuid(), RL.uuid());
});

test('emailDomainType: corporate / free / disposable (incluye subdominios)', function () {
  assert.strictEqual(RL.emailDomainType('maria@empresa.mx'), 'corporate');
  assert.strictEqual(RL.emailDomainType('MARIA@GMAIL.COM'), 'free');
  assert.strictEqual(RL.emailDomainType('x@yahoo.com.mx'), 'free');
  assert.strictEqual(RL.emailDomainType('x@mailinator.com'), 'disposable');
  assert.strictEqual(RL.emailDomainType('x@sub.mailinator.com'), 'disposable');
  assert.strictEqual(RL.emailDomainType(''), 'free');
});

test('phoneE164MX: normaliza a +52 y rechaza longitudes inválidas', function () {
  assert.strictEqual(RL.phoneE164MX('55 5878 8983'), '+525558788983');
  assert.strictEqual(RL.phoneE164MX('+52 55 5878 8983'), '+525558788983');
  assert.strictEqual(RL.phoneE164MX('+52 1 55 5878 8983'), '+525558788983');
  assert.strictEqual(RL.phoneE164MX('5558788'), null);
  assert.strictEqual(RL.phoneE164MX(''), null);
});

test('leadScore: casos de referencia del spec (base 15)', function () {
  // gmail sin empresa, tel válido, 1 servicio → 35 C clean (caso QA de la guía)
  assert.deepStrictEqual(
    RL.leadScore({ emailType: 'free', hasCompany: false, sizeBucket: null, phoneValid: true, servicesCount: 1, honeypotFilled: false }),
    { score: 35, tier: 'C', flag: 'clean' });
  // corporativo + empresa sin tamaño → 70 A
  assert.deepStrictEqual(
    RL.leadScore({ emailType: 'corporate', hasCompany: true, sizeBucket: null, phoneValid: true, servicesCount: 1, honeypotFilled: false }),
    { score: 70, tier: 'A', flag: 'clean' });
  // corporativo + empresa + 51_200 → 85 A
  assert.strictEqual(
    RL.leadScore({ emailType: 'corporate', hasCompany: true, sizeBucket: '51_200', phoneValid: true, servicesCount: 1, honeypotFilled: false }).score, 85);
  // gmail + empresa + 1_10 → 55 B
  assert.deepStrictEqual(
    RL.leadScore({ emailType: 'free', hasCompany: true, sizeBucket: '1_10', phoneValid: true, servicesCount: 1, honeypotFilled: false }),
    { score: 55, tier: 'B', flag: 'clean' });
  // desechable → suspect y ≤30
  const d = RL.leadScore({ emailType: 'disposable', hasCompany: true, sizeBucket: '200_plus', phoneValid: true, servicesCount: 1, honeypotFilled: false });
  assert.strictEqual(d.tier, 'C');
  assert.strictEqual(d.flag, 'suspect');
  // teléfono inválido → suspect
  assert.strictEqual(
    RL.leadScore({ emailType: 'corporate', hasCompany: true, sizeBucket: null, phoneValid: false, servicesCount: 1, honeypotFilled: false }).flag, 'suspect');
  // honeypot → spam directo
  assert.deepStrictEqual(
    RL.leadScore({ emailType: 'corporate', hasCompany: true, sizeBucket: '51_200', phoneValid: true, servicesCount: 3, honeypotFilled: true }),
    { score: 0, tier: 'C', flag: 'spam' });
});

test('serviceLineFromPilar: mapa completo con fallback', function () {
  assert.strictEqual(RL.serviceLineFromPilar('Bundle Completo'), 'paquete_integral');
  assert.strictEqual(RL.serviceLineFromPilar('Google Ads'), 'publicidad_digital');
  assert.strictEqual(RL.serviceLineFromPilar('Sitio Web + SEO'), 'web_seo');
  assert.strictEqual(RL.serviceLineFromPilar('CRM + Automatización'), 'crm_automatizacion');
  assert.strictEqual(RL.serviceLineFromPilar('lo que sea'), 'paquete_integral');
});

test('prefilledRef: RL- + primeros 8 del lead_id', function () {
  assert.strictEqual(RL.prefilledRef('3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30'), 'RL-3f8a91c2');
});

test('pushEvent: resetea rl_event_data y agrega event_id', function () {
  globalThis.dataLayer = [];
  const payload = RL.pushEvent('rl_scroll_depth', { threshold: 50 });
  assert.strictEqual(globalThis.dataLayer.length, 2);
  assert.deepStrictEqual(globalThis.dataLayer[0], { rl_event_data: null });
  assert.strictEqual(globalThis.dataLayer[1].event, 'rl_scroll_depth');
  assert.strictEqual(globalThis.dataLayer[1].rl_event_data.threshold, 50);
  assert.match(payload.event_id, /^[0-9a-f-]{36}$/);
  delete globalThis.dataLayer;
});

test('sha256hex: hash conocido con Web Crypto de Node', async function () {
  const h = await RL.sha256hex('maria@empresa.mx');
  const esperado = require('node:crypto').createHash('sha256').update('maria@empresa.mx').digest('hex');
  assert.strictEqual(h, esperado);
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/rl-tracking.js'`.

- [ ] **Step 3: Crear `js/rl-tracking.js` (núcleo)**

```js
// js/rl-tracking.js — Capa 1 de tracking rl_* (Guía v2.1, spec 2026-08-03).
// Núcleo puro window.RL + listeners DOM. En Node exporta el núcleo para tests.
(function (global) {
  'use strict';

  var FREE_DOMAINS = [
    'gmail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es',
    'yahoo.com', 'yahoo.com.mx', 'live.com', 'live.com.mx', 'icloud.com',
    'proton.me', 'protonmail.com', 'aol.com', 'msn.com'
  ];
  // Mantener en sincronía con DOMINIOS_DESECHABLES de api/lead.js
  var DISPOSABLE_DOMAINS = [
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org', 'tempmail.com',
    'yopmail.com', 'sharklasers.com', 'trashmail.com', 'getnada.com', 'dispostable.com',
    'maildrop.cc', 'mintemail.com', 'throwawaymail.com', 'fakeinbox.com', 'mohmal.com',
    'emailondeck.com', 'mailnesia.com', 'mytemp.email', 'tempr.email', 'discard.email',
    'mailcatch.com', 'tempmailo.com', 'moakt.com', 'tmpmail.org', 'correotemporal.org',
    'luxusmail.org', 'mailpoof.com', 'tempail.com', 'cuvox.de', 'dayrep.com',
    'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
    'superrito.com', 'teleworm.us', 'armyspy.com'
  ];
  var SERVICE_LINE_MAP = {
    'Bundle Completo': 'paquete_integral',
    'Google Ads': 'publicidad_digital',
    'Sitio Web + SEO': 'web_seo',
    'CRM + Automatización': 'crm_automatizacion'
  };

  function cryptoObj() {
    return global.crypto || (typeof crypto !== 'undefined' ? crypto : null);
  }

  function uuid() {
    var c = cryptoObj();
    if (c && c.getRandomValues) {
      var b = c.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
      var h = '';
      for (var i = 0; i < 16; i++) h += ('0' + b[i].toString(16)).slice(-2);
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
      var r = Math.random() * 16 | 0; return (ch === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }

  function pushEvent(name, data) {
    var dl = global.dataLayer = global.dataLayer || [];
    dl.push({ rl_event_data: null }); // C-13: reset antes de cada evento
    var payload = {};
    for (var k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k];
    }
    if (!payload.event_id) payload.event_id = uuid(); // C-15
    dl.push({ event: name, rl_event_data: payload });
    return payload;
  }

  function emailDomainType(email) {
    var dom = String(email || '').trim().toLowerCase().split('@')[1] || '';
    if (!dom) return 'free';
    for (var i = 0; i < DISPOSABLE_DOMAINS.length; i++) {
      var d = DISPOSABLE_DOMAINS[i];
      if (dom === d || dom.slice(-(d.length + 1)) === '.' + d) return 'disposable';
    }
    return FREE_DOMAINS.indexOf(dom) !== -1 ? 'free' : 'corporate';
  }

  function phoneE164MX(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 13 && d.slice(0, 3) === '521') d = d.slice(3); // formato legado +52 1
    if (d.length === 12 && d.slice(0, 2) === '52') d = d.slice(2);
    return d.length === 10 ? '+52' + d : null;
  }

  function leadScore(input) {
    if (input.honeypotFilled) return { score: 0, tier: 'C', flag: 'spam' };
    var s = 15;
    if (input.emailType === 'corporate') s += 25;
    else if (input.emailType === 'free') s += 5;
    else if (input.emailType === 'disposable') s -= 30;
    if (input.hasCompany) s += 15;
    if (input.sizeBucket === '51_200' || input.sizeBucket === '200_plus') s += 15;
    else if (input.sizeBucket === '11_50') s += 10;
    else if (input.sizeBucket === '1_10') s += 5;
    if (input.phoneValid) s += 10;
    if (input.servicesCount > 0) s += 5;
    s = Math.max(0, Math.min(100, s));
    return {
      score: s,
      tier: s >= 70 ? 'A' : (s >= 40 ? 'B' : 'C'),
      flag: (input.emailType === 'disposable' || !input.phoneValid) ? 'suspect' : 'clean'
    };
  }

  function serviceLineFromPilar(p) { return SERVICE_LINE_MAP[p] || 'paquete_integral'; }

  function prefilledRef(leadId) { return 'RL-' + String(leadId || '').slice(0, 8); }

  function sha256hex(str) {
    var c = cryptoObj();
    if (!(c && c.subtle && typeof TextEncoder !== 'undefined')) return Promise.resolve(null);
    return c.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      var out = '', v = new Uint8Array(buf);
      for (var i = 0; i < v.length; i++) out += ('0' + v[i].toString(16)).slice(-2);
      return out;
    }).catch(function () { return null; });
  }

  var RL = {
    uuid: uuid, pushEvent: pushEvent, emailDomainType: emailDomainType,
    phoneE164MX: phoneE164MX, leadScore: leadScore,
    serviceLineFromPilar: serviceLineFromPilar, prefilledRef: prefilledRef,
    sha256hex: sha256hex
  };

  global.RL = RL;
  if (typeof module !== 'undefined' && module.exports) module.exports = RL;
  if (typeof global.document === 'undefined') return; // Node: solo el núcleo

  // --- Listeners DOM (Task 4 y 5 los agregan aquí) ---
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test` y `node --check js/rl-tracking.js`
Expected: PASS todos los tests de rl-core (y siguen pasando los de bootstrap).

- [ ] **Step 5: Commit**

```bash
git add js/rl-tracking.js tests/rl-core.test.js
git commit -m "feat(tracking): núcleo RL (scoring, normalización, pushEvent con reset y event_id)"
```

---

### Task 4: Listeners de engagement + carga del script

**Files:**
- Modify: `js/rl-tracking.js` (sección de listeners, tras el `return` de Node)
- Modify: `index.html` (agregar `<script src="/js/rl-tracking.js" defer></script>` en el `<head>`, después del snippet de GTM)
- Test: `tests/rl-core.test.js` (agregar tests de los helpers puros `RL._crossedThresholds` y `RL._engagedReady`)

**Interfaces:**
- Consumes: `RL.pushEvent`, `RL.prefilledRef` (Task 3); `window.__rl` (Task 2); secciones `#servicios`, `#resultados`, form `#lead-form` de index.html.
- Produces: eventos `rl_scroll_depth`, `rl_engaged_session`, `rl_service_view`, `rl_case_study_view`, `rl_form_start`, `rl_phone_click`, `rl_whatsapp_click` (dormido). Helpers testeables `RL._crossedThresholds(prevMax, pct) → number[]` y `RL._engagedReady(state) → boolean`.

- [ ] **Step 1: Agregar tests de los helpers puros (fallan)**

Añadir al final de `tests/rl-core.test.js`:

```js
test('_crossedThresholds: devuelve solo los umbrales recién cruzados', function () {
  assert.deepStrictEqual(RL._crossedThresholds(0, 30), [25]);
  assert.deepStrictEqual(RL._crossedThresholds(0, 100), [25, 50, 75, 90]);
  assert.deepStrictEqual(RL._crossedThresholds(30, 60), [50]);
  assert.deepStrictEqual(RL._crossedThresholds(60, 55), []);
  assert.deepStrictEqual(RL._crossedThresholds(90, 100), []);
});

test('_engagedReady: exige 45 s visibles + scroll 50 + 2 interacciones, una sola vez', function () {
  assert.strictEqual(RL._engagedReady({ engagedFired: false, visibleMs: 45000, maxScroll: 50, interactions: 2 }), true);
  assert.strictEqual(RL._engagedReady({ engagedFired: false, visibleMs: 44000, maxScroll: 90, interactions: 5 }), false);
  assert.strictEqual(RL._engagedReady({ engagedFired: false, visibleMs: 60000, maxScroll: 49, interactions: 5 }), false);
  assert.strictEqual(RL._engagedReady({ engagedFired: false, visibleMs: 60000, maxScroll: 90, interactions: 1 }), false);
  assert.strictEqual(RL._engagedReady({ engagedFired: true, visibleMs: 60000, maxScroll: 90, interactions: 5 }), false);
});
```

Run: `npm test` → Expected: FAIL (`RL._crossedThresholds is not a function`).

- [ ] **Step 2: Implementar los listeners en `js/rl-tracking.js`**

Los helpers puros van ANTES del `return` de Node (para que se exporten); el bloque DOM va después. Primero, junto a las demás funciones del núcleo, agregar:

```js
  function crossedThresholds(prevMax, pct) {
    var out = [], ts = [25, 50, 75, 90];
    for (var i = 0; i < ts.length; i++) {
      if (pct >= ts[i] && prevMax < ts[i]) out.push(ts[i]);
    }
    return out;
  }

  function engagedReady(s) {
    return !s.engagedFired && s.visibleMs >= 45000 && s.maxScroll >= 50 && s.interactions >= 2;
  }
```

y en el objeto `RL` añadir las claves `_crossedThresholds: crossedThresholds, _engagedReady: engagedReady`.

Después, reemplazar el comentario `// --- Listeners DOM (Task 4 y 5 los agregan aquí) ---` por:

```js
  // --- Listeners DOM ---
  function initDom() {
    var state = { maxScroll: 0, interactions: 0, engagedFired: false, visibleMs: 0 };

    function scrollPct() {
      var doc = document.documentElement;
      var h = (doc.scrollHeight - doc.clientHeight) || 1;
      var y = window.pageYOffset || doc.scrollTop || 0;
      return Math.min(100, Math.round((y / h) * 100));
    }

    // rl_engaged_session: 45 s visibles + scroll 50% + 2 interacciones (§2.3)
    function maybeEngaged() {
      if (!engagedReady(state)) return;
      state.engagedFired = true;
      clearInterval(engagedTimer);
      pushEvent('rl_engaged_session', {
        engagement_time_sec: Math.round(state.visibleMs / 1000),
        max_scroll_pct: state.maxScroll,
        interaction_count: state.interactions
      });
    }
    var engagedTimer = setInterval(function () {
      if (document.visibilityState === 'visible') state.visibleMs += 5000;
      maybeEngaged();
    }, 5000);
    document.addEventListener('click', function () { state.interactions++; }, { passive: true, capture: true });
    document.addEventListener('keydown', function () { state.interactions++; }, { passive: true, capture: true });

    // rl_scroll_depth (25/50/75/90) + rl_case_study_view (#resultados al 75%)
    var resEl = document.getElementById('resultados');
    var resFired = false;
    function checkCaseStudy() {
      if (resFired || !resEl) return;
      var r = resEl.getBoundingClientRect();
      if (r.height <= 0) return;
      var read = Math.round(((window.innerHeight - r.top) / r.height) * 100);
      if (read >= 75) {
        resFired = true;
        pushEvent('rl_case_study_view', {
          case_id: 'resultados_home', case_segment: 'general_b2b_mx',
          read_depth_pct: Math.min(100, read)
        });
      }
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var pct = scrollPct();
        var cruzados = crossedThresholds(state.maxScroll, pct);
        if (pct > state.maxScroll) state.maxScroll = pct;
        for (var i = 0; i < cruzados.length; i++) {
          pushEvent('rl_scroll_depth', { threshold: cruzados[i] });
        }
        checkCaseStudy();
        maybeEngaged();
      });
    }, { passive: true });

    // rl_service_view: 20 s acumulados con #servicios visible (pausa fuera de viewport/pestaña)
    (function watchServicios() {
      var el = document.getElementById('servicios');
      if (!el || !('IntersectionObserver' in window)) return;
      var visible = false, acc = 0, done = false;
      var io = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) visible = es[i].isIntersecting;
      }, { threshold: 0.4 });
      io.observe(el);
      var t = setInterval(function () {
        if (done) return;
        if (visible && document.visibilityState === 'visible') acc += 1000;
        if (acc >= 20000) {
          done = true; clearInterval(t); io.disconnect();
          pushEvent('rl_service_view', {
            service_line: 'paquete_integral', assigned_partner: 'ambos',
            dwell_time_sec: Math.round(acc / 1000)
          });
        }
      }, 1000);
    })();

    // rl_phone_click + rl_whatsapp_click (dormido hasta que exista un enlace wa.me; C-19)
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) {
        pushEvent('rl_phone_click', { cta_location: a.closest('footer') ? 'footer' : 'body' });
      } else if (href.indexOf('wa.me') !== -1) {
        var ctx = global.__rl || {};
        var ref = prefilledRef(ctx.leadId);
        try {
          var u = new URL(a.href);
          var txt = u.searchParams.get('text') || '';
          u.searchParams.set('text', (txt ? txt + ' ' : '') + '[' + ref + ']');
          a.href = u.toString();
        } catch (err) { /* URL inválida: el clic sigue, solo sin ref */ }
        pushEvent('rl_whatsapp_click', {
          transaction_id: ctx.leadId || null, prefilled_ref: ref,
          cta_location: a.closest('footer') ? 'footer' : 'body',
          service_line: 'paquete_integral'
        });
      }
    }, true);

    // rl_form_start: primer focus en el formulario (1× por instancia)
    var form = document.getElementById('lead-form');
    if (form) {
      var started = false;
      form.addEventListener('focusin', function () {
        if (started) return;
        started = true;
        pushEvent('rl_form_start', { form_id: 'agenda_diagnostico', form_location: 'contacto' });
      });
    }
  }

  try { initDom(); } catch (e) { /* el tracking jamás rompe la página */ }
```

- [ ] **Step 3: Cargar el script en `index.html`**

Después de `<!-- End Google Tag Manager -->` (línea 14), agregar:

```html
  <script src="/js/rl-tracking.js" defer></script>
```

- [ ] **Step 4: Verificar tests + sintaxis + smoke en navegador**

Run: `npm test && node --check js/rl-tracking.js`
Expected: PASS (incluye los 2 tests nuevos).

Smoke manual con `npx vercel dev`: abrir `http://localhost:3000`, en la consola ejecutar `dataLayer.filter(e => e.event && e.event.indexOf('rl_') === 0).map(e => e.event)`. Hacer scroll al fondo, esperar en #servicios 20 s. Expected: `rl_context_ready`, `rl_scroll_depth` ×4, `rl_case_study_view`, `rl_service_view`; cada evento precedido de `{rl_event_data: null}` en el array; clic al teléfono del footer agrega `rl_phone_click`.

- [ ] **Step 5: Commit**

```bash
git add js/rl-tracking.js index.html tests/rl-core.test.js
git commit -m "feat(tracking): eventos de engagement (scroll, engaged, service, case, phone, form_start)"
```

---

### Task 5: Formulario — campo tamaño de empresa + `rl_lead_submit`/`rl_form_error`

**Files:**
- Modify: `js/rl-tracking.js` (agregar `RL.buildLeadSubmit`)
- Modify: `index.html` (select nuevo tras el campo empresa ~línea 1170; submit handler inline ~líneas 1351–1413)
- Test: `tests/rl-lead.test.js`

**Interfaces:**
- Consumes: `RL.leadScore`, `RL.emailDomainType`, `RL.phoneE164MX`, `RL.sha256hex`, `RL.serviceLineFromPilar`, `RL.uuid` (Task 3); `window.__rl` (Task 2); `t0`, `payload` y `servicios` del submit handler existente.
- Produces: `RL.buildLeadSubmit(f) → Promise<object>` donde `f = { email, phoneRaw, hasCompany: boolean, sizeBucket: string|null, servicesCount: number, honeypotFilled: boolean, pilar: string, t0: number }` y el objeto resuelto es el `rl_event_data` completo de `rl_lead_submit` (§2.4 del spec).

- [ ] **Step 1: Escribir los tests que fallan**

Crear `tests/rl-lead.test.js`:

```js
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const nodeCrypto = require('node:crypto');
const RL = require('../js/rl-tracking.js');

function sha(s) { return nodeCrypto.createHash('sha256').update(s).digest('hex'); }

test('buildLeadSubmit: payload completo, hasheado y sin PII en claro', async function () {
  globalThis.__rl = { leadId: '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30', sessionId: '1.a', sessionCount: 1, isInternal: false, touchCount: 2, daysSinceFirstTouch: 2, consentState: 'granted' };
  const p = await RL.buildLeadSubmit({
    email: ' Maria@Empresa.MX ', phoneRaw: '55 5878 8983', hasCompany: true,
    sizeBucket: '51_200', servicesCount: 2, honeypotFilled: false,
    pilar: 'Bundle Completo', t0: Date.now() - 2000
  });
  assert.strictEqual(p.transaction_id, '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30');
  assert.strictEqual(p.lead_id, p.transaction_id);
  assert.strictEqual(p.form_id, 'agenda_diagnostico');
  assert.strictEqual(p.form_location, 'contacto');
  assert.strictEqual(p.lead_source_channel, 'form');
  assert.strictEqual(p.service_line, 'paquete_integral');
  assert.strictEqual(p.assigned_partner, 'ambos');
  assert.strictEqual(p.company_size_bucket, '51_200');
  assert.strictEqual(p.email_domain_type, 'corporate');
  assert.strictEqual(p.lead_quality_flag, 'clean');
  assert.strictEqual(p.lead_score, 85);
  assert.strictEqual(p.lead_tier, 'A');
  assert.strictEqual(p.vertical_fit, 'horizontal');
  // Claves de contrato presentes aunque el form no las capture
  assert.strictEqual(p.prospect_segment, null);
  assert.strictEqual(p.prospect_geo, null);
  assert.strictEqual(p.operation_volume_bucket, null);
  assert.strictEqual(p.current_marketing_maturity, null);
  assert.strictEqual(p.segment_match, null);
  // Hashing normalizado (C-14)
  assert.strictEqual(p.user_data.sha256_email_address, sha('maria@empresa.mx'));
  assert.strictEqual(p.user_data.sha256_phone_number, sha('+525558788983'));
  assert.strictEqual(JSON.stringify(p).indexOf('maria@empresa.mx'), -1, 'email en claro prohibido');
  assert.strictEqual(JSON.stringify(p).indexOf('5558788983'), -1, 'teléfono en claro prohibido');
  assert.ok(p.time_to_convert_sec >= 1 && p.time_to_convert_sec <= 5);
  assert.strictEqual(p.touch_count, 2);
  assert.strictEqual(p.days_since_first_touch, 2);
  assert.match(p.event_id, /^[0-9a-f-]{36}$/);
  delete globalThis.__rl;
});

test('buildLeadSubmit: honeypot → spam, y teléfono inválido no se hashea', async function () {
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', touchCount: 1, daysSinceFirstTouch: 0 };
  const p = await RL.buildLeadSubmit({
    email: 'bot@gmail.com', phoneRaw: '123', hasCompany: false, sizeBucket: null,
    servicesCount: 0, honeypotFilled: true, pilar: 'Google Ads', t0: null
  });
  assert.strictEqual(p.lead_quality_flag, 'spam');
  assert.strictEqual(p.lead_score, 0);
  assert.strictEqual(p.lead_tier, 'C');
  assert.strictEqual(p.service_line, 'publicidad_digital');
  assert.strictEqual(p.time_to_convert_sec, null);
  assert.ok(!p.user_data || !p.user_data.sha256_phone_number, 'teléfono inválido no se hashea');
  delete globalThis.__rl;
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm test`
Expected: FAIL — `RL.buildLeadSubmit is not a function`.

- [ ] **Step 3: Implementar `buildLeadSubmit` en `js/rl-tracking.js`**

Agregar junto al núcleo (antes del objeto `RL`):

```js
  function buildLeadSubmit(f) {
    var ctx = global.__rl || {};
    var emailNorm = String(f.email || '').trim().toLowerCase();
    var e164 = phoneE164MX(f.phoneRaw);
    var emailType = emailDomainType(emailNorm);
    var q = leadScore({
      emailType: emailType, hasCompany: !!f.hasCompany, sizeBucket: f.sizeBucket || null,
      phoneValid: !!e164, servicesCount: f.servicesCount || 0, honeypotFilled: !!f.honeypotFilled
    });
    var payload = {
      event_id: uuid(),
      transaction_id: ctx.leadId || null,
      lead_id: ctx.leadId || null,
      form_id: 'agenda_diagnostico', form_location: 'contacto', lead_source_channel: 'form',
      service_line: serviceLineFromPilar(f.pilar), assigned_partner: 'ambos',
      prospect_segment: null, prospect_geo: null,
      company_size_bucket: f.sizeBucket || null,
      operation_volume_bucket: null, current_marketing_maturity: null,
      email_domain_type: emailType,
      lead_quality_flag: q.flag, lead_score: q.score, lead_tier: q.tier,
      vertical_fit: 'horizontal', segment_match: null,
      time_to_convert_sec: f.t0 ? Math.max(0, Math.round((Date.now() - f.t0) / 1000)) : null,
      touch_count: (typeof ctx.touchCount === 'number') ? ctx.touchCount : null,
      days_since_first_touch: (typeof ctx.daysSinceFirstTouch === 'number') ? ctx.daysSinceFirstTouch : null
    };
    return Promise.all([
      sha256hex(emailNorm),
      e164 ? sha256hex(e164) : Promise.resolve(null)
    ]).then(function (hs) {
      var ud = {};
      if (hs[0]) ud.sha256_email_address = hs[0];
      if (hs[1]) ud.sha256_phone_number = hs[1];
      if (ud.sha256_email_address || ud.sha256_phone_number) payload.user_data = ud;
      return payload;
    });
  }
```

y en el objeto `RL` añadir `buildLeadSubmit: buildLeadSubmit`.

- [ ] **Step 4: Correr y verificar que pasa**

Run: `npm test`
Expected: PASS los 2 tests nuevos.

- [ ] **Step 5: Agregar el select al formulario en `index.html`**

Después del `<div class="field full">` del campo Empresa (línea ~1170), insertar:

```html
        <div class="field full"><label for="f-tamano">Tamaño de tu empresa</label>
          <select id="f-tamano">
            <option value="" selected>Prefiero no decir</option>
            <option value="1_10">1–10 personas</option>
            <option value="11_50">11–50 personas</option>
            <option value="51_200">51–200 personas</option>
            <option value="200_plus">Más de 200 personas</option>
          </select>
        </div>
```

(El CSS existente `.field select` en la línea ~503 ya lo estiliza; no se agrega CSS.)

- [ ] **Step 6: Conectar los eventos en el submit handler inline**

En el segundo `<script>` inline de `index.html` (el del formulario), hacer estos cambios exactos:

a) Tras `if (!form.reportValidity()) return;` — reemplazar esa línea por:

```js
    if (!form.reportValidity()) {
      var inv = form.querySelector(':invalid');
      if (window.RL) RL.pushEvent('rl_form_error', {
        form_id: 'agenda_diagnostico',
        error_field: (inv && (inv.id || inv.name)) || 'unknown',
        error_type: 'validation'
      });
      return;
    }
```

b) Tras la declaración de `var utm = ...` agregar:

```js
    var tamSel = document.getElementById('f-tamano');
    var tamano = tamSel ? tamSel.value : '';
    var tamanoTexto = (tamSel && tamano) ? tamSel.options[tamSel.selectedIndex].text : '';
```

c) En `payload.mensaje`, cambiar la línea:

```js
      mensaje: ('Servicios: ' + (servicios.join(', ') || 'no indicó') + (utm ? ' · ' + utm : '')),
```

por:

```js
      mensaje: ('Servicios: ' + (servicios.join(', ') || 'no indicó') + (tamanoTexto ? ' · Tamaño: ' + tamanoTexto : '') + (utm ? ' · ' + utm : '')),
```

d) En el `.then` de éxito, inmediatamente después de `if (!data.success) { ... throw e; }` y ANTES de `form.classList.add('sent');`, agregar:

```js
      if (window.RL && RL.buildLeadSubmit) {
        RL.buildLeadSubmit({
          email: payload.email, phoneRaw: payload.telefono,
          hasCompany: !!payload.empresa, sizeBucket: tamano || null,
          servicesCount: servicios.length, honeypotFilled: !!payload.website,
          pilar: payload.interes_pilar, t0: t0
        }).then(function (p) { RL.pushEvent('rl_lead_submit', p); }).catch(function () {});
      }
```

e) En el `.catch` final, después de `quitarError();`, agregar:

```js
      if (window.RL) RL.pushEvent('rl_form_error', {
        form_id: 'agenda_diagnostico',
        error_field: 'server',
        error_type: 'server'
      });
```

- [ ] **Step 7: Verificación integral del formulario**

Run: `npm test && node --check js/rl-tracking.js`
Expected: PASS.

Smoke con `npx vercel dev`: llenar el formulario con `test@gmail.com`, sin empresa, teléfono `5512345678`, 1 servicio, enviar. En consola:
`dataLayer.filter(e => e.event === 'rl_lead_submit')[0].rl_event_data`
Expected: `lead_tier: 'C'`, `lead_score: 35`, `lead_quality_flag: 'clean'`, `user_data` con 2 hashes hex de 64 chars, sin email/teléfono en claro. (El envío llegará a n8n/Notion como lead de prueba — avisar o borrar después.)

- [ ] **Step 8: Commit**

```bash
git add js/rl-tracking.js index.html tests/rl-lead.test.js
git commit -m "feat(form): campo tamaño de empresa + rl_lead_submit con score y hashing SHA-256"
```

---

### Task 6: QA integral contra el checklist del spec

**Files:**
- Modify: los que requieran ajuste tras la QA (idealmente ninguno)

**Interfaces:**
- Consumes: todo lo anterior + GTM Preview (Tag Assistant) conectado al contenedor GTM-P3WZC7MV con el JSON v2.1.1 importado en un workspace.

- [ ] **Step 1: Suite completa y sintaxis**

Run: `npm test && node --check js/rl-tracking.js && node --check api/lead.js`
Expected: PASS todo; `api/lead.js` intacto.

- [ ] **Step 2: Checklist manual del spec (§Validación) sobre `npx vercel dev`**

Con el navegador en `http://localhost:3000` verificar en orden (DevTools → consola/Application):

1. `dataLayer[]`: el primer evento `rl_*` es `rl_context_ready` con los 4 bloques poblados.
2. Llegar con `?gclid=test123` → `traffic.gclid === 'test123'` y cookie `rl_attr` lo contiene.
3. Cerrar pestaña, reabrir → `session_count` sube, `first_touch` idéntico, `is_returning: true`.
4. `?rl_internal=1` → `user.is_internal: true`; en visitas siguientes sin el parámetro, sigue true.
5. Scroll al fondo → `rl_scroll_depth` 25/50/75/90 una vez cada uno; `rl_case_study_view` al pasar #resultados.
6. Permanecer en #servicios ≥20 s → `rl_service_view` con `dwell_time_sec` ≈ 20.
7. 45 s en página + scroll + 2 clics → `rl_engaged_session` (y no dispara con la pestaña oculta).
8. Focus en el form → `rl_form_start` (solo la primera vez).
9. Enviar vacío → `rl_form_error` con `error_field` del primer campo inválido.
10. Envío de prueba → `rl_lead_submit` (verificar hashes y ausencia de PII en claro).
11. Después del envío, hacer scroll → el siguiente `rl_scroll_depth` NO arrastra campos del lead (reset C-13 visible en el array).

- [ ] **Step 3: Verificación GTM Preview (requiere el contenedor importado)**

En Tag Assistant (tagassistant.google.com) conectar `http://localhost:3000` con el workspace que tiene el JSON v2.1.1:

- `rl_context_ready` aparece como primer evento personalizado.
- Con navegación normal: disparan los tags GA4 de scroll (solo 50/90), service_view, case_study_view, engaged_session, form_start.
- Envío con gmail sin empresa → dispara `GA4 - generate_lead`; los tags `Ads - Lead` (bloqueado por G3 Tier C) y `Meta - Lead` (G2 no aplica: flag clean, pero Ads bloquea por tier) según lo esperado; con honeypot lleno → ningún tag de Ads/Meta.
- Con `?rl_internal=1` → ningún tag dispara (G1).

- [ ] **Step 4: Verificación del middleware en preview deploy**

```bash
npx vercel deploy
curl -sI https://<preview-url>/ | grep -i set-cookie
```

Expected: `Set-Cookie: rl_geo=<país>; Path=/; SameSite=Lax; Secure` (desde un deploy real el header geo existe). Verificar también que la página carga normal y `curl -sI https://<preview-url>/api/lead` responde 405 (la función sigue viva con package.json presente).

- [ ] **Step 5: Commit final (si hubo ajustes) y cierre**

```bash
git add -A && git commit -m "fix(tracking): ajustes de QA integral fases 1-3" # solo si hubo cambios
```

No hacer `git push` sin confirmación del usuario (deploy = push a main).

---

## Self-review del plan (hecho)

- **Cobertura del spec:** Fase 1 → Task 1–2; Fase 2 → Task 4; Fase 3 → Task 5; validación §Validación → Task 6; `rl_whatsapp_click` dormido → Task 4; claves null de contrato → Task 5. Sin huecos.
- **Sin placeholders:** todo step tiene código o comando exacto con expected.
- **Consistencia de tipos:** `window.__rl` (Task 2) coincide con lo que leen `buildLeadSubmit` y el listener de WhatsApp; `RL.pushEvent(name, data)` usado igual en Tasks 4–5; `f.sizeBucket` usa los valores del select (`1_10|11_50|51_200|200_plus`).
