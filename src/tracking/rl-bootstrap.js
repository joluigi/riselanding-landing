// RL Bootstrap: identidad, atribución y Consent Mode v2. DEBE ir antes de GTM.
// Contrato: Guía de Tracking v2.1 §2.2 · docs/contrato-integraciones.md §2.
// Lo inyecta inline src/components/tracking/RlBootstrap.astro, precedido de
// window.__rlPage = { template, service_line, type, publish_date, is_landing_page, target_segment }.
// Sin __rlPage usa los valores históricos de la home (lp_home_v1). ES5 a propósito: lo prueba
// tests/rl-bootstrap.test.js en node:vm.
(function () {
  var now = new Date();
  // Parámetros de la página (los define el layout); defaults = valores previos al rediseño
  var P = window.__rlPage || {};
  var pg = {
    template: P.template || 'lp_home_v1',
    serviceLine: P.service_line || 'paquete_integral',
    type: P.type || 'landing',
    publishDate: P.publish_date || '2026-07-06',
    isLandingPage: typeof P.is_landing_page === 'boolean' ? P.is_landing_page : true,
    targetSegment: P.target_segment || 'general_b2b_mx'
  };

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
  } catch (e) { newSession = true; sid = Math.floor(now.getTime() / 1000) + '.noses'; }
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
  // Del referrer externo solo se guarda el origen (esquema + dominio): la ruta o el query de un
  // sitio ajeno podrían traer datos personales
  var refOrigen = null;
  if (refExterno) { try { refOrigen = new URL(ref).origin; } catch (e) { refOrigen = null; } }
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
      term: qs.get('utm_term') || null, timestamp: now.toISOString(), landing_page: location.pathname,
      // Aditivos (Fase 6 del lead quality gate): no cambian las llaves anteriores
      utm_id: qs.get('utm_id') || null, referrer: refOrigen
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

  // --- site.environment (guarda G5): 'production' solo en el dominio real ---
  var host = location.hostname;
  var env = (host === 'riselanding.com' || host === 'www.riselanding.com') ? 'production'
    : (!host || host === 'localhost' || host === '127.0.0.1' || host === '[::1]') ? 'development'
    : 'staging';

  // --- rl_context_ready (§2.2) ---
  var days = Math.max(0, Math.floor((now.getTime() - Date.parse(lid.fs)) / 86400000)) || 0;
  window.dataLayer.push({
    event: 'rl_context_ready',
    rl_schema_version: '2.2.0',
    site: { environment: env, domains: ['riselanding.com', 'www.riselanding.com'], currency: 'MXN' },
    page: {
      type: pg.type, service_line: pg.serviceLine, vertical_fit: 'horizontal',
      target_segment: pg.targetSegment, language: 'es-MX', template: pg.template,
      path: location.pathname, publish_date: pg.publishDate, is_landing_page: pg.isLandingPage,
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
    touchCount: attr.tc || 0, daysSinceFirstTouch: days, consentState: consentState,
    page: { template: pg.template, serviceLine: pg.serviceLine }
  };
})();
