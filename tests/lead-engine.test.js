'use strict';
// Motor de calidad (Fase 3). Fixtures 100 % sintéticos: nombres inventados, dominios .example
// (RFC 2606) o gratuitos con usuarios inventados, teléfonos 55 0000 0000.
// Cada fixture documenta su cálculo de spam_points y lead_score.
const { test } = require('node:test');
const assert = require('node:assert');
const E = require('../lib/lead-quality/engine.js');
const S = require('../lib/lead-quality/schema.js');

const LISTAS = {
  junkCompany: require('../lib/lead-quality/data/junk-company.json').values,
  freeEmail: require('../lib/lead-quality/data/free-email-domains.json').domains,
  disposable: require('../lib/lead-quality/data/disposable-email-domains.json').domains,
  agencyDenylist: ['agencia-rival.example']
};

const TEL_OK = '55 0000 0000';
const CRM = ['Implementación de CRM'];
const MSG_OK = 'Queremos ordenar el seguimiento de prospectos en un CRM.';

function lead(extra) {
  return Object.assign({
    solicitante: 'empresa', nombre: 'Ana', apellido: 'Prueba', email: 'ana@empresa-sintetica.example',
    telefono: TEL_OK, telefono_pais: 'MX', empresa: 'Empresa Sintética Uno', sitio_web: '',
    tamano: '1_10', servicios: CRM, presupuesto: 'sin_definir', necesidad: MSG_OK
  }, extra || {});
}
function evaluar(extra) { return E.evaluateLead(lead(extra), { listas: LISTAS }); }

// --- Fixtures de la especificación (§ Fase 9), con las reglas acordadas ---

test('F1 · "Q Q", empresa "Q", tel 1234567890, correo sin relación, 200+ → spam', function () {
  // spam_points: name_single_letters +3 · phone_invalid_prefix_1 +2 (10 dígitos, empieza en 1)
  //   · "Q" no está en la lista basura ni es aleatoria · la regla correo/nombre no aplica
  //   (el nombre no tiene palabras de 3+ letras) = 5 ≥ 3 → spam
  // lead_score: empresa 20 · empresa válida 0 ("Q" < 2 caracteres) · tamaño 0 (empresa no válida)
  //   · 1 servicio 5 · mensaje 10 · teléfono inválido 0 = 35 → C
  const r = evaluar({ nombre: 'Q', apellido: 'Q', empresa: 'Q', telefono: '1234567890', email: 'zx9071@gmail.com', tamano: '200_plus' });
  assert.deepStrictEqual(r.signals, ['name_single_letters', 'phone_invalid_prefix_1']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [5, 'spam', 35, 'C']);
});

test('F2 · "Xkxkxkxlxlx 4prtqrk", empresa = teléfono de 11 dígitos, 6 servicios → spam', function () {
  // spam_points: name_random +3 ("xkxkxk" y "4prtqrk") · company_equals_phone +3
  //   · phone_invalid_len_11 +2 · all_services +1 · email_name_mismatch +1 (gratuito; "qq" no
  //   contiene "xkxkxkxlxlx" ni "prtqrk") = 10 → spam
  // lead_score: empresa 20 · 0 servicios en rango (6 marcados) · mensaje 10 = 30 → C
  const r = evaluar({ nombre: 'Xkxkxkxlxlx', apellido: '4prtqrk', empresa: '55000000001', telefono: '55000000001', email: 'qq12@gmail.com', servicios: S.SERVICIOS.slice() });
  assert.deepStrictEqual(r.signals, ['name_random', 'company_equals_phone', 'phone_invalid_len_11', 'all_services', 'email_name_mismatch']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [10, 'spam', 30, 'C']);
});

