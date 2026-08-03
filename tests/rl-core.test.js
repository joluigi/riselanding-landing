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
