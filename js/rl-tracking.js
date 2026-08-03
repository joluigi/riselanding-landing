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

  function crossedThresholds(prevMax, pct) {
    var out = [], ts = [25, 50, 75, 90];
    for (var i = 0; i < ts.length; i++) {
      if (pct >= ts[i] && prevMax < ts[i]) out.push(ts[i]);
    }
    return out;
  }

  function engagedReady(s) {
    return !s.engagedFired && s.visibleMs >= 45000 && s.maxScroll >= 50 && s.interactions >= 2;
  }

  function sha256hex(str) {
    var c = cryptoObj();
    if (!(c && c.subtle && typeof TextEncoder !== 'undefined')) return Promise.resolve(null);
    return c.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      var out = '', v = new Uint8Array(buf);
      for (var i = 0; i < v.length; i++) out += ('0' + v[i].toString(16)).slice(-2);
      return out;
    }).catch(function () { return null; });
  }

  function buildLeadSubmit(f) {
    var ctx = global.__rl || {};
    var emailNorm = String(f.email || '').trim().toLowerCase();
    var e164 = phoneE164MX(f.phoneRaw);
    var emailType = emailDomainType(emailNorm);
    var q = leadScore({
      emailType: emailType, hasCompany: !!f.hasCompany, sizeBucket: f.sizeBucket || null,
      phoneValid: !!e164, servicesCount: f.servicesCount || 0, honeypotFilled: !!f.honeypotFilled
    });
    var payload = {
      event_id: uuid(),
      transaction_id: ctx.leadId || null,
      lead_id: ctx.leadId || null,
      form_id: 'agenda_diagnostico', form_location: 'contacto', lead_source_channel: 'form',
      service_line: serviceLineFromPilar(f.pilar), assigned_partner: 'ambos',
      prospect_segment: null, prospect_geo: null,
      company_size_bucket: f.sizeBucket || null,
      operation_volume_bucket: null, current_marketing_maturity: null,
      email_domain_type: emailType,
      lead_quality_flag: q.flag, lead_score: q.score, lead_tier: q.tier,
      vertical_fit: 'horizontal', segment_match: null,
      time_to_convert_sec: f.t0 ? Math.max(0, Math.round((Date.now() - f.t0) / 1000)) : null,
      touch_count: (typeof ctx.touchCount === 'number') ? ctx.touchCount : null,
      days_since_first_touch: (typeof ctx.daysSinceFirstTouch === 'number') ? ctx.daysSinceFirstTouch : null
    };
    return Promise.all([
      sha256hex(emailNorm),
      e164 ? sha256hex(e164) : Promise.resolve(null)
    ]).then(function (hs) {
      var ud = {};
      if (hs[0]) ud.sha256_email_address = hs[0];
      if (hs[1]) ud.sha256_phone_number = hs[1];
      if (ud.sha256_email_address || ud.sha256_phone_number) payload.user_data = ud;
      return payload;
    });
  }

  var RL = {
    uuid: uuid, pushEvent: pushEvent, emailDomainType: emailDomainType,
    phoneE164MX: phoneE164MX, leadScore: leadScore,
    serviceLineFromPilar: serviceLineFromPilar, prefilledRef: prefilledRef,
    sha256hex: sha256hex, buildLeadSubmit: buildLeadSubmit,
    _crossedThresholds: crossedThresholds, _engagedReady: engagedReady
  };

  global.RL = RL;
  if (typeof module !== 'undefined' && module.exports) module.exports = RL;
  if (typeof global.document === 'undefined') return; // Node: solo el núcleo

  // --- Listeners DOM ---
  function initDom() {
    var state = { maxScroll: 0, interactions: 0, engagedFired: false, visibleMs: 0 };

    function scrollPct() {
      var doc = document.documentElement;
      var h = (doc.scrollHeight - doc.clientHeight) || 1;
      var y = window.pageYOffset || doc.scrollTop || 0;
      return Math.min(100, Math.round((y / h) * 100));
    }

    // rl_engaged_session: 45 s visibles + scroll 50% + 2 interacciones (§2.3)
    function maybeEngaged() {
      if (!engagedReady(state)) return;
      state.engagedFired = true;
      clearInterval(engagedTimer);
      pushEvent('rl_engaged_session', {
        engagement_time_sec: Math.round(state.visibleMs / 1000),
        max_scroll_pct: state.maxScroll,
        interaction_count: state.interactions
      });
    }
    var engagedTimer = setInterval(function () {
      if (document.visibilityState === 'visible') state.visibleMs += 5000;
      maybeEngaged();
    }, 5000);
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('a, button, input, select, textarea, label, .svc-tab, .faq-q')) state.interactions++;
    }, { passive: true, capture: true });
    document.addEventListener('keydown', function (e) {
      if (e.target && e.target.closest && e.target.closest('a, button, input, select, textarea, label, .svc-tab, .faq-q')) state.interactions++;
    }, { passive: true, capture: true });

    // rl_scroll_depth (25/50/75/90) + rl_case_study_view (#resultados al 75%)
    var resEl = document.getElementById('resultados');
    var resFired = false;
    function checkCaseStudy() {
      if (resFired || !resEl) return;
      var r = resEl.getBoundingClientRect();
      if (r.height <= 0) return;
      var read = Math.round(((window.innerHeight - r.top) / r.height) * 100);
      if (read >= 75) {
        resFired = true;
        pushEvent('rl_case_study_view', {
          case_id: 'resultados_home', case_segment: 'general_b2b_mx',
          read_depth_pct: Math.min(100, read)
        });
      }
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var pct = scrollPct();
        var cruzados = crossedThresholds(state.maxScroll, pct);
        if (pct > state.maxScroll) state.maxScroll = pct;
        for (var i = 0; i < cruzados.length; i++) {
          pushEvent('rl_scroll_depth', { threshold: cruzados[i] });
        }
        checkCaseStudy();
        maybeEngaged();
      });
    }, { passive: true });

    // rl_service_view: 20 s acumulados con #servicios visible (pausa fuera de viewport/pestaña)
    (function watchServicios() {
      var el = document.getElementById('servicios');
      if (!el || !('IntersectionObserver' in window)) return;
      var visible = false, acc = 0, done = false;
      var io = new IntersectionObserver(function (es) {
        for (var i = 0; i < es.length; i++) visible = es[i].isIntersecting;
      }, { threshold: 0.4 });
      io.observe(el);
      var t = setInterval(function () {
        if (done) return;
        if (visible && document.visibilityState === 'visible') acc += 1000;
        if (acc >= 20000) {
          done = true; clearInterval(t); io.disconnect();
          pushEvent('rl_service_view', {
            service_line: 'paquete_integral', assigned_partner: 'ambos',
            dwell_time_sec: Math.round(acc / 1000)
          });
        }
      }, 1000);
    })();

    // rl_phone_click + rl_whatsapp_click (dormido hasta que exista un enlace wa.me; C-19)
    var phoneFired = false, waFired = false;
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) {
        if (phoneFired) return;
        phoneFired = true;
        pushEvent('rl_phone_click', { cta_location: a.closest('footer') ? 'footer' : 'body' });
      } else if (href.indexOf('wa.me') !== -1) {
        if (waFired) return;
        waFired = true;
        var ctx = global.__rl || {};
        var ref = prefilledRef(ctx.leadId);
        try {
          var u = new URL(a.href);
          var txt = u.searchParams.get('text') || '';
          u.searchParams.set('text', (txt ? txt + ' ' : '') + '[' + ref + ']');
          a.href = u.toString();
        } catch (err) { /* URL inválida: el clic sigue, solo sin ref */ }
        pushEvent('rl_whatsapp_click', {
          transaction_id: ctx.leadId || null, prefilled_ref: ref,
          cta_location: a.closest('footer') ? 'footer' : 'body',
          service_line: 'paquete_integral'
        });
      }
    }, true);

    // rl_form_start: primer focus en el formulario (1× por instancia)
    var form = document.getElementById('lead-form');
    if (form) {
      var started = false;
      form.addEventListener('focusin', function () {
        if (started) return;
        started = true;
        pushEvent('rl_form_start', { form_id: 'agenda_diagnostico', form_location: 'contacto' });
      });
    }
  }

  try { initDom(); } catch (e) { /* el tracking jamás rompe la página */ }
})(typeof window !== 'undefined' ? window : globalThis);
