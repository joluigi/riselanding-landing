// Pruebas de js/rl-form.js (plan F4 §4): precarga del servicio, publicación de rl_lead_submit con
// eventCallback y navegación a /gracias con tope de 2 s. Sin jsdom: objetos falsos y node:test.
// Al final, pruebas estáticas de src/styles/form.css (16 px en inputs, iOS no hace zoom al enfocar).
'use strict';
const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const RLForm = require('../js/rl-form.js');

const RAIZ = path.join(__dirname, '..');
const SERVICIOS = require('../lib/lead-quality/schema.js').SERVICIOS;

function vaciarMicrotareas() { return new Promise(function (r) { setImmediate(r); }); }

// Formulario falso con un chip por servicio del esquema
function formularioFalso() {
  const chips = SERVICIOS.map(function (s) {
    const clases = new Set();
    const chk = { classList: { add: function (c) { clases.add(c); }, contains: function (c) { return clases.has(c); } } };
    const eventos = [];
    const cb = {
      checked: false,
      getAttribute: function (a) { return a === 'data-zoho' ? s : null; },
      closest: function (sel) { return sel === '.chk' ? chk : null; },
      dispatchEvent: function (e) { eventos.push(e); }
    };
    return { servicio: s, cb: cb, chk: chk, eventos: eventos };
  });
  const form = {
    querySelectorAll: function (sel) {
      assert.strictEqual(sel, '.checks input[data-zoho]');
      return chips.map(function (c) { return c.cb; });
    }
  };
  return { form: form, chips: chips };
}

const PAYLOAD = Object.freeze({
  event_id: '9b1f3c2a-4d5e-4f60-8a71-b2c3d4e5f607', lead_id: '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30',
  transaction_id: '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30', form_id: 'agenda_diagnostico', form_location: 'contacto',
  lead_quality_flag: 'clean', lead_score: 85, lead_tier: 'A'
});

beforeEach(function () { globalThis.dataLayer = []; });

test('expone la API pura en module.exports y window.RLForm', function () {
  assert.strictEqual(globalThis.RLForm, RLForm);
  ['precargarServicio', 'publicarLeadSubmit', 'esperarEvento', 'concluirEnvio'].forEach(function (f) {
    assert.strictEqual(typeof RLForm[f], 'function', f);
  });
  assert.strictEqual(RLForm.URL_GRACIAS, '/gracias');
  assert.strictEqual(RLForm.TIEMPO_MAX_GTM_MS, 2000);
});

test('precarga: marca solo el chip del servicio de la página y le agrega .on, sin evento change', function () {
  SERVICIOS.forEach(function (servicio) {
    const f = formularioFalso();
    const marcado = RLForm.precargarServicio(f.form, servicio);
    f.chips.forEach(function (c) {
      const esEste = c.servicio === servicio;
      assert.strictEqual(c.cb.checked, esEste, servicio + ' → ' + c.servicio);
      assert.strictEqual(c.chk.classList.contains('on'), esEste);
      assert.strictEqual(c.eventos.length, 0, 'sin change sintético');
    });
    assert.strictEqual(marcado, f.chips.find(function (c) { return c.servicio === servicio; }).cb);
  });
});

test('precarga: sin data-servicio o con un valor fuera del esquema no marca nada', function () {
  [null, '', 'Tienda en línea', 'implementación de crm'].forEach(function (valor) {
    const f = formularioFalso();
    assert.strictEqual(RLForm.precargarServicio(f.form, valor), null);
    assert.ok(f.chips.every(function (c) { return !c.cb.checked && !c.chk.classList.contains('on'); }), String(valor));
  });
  assert.strictEqual(RLForm.precargarServicio(null, 'Implementación de CRM'), null);
});

test('publicarLeadSubmit: reset primero, luego rl_lead_submit con el mismo event_id, eventCallback y eventTimeout 2000', function () {
  const listo = function () {};
  RLForm.publicarLeadSubmit(PAYLOAD, listo);
  const dl = globalThis.dataLayer;
  assert.strictEqual(dl.length, 2);
  assert.deepStrictEqual(dl[0], { rl_event_data: null });
  assert.strictEqual(dl[1].event, 'rl_lead_submit');
  assert.strictEqual(dl[1].rl_event_data, PAYLOAD);
  assert.strictEqual(dl[1].rl_event_data.event_id, PAYLOAD.event_id);
  assert.strictEqual(dl[1].eventCallback, listo);
  assert.strictEqual(dl[1].eventTimeout, 2000);
});

