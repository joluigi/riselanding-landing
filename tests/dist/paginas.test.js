// Pruebas sobre el HTML generado en dist/ (plan F4 §6). Requieren `npm run build`;
// sin dist/ se marcan como omitidas. `npm run test:dist` construye y las corre.
// Primera versión (PR0): 4 páginas provisionales. PR2 agrega el bloque del formulario y PR4 las de servicios.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DIST = path.join(__dirname, '..', '..', 'dist');

const PAGINAS = [
  { archivo: 'index.html', template: 'home_v2', type: 'home', serviceLine: 'paquete_integral', canonical: 'https://riselanding.com/' },
  { archivo: 'aviso-de-privacidad.html', template: 'legal_v1', type: 'legal', serviceLine: 'paquete_integral', canonical: 'https://riselanding.com/aviso-de-privacidad' },
  { archivo: 'gracias.html', template: 'gracias_v1', type: 'gracias', serviceLine: 'paquete_integral', noindex: true },
  { archivo: '404.html', template: 'error_404_v1', type: 'error', serviceLine: 'paquete_integral' }
];

const ESTATICOS = [
  'js/rl-tracking.js',
  'lib/lead-quality/schema.js',
  'Assets/og-image.png',
  'Assets/favicon-32.png',
  'Assets/logo-horizontal.svg',
  'Assets/logo-horizontal-blanco.svg',
  'Assets/isotipo.svg',
  'sitemap.xml',
  'robots.txt'
];

if (!fs.existsSync(DIST)) {
  test('pruebas de dist/', { skip: 'corre npm run build' }, function () {});
} else {
  definirPruebas();
}

