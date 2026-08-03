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
