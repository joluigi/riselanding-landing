'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const nodeCrypto = require('node:crypto');
const RL = require('../js/rl-tracking.js');

function sha(s) { return nodeCrypto.createHash('sha256').update(s).digest('hex'); }
// Veredicto tal como lo devuelve /api/lead (motor del servidor)
const VEREDICTO_A = { lead_quality_flag: 'clean', lead_score: 85, lead_tier: 'A', email_domain_type: 'corporate' };

function nullKeys(o) {
  return Object.keys(o).filter(function (k) { return o[k] === null || o[k] === undefined; });
}

test('buildLeadSubmit: payload completo, hasheado y sin PII en claro', async function () {
  globalThis.__rl = { leadId: '3f8a91c2-6d4e-4b17-9a05-2ce8f1b74d30', sessionId: '1.a', sessionCount: 1, isInternal: false, touchCount: 2, daysSinceFirstTouch: 2, consentState: 'granted' };
  const p = await RL.buildLeadSubmit({
    email: ' Maria@Empresa.MX ', phoneRaw: '55 5878 8983',
    sizeBucket: '51_200', pilar: 'Bundle Completo', t0: Date.now() - 2000, verdict: VEREDICTO_A
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

test('buildLeadSubmit: sin veredicto del servidor resuelve null (no hay rl_lead_submit)', async function () {
  assert.strictEqual(await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '5558788983' }), null);
  assert.strictEqual(await RL.buildLeadSubmit({ email: 'a@empresa.mx', verdict: { lead_quality_flag: 'clean' } }), null);
  assert.strictEqual(await RL.buildLeadSubmit(null), null);
});

test('buildLeadSubmit: flag, score, tier y email_domain_type salen tal cual del servidor', async function () {
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' };
  const casos = [
    { lead_quality_flag: 'spam', lead_score: 35, lead_tier: 'C', email_domain_type: 'free' },
    { lead_quality_flag: 'suspect', lead_score: 40, lead_tier: 'C', email_domain_type: 'free' },
    { lead_quality_flag: 'clean', lead_score: 53, lead_tier: 'B', email_domain_type: 'free' },
    { lead_quality_flag: 'competitor', lead_score: 98, lead_tier: 'A', email_domain_type: 'corporate' }
  ];
  for (const v of casos) {
    const p = await RL.buildLeadSubmit({ email: 'maria@gmail.com', phoneRaw: '+52 55 5878 8983', verdict: v });
    assert.deepStrictEqual(
      [p.lead_quality_flag, p.lead_score, p.lead_tier, p.email_domain_type],
      [v.lead_quality_flag, v.lead_score, v.lead_tier, v.email_domain_type]);
  }
  delete globalThis.__rl;
});

test('buildLeadSubmit: teléfono inválido no se hashea y sin tamaño la clave se omite', async function () {
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' };
  const p = await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '123', pilar: 'Google Ads', t0: null, verdict: VEREDICTO_A });
  assert.strictEqual(p.service_line, 'publicidad_digital');
  assert.ok(!('time_to_convert_sec' in p), 'sin t0 la clave se omite');
  assert.ok(!('company_size_bucket' in p), 'sin tamaño la clave se omite');
  assert.ok(!p.user_data.sha256_phone_number, 'teléfono inválido no se hashea');
  assert.deepStrictEqual(nullKeys(p), []);
  delete globalThis.__rl;
});

test('buildLeadSubmit: sin bootstrap (__rl ausente) transaction_id === lead_id con UUID nuevo', async function () {
  delete globalThis.__rl;
  const p = await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '5558788983', verdict: VEREDICTO_A });
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

test('classifySubmitError: códigos de fricción sin valores del formulario', function () {
  assert.deepStrictEqual(RL.classifySubmitError({ tipo: 'turnstile' }), ['network_error', 'turnstile_unavailable']);
  assert.deepStrictEqual(RL.classifySubmitError({ tipo: 'sin_token' }), ['network_error', 'network']);
  assert.deepStrictEqual(RL.classifySubmitError({ tipo: 'network_error' }), ['network_error', 'network']);
  assert.deepStrictEqual(RL.classifySubmitError({ code: 'rate_limited', message: 'x' }), ['server_error', 'rate_limited']);
  assert.deepStrictEqual(RL.classifySubmitError({ code: 'form_expired' }), ['server_error', 'form_expired']);
  assert.deepStrictEqual(RL.classifySubmitError({ code: 'validation', campo: 'telefono' }), ['server_error', 'telefono']);
  assert.deepStrictEqual(RL.classifySubmitError({ delServidor: true }), ['server_error', undefined]);
  assert.deepStrictEqual(RL.classifySubmitError(null), ['server_error', undefined]);
  globalThis.dataLayer = [];
  const fe = RL.classifySubmitError({ code: 'rate_limited' });
  RL.pushFormError(fe[0], fe[1]);
  assert.deepStrictEqual(Object.keys(globalThis.dataLayer[1].rl_event_data).sort(), ['error_field', 'error_type', 'event_id', 'form_id']);
  delete globalThis.dataLayer;
});