// Ejecuta el <script id="rl-bootstrap"> extraído del HTML en un sandbox con cookies falsas
function correrBootstrap(codigo, cookies) {
  const jar = Object.assign({}, cookies);
  const sandbox = {
    document: {
      get cookie() { return Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; '); },
      set cookie(str) { const par = str.split(';')[0]; const i = par.indexOf('='); jar[par.slice(0, i).trim()] = par.slice(i + 1).trim(); },
      referrer: ''
    },
    location: { search: '', pathname: '/', hostname: 'riselanding.com' },
    sessionStorage: { getItem: function () { return null; }, setItem: function () {} },
    crypto: require('node:crypto').webcrypto,
    URLSearchParams, URL, Date, Math, JSON, RegExp, Array, Object, Uint8Array, encodeURIComponent, decodeURIComponent
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox);
  return sandbox;
}

function definirPruebas() {
  PAGINAS.forEach(function (p) {
    const ruta = path.join(DIST, p.archivo);

    test(p.archivo + ': existe', function () {
      assert.ok(fs.existsSync(ruta), 'falta dist/' + p.archivo);
    });
    if (!fs.existsSync(ruta)) return;
    const html = fs.readFileSync(ruta, 'utf8');

    test(p.archivo + ': orden del head charset < rl-bootstrap < gtm.js < /js/rl-tracking.js', function () {
      const iCharset = html.indexOf('<meta charset');
      const iBoot = html.indexOf('id="rl-bootstrap"');
      const iGtm = html.indexOf('googletagmanager.com/gtm.js');
      const iTrack = html.indexOf('/js/rl-tracking.js');
      const iHead = html.indexOf('</head>');
      assert.ok(iCharset !== -1 && iCharset < iBoot, 'meta charset debe ir antes del bootstrap');
      assert.ok(iBoot !== -1, 'falta <script id="rl-bootstrap">');
      assert.ok(iBoot < iGtm, 'el bootstrap debe ir ANTES del snippet GTM');
      assert.ok(iGtm < iTrack, 'GTM debe ir antes de /js/rl-tracking.js');
      assert.ok(iTrack < iHead, '/js/rl-tracking.js debe ir en el head');
      assert.strictEqual(html.split('googletagmanager.com/gtm.js').length - 1, 1, 'un solo snippet GTM');
      assert.strictEqual(html.split('id="rl-bootstrap"').length - 1, 1, 'un solo bootstrap');
    });

    test(p.archivo + ': rl_context_ready con la plantilla de la página y consent denied con rl_geo=DE', function () {
      const m = html.match(/<script id="rl-bootstrap">([\s\S]*?)<\/script>/);
      assert.ok(m, 'no se pudo extraer el bootstrap');
      const sb = correrBootstrap(m[1], { rl_geo: 'DE' });
      const ctx = sb.dataLayer.find(function (e) { return e && e.event === 'rl_context_ready'; });
      assert.ok(ctx, 'no se empujó rl_context_ready');
      assert.strictEqual(ctx.rl_schema_version, '2.2.0');
      assert.strictEqual(ctx.page.template, p.template);
      assert.strictEqual(ctx.page.type, p.type);
      assert.strictEqual(ctx.page.service_line, p.serviceLine);
      assert.strictEqual(sb.__rl.page.serviceLine, p.serviceLine);
      const consent = sb.dataLayer.find(function (e) { return e && e[0] === 'consent' && e[1] === 'default'; });
      assert.strictEqual(consent[2].ad_storage, 'denied');
      assert.strictEqual(ctx.user.consent_state, 'denied');
    });

    test(p.archivo + ': noscript de GTM como primer hijo del body', function () {
      assert.match(html, /<body[^>]*>\s*<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-P3WZC7MV"/);
    });

    if (p.canonical) {
      test(p.archivo + ': canonical sin .html', function () {
        const canon = html.match(/<link rel="canonical" href="[^"]+"/g) || [];
        assert.deepStrictEqual(canon, ['<link rel="canonical" href="' + p.canonical + '"'], 'un solo canonical: ' + p.canonical);
      });
    }

    if (p.noindex) {
      test(p.archivo + ': noindex, nofollow', function () {
        assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
      });
    }
  });

  test('index.html conserva el formulario y carga schema.js', function () {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    assert.ok(html.indexOf('id="lead-form"') !== -1, 'falta #lead-form');
    assert.ok(html.indexOf('/lib/lead-quality/schema.js') !== -1, 'falta /lib/lead-quality/schema.js');
  });

  test('estáticos copiados a dist/', function () {
    ESTATICOS.forEach(function (rel) {
      assert.ok(fs.existsSync(path.join(DIST, rel)), 'falta dist/' + rel);
    });
    const datos = fs.readdirSync(path.join(DIST, 'lib/lead-quality/data')).filter(function (f) { return f.endsWith('.json'); });
    const fuente = fs.readdirSync(path.join(__dirname, '..', '..', 'lib/lead-quality/data')).filter(function (f) { return f.endsWith('.json'); });
    assert.deepStrictEqual(datos.sort(), fuente.sort(), 'lib/lead-quality/data/*.json incompleto');
    assert.ok(!fs.existsSync(path.join(DIST, 'lib/lead-quality/engine.js')), 'engine.js es solo de servidor: no se publica');
  });
}

// --- (c) Formulario (PR2, plan F4 §6): ids del contrato §4, data-zoho de SERVICIOS, orden de
// scripts y servicio precargado por página. Las páginas que aún no existen se omiten (PR3 y PR4).
const SERVICIOS = require('../../lib/lead-quality/schema.js').SERVICIOS;

const IDS_FORMULARIO = [
  'lead-form', 'f-hp', 'f-solicitante', 'f-servicios', 'f-tamano', 'f-presupuesto', 'f-necesidad',
  'f-necesidad-contador', 'f-nombre', 'f-email', 'f-tel', 'f-tel-pais', 'f-empresa', 'f-sitio',
  'f-sitio-campo', 'f-sitio-toggle', 'f-sitio-toggle-caja', 'f-consent', 'f-turnstile', 'f-continuar',
  'f-atras', 'f-paso-1', 'f-paso-2', 'f-paso-texto', 'f-paso-barra', 'f-anuncio', 'f-progreso',
  'utm_source', 'utm_medium', 'utm_campaign'
];

// Servicio precargado (docs/sitemap.md §7.6); null = sin data-servicio
const FORMULARIOS = [
  { archivo: 'index.html', servicio: null },
  { archivo: 'servicios.html', servicio: null },
  { archivo: 'servicios/crm.html', servicio: 'Implementación de CRM' },
  { archivo: 'servicios/automatizacion.html', servicio: 'Automatización de procesos' },
  { archivo: 'servicios/google-ads.html', servicio: 'Publicidad Digital' },
  { archivo: 'servicios/sitio-web.html', servicio: 'Reediseño / Desarrollo página web' }
];

function escaparHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

if (fs.existsSync(DIST)) {
  FORMULARIOS.forEach(function (f) {
    const ruta = path.join(DIST, f.archivo);
    const nombre = f.archivo + ': formulario del contrato';
    if (!fs.existsSync(ruta)) {
      test(nombre, { skip: 'dist/' + f.archivo + ' todavía no existe' }, function () {});
      return;
    }
    test(nombre, function () {
      const html = fs.readFileSync(ruta, 'utf8');
      IDS_FORMULARIO.forEach(function (id) {
        assert.strictEqual(html.split('id="' + id + '"').length - 1, 1, 'id="' + id + '" debe existir una sola vez');
      });
      SERVICIOS.forEach(function (s) {
        assert.ok(html.indexOf('data-zoho="' + escaparHtml(s) + '"') !== -1, 'falta data-zoho="' + s + '"');
      });
      assert.strictEqual(html.split('data-zoho="').length - 1, SERVICIOS.length, 'un chip por valor de SERVICIOS');
      assert.match(html, /class="hp-field"/, 'falta el honeypot .hp-field');

      const iTrack = html.indexOf('/js/rl-tracking.js');
      const iSchema = html.indexOf('<script src="/lib/lead-quality/schema.js"');
      const iForm = html.indexOf('<script src="/js/rl-form.js"');
      assert.ok(iSchema !== -1, 'falta <script src="/lib/lead-quality/schema.js">');
      assert.ok(iForm !== -1, 'falta <script src="/js/rl-form.js">');
      assert.ok(iTrack < iSchema && iSchema < iForm, 'orden: rl-tracking.js, schema.js, rl-form.js');
      assert.strictEqual(html.split('/js/rl-form.js').length - 1, 1, 'rl-form.js una sola vez');

      const form = html.match(/<form\b[^>]*\bid="lead-form"[^>]*>/);
      assert.ok(form, 'no se encontró la etiqueta <form id="lead-form">');
      const ds = form[0].match(/\bdata-servicio="([^"]*)"/);
      if (f.servicio === null) {
        assert.strictEqual(ds, null, 'esta página no precarga servicio');
      } else {
        assert.ok(ds, 'falta data-servicio en #lead-form');
        assert.strictEqual(ds[1], escaparHtml(f.servicio));
      }
      assert.match(html, /<section\b[^>]*\bid="contacto"/, 'falta la sección #contacto');
    });
  });

  test('dist/js/rl-form.js publicado', function () {
    assert.ok(fs.existsSync(path.join(DIST, 'js', 'rl-form.js')), 'falta dist/js/rl-form.js');
  });
}