test('F3 · "Laura Méndez", empresa "Qwqwerty", lm4821@gmail.com → spam (secuencia de teclado)', function () {
  // spam_points: empresa aleatoria +2 por keyboard_sequence ("qwert"/"werty", 5+ teclas de la fila
  //   superior) · company_pair_repeat +0 (ya viene con otra señal aleatoria de la empresa: no suma
  //   encima) · email_name_mismatch +1 ("lm" no contiene "laura" ni "mendez") = 3 ≥ 3 → spam
  //   (Sin la regla de teclado eran 2 → suspect.)
  // lead_score: empresa 20 · empresa válida 10 (no está en la lista basura) · 1–10 3 · 1 servicio 5
  //   · mensaje 10 · teléfono 5 = 53 → B
  const r = evaluar({ nombre: 'Laura', apellido: 'Méndez', empresa: 'Qwqwerty', email: 'lm4821@gmail.com' });
  assert.deepStrictEqual(r.signals, ['keyboard_sequence', 'company_pair_repeat', 'email_name_mismatch']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [3, 'spam', 53, 'B']);
});

test('F4 · "Diana Ruiz", empresa "Bro", tel de 8 dígitos, zorro991@gmail.com, 51–200 → spam', function () {
  // spam_points: phone_invalid_len_8 +2 · company_junk +1 · company_junk_large_size +1
  //   · email_name_mismatch +1 ("zorro" no contiene "diana" ni "ruiz") = 5 → spam
  // lead_score: empresa 20 · 1 servicio 5 · mensaje 10 = 35 → C (además, forzado por empresa basura)
  const r = evaluar({ nombre: 'Diana', apellido: 'Ruiz', empresa: 'Bro', telefono: '55000000', email: 'zorro991@gmail.com', tamano: '51_200' });
  assert.deepStrictEqual(r.signals, ['phone_invalid_len_8', 'company_junk', 'company_junk_large_size', 'email_name_mismatch']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [5, 'spam', 35, 'C']);
});

test('F5 · "Marta Solís", empresa "Ama de casa", martasolis77@gmail.com, tel válido, 1 servicio → suspect, tier C', function () {
  // spam_points: company_junk +1 · email_name_match −1 ("martasolis" contiene "marta") = 0
  // lead_score: empresa 20 · empresa no válida 0 · tamaño 0 · 1 servicio 5 · mensaje 10
  //   · teléfono 5 = 40 → B, pero la empresa basura FUERZA tier C
  // flag: correo gratuito sin sitio y tier C → suspect
  const r = evaluar({ nombre: 'Marta', apellido: 'Solís', empresa: 'Ama de casa', email: 'martasolis77@gmail.com' });
  assert.deepStrictEqual(r.signals, ['company_junk', 'email_name_match', 'tier_forced_c_company_junk', 'free_email_no_site_tier_c']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [0, 'suspect', 40, 'C']);
});

test('F6 · "Pablo Ríos", empresa "Nada", pabloriosx@gmail.com, tel válido, CRM, 11–50 → suspect, tier C', function () {
  // spam_points: company_junk +1 · email_name_match −1 ("pabloriosx" contiene "pablo") = 0
  // lead_score: empresa 20 · empresa no válida 0 · 11–50 no suma (empresa no válida) · 1 servicio 5
  //   · mensaje 10 · teléfono 5 = 40 → B → forzado a C por empresa basura
  const r = evaluar({ nombre: 'Pablo', apellido: 'Ríos', empresa: 'Nada', email: 'pabloriosx@gmail.com', tamano: '11_50' });
  assert.deepStrictEqual(r.signals, ['company_junk', 'email_name_match', 'tier_forced_c_company_junk', 'free_email_no_site_tier_c']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [0, 'suspect', 40, 'C']);
});

test('F7 · solicitante "Busco empleo" → job_seeker (la ruta nunca lo reenvía; ver lead-api.test.js)', function () {
  // spam_points: 0 · lead_score: empleo 0 · empresa válida 10 · correo corporativo 15 · 1–10 3
  //   · 1 servicio 5 · mensaje 10 · teléfono 5 = 48 → B · flag por tipo de solicitante: job_seeker
  //   (el tier no importa: job_seeker nunca se reenvía ni se publica como rl_lead_submit)
  const r = evaluar({ solicitante: 'empleo' });
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier], [0, 'job_seeker', 48, 'B']);
});