test('publicarLeadSubmit: conserva lo que ya había en el dataLayer y crea uno si no existe', function () {
  globalThis.dataLayer = [{ event: 'rl_context_ready' }];
  RLForm.publicarLeadSubmit(PAYLOAD, function () {});
  assert.deepStrictEqual(globalThis.dataLayer.map(function (e) { return e.event || 'reset'; }), ['rl_context_ready', 'reset', 'rl_lead_submit']);
  delete globalThis.dataLayer;
  RLForm.publicarLeadSubmit(PAYLOAD, function () {});
  assert.strictEqual(globalThis.dataLayer.length, 2);
});

test('concluirEnvio con veredicto: publica (reset y evento) y navega a /gracias cuando GTM llama a eventCallback', async function () {
  const navegaciones = [];
  const fin = RLForm.concluirEnvio(Promise.resolve(PAYLOAD), function (url) { navegaciones.push(url); }, 60000);
  await vaciarMicrotareas();
  const dl = globalThis.dataLayer;
  assert.deepStrictEqual(dl[0], { rl_event_data: null }, 'el reset va antes del evento');
  assert.strictEqual(dl[1].event, 'rl_lead_submit');
  assert.strictEqual(dl[1].rl_event_data.event_id, PAYLOAD.event_id);
  assert.deepStrictEqual(navegaciones, [], 'no navega antes de que GTM confirme');
  // GTM llama eventCallback una vez por contenedor: solo debe navegar una vez
  dl[1].eventCallback('GTM-P3WZC7MV');
  dl[1].eventCallback('GTM-OTRO');
  await fin;
  assert.deepStrictEqual(navegaciones, ['/gracias']);
  assert.strictEqual(dl.filter(function (e) { return e.event === 'rl_lead_submit'; }).length, 1);
});

test('concluirEnvio sin veredicto (fake success): no publica nada y navega igual', async function () {
  const navegaciones = [];
  await RLForm.concluirEnvio(Promise.resolve(null), function (url) { navegaciones.push(url); });
  assert.deepStrictEqual(globalThis.dataLayer, [], 'sin veredicto no hay push, ni siquiera el reset');
  assert.deepStrictEqual(navegaciones, ['/gracias']);
});

test('concluirEnvio: si armar el payload falla, no publica y navega igual', async function () {
  const navegaciones = [];
  await RLForm.concluirEnvio(Promise.reject(new Error('sin Web Crypto')), function (url) { navegaciones.push(url); });
  assert.deepStrictEqual(globalThis.dataLayer, []);
  assert.deepStrictEqual(navegaciones, ['/gracias']);
});

test('concluirEnvio con GTM bloqueado: navega a los 2 s exactos, no antes', async function (t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const navegaciones = [];
  RLForm.concluirEnvio(Promise.resolve(PAYLOAD), function (url) { navegaciones.push(url); });
  await vaciarMicrotareas();
  assert.strictEqual(globalThis.dataLayer[1].event, 'rl_lead_submit');
  t.mock.timers.tick(1999);
  await vaciarMicrotareas();
  assert.deepStrictEqual(navegaciones, [], 'a los 1999 ms todavía espera');
  t.mock.timers.tick(1);
  await vaciarMicrotareas();
  assert.deepStrictEqual(navegaciones, ['/gracias']);
  // Si GTM despierta tarde, no navega otra vez
  globalThis.dataLayer[1].eventCallback();
  await vaciarMicrotareas();
  assert.deepStrictEqual(navegaciones, ['/gracias']);
});

test('esperarEvento: si publicar lanza, resuelve de inmediato', async function () {
  await RLForm.esperarEvento(function () { throw new Error('dataLayer roto'); }, 60000);
});

