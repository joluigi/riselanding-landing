'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const nodeCrypto = require('node:crypto');
const RL = require('../js/rl-tracking.js');

function sha(s) { return nodeCrypto.createHash('sha256').update(s).digest('hex'); }
function nullKeys(o) {
  return Object.keys(o).filter(function (k) { return o[k] === null || o[k] === undefined; });
}

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
  // Claves que el form no captura se omiten (nunca null)
  ['prospect_segment', 'prospect_geo', 'operation_volume_bucket', 'current_marketing_maturity', 'segment_match']
    .forEach(function (k) { assert.ok(!(k in p), k + ' debe omitirse'); });
  assert.deepStrictEqual(nullKeys(p), []);
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
  assert.ok(!('time_to_convert_sec' in p), 'sin t0 la clave se omite');
  assert.deepStrictEqual(nullKeys(p), []);
  assert.ok(!p.user_data || !p.user_data.sha256_phone_number, 'teléfono inválido no se hashea');
  delete globalThis.__rl;
});

test('buildLeadSubmit: @gmail.com sin datos de empresa → Tier C (G3) con flag clean, aun con todo lo demás al máximo', async function () {
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' };
  const p = await RL.buildLeadSubmit({
    email: 'maria@gmail.com', phoneRaw: '+52 55 5878 8983', hasCompany: false, sizeBucket: null,
    servicesCount: 6, honeypotFilled: false, pilar: 'Bundle Completo', t0: Date.now()
  });
  assert.strictEqual(p.email_domain_type, 'free');
  assert.strictEqual(p.lead_tier, 'C');
  assert.strictEqual(p.lead_quality_flag, 'clean');
  assert.ok(!('company_size_bucket' in p), 'sin tamaño la clave se omite');
  assert.match(p.user_data.sha256_email_address, /^[0-9a-f]{64}$/);
  assert.match(p.user_data.sha256_phone_number, /^[0-9a-f]{64}$/);
  delete globalThis.__rl;
});

test('buildLeadSubmit: lead_quality_flag siempre presente (G2 bloquea si falta)', async function () {
  const casos = [
    { email: 'a@empresa.mx', phoneRaw: '5558788983', honeypotFilled: false },
    { email: 'a@gmail.com', phoneRaw: '123', honeypotFilled: false },
    { email: 'a@mailinator.com', phoneRaw: '5558788983', honeypotFilled: false },
    { email: '', phoneRaw: '', honeypotFilled: false },
    { email: 'bot@empresa.mx', phoneRaw: '5558788983', honeypotFilled: true }
  ];
  for (const c of casos) {
    const p = await RL.buildLeadSubmit(c);
    assert.ok(['clean', 'suspect', 'spam'].indexOf(p.lead_quality_flag) !== -1, JSON.stringify(c));
  }
});

test('buildLeadSubmit: sin bootstrap (__rl ausente) transaction_id === lead_id con UUID nuevo', async function () {
  delete globalThis.__rl;
  const p = await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '5558788983' });
  assert.match(p.lead_id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.strictEqual(p.transaction_id, p.lead_id);
  ['touch_count', 'days_since_first_touch'].forEach(function (k) { assert.ok(!(k in p), k + ' debe omitirse'); });
  assert.deepStrictEqual(nullKeys(p), []);
});

test('pushEvent: omite claves null/undefined del payload', function () {
  globalThis.dataLayer = [];
  RL.pushEvent('rl_whatsapp_click', { transaction_id: null, prefilled_ref: 'RL-x', service_line: undefined });
  const d = globalThis.dataLayer[1].rl_event_data;
  assert.deepStrictEqual(Object.keys(d).sort(), ['event_id', 'prefilled_ref']);
  delete globalThis.dataLayer;
});

test('pushFormError: reset previo, error_type del contrato y error_field solo si aplica', function () {
  globalThis.dataLayer = [];
  RL.pushFormError('client_validation', 'f-email');
  RL.pushFormError('server_error');
  RL.pushFormError('network_error');
  const dl = globalThis.dataLayer;
  assert.strictEqual(dl.length, 6);
  assert.deepStrictEqual(dl[0], { rl_event_data: null });
  assert.strictEqual(dl[1].event, 'rl_form_error');
  assert.strictEqual(dl[1].rl_event_data.form_id, 'agenda_diagnostico');
  assert.strictEqual(dl[1].rl_event_data.error_type, 'client_validation');
  assert.strictEqual(dl[1].rl_event_data.error_field, 'f-email');
  assert.strictEqual(dl[3].rl_event_data.error_type, 'server_error');
  assert.ok(!('error_field' in dl[3].rl_event_data));
  assert.strictEqual(dl[5].rl_event_data.error_type, 'network_error');
  delete globalThis.dataLayer;
});

test('rl_lead_submit en el dataLayer: ningún valor contiene PII en claro', async function () {
  globalThis.dataLayer = [];
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', touchCount: 1, daysSinceFirstTouch: 0 };
  const p = await RL.buildLeadSubmit({ email: 'Maria@Empresa.mx', phoneRaw: '55 5878 8983', hasCompany: true });
  RL.pushEvent('rl_lead_submit', p);
  (function walk(v) {
    if (v && typeof v === 'object') { Object.keys(v).forEach(function (k) { walk(v[k]); }); return; }
    if (typeof v === 'string') {
      assert.ok(v.indexOf('@') === -1, 'valor con @: ' + v);
      assert.ok(v.indexOf('5558788983') === -1, 'teléfono en claro: ' + v);
    }
  })(globalThis.dataLayer);
  delete globalThis.dataLayer;
  delete globalThis.__rl;
});
