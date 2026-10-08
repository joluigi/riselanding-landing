// lib/lead-quality/engine.js — Motor de calidad de leads (Fase 3). Módulo puro, sin
// dependencias de framework: evaluateLead(input, opciones) →
//   { lead_quality_flag, lead_score, lead_tier, spam_points, signals[], email_domain_type }
// Lo usa el servidor (autoridad). UMD en ES5 como schema.js, del que reutiliza helpers.
// Las listas llegan en opciones.listas: { junkCompany, freeEmail, disposable, agencyDenylist }.
(function (root, factory) {
  var schema = (typeof module !== 'undefined' && module.exports) ? require('./schema.js') : root.LeadSchema;
  var api = factory(schema);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LeadEngine = api;
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  var SPAM_UMBRAL = 3;
  var TODOS_LOS_SERVICIOS = S.SERVICIOS.length;

  // Puntos comerciales (lead_score) — especificación §3.3
  var PUNTOS_SOLICITANTE = { empresa: 20, emprendimiento: 8 };
  var PUNTOS_TAMANO = { '1_10': 3, '11_50': 10, '51_200': 15, '200_plus': 15 };
  var PUNTOS_PRESUPUESTO = { sin_definir: 0, menos_10k: 2, '10k_25k': 8, '25k_50k': 12, mas_50k: 15 };
  var TAMANOS_GRANDES = ['51_200', '200_plus'];

  // Señales de contenido heredadas del scoring anterior de api/lead.js (se conservan sus puntos).
  // OJO: nada de términos legítimos del negocio (seo, sem, crm, marketing, ads, publicidad…).
  var KEYWORDS_SPAM = [
    'casino', 'viagra', 'cialis', 'porn', 'xxx', 'forex',
    'guest post', 'link insertion', 'gana dinero', 'make money fast',
    'lottery', 'lotería', 'préstamo urgente', 'loan approved',
    'hacking service', 'seguidores baratos', 'buy followers',
    'recover your funds', 'crypto investment', 'inversión en cripto'
  ];
  var RE_KEYWORDS = KEYWORDS_SPAM.map(function (k) {
    return new RegExp('(^|[^a-z0-9áéíóúñ])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9áéíóúñ])', 'i');
  });
  // TLDs de una lista cerrada (para no confundir abreviaturas como "S.A. de C.V.") + dominios
  // mexicanos: al menos una etiqueta de 2+ caracteres antes de .mx o .com.mx (ejemplo.mx,
  // ejemplo.com.mx, sub.ejemplo.org.mx). "C.V." o "S.A." no califican: son de una sola letra.
  // (La alternativa .mx va antes que la de .com para que "ejemplo.com.mx" no se corte en ".com".)
  var RE_URL = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9][a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com\.)?mx\b|\b[a-z0-9][a-z0-9.-]*\.(?:com|net|org|info|biz|io|co|ru|cn|xyz|top|site|online|club|shop|store|live|vip|link|click|icu|buzz|work|space|pro)\b/i;
  var RE_URL_G = new RegExp(RE_URL.source, 'gi');
  var RE_CIRILICO_CJK = /[Ѐ-ӿ一-鿿]/;

  function texto(v) { return (v === null || typeof v === 'undefined') ? '' : String(v); }
  function palabras(v) { return S.normalizarClave(v).split(' ').filter(Boolean); }
  function letras(p) { return p.replace(/[^a-z]/g, ''); }

  // Palabra "tecleada al azar" (§3.2): 4+ letras sin vocales, 5+ consonantes seguidas, el
  // mismo par repetido 3 veces seguidas, o letras mezcladas con dígitos. La "y" cuenta como
  // vocal para no castigar nombres como "Lynn". Se evalúa sin acentos y en minúsculas.
  function palabraAleatoria(p, opciones) {
    var o = opciones || {};
    if (!o.permitirDigitos && /[a-z]/.test(p) && /\d/.test(p)) return true;
    var l = letras(p);
    if (l.length >= 4 && !/[aeiouy]/.test(l)) return true;
    if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(l)) return true;
    if (/(..)\1\1/.test(l)) return true;
    return false;
  }

  function parRepetido(p) { return /([a-z]{2})\1/.test(letras(p)); }

  // Secuencias de teclado QWERTY en español: 5+ teclas seguidas de una fila, en cualquier
  // dirección (qwert, werty, asdfg, poiuy, ñlkjh…). Con 4 había falsos positivos reales:
  // "Liberty Seguros" y "Property" contienen "erty"; "Wertheimer", "wert".
  var FILAS_TECLADO = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
  var TRAMO_TECLADO = 5;
  var TRAMOS_TECLADO = [];
  FILAS_TECLADO.forEach(function (fila) {
    [fila, fila.split('').reverse().join('')].forEach(function (r) {
      for (var t = 0; t + TRAMO_TECLADO <= r.length; t++) TRAMOS_TECLADO.push(r.slice(t, t + TRAMO_TECLADO));
    });
  });
  // Minúsculas sin acentos pero conservando la ñ (normalizarClave la convierte en n)
  function letrasTeclado(p) {
    return texto(p).toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/[^a-zñ]/g, '');
  }
  function secuenciaTeclado(v) {
    return texto(v).split(/\s+/).some(function (p) {
      var l = letrasTeclado(p);
      return TRAMOS_TECLADO.some(function (t) { return l.indexOf(t) !== -1; });
    });
  }

  // Dominio de una URL encontrada en texto libre (sin esquema, www ni ruta)
  function dominioDeUrl(u) {
    return texto(u).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#:]/)[0].replace(/[.,;)]+$/, '');
  }
  function mismoDominio(a, b) {
    return !!a && !!b && (a === b || a.slice(-(b.length + 1)) === '.' + b || b.slice(-(a.length + 1)) === '.' + a);
  }

  function soloDigitos(v) { return texto(v).replace(/\D/g, ''); }

  function hostDe(url) {
    var m = texto(url).match(/^https?:\/\/([^/:?#]+)/i);
    return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
  }

  function dominioEnLista(dominio, lista) { return !!dominio && S.enLista(dominio, lista || []); }

  function tipoDeCorreo(dominio, listas) {
    if (dominioEnLista(dominio, listas.disposable)) return 'disposable';
    if (!dominio || (listas.freeEmail || []).indexOf(dominio) !== -1) return 'free';
    return 'corporate';
  }

  // Teléfono: válido si hay E.164 (lo calcula el servidor con libphonenumber) o, en México,
  // si cumple la regla de 10 dígitos. Si no, un código legible con la causa.
  function evaluarTelefono(input) {
    var pais = texto(input.telefono_pais) || 'MX';
    if (input.telefono_e164) return { valido: true, codigo: '' };
    if (pais === 'MX') {
      if (S.digitosMX(input.telefono)) return { valido: true, codigo: '' };
      var d = soloDigitos(input.telefono);
      if (d.length === 13 && d.slice(0, 3) === '521') d = d.slice(3);
      else if (d.length === 12 && d.slice(0, 2) === '52') d = d.slice(2);
      if (d.length === 10) return { valido: false, codigo: 'phone_invalid_prefix_' + d.charAt(0) };
      return { valido: false, codigo: 'phone_invalid_len_' + d.length };
    }
    return { valido: false, codigo: 'phone_invalid' };
  }

  function evaluateLead(input, opciones) {
    var i = input || {};
    var listas = (opciones && opciones.listas) || {};
    var senales = [];
    var puntos = 0;
    function senal(codigo, p) { senales.push(codigo); puntos += (p || 0); }

    // --- Veredicto spam directo (capas anti-bot) ---
    var bot = texto(i.bot_signal);

    // --- Nombre ---
    var palabrasNombre = palabras(texto(i.nombre) + ' ' + texto(i.apellido));
    var nombrePalabraAleatoria = palabrasNombre.some(function (p) { return palabraAleatoria(p); });
    var nombreTeclado = secuenciaTeclado(texto(i.nombre) + ' ' + texto(i.apellido));
    var nombreAleatorio = nombrePalabraAleatoria || nombreTeclado;
    if (palabrasNombre.length && palabrasNombre.every(function (p) { return letras(p).length <= 1; })) {
      senal('name_single_letters', 3);
    }
    // Nombre aleatorio: +3 una sola vez, aunque lo detecten ambas reglas
    if (nombreAleatorio) puntos += 3;
    if (nombrePalabraAleatoria) senales.push('name_random');
    if (nombreTeclado) senales.push('keyboard_sequence');

    // --- Empresa ---
    var empresa = texto(i.empresa).trim();
    var empresaClave = S.normalizarClave(empresa);
    var empresaDigitos = soloDigitos(empresa);
    var telDigitos = soloDigitos(i.telefono);
    var empresaBasura = S.esEmpresaBasura(empresa, listas.junkCompany);
    var empresaNumerica = !!empresaClave && /^[\d\s()+.\-]+$/.test(empresa) && empresaDigitos.length > 0;
    var empresaIgualTel = empresaDigitos.length >= 7 && telDigitos.length >= 7 &&
      (empresaDigitos === telDigitos || empresaDigitos.slice(-10) === telDigitos.slice(-10));
    if (empresaIgualTel) senal('company_equals_phone', 3);
    else if (empresaNumerica) senal('company_numeric', 3);

    var palabrasEmpresa = palabras(empresa);
    var empresaAleatoria = false, empresaPar = false;
    if (!empresaBasura && !empresaNumerica && !empresaIgualTel) {
      var empresaPalabraAleatoria = palabrasEmpresa.some(function (p) { return palabraAleatoria(p); });
      var empresaTeclado = secuenciaTeclado(empresa);
      empresaAleatoria = empresaPalabraAleatoria || empresaTeclado;
      empresaPar = palabrasEmpresa.some(parRepetido);
      // Empresa aleatoria: +2 una sola vez, aunque la detecten ambas reglas
      if (empresaAleatoria) puntos += 2;
      if (empresaPalabraAleatoria) senales.push('company_random');
      if (empresaTeclado && senales.indexOf('keyboard_sequence') === -1) senales.push('keyboard_sequence');
      if (empresaPar) {
        // +1 si es la única señal aleatoria; +2 si viene con otra (y nunca suma encima de company_random)
        var otraAleatoria = empresaAleatoria || nombreAleatorio;
        senales.push('company_pair_repeat');
        if (!empresaAleatoria) puntos += otraAleatoria ? 2 : 1;
      }
    }

    // --- Teléfono ---
    var tel = evaluarTelefono(i);
    if (!tel.valido) senal(tel.codigo, 2);

    // --- Empresa basura y tamaño ---
    if (empresaBasura) {
      senal('company_junk', 1);
      if (TAMANOS_GRANDES.indexOf(texto(i.tamano)) !== -1) senal('company_junk_large_size', 1);
    }

    // --- Servicios ---
    var servicios = Array.isArray(i.servicios) ? i.servicios : [];
    if (servicios.length >= TODOS_LOS_SERVICIOS) senal('all_services', 1);

    // --- Correo vs. nombre (solo dominios gratuitos) ---
    var email = texto(i.email).trim().toLowerCase();
    var dominio = S.dominioDe(email);
    var tipoCorreo = tipoDeCorreo(dominio, listas);
    if (tipoCorreo === 'free') {
      var local = S.normalizarClave(email.split('@')[0]).replace(/[^a-z]/g, '');
      var nombres3 = palabrasNombre.map(letras).filter(function (p) { return p.length >= 3; });
      if (nombres3.length) {
        var coincide = nombres3.some(function (p) { return local.indexOf(p) !== -1; });
        if (coincide) senal('email_name_match', -1);
        else senal('email_name_mismatch', 1);
      }
    }

    // --- Contenido (scoring anterior) ---
    var necesidad = texto(i.necesidad);
    if (RE_URL.test(texto(i.nombre) + ' ' + texto(i.apellido))) senal('url_in_name', 2);
    if (RE_URL.test(empresa)) senal('url_in_company', 2);
    if (RE_URL.test(texto(i.telefono))) senal('url_in_phone', 2);
    // URLs en el mensaje: la primera no suma si es del sitio informado o del dominio del correo
    // corporativo ("vean nuestro catálogo en empresa.mx"); el resto, +1 cada una hasta +3.
    var urlsMensaje = necesidad.match(RE_URL_G) || [];
    var dominioPropio = [hostDe(i.sitio_web), tipoCorreo === 'corporate' ? dominio : ''];
    if (urlsMensaje.length && dominioPropio.some(function (d) { return mismoDominio(dominioDeUrl(urlsMensaje[0]), d); })) {
      urlsMensaje = urlsMensaje.slice(1);
      senales.push('own_url_in_message');
    }
    if (urlsMensaje.length) senal('url_in_message', Math.min(urlsMensaje.length, 3));
    var todoTexto = (texto(i.nombre) + ' ' + texto(i.apellido) + ' ' + empresa + ' ' + necesidad).toLowerCase();
    for (var k = 0; k < KEYWORDS_SPAM.length; k++) {
      if (RE_KEYWORDS[k].test(todoTexto)) senal('spam_keyword_' + KEYWORDS_SPAM[k].replace(/\s+/g, '_'), 2);
    }
    if (RE_CIRILICO_CJK.test(todoTexto)) senal('cyrillic_cjk', 1);

    // Señales de auditoría que agrega la ruta (0 puntos): turnstile_unavailable, etc.
    (Array.isArray(i.extra_signals) ? i.extra_signals : []).forEach(function (s) { if (s) senales.push(String(s)); });

    // --- lead_score (0–100) ---
    var solicitante = texto(i.solicitante);
    var score = PUNTOS_SOLICITANTE[solicitante] || 0;
    var empresaValida = empresa.length >= 2 && !empresaBasura && !empresaNumerica && !empresaIgualTel;
    if (empresaValida) score += 10;
    var sitioHost = hostDe(i.sitio_web);
    if (i.sitio_web) score += 10;
    if (tipoCorreo === 'corporate') score += 15;
    if (tipoCorreo === 'corporate' && sitioHost && sitioHost !== 'instagram.com' &&
        (dominio === sitioHost || dominio.slice(-(sitioHost.length + 1)) === '.' + sitioHost)) score += 5;
    if (empresaValida) score += PUNTOS_TAMANO[texto(i.tamano)] || 0;
    score += PUNTOS_PRESUPUESTO[texto(i.presupuesto)] || 0;
    if (servicios.length >= 1 && servicios.length <= 3) score += 5;
    var palabrasMensaje = necesidad.split(/\s+/).filter(Boolean);
    var mensajeAleatorio = palabrasMensaje.some(function (p) {
      // Siglas del negocio (CRM, HTML, KPI…) no cuentan como tecleo al azar
      if (/^[A-ZÁÉÍÓÚÑ0-9]{2,5}[a-z]?$/.test(p.replace(/[^A-Za-zÁÉÍÓÚÑ0-9]/g, ''))) return false;
      return palabraAleatoria(S.normalizarClave(p), { permitirDigitos: true });
    });
    // Mensaje opcional: vacío o con menos de 20 caracteres no suma ni resta; 20+ sin tecleo al azar, +10.
    // (Las URLs del mensaje siguen sumando spam_points arriba, igual que antes.)
    if (S.normalizarClave(necesidad).length >= S.NECESIDAD_MIN_PUNTOS && !mensajeAleatorio) score += 10;
    if (tel.valido) score += 5;
    score = Math.max(0, Math.min(100, score));

    var tier = score >= 70 ? 'A' : (score >= 40 ? 'B' : 'C');
    if (empresaBasura && tier !== 'C') { tier = 'C'; senales.push('tier_forced_c_company_junk'); }

    // --- lead_quality_flag (precedencia §3.4) ---
    var flag;
    var tipo = S.SOLICITANTES[solicitante];
    var sitioDenylist = sitioHost && sitioHost !== 'instagram.com' && dominioEnLista(sitioHost, listas.agencyDenylist);
    if (bot) {
      senales.unshift('bot_' + bot);
      flag = 'spam';
    } else if (puntos >= SPAM_UMBRAL) {
      flag = 'spam';
    } else if (tipo && tipo.flag) {
      flag = tipo.flag;
    } else if (dominioEnLista(dominio, listas.agencyDenylist) || sitioDenylist) {
      senales.push('agency_denylist');
      flag = 'competitor';
    } else if (tipoCorreo === 'free' && !i.sitio_web && tier === 'C') {
      senales.push('free_email_no_site_tier_c');
      flag = 'suspect';
    } else if (empresaBasura || empresaPar) {
      flag = 'suspect';
    } else {
      flag = 'clean';
    }

    return {
      lead_quality_flag: flag,
      lead_score: score,
      lead_tier: tier,
      spam_points: puntos,
      signals: senales,
      email_domain_type: tipoCorreo
    };
  }

  return {
    evaluateLead: evaluateLead, palabraAleatoria: palabraAleatoria, secuenciaTeclado: secuenciaTeclado,
    SPAM_UMBRAL: SPAM_UMBRAL, KEYWORDS_SPAM: KEYWORDS_SPAM
  };
});