test('F8 · "Mi empresa", Transportes Norte, correo y sitio del mismo dominio, 11–50, $10–25k → clean, tier A', function () {
  // spam_points: 0 (correo corporativo: la regla correo/nombre no aplica)
  // lead_score: empresa 20 · empresa válida 10 · sitio 10 · correo corporativo 15 · mismo dominio 5
  //   · 11–50 10 · $10–25k 8 · 1 servicio 5 · mensaje (60 caracteres) 10 · teléfono 5 = 98 → A
  const mensaje = 'Queremos más cotizaciones de clientes del Bajío por WhatsApp';
  assert.strictEqual(mensaje.length, 60);
  const r = evaluar({
    nombre: 'Ana', apellido: 'Robles', empresa: 'Transportes Norte', email: 'ana@transportesnorte.example',
    sitio_web: S.normalizarSitio('transportesnorte.example').valor, tamano: '11_50', presupuesto: '10k_25k', necesidad: mensaje
  });
  assert.deepStrictEqual(r.signals, []);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier, r.email_domain_type], [0, 'clean', 98, 'A', 'corporate']);
});

test('F9 · "Mi empresa", Agencia Aduanal Vega, Gmail que coincide con el nombre, sin sitio, 1–10 → clean, tier B', function () {
  // spam_points: email_name_match −1 ("sofiavegaaduanal" contiene "sofia" y "vega") = −1
  // lead_score: empresa 20 · empresa válida 10 · 1–10 3 · "Aún no lo defino" 0 · 1 servicio 5
  //   · mensaje 10 · teléfono 5 = 53 → B · gratuito sin sitio pero tier B → clean
  const r = evaluar({ nombre: 'Sofía', apellido: 'Vega', empresa: 'Agencia Aduanal Vega', email: 'sofia.vega.aduanal@gmail.com' });
  assert.deepStrictEqual(r.signals, ['email_name_match']);
  assert.deepStrictEqual([r.spam_points, r.lead_quality_flag, r.lead_score, r.lead_tier, r.email_domain_type], [-1, 'clean', 53, 'B', 'free']);
});

// --- Reglas acordadas y bordes ---

test('par repetido en empresa: +1 solo (suspect, no spam); +2 con otra señal aleatoria; sin doble conteo', function () {
  const solo = evaluar({ empresa: 'Papelería Papalote' });
  assert.deepStrictEqual([solo.spam_points, solo.lead_quality_flag], [1, 'suspect']);
  assert.ok(solo.signals.indexOf('company_pair_repeat') !== -1);
  const conNombre = evaluar({ empresa: 'Ufufijdic', nombre: 'Xkxkxk' }); // name_random +3 y par +2
  assert.strictEqual(conNombre.spam_points, 5);
  const conAleatoria = evaluar({ empresa: 'Qwqw Xjkzt' }); // company_random +2; el par no suma encima
  assert.deepStrictEqual([conAleatoria.spam_points, conAleatoria.signals.slice(0, 2)], [2, ['company_random', 'company_pair_repeat']]);
});

test('correo corporativo: la regla de coincidencia correo/nombre no aplica', function () {
  const r = evaluar({ email: 'ventas@empresa-sintetica.example' });
  assert.ok(r.signals.indexOf('email_name_mismatch') === -1 && r.signals.indexOf('email_name_match') === -1);
  assert.strictEqual(r.spam_points, 0);
});

test('Gmail por sí solo no es spam ni suspect si el resto es bueno', function () {
  const r = evaluar({ email: 'ana.prueba.sintetica@gmail.com', presupuesto: '25k_50k', tamano: '11_50' });
  assert.deepStrictEqual([r.lead_quality_flag, r.spam_points], ['clean', -1]);
});

test('empresa numérica y aleatoria', function () {
  assert.deepStrictEqual(evaluar({ empresa: '12345' }).signals.slice(0, 1), ['company_numeric']);
  assert.strictEqual(evaluar({ empresa: '12345' }).spam_points, 3);
  const r = evaluar({ empresa: 'Xjkzt Comercial' });
  assert.deepStrictEqual([r.spam_points, r.signals[0]], [2, 'company_random']);
});

test('agency-denylist: dominio del correo o del sitio → competitor', function () {
  assert.strictEqual(evaluar({ email: 'ana@agencia-rival.example' }).lead_quality_flag, 'competitor');
  assert.strictEqual(evaluar({ sitio_web: 'https://www.agencia-rival.example' }).lead_quality_flag, 'competitor');
  assert.ok(evaluar({ email: 'ana@mx.agencia-rival.example' }).signals.indexOf('agency_denylist') !== -1);
});

