'use strict';
// Esquema compartido del formulario (Fase 2). Datos 100 % sintéticos.
const { test } = require('node:test');
const assert = require('node:assert');
const S = require('../lib/lead-quality/schema.js');
const junk = require('../lib/lead-quality/data/junk-company.json');
const desechables = require('../lib/lead-quality/data/disposable-email-domains.json');

const LISTAS = { junkCompany: junk.values, disposable: desechables.domains };

function base(extra) {
  return Object.assign({
    solicitante: 'empresa', nombre: 'Ana Prueba', email: 'ana@empresa-sintetica.mx',
    telefono: '55 0000 0000', telefono_pais: 'MX', empresa: 'Empresa Sintética Uno', sitio_web: '',
    tamano: '11_50', servicios: ['Implementación de CRM'], presupuesto: 'sin_definir',
    necesidad: 'Queremos ordenar el seguimiento de prospectos en un CRM.', consentimiento: true
  }, extra || {});
}

function campos(v) { return v.errores.map(function (e) { return e.campo; }); }

test('listas de datos: al menos 100 dominios desechables y la lista basura de la especificación', function () {
  assert.ok(desechables.domains.length >= 100, 'hay ' + desechables.domains.length);
  desechables.domains.forEach(function (d) { assert.match(d, /^[a-z0-9.-]+\.[a-z]{2,}$/, d); });
  ['nada', 'ama de casa', 'niño', 'bro', 't', 'sí', 'n/a', '-'].forEach(function (v) {
    assert.ok(junk.values.indexOf(v) !== -1, v);
  });
});

test('envío completo válido: ok, sin errores y datos normalizados', function () {
  const v = S.validar(base({ nombre: '  aNA   maría   de la o ', email: ' Ana@Empresa-Sintetica.MX ' }), { listas: LISTAS });
  assert.deepStrictEqual(v.errores, []);
  assert.strictEqual(v.ok, true);
  assert.strictEqual(v.datos.nombreCompleto, 'Ana María de la O');
  assert.deepStrictEqual([v.datos.nombre, v.datos.apellido], ['Ana', 'María de la O']);
  assert.strictEqual(v.datos.email, 'ana@empresa-sintetica.mx');
  assert.strictEqual(v.datos.telefonoE164, '+525500000000');
  assert.strictEqual(v.datos.comercial, true);
  assert.strictEqual(v.datos.flagSolicitante, null);
});

test('nombre completo: Title Case, espacios colapsados y partículas en minúscula', function () {
  assert.strictEqual(S.validarNombreCompleto('  juan   carlos  pérez ').valor, 'Juan Carlos Pérez');
  assert.strictEqual(S.validarNombreCompleto('maría de los ángeles ruiz').valor, 'María de los Ángeles Ruiz');
  assert.strictEqual(S.validarNombreCompleto('ana-lucía torres').valor, 'Ana-Lucía Torres');
  assert.strictEqual(S.validarNombreCompleto("kevin o'neil").valor, "Kevin O'Neil");
});

test('nombre completo: al menos 2 palabras, la primera con 2+ letras; iniciales intermedias permitidas', function () {
  ['Juan C. Pérez', 'María de la O', 'Lu Wong', 'Ana Prueba'].forEach(function (n) {
    assert.strictEqual(S.validarNombreCompleto(n).error, '', n);
  });
  assert.strictEqual(S.validarNombreCompleto('Juan').error, 'nombre_una_palabra');
  assert.strictEqual(S.validarNombreCompleto('Juan .').error, 'nombre_una_palabra'); // "." no es palabra
  assert.strictEqual(S.validarNombreCompleto('T T').error, 'nombre_corto');
  assert.strictEqual(S.validarNombreCompleto('Q Q Q').error, 'nombre_corto');
  assert.strictEqual(S.validarNombreCompleto('J. Pérez').error, 'nombre_corto'); // primera palabra de 1 letra
  assert.strictEqual(S.MENSAJES.nombre_una_palabra, 'Escribe tu nombre y apellido.');
});