test('rl_lead_submit en el dataLayer: ningún valor contiene PII en claro', async function () {
  globalThis.dataLayer = [];
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', touchCount: 1, daysSinceFirstTouch: 0 };
  const p = await RL.buildLeadSubmit({ email: 'Maria@Empresa.mx', phoneRaw: '55 5878 8983', verdict: VEREDICTO_A });
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

test('rl_non_commercial_submit: reset previo, payload mínimo + atribución sin PII, nunca rl_lead_submit', function () {
  const attr = { gclid: 'gclid-sintetico', ft: { source: 'google', medium: 'cpc', campaign: 'marca', landing_page: '/' }, lt: { source: '(direct)', medium: '(none)' }, tc: 2 };
  globalThis.document = { cookie: 'otra=1; rl_attr=' + encodeURIComponent(JSON.stringify(attr)) + '; rl_lid=x' };
  globalThis.__rl = { touchCount: 2, daysSinceFirstTouch: 3 };
  globalThis.dataLayer = [];
  try {
    RL.pushNonCommercialSubmit('job_seeker');
    const dl = globalThis.dataLayer;
    assert.strictEqual(dl.length, 2);
    assert.deepStrictEqual(dl[0], { rl_event_data: null });
    assert.strictEqual(dl[1].event, 'rl_non_commercial_submit');
    const d = dl[1].rl_event_data;
    assert.deepStrictEqual(Object.keys(d).sort(), ['applicant_type', 'attribution', 'event_id', 'form_id', 'form_location']);
    assert.strictEqual(d.applicant_type, 'job_seeker');
    assert.match(d.event_id, /^[0-9a-f-]{36}$/);
    assert.deepStrictEqual(d.attribution, { gclid: 'gclid-sintetico', first_touch: attr.ft, last_touch: attr.lt, touch_count: 2, days_since_first_touch: 3 });
    assert.ok(!dl.some(function (e) { return e.event === 'rl_lead_submit'; }));
    assert.ok(!/@|lead_quality_flag|lead_score|user_data/.test(JSON.stringify(d)), 'sin PII ni campos de conversión');
  } finally {
    delete globalThis.document; delete globalThis.__rl; delete globalThis.dataLayer;
  }
});

test('attributionFromCookie: sin cookie o con cookie corrupta devuelve solo lo que hay', function () {
  delete globalThis.__rl;
  assert.deepStrictEqual(RL.attributionFromCookie(''), {});
  assert.deepStrictEqual(RL.attributionFromCookie('rl_attr=%7Bnope'), {});
});

test('rl_lead_submit y rl_non_commercial_submit usan el event_id / lead_id que confirmó el servidor', async function () {
  delete globalThis.__rl;
  const ev = '11111111-2222-4333-8444-555555555555', lid = '66666666-7777-4888-9999-aaaaaaaaaaaa';
  const p = await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '5558788983', eventId: ev, leadId: lid, verdict: VEREDICTO_A });
  assert.deepStrictEqual([p.event_id, p.lead_id, p.transaction_id], [ev, lid, lid]);
  globalThis.dataLayer = [];
  RL.pushNonCommercialSubmit('student', ev);
  assert.strictEqual(globalThis.dataLayer[1].rl_event_data.event_id, ev);
  delete globalThis.dataLayer;
  assert.deepStrictEqual(RL.classifySubmitError({ code: 'destination_error' }), ['server_error', 'destination_error']);
});

test('user_data: SHA-256 de nombre y apellido normalizados (minúsculas, sin acentos, sin espacios extremos) en address', async function () {
  delete globalThis.__rl;
  const p = await RL.buildLeadSubmit({
    email: 'ana@empresa.mx', phoneRaw: '5558788983', firstName: '  María   José ', lastName: 'NÚÑEZ ',
    verdict: VEREDICTO_A
  });
  assert.strictEqual(RL.normalizeName('  María   José '), 'maria jose');
  assert.strictEqual(RL.normalizeName('NÚÑEZ '), 'nunez');
  assert.deepStrictEqual(p.user_data.address, { sha256_first_name: sha('maria jose'), sha256_last_name: sha('nunez') });
  // Mismo hash con o sin acentos / mayúsculas
  const q = await RL.buildLeadSubmit({ email: 'ana@empresa.mx', firstName: 'maria jose', lastName: 'Nunez', verdict: VEREDICTO_A });
  assert.deepStrictEqual(q.user_data.address, p.user_data.address);
  // Sin nombre no hay address
  const r = await RL.buildLeadSubmit({ email: 'ana@empresa.mx', verdict: VEREDICTO_A });
  assert.ok(!('address' in r.user_data));
});