test('precedencia: spam gana a solicitante no comercial; bot_signal → spam directo', function () {
  assert.strictEqual(evaluar({ solicitante: 'personal', nombre: 'T', apellido: 'T', telefono: '55000000' }).lead_quality_flag, 'spam');
  const b = evaluar({ bot_signal: 'honeypot' });
  assert.deepStrictEqual([b.lead_quality_flag, b.signals[0]], ['spam', 'bot_honeypot']);
});

test('tiers en los bordes y tope en 100', function () {
  // Máximo teórico: 20+10+10+15+5+15+15+5+10+5 = 110 → 100
  const max = evaluar({ email: 'ana@maxima.example', sitio_web: 'https://maxima.example', tamano: '51_200', presupuesto: 'mas_50k' });
  assert.deepStrictEqual([max.lead_score, max.lead_tier], [100, 'A']);
  // 70 exacto → A: emprendimiento 8 + empresa 10 + corporativo 15 + 51–200 15 + $25–50k 12 + 1 servicio 5 + teléfono 5 (sin mensaje)
  const a70 = evaluar({ solicitante: 'emprendimiento', email: 'ana@c.example', tamano: '51_200', presupuesto: '25k_50k', necesidad: '' });
  assert.deepStrictEqual([a70.lead_score, a70.lead_tier], [70, 'A']);
  // 40 exacto → B: empresa 20 + empresa 10 + gratuito 0 + sin tamaño + 1 servicio 5 + teléfono 5 (sin mensaje)
  const b40 = evaluar({ email: 'ana.prueba@gmail.com', tamano: '', necesidad: '' });
  assert.deepStrictEqual([b40.lead_score, b40.lead_tier], [40, 'B']);
  // 36 → C: emprendimiento 8 + empresa 10 + 1–10 3 + 1 servicio 5 + mensaje 10 + gratuito 0 + teléfono inválido 0
  const c = evaluar({ solicitante: 'emprendimiento', email: 'ana.prueba@gmail.com', telefono: '5500' });
  assert.deepStrictEqual([c.lead_score, c.lead_tier], [36, 'C']);
  // Otros valores de referencia
  assert.strictEqual(evaluar({ presupuesto: '10k_25k', email: 'ana@c.example' }).lead_score, 76); // 20+10+15+3+8+5+10+5
  assert.strictEqual(evaluar({ solicitante: 'emprendimiento', email: 'ana@c.example', tamano: '51_200', necesidad: '' }).lead_score, 58);
});

test('mensaje: siglas del negocio no cuentan como tecleo al azar; basura sí', function () {
  // Base: 20 + 10 + corporativo 15 + 1–10 3 + 1 servicio 5 + teléfono 5 = 58; mensaje válido +10
  assert.strictEqual(evaluar({ necesidad: 'Necesitamos un CRM y reportes KPI en HTML para ventas B2B.' }).lead_score, 68);
  assert.strictEqual(evaluar({ necesidad: 'fkfkfkflflf asdkjh qwrtplk zzxxccvvbb nnmm prueba' }).lead_score, 58);
});

test('contenido heredado: URLs, palabras spam y cirílico siguen puntuando', function () {
  const r = evaluar({ necesidad: 'Visita casino-sintetico.xyz y gana dinero con nosotros ya mismo hoy' });
  assert.ok(r.signals.indexOf('url_in_message') !== -1);
  assert.ok(r.signals.indexOf('spam_keyword_gana_dinero') !== -1);
  assert.strictEqual(r.lead_quality_flag, 'spam'); // 1 + 2 = 3
});

test('email_domain_type: corporate / free / disposable', function () {
  assert.strictEqual(evaluar({ email: 'a@empresa.example' }).email_domain_type, 'corporate');
  assert.strictEqual(evaluar({ email: 'a@outlook.es' }).email_domain_type, 'free');
  assert.strictEqual(evaluar({ email: 'a@x.mailinator.com' }).email_domain_type, 'disposable');
});

test('señales de auditoría externas se agregan sin puntos', function () {
  const r = evaluar({ extra_signals: ['turnstile_unavailable', 'fast_submit_lt_8s'] });
  assert.deepStrictEqual([r.spam_points, r.signals], [0, ['turnstile_unavailable', 'fast_submit_lt_8s']]);
});