test('nombre completo: rechaza dígitos, símbolos, vacío y exceso de longitud', function () {
  assert.strictEqual(S.validarNombreCompleto('Xkxkx 4prtqrk').error, 'nombre_digitos');
  assert.strictEqual(S.validarNombreCompleto('Ana_ Prueba').error, 'nombre_simbolos');
  assert.strictEqual(S.validarNombreCompleto('... ...').error, 'nombre_simbolos');
  assert.strictEqual(S.validarNombreCompleto('   ').error, 'nombre_vacio');
  assert.strictEqual(S.validarNombreCompleto('Ana ' + 'a'.repeat(200)).error, 'nombre_largo');
});

test('separarNombre: primera palabra + resto (el resto conserva lo tecleado salvo extremos)', function () {
  assert.deepStrictEqual(S.separarNombre('  Ana   María  Pérez '), { nombre: 'Ana', apellido: 'María  Pérez' });
  assert.deepStrictEqual(S.separarNombre('Ana Prueba'), { nombre: 'Ana', apellido: 'Prueba' });
  assert.deepStrictEqual(S.separarNombre('Ana'), { nombre: 'Ana', apellido: '' });
  // Clientes viejos que mandan nombre y apellido por separado: se unen
  const v = S.validar(base({ nombre: 'Ana', apellido: 'Prueba Ruiz' }), { listas: LISTAS });
  assert.deepStrictEqual([v.ok, v.datos.nombre, v.datos.apellido], [true, 'Ana', 'Prueba Ruiz']);
});

test('correo: formato, minúsculas y desechables (incluye subdominios)', function () {
  assert.strictEqual(S.validarEmail('ANA@Empresa.MX', LISTAS).valor, 'ana@empresa.mx');
  assert.strictEqual(S.validarEmail('ana@empresa', LISTAS).error, 'email_formato');
  assert.strictEqual(S.validarEmail('ana empresa@x.mx', LISTAS).error, 'email_formato');
  assert.strictEqual(S.validarEmail('', LISTAS).error, 'email_vacio');
  assert.strictEqual(S.validarEmail('x1@mailinator.com', LISTAS).error, 'email_desechable');
  assert.strictEqual(S.validarEmail('x1@inbox.yopmail.com', LISTAS).error, 'email_desechable');
  assert.strictEqual(S.validarEmail('ana@gmail.com', LISTAS).error, '', 'Gmail por sí solo no es spam');
});

test('correo: sugiere typos frecuentes sin bloquear', function () {
  const v = S.validarEmail('ana.prueba@gmial.com', LISTAS);
  assert.strictEqual(v.error, '');
  assert.strictEqual(v.sugerencia, 'ana.prueba@gmail.com');
  assert.strictEqual(S.sugerirCorreo('ana@hotmial.com'), 'ana@hotmail.com');
  assert.strictEqual(S.sugerirCorreo('ana@empresa.con'), 'ana@empresa.com');
  assert.strictEqual(S.sugerirCorreo('ana@gmail.con'), 'ana@gmail.com');
  assert.strictEqual(S.sugerirCorreo('ana@gmail.com'), '');
  assert.strictEqual(S.sugerirCorreo('ana@empresa.mx'), '');
});

test('teléfono MX: 10 dígitos, sin 0/1 inicial; acepta +52 y +52 1; E.164', function () {
  const ok = ['5500000000', '55 0000 0000', '+52 55 0000 0000', '+52 1 55 0000 0000', '(33) 1000-0000', '52 8100000000'];
  ok.forEach(function (t) { assert.strictEqual(S.validarTelefono(t, 'MX').error, '', t); });
  assert.strictEqual(S.validarTelefono('+52 1 55 0000 0000', 'MX').e164, '+525500000000');
  const malos = ['1234567890', '0550000000', '5500000', '55000000', '550000000', '55000000000'];
  malos.forEach(function (t) {
    const r = S.validarTelefono(t, 'MX');
    assert.strictEqual(r.error, 'telefono_mx', t);
  });
  assert.strictEqual(S.MENSAJES.telefono_mx, 'Escribe tu número a 10 dígitos');
  assert.strictEqual(S.validarTelefono('', 'MX').error, 'telefono_vacio');
});