// --- Cableado en el DOM (lectura estática del fuente) ---
const FUENTE = fs.readFileSync(path.join(RAIZ, 'js', 'rl-form.js'), 'utf8');

test('rl-form.js: precarga tras aplicarSolicitante, redirección con concluirEnvio, Turnstile light', function () {
  const iAplicar = FUENTE.indexOf("$('f-solicitante').addEventListener('change', aplicarSolicitante);");
  const iPrecarga = FUENTE.indexOf("precargarServicio(form, form.getAttribute('data-servicio'))");
  assert.ok(iAplicar !== -1 && iPrecarga > iAplicar, 'la precarga va después del aplicarSolicitante inicial');
  assert.match(FUENTE, /concluirEnvio\(veredicto, function \(url\) \{ location\.assign\(url\); \}\)/);
  assert.doesNotMatch(FUENTE, /pushEvent\('rl_lead_submit'/, 'rl_lead_submit solo sale por publicarLeadSubmit');
  assert.doesNotMatch(FUENTE, /mostrarExito/, 'el éxito comercial ya no es inline');
  assert.match(FUENTE, /theme: 'light'/);
  assert.doesNotMatch(FUENTE, /theme: 'dark'/);
  // No comercial sigue inline y sin redirección
  assert.match(FUENTE, /mostrarAviso\(data\.message\)/);
});

test('rl-form.js: sin guion largo (U+2014)', function () {
  assert.strictEqual(FUENTE.indexOf('\u2014'), -1);
});

// --- form.css: 16 px mínimo en inputs (DESIGN.md §7, contrato §7) ---
const CSS = fs.readFileSync(path.join(RAIZ, 'src', 'styles', 'form.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function reglas(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), cuerpo: m[2] });
  return out;
}

function tocaControl(selector) {
  return /\b(input|select|textarea)\b/.test(selector);
}

test('form.css: los inputs, selects y textareas de .field declaran font-size de 16 px', function () {
  const base = reglas(CSS).filter(function (r) {
    return /\.field input/.test(r.selector) && /\.field select/.test(r.selector) && /\.field textarea/.test(r.selector);
  });
  assert.ok(base.some(function (r) { return /font-size:\s*16px/.test(r.cuerpo); }), 'falta font-size: 16px en .field input, .field select, .field textarea');
  assert.ok(base.some(function (r) { return /min-height:\s*48px/.test(r.cuerpo); }), 'falta min-height: 48px (DESIGN.md §7)');
});

test('form.css: ninguna regla sobre input, select o textarea baja de 16 px', function () {
  reglas(CSS).filter(function (r) { return tocaControl(r.selector); }).forEach(function (r) {
    const re = /font-size:\s*([^;]+)/g;
    let m;
    while ((m = re.exec(r.cuerpo))) {
      const v = m[1].trim();
      const px = v.match(/^(\d+(?:\.\d+)?)px$/);
      assert.ok(px || v === 'inherit' || v === '1rem' || v === '100%', r.selector + ': font-size no verificable (' + v + ')');
      if (px) assert.ok(Number(px[1]) >= 16, r.selector + ': font-size ' + v + ' < 16px (zoom en iOS)');
    }
    assert.doesNotMatch(r.cuerpo, /(^|[;\s])font:\s/, r.selector + ': usa font-size explícito, no el shorthand font');
  });
});

test('form.css: honeypot fuera de pantalla, nunca display:none', function () {
  const hp = reglas(CSS).filter(function (r) { return /\.hp-field\b/.test(r.selector); });
  assert.ok(hp.length, 'falta la regla .hp-field');
  hp.forEach(function (r) {
    assert.doesNotMatch(r.cuerpo, /display:\s*none/);
    assert.doesNotMatch(r.cuerpo, /visibility:\s*hidden/);
  });
  assert.ok(hp.some(function (r) { return /position:\s*absolute/.test(r.cuerpo) && /left:\s*-9999px/.test(r.cuerpo); }));
  assert.ok(reglas(CSS).some(function (r) { return r.selector === '.form-grid [hidden]' && /display:\s*none\s*!important/.test(r.cuerpo); }), 'falta .form-grid [hidden]{display:none!important}');
});