test('ninguna salida trae PII: solo códigos legibles', function () {
  const r = evaluar({ nombre: 'Diana', apellido: 'Ruiz', empresa: 'Bro', email: 'zorro991@gmail.com', telefono: '55000000' });
  const txt = JSON.stringify(r);
  ['diana', 'ruiz', 'zorro', '55000000'].forEach(function (x) { assert.ok(txt.toLowerCase().indexOf(x) === -1, x); });
  r.signals.forEach(function (s) { assert.match(s, /^[a-z0-9_]+$/); });
});

// --- Ajustes de la Fase 3 aprobada: teclado, URLs propias, vocabulario del negocio ---

test('keyboard_sequence: 5+ teclas seguidas de una fila, en cualquier dirección, en nombre y empresa', function () {
  const casos = [['empresa', 'Asdfg Consultores'], ['empresa', 'Poiuy Studio'], ['empresa', 'Ñlkjh'], ['empresa', 'Zxcvb'], ['nombre', 'Qwerty']];
  casos.forEach(function (c) {
    const extra = {}; extra[c[0]] = c[1];
    const r = evaluar(extra);
    assert.ok(r.signals.indexOf('keyboard_sequence') !== -1, c[1]);
    assert.strictEqual(r.spam_points, c[0] === 'nombre' ? 3 : 2, c[1]);
  });
  // Nombre con ambas reglas (palabra aleatoria y teclado): +3 una sola vez
  const doble = evaluar({ nombre: 'Qwertyqwerty', apellido: 'Sdfghjk' });
  assert.strictEqual(doble.spam_points, 3);
});

test('keyboard_sequence: empresas reales NO la activan (con 4 teclas sí caían Liberty, Property, Wertheimer)', function () {
  ['Grupo Asdrúbal', 'Tertulia Café', 'Poiesis', 'Liberty Seguros', 'Property Solutions', 'Wertheimer Abogados',
    'Transportes Norte', 'Agencia Aduanal Vega', 'Querétaro Logística', 'Superiores Asociados'].forEach(function (e) {
    const r = evaluar({ empresa: e });
    assert.ok(r.signals.indexOf('keyboard_sequence') === -1, e);
    assert.strictEqual(r.spam_points, 0, e);
  });
});

test('URLs en el mensaje: la primera no suma si es del sitio o del correo corporativo; el resto +1 c/u hasta +3', function () {
  // La regex de URL heredada solo reconoce TLDs de una lista cerrada (.com, .net, .io…), a propósito,
  // para no confundir "S.A. de C.V."; por eso aquí se usan dominios .com inventados (y no .example/.mx).
  const conSitio = { sitio_web: 'https://sintetica-qa-uno.com', email: 'ana@sintetica-qa-uno.com' };
  function pts(necesidad, extra) { return evaluar(Object.assign({ necesidad: necesidad }, extra || {})); }
  const propio = pts('Pueden ver nuestro catálogo en sintetica-qa-uno.com para cotizar', conSitio);
  assert.deepStrictEqual([propio.spam_points, propio.signals], [0, ['own_url_in_message']]);
  // Dominio del correo corporativo aunque no haya sitio
  assert.strictEqual(pts('Catálogo en www.sintetica-qa-uno.com/productos, queremos más ventas', { email: 'ana@sintetica-qa-uno.com' }).spam_points, 0);
  // Propia + ajena: solo cuenta la ajena
  assert.strictEqual(pts('Catálogo en sintetica-qa-uno.com y referencia ajena-qa-dos.com para comparar', conSitio).spam_points, 1);
  // Ajenas: 1 → +1, 2 → +2, 4 → +3
  assert.strictEqual(pts('Queremos algo como ajena-qa-dos.com para vender más en línea').spam_points, 1);
  assert.strictEqual(pts('Queremos algo como ajena-qa-dos.com y ajena-qa-tres.com para vender').spam_points, 2);
  assert.strictEqual(pts('Ver a-qa.com b-qa.com c-qa.com d-qa.com para inspirarnos en el diseño nuevo').spam_points, 3);
  // Con correo gratuito, el dominio del correo NO cuenta como propio
  const gratis = pts('Nuestro correo es de gmail.com y todavía no tenemos sitio propio', { email: 'ana.prueba@gmail.com' });
  assert.deepStrictEqual(gratis.signals, ['email_name_match', 'url_in_message']); // −1 (coincide con "ana") +1 (URL)
  // Solo se perdona la PRIMERA URL: ajena primero y propia después → cuentan las dos
  assert.strictEqual(pts('Referencia ajena-qa-dos.com y catálogo en sintetica-qa-uno.com', conSitio).spam_points, 2);
  // URL en empresa sigue en +2
  assert.ok(evaluar({ empresa: 'www.sintetica-qa-uno.com' }).signals.indexOf('url_in_company') !== -1);
});