test('user_data: teléfono E.164 de otro país (lo arma el formulario) y fallback a la regla de México', async function () {
  delete globalThis.__rl;
  const us = await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '202 555 0123', phoneE164: '+12025550123', verdict: VEREDICTO_A });
  assert.strictEqual(us.user_data.sha256_phone_number, sha('+12025550123'));
  const mx = await RL.buildLeadSubmit({ email: 'a@empresa.mx', phoneRaw: '+52 1 55 5878 8983', phoneE164: 'no-es-e164', verdict: VEREDICTO_A });
  assert.strictEqual(mx.user_data.sha256_phone_number, sha('+525558788983'));
});

test('dataLayer completo del flujo: ningún valor contiene PII en claro y user_data solo trae hashes', async function () {
  // Datos sintéticos con valores fáciles de rastrear
  const pii = {
    nombre: 'Anacleta', apellido: 'Zubizarreta', email: 'anacleta.zubi@empresa-qa.example',
    telefono: '55 9876 5432', empresa: 'Maquiladora Rastreable QA', sitio: 'maquiladora-rastreable.example',
    necesidad: 'Necesitamos rastrear que esta frase jamás aparezca en el dataLayer'
  };
  const agujas = [pii.nombre, pii.apellido, pii.email, 'anacleta.zubi', '9876', '5598765432', pii.empresa,
    'Rastreable', pii.sitio, 'jamás aparezca'].map(function (x) { return x.toLowerCase(); });
  globalThis.__rl = { leadId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', touchCount: 1, daysSinceFirstTouch: 0 };
  globalThis.document = { cookie: 'rl_attr=' + encodeURIComponent(JSON.stringify({ gclid: 'gclid-sintetico', ft: { source: 'google', medium: 'cpc' } })) };
  globalThis.dataLayer = [];
  try {
    RL.pushEvent('rl_form_start', { form_id: 'agenda_diagnostico', form_location: 'contacto' });
    RL.pushEvent('rl_form_submit_attempt', { form_id: 'agenda_diagnostico', form_location: 'contacto' });
    RL.pushFormError('client_validation', 'telefono');
    const fe = RL.classifySubmitError({ code: 'validation', campo: 'empresa' });
    RL.pushFormError(fe[0], fe[1]);
    RL.pushNonCommercialSubmit('student', '11111111-2222-4333-8444-555555555555');
    const p = await RL.buildLeadSubmit({
      email: pii.email, phoneRaw: pii.telefono, phoneE164: '+525598765432', firstName: pii.nombre, lastName: pii.apellido,
      sizeBucket: '11_50', pilar: 'CRM + Automatización', t0: Date.now() - 60000, eventId: '11111111-2222-4333-8444-555555555555',
      verdict: { lead_quality_flag: 'clean', lead_score: 83, lead_tier: 'A', email_domain_type: 'corporate' }
    });
    RL.pushEvent('rl_lead_submit', p);

    const eventos = globalThis.dataLayer.filter(function (e) { return e.event; }).map(function (e) { return e.event; });
    assert.deepStrictEqual(eventos, ['rl_form_start', 'rl_form_submit_attempt', 'rl_form_error', 'rl_form_error', 'rl_non_commercial_submit', 'rl_lead_submit']);
    (function recorrer(v, ruta) {
      if (v && typeof v === 'object') { Object.keys(v).forEach(function (k) { recorrer(v[k], ruta + '.' + k); }); return; }
      if (typeof v === 'string' || typeof v === 'number') {
        const t = String(v).toLowerCase();
        agujas.forEach(function (a) { assert.ok(t.indexOf(a) === -1, 'PII "' + a + '" en ' + ruta); });
        assert.ok(t.indexOf('@') === -1, 'valor con @ en ' + ruta);
      }
    })(globalThis.dataLayer, 'dataLayer');
    const ud = p.user_data;
    [ud.sha256_email_address, ud.sha256_phone_number, ud.address.sha256_first_name, ud.address.sha256_last_name]
      .forEach(function (h) { assert.match(h, /^[0-9a-f]{64}$/); });
    assert.strictEqual(ud.sha256_phone_number, sha('+525598765432'));
  } finally {
    delete globalThis.__rl; delete globalThis.document; delete globalThis.dataLayer;
  }
});