test('teléfono fuera de México: en el cliente solo longitud; INTL exige +código', function () {
  assert.strictEqual(S.validarTelefono('202 555 0123', 'US').error, '');
  assert.strictEqual(S.validarTelefono('123', 'US').error, 'telefono_invalido');
  assert.strictEqual(S.validarTelefono('202 555 0123', 'INTL').error, 'telefono_intl');
  assert.strictEqual(S.validarTelefono('+44 20 7946 0000', 'INTL').error, '');
});

test('sitio web o Instagram: dominio, URL o @usuario → URL normalizada; sin fetch', function () {
  assert.deepStrictEqual(S.normalizarSitio('transportes-sinteticos.mx'), { valor: 'https://transportes-sinteticos.mx', error: '' });
  assert.deepStrictEqual(S.normalizarSitio('WWW.Ejemplo-Sintetico.com.mx/'), { valor: 'https://www.ejemplo-sintetico.com.mx', error: '' });
  assert.deepStrictEqual(S.normalizarSitio('http://ejemplo-sintetico.mx/servicios'), { valor: 'http://ejemplo-sintetico.mx/servicios', error: '' });
  assert.deepStrictEqual(S.normalizarSitio('@Negocio.Sintetico'), { valor: 'https://instagram.com/negocio.sintetico', error: '' });
  assert.deepStrictEqual(S.normalizarSitio('instagram.com/negocio_sint?igsh=abc'), { valor: 'https://instagram.com/negocio_sint', error: '' });
  assert.deepStrictEqual(S.normalizarSitio(''), { valor: '', error: '' });
  ['miempresa', 'mi empresa.mx', '@', '@con espacio', 'https://', 'instagram.com/'].forEach(function (s) {
    assert.strictEqual(S.normalizarSitio(s).error, 'sitio_formato', s);
  });
});

test('empresa: obligatoria (2+ caracteres) para empresa y emprendimiento; lista basura normalizada', function () {
  ['empresa', 'emprendimiento'].forEach(function (tipo) {
    assert.deepStrictEqual(campos(S.validar(base({ solicitante: tipo, empresa: '' }), { listas: LISTAS })), ['empresa']);
    assert.deepStrictEqual(campos(S.validar(base({ solicitante: tipo, empresa: 'A' }), { listas: LISTAS })), ['empresa']);
  });
  ['Nada', '  NIÑO ', 'Ama   de Casa', 'n/a', 'Bro', 'T', 'Sí'].forEach(function (e) {
    const v = S.validar(base({ empresa: e }), { listas: LISTAS });
    assert.deepStrictEqual(campos(v), ['empresa'], e);
    assert.strictEqual(v.errores[0].mensaje, 'Escribe el nombre de tu empresa o negocio');
  });
  assert.strictEqual(S.validar(base({ empresa: 'Nada Más Transportes' }), { listas: LISTAS }).ok, true);
});