test('palabras spam: la lista no incluye vocabulario de nuestros servicios', function () {
  const servicios = ['seo', 'posicionamiento', 'google ads', 'ads', 'publicidad', 'marketing', 'crm', 'automatización',
    'automatizacion', 'landing', 'sitio web', 'leads', 'lead', 'campañas', 'campaña', 'sem', 'dashboards', 'web', 'ventas', 'whatsapp'];
  E.KEYWORDS_SPAM.forEach(function (k) {
    servicios.forEach(function (sv) { assert.ok(k.indexOf(sv) === -1 && sv.indexOf(k) === -1, k + ' choca con ' + sv); });
  });
});

test('mensaje legítimo con todo el vocabulario de servicios → 0 puntos de contenido', function () {
  const r = evaluar({
    necesidad: 'Necesitamos SEO y posicionamiento, campañas en Google Ads y Meta Ads, publicidad y marketing digital, ' +
      'un CRM con automatización, una landing y un sitio web nuevo para captar más leads y dar seguimiento por WhatsApp; ' +
      'también dashboards de ventas.'
  });
  assert.deepStrictEqual([r.spam_points, r.signals], [0, []]);
  assert.strictEqual(r.lead_quality_flag, 'clean');
});


test('URLs .mx y .com.mx: se detectan en el mensaje y como propias; "S.A. de C.V." no es URL', function () {
  function pts(necesidad, extra) { return evaluar(Object.assign({ necesidad: necesidad }, extra || {})); }
  assert.strictEqual(pts('Queremos algo parecido a ejemplo-qa-uno.mx para vender más').spam_points, 1);
  assert.strictEqual(pts('Referencias: ejemplo-qa-uno.com.mx y www.ejemplo-qa-dos.mx/tienda para comparar').spam_points, 2);
  assert.strictEqual(pts('Nuestro sitio anterior era sub.ejemplo-qa-uno.org.mx y ya no funciona').spam_points, 1);
  // Propia (.com.mx del sitio o del correo corporativo) no suma
  const propio = pts('Catálogo en ejemplo-qa-uno.com.mx, queremos más cotizaciones', { sitio_web: 'https://ejemplo-qa-uno.com.mx' });
  assert.deepStrictEqual([propio.spam_points, propio.signals], [0, ['own_url_in_message']]);
  assert.strictEqual(pts('Pedidos en ventas.ejemplo-qa-uno.mx y más', { email: 'ana@ejemplo-qa-uno.mx' }).spam_points, 0);
  // Razones sociales mexicanas: no son URL, ni en el mensaje ni en la empresa
  ['Somos Comercializadora Sintética S.A. de C.V. y queremos vender más en línea',
    'Grupo QA S.A.P.I. de C.V., S. de R.L. de C.V. y S.C. buscan más clientes en México',
    'Operamos en Méx. y Mty. desde hace años, queremos crecer con campañas'].forEach(function (m) {
    const r = pts(m);
    assert.ok(r.signals.indexOf('url_in_message') === -1, m);
  });
  ['Comercializadora Sintética S.A. de C.V.', 'Servicios QA S. de R.L. de C.V.'].forEach(function (e) {
    assert.ok(evaluar({ empresa: e }).signals.indexOf('url_in_company') === -1, e);
  });
  // Pero un dominio .mx como nombre de empresa sí es URL en empresa
  assert.ok(evaluar({ empresa: 'ejemplo-qa-uno.com.mx' }).signals.indexOf('url_in_company') !== -1);
});
