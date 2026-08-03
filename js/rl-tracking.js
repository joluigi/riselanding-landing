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
