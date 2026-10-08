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