test('servicios (mín. 1, orden canónico), tamaño, presupuesto y consentimiento; necesidad opcional', function () {
  const v = S.validar(base({ servicios: [], tamano: '', presupuesto: 'x', necesidad: 'muy corto', consentimiento: false }), { listas: LISTAS });
  assert.deepStrictEqual(campos(v), ['servicios', 'tamano', 'presupuesto', 'consentimiento']);
  const orden = S.validar(base({ servicios: ['Dashboards y reportes', 'Publicidad Digital', 'no-existe'] }), { listas: LISTAS });
  assert.deepStrictEqual(orden.datos.servicios, ['Publicidad Digital', 'Dashboards y reportes']);
  // "¿Qué quieres resolver?" es opcional: vacío o corto pasa; solo hay tope de 2000
  ['', '   ', 'Más ventas', 'x'.repeat(20)].forEach(function (n) {
    assert.strictEqual(S.validar(base({ necesidad: n }), { listas: LISTAS }).ok, true, JSON.stringify(n));
  });
  assert.strictEqual(S.validar(base({ necesidad: undefined }), { listas: LISTAS }).ok, true);
  assert.strictEqual(S.NECESIDAD_MIN_PUNTOS, 20);
  assert.ok(!('necesidad_corta' in S.MENSAJES));
  assert.strictEqual(S.validar(base({ necesidad: 'x'.repeat(2001) }), { listas: LISTAS }).errores[0].codigo, 'necesidad_larga');
});

test('solicitante sin elegir: se exige y se validan también los campos de negocio', function () {
  const v = S.validar(base({ solicitante: '', empresa: '' }), { listas: LISTAS });
  assert.deepStrictEqual(campos(v), ['solicitante', 'empresa']);
});

test('solicitantes no comerciales: solo cuenta el tipo; no se piden ni se devuelven datos de contacto', function () {
  const casos = { personal: 'student', empleo: 'job_seeker', proveedor: 'competitor' };
  Object.keys(casos).forEach(function (tipo) {
    const v = S.validar({ solicitante: tipo }, { listas: LISTAS });
    assert.strictEqual(v.ok, true, tipo + ': ' + JSON.stringify(v.errores));
    assert.deepStrictEqual(v.datos, { solicitante: tipo, comercial: false, flagSolicitante: casos[tipo] });
    // Aunque llegaran datos de contacto (cliente viejo o API directa), no se validan ni se devuelven
    const con = S.validar(base({ solicitante: tipo, nombre: 'T', telefono: '5500', consentimiento: false }), { listas: LISTAS });
    assert.strictEqual(con.ok, true);
    assert.ok(!('email' in con.datos) && !('telefono' in con.datos) && !('nombre' in con.datos));
  });
});

test('pasos del formulario: el paso 1 son los campos del negocio; el 2, los de contacto', function () {
  assert.deepStrictEqual(S.PASOS[1], ['solicitante', 'servicios', 'tamano', 'presupuesto', 'necesidad']);
  assert.deepStrictEqual(S.PASOS[2], ['nombre', 'email', 'telefono', 'empresa', 'sitio_web', 'consentimiento']);
  assert.deepStrictEqual(S.CAMPOS, S.PASOS[1].concat(S.PASOS[2]));
});

test('errores en el orden del formulario, con mensaje en español', function () {
  const v = S.validar({}, { listas: LISTAS });
  assert.deepStrictEqual(campos(v), ['solicitante', 'servicios', 'tamano', 'presupuesto', 'nombre', 'email', 'telefono', 'empresa', 'consentimiento']);
  v.errores.forEach(function (e) { assert.ok(e.mensaje && e.mensaje.length > 5, e.campo); });
});

test('pilar: nunca "Bundle Completo" por 0 servicios; sí con 2+ pilares o 3+ servicios', function () {
  assert.strictEqual(S.pilar(['Publicidad Digital']), 'Google Ads');
  assert.strictEqual(S.pilar(['SEO y Posicionamiento', 'Reediseño / Desarrollo página web']), 'Sitio Web + SEO');
  assert.strictEqual(S.pilar(['Implementación de CRM']), 'CRM + Automatización');
  assert.strictEqual(S.pilar(['Publicidad Digital', 'Implementación de CRM']), 'Bundle Completo');
  assert.strictEqual(S.pilar(['Implementación de CRM', 'Automatización de procesos', 'Dashboards y reportes']), 'Bundle Completo');
});
