'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const RL = require('../js/rl-tracking.js');

test('uuid: formato UUIDv4', function () {
  assert.match(RL.uuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notStrictEqual(RL.uuid(), RL.uuid());
});

test('phoneE164MX: normaliza a +52 y rechaza longitudes inválidas', function () {
  assert.strictEqual(RL.phoneE164MX('55 5878 8983'), '+525558788983');
  assert.strictEqual(RL.phoneE164MX('+52 55 5878 8983'), '+525558788983');
  assert.strictEqual(RL.phoneE164MX('+52 1 55 5878 8983'), '+525558788983');
  assert.strictEqual(RL.phoneE164MX('5558788'), null);
  assert.strictEqual(RL.phoneE164MX(''), null);
});

test('el modelo de calidad del cliente ya no existe: el veredicto viene solo del servidor', function () {
  assert.strictEqual(RL.leadScore, undefined);
  assert.strictEqual(RL.emailDomainType, undefined);
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

// --- Listeners DOM (taxonomía 2.2.0): js/rl-tracking.js en node:vm con un DOM falso mínimo ---
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SRC_TRACKING = fs.readFileSync(path.join(__dirname, '..', 'js', 'rl-tracking.js'), 'utf8');

// Monta la página con los ids indicados y un reloj falso (avanzar(ms) corre los setInterval)
function montarPagina(opts) {
  const o = opts || {};
  const ids = o.ids || [];
  const elementos = {};
  ids.forEach(function (id) {
    elementos[id] = { id: id, getBoundingClientRect: function () { return { top: 0, height: 1000 }; } };
  });
  const listeners = { document: {}, window: {} };
  const observados = [];
  const intervalos = [];
  let reloj = 0;
  const doc = {
    cookie: '', visibilityState: o.visibilityState || 'visible',
    documentElement: { scrollHeight: 2000, clientHeight: 1000, scrollTop: 0 },
    getElementById: function (id) { return elementos[id] || null; },
    addEventListener: function (tipo, fn) { (listeners.document[tipo] = listeners.document[tipo] || []).push(fn); }
  };
  const sandbox = {
    document: doc, dataLayer: [], innerHeight: 800, pageYOffset: 0,
    crypto: require('node:crypto').webcrypto, URL: URL,
    addEventListener: function (tipo, fn) { (listeners.window[tipo] = listeners.window[tipo] || []).push(fn); },
    requestAnimationFrame: function (fn) { fn(); },
    setInterval: function (fn, ms) { intervalos.push({ fn: fn, ms: ms, vivo: true }); return intervalos.length - 1; },
    clearInterval: function (i) { if (intervalos[i]) intervalos[i].vivo = false; },
    IntersectionObserver: function (cb) {
      this.observe = function (el) { observados.push({ el: el, cb: cb }); };
      this.disconnect = function () {};
    }
  };
  if (o.rl) sandbox.__rl = o.rl;
  if (o.rlPage) sandbox.__rlPage = o.rlPage;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC_TRACKING, sandbox);
  return {
    sandbox: sandbox, observados: observados,
    eventos: function (nombre) {
      return sandbox.dataLayer.filter(function (x) { return x.event === nombre; }).map(function (x) { return x.rl_event_data; });
    },
    verSeccion: function (ratio) { observados.forEach(function (ob) { ob.cb([{ intersectionRatio: ratio }]); }); },
    avanzar: function (ms) {
      for (let t = 0; t < ms; t += 1000) {
        reloj += 1000;
        intervalos.forEach(function (it) { if (it.vivo && reloj % it.ms === 0) it.fn(); });
      }
    },
    clic: function (href, enFooter) {
      const a = {
        href: href,
        getAttribute: function (k) { return k === 'href' ? href : null; },
        closest: function (sel) { return sel === 'footer' ? (enFooter ? {} : null) : a; }
      };
      (listeners.document.click || []).forEach(function (fn) { fn({ target: a }); });
      return a;
    },
    scroll: function (y) {
      doc.documentElement.scrollTop = y;
      (listeners.window.scroll || []).forEach(function (fn) { fn(); });
    }
  };
}

test('rl_service_view: en página de servicio observa #enfoque y manda el service_line de la página', function () {
  const p = montarPagina({ ids: ['enfoque'], rl: { leadId: 'abc', page: { template: 'servicio_crm_v1', serviceLine: 'crm_automatizacion' } } });
  assert.strictEqual(p.observados.length, 1);
  assert.strictEqual(p.observados[0].el.id, 'enfoque');
  p.verSeccion(0.6);
  p.avanzar(19000);
  assert.strictEqual(p.eventos('rl_service_view').length, 0, 'antes de 20 s no dispara');
  p.avanzar(1000);
  const ev = p.eventos('rl_service_view');
  assert.strictEqual(ev.length, 1);
  assert.strictEqual(ev[0].service_line, 'crm_automatizacion');
  assert.strictEqual(ev[0].assigned_partner, 'ambos');
  assert.strictEqual(ev[0].dwell_time_sec, 20);
  assert.match(ev[0].event_id, /^[0-9a-f-]{36}$/);
  p.avanzar(30000);
  assert.strictEqual(p.eventos('rl_service_view').length, 1, 'una sola vez por carga');
});

test('rl_service_view: en home prefiere #servicios y sin __rl.page usa paquete_integral', function () {
  const p = montarPagina({ ids: ['servicios', 'enfoque'] });
  assert.strictEqual(p.observados[0].el.id, 'servicios');
  p.verSeccion(0.5);
  p.avanzar(20000);
  assert.strictEqual(p.eventos('rl_service_view')[0].service_line, 'paquete_integral');
});

test('rl_service_view: respaldo en window.__rlPage.service_line cuando __rl no trae page', function () {
  const p = montarPagina({ ids: ['enfoque'], rl: { leadId: 'abc' }, rlPage: { service_line: 'publicidad_digital' } });
  p.verSeccion(1);
  p.avanzar(20000);
  assert.strictEqual(p.eventos('rl_service_view')[0].service_line, 'publicidad_digital');
});

test('rl_service_view: no cuenta si la sección no es visible o la pestaña está oculta', function () {
  const fuera = montarPagina({ ids: ['enfoque'] });
  fuera.verSeccion(0.2);
  fuera.avanzar(60000);
  assert.strictEqual(fuera.eventos('rl_service_view').length, 0);
  const oculta = montarPagina({ ids: ['enfoque'], visibilityState: 'hidden' });
  oculta.verSeccion(1);
  oculta.avanzar(60000);
  assert.strictEqual(oculta.eventos('rl_service_view').length, 0);
});

test('rl_service_view: sin #servicios ni #enfoque no observa nada (legal, gracias, 404)', function () {
  const p = montarPagina({ ids: [] });
  assert.strictEqual(p.observados.length, 0);
  p.avanzar(60000);
  assert.strictEqual(p.eventos('rl_service_view').length, 0);
});

test('rl_whatsapp_click: service_line de la página, ref en el texto y respaldo paquete_integral', function () {
  const p = montarPagina({ rl: { leadId: '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30', page: { serviceLine: 'web_seo' } } });
  const a = p.clic('https://wa.me/525548213439?text=Hola', true);
  const ev = p.eventos('rl_whatsapp_click');
  assert.strictEqual(ev.length, 1);
  assert.strictEqual(ev[0].service_line, 'web_seo');
  assert.strictEqual(ev[0].prefilled_ref, 'RL-3f8a91c2');
  assert.strictEqual(ev[0].transaction_id, '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30');
  assert.strictEqual(ev[0].cta_location, 'footer');
  assert.match(decodeURIComponent(a.href.replace(/\+/g, ' ')), /Hola \[RL-3f8a91c2\]/);
  p.clic('https://wa.me/525548213439', false);
  assert.strictEqual(p.eventos('rl_whatsapp_click').length, 1, 'una sola vez por carga');

  const sinPagina = montarPagina({ rl: { leadId: 'x' } });
  sinPagina.clic('https://wa.me/525548213439', false);
  assert.strictEqual(sinPagina.eventos('rl_whatsapp_click')[0].service_line, 'paquete_integral');
});

test('rl_case_study_view: dormido sin #resultados; rl_scroll_depth sigue activo', function () {
  const p = montarPagina({ ids: ['enfoque'] });
  p.scroll(1000);
  assert.strictEqual(p.eventos('rl_case_study_view').length, 0);
  assert.deepStrictEqual(p.eventos('rl_scroll_depth').map(function (e) { return e.threshold; }), [25, 50, 75, 90]);
});

// --- Taxonomía versionada: docs/tracking/rl-taxonomy.json ---
const RAIZ = path.join(__dirname, '..');
const TAXO_RAW = fs.readFileSync(path.join(RAIZ, 'docs', 'tracking', 'rl-taxonomy.json'), 'utf8');

test('rl-taxonomy.json: JSON válido, v2.2.0 y misma versión que el bootstrap', function () {
  const t = JSON.parse(TAXO_RAW);
  assert.strictEqual(t.schema_version, '2.2.0');
  const boot = fs.readFileSync(path.join(RAIZ, 'src', 'tracking', 'rl-bootstrap.js'), 'utf8');
  assert.match(boot, /rl_schema_version:\s*'2\.2\.0'/);
  assert.ok(Array.isArray(t.changelog) && t.changelog.some(function (c) { return c.version === '2.2.0'; }));
  assert.strictEqual(TAXO_RAW.indexOf('\u2014'), -1, 'sin guion largo');
});

test('rl-taxonomy.json: documenta cada evento rl_* que publica el código, con estado válido', function () {
  const t = JSON.parse(TAXO_RAW);
  const ESTADOS = ['activo', 'dormido', 'planeado'];
  const porNombre = {};
  t.events.forEach(function (e) {
    assert.ok(ESTADOS.indexOf(e.status) !== -1, e.name + ': estado ' + e.status);
    assert.strictEqual(typeof e.gtm_trigger, 'boolean', e.name + ': gtm_trigger');
    porNombre[e.name] = e;
  });
  // fuentes que publican eventos rl_* (el index.html legado se borró en PR7)
  const fuentes = ['js/rl-tracking.js', 'src/tracking/rl-bootstrap.js', 'js/rl-form.js']
    .filter(function (f) { return fs.existsSync(path.join(RAIZ, f)); })
    .map(function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); }).join('\n');
  const emitidos = new Set();
  const re = /(?:pushEvent|pushEvento|event:)\s*\(?\s*'(rl_[a-z_]+)'/g;
  let m;
  while ((m = re.exec(fuentes))) emitidos.add(m[1]);
  assert.ok(emitidos.size >= 10, 'el extractor encontró ' + emitidos.size + ' eventos');
  emitidos.forEach(function (n) { assert.ok(porNombre[n], n + ' falta en la taxonomía'); });
  assert.strictEqual(porNombre.rl_case_study_view.status, 'dormido');
  assert.strictEqual(porNombre.rl_tool_start.status, 'planeado');
  assert.strictEqual(porNombre.rl_tool_complete.status, 'planeado');
  assert.deepStrictEqual(porNombre.rl_service_view.dom_selector_by_template.servicio, '#enfoque');
});

test('rl-taxonomy.json: service_line y page.template coinciden con el código', function () {
  const t = JSON.parse(TAXO_RAW);
  Object.keys({ 'Bundle Completo': 1, 'Google Ads': 1, 'Sitio Web + SEO': 1, 'CRM + Automatización': 1 }).forEach(function (pilar) {
    assert.ok(t.values.service_line.indexOf(RL.serviceLineFromPilar(pilar)) !== -1, pilar);
  });
  ['home_v2', 'servicios_indice_v1', 'servicio_crm_v1', 'servicio_automatizacion_v1', 'servicio_google_ads_v1',
    'servicio_sitio_web_v1', 'legal_v1', 'gracias_v1', 'error_404_v1', 'lp_home_v1'].forEach(function (tpl) {
    assert.ok(t.values.page_template.some(function (v) { return v.template === tpl; }), tpl);
  });
});
