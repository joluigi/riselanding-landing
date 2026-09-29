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
    solicitante: 'empresa', nombre: 'Ana', apellido: 'Prueba', email: 'ana@empresa-sintetica.mx',
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
  const v = S.validar(base({ nombre: '  aNA   maría ', apellido: 'de la o', email: ' Ana@Empresa-Sintetica.MX ' }), { listas: LISTAS });
  assert.deepStrictEqual(v.errores, []);
  assert.strictEqual(v.ok, true);
  assert.strictEqual(v.datos.nombre, 'Ana María');
  assert.strictEqual(v.datos.apellido, 'De la O'); // partícula en minúscula salvo al inicio
  assert.strictEqual(v.datos.email, 'ana@empresa-sintetica.mx');
  assert.strictEqual(v.datos.telefonoE164, '+525500000000');
  assert.strictEqual(v.datos.comercial, true);
  assert.strictEqual(v.datos.flagSolicitante, null);
});

test('nombre: Title Case, espacios colapsados y partículas en minúscula', function () {
  assert.strictEqual(S.validarNombre('  juan   carlos ', 'nombre').valor, 'Juan Carlos');
  assert.strictEqual(S.validarNombre('maría de los ángeles', 'nombre').valor, 'María de los Ángeles');
  assert.strictEqual(S.validarNombre('ana-lucía', 'nombre').valor, 'Ana-Lucía');
  assert.strictEqual(S.validarNombre("o'neil", 'apellido').valor, "O'Neil");
});

test('nombre: 2+ letras en la primera palabra; iniciales intermedias permitidas', function () {
  assert.strictEqual(S.validarNombre('Juan C.', 'nombre').error, '');
  assert.strictEqual(S.validarNombre('de la O', 'apellido').error, '');
  assert.strictEqual(S.validarNombre('T', 'nombre').error, 'nombre_corto');
  assert.strictEqual(S.validarNombre('T T', 'nombre').error, 'nombre_corto');
  assert.strictEqual(S.validarNombre('Q', 'apellido').error, 'apellido_corto');
  assert.strictEqual(S.validarNombre('J. Pérez', 'apellido').error, 'apellido_corto'); // primera palabra de 1 letra
});

test('nombre: rechaza dígitos, símbolos y vacío', function () {
  assert.strictEqual(S.validarNombre('Xkxkx 4prtqrk', 'nombre').error, 'nombre_digitos');
  assert.strictEqual(S.validarNombre('Ana_', 'nombre').error, 'nombre_simbolos');
  assert.strictEqual(S.validarNombre('...', 'nombre').error, 'nombre_simbolos');
  assert.strictEqual(S.validarNombre('   ', 'nombre').error, 'nombre_vacio');
  assert.strictEqual(S.validarNombre('', 'apellido').error, 'apellido_vacio');
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

test('servicios (mín. 1, orden canónico), tamaño, presupuesto, necesidad (30+) y consentimiento', function () {
  const v = S.validar(base({ servicios: [], tamano: '', presupuesto: 'x', necesidad: 'muy corto', consentimiento: false }), { listas: LISTAS });
  assert.deepStrictEqual(campos(v), ['tamano', 'servicios', 'presupuesto', 'necesidad', 'consentimiento']);
  const orden = S.validar(base({ servicios: ['Dashboards y reportes', 'Publicidad Digital', 'no-existe'] }), { listas: LISTAS });
  assert.deepStrictEqual(orden.datos.servicios, ['Publicidad Digital', 'Dashboards y reportes']);
  assert.strictEqual(S.validar(base({ necesidad: 'x'.repeat(29) }), { listas: LISTAS }).ok, false);
  assert.strictEqual(S.validar(base({ necesidad: 'x'.repeat(30) }), { listas: LISTAS }).ok, true);
  assert.strictEqual(S.validar(base({ necesidad: 'x'.repeat(2001) }), { listas: LISTAS }).errores[0].codigo, 'necesidad_larga');
});

test('solicitante sin elegir: se exige y se validan también los campos de negocio', function () {
  const v = S.validar(base({ solicitante: '', empresa: '' }), { listas: LISTAS });
  assert.deepStrictEqual(campos(v), ['solicitante', 'empresa']);
});

test('solicitantes no comerciales: flag propio y sin exigir campos de negocio', function () {
  const casos = { personal: 'student', empleo: 'job_seeker', proveedor: 'competitor' };
  Object.keys(casos).forEach(function (tipo) {
    const v = S.validar(base({ solicitante: tipo, empresa: '', tamano: '', servicios: [], presupuesto: '', necesidad: '' }), { listas: LISTAS });
    assert.strictEqual(v.ok, true, tipo + ': ' + JSON.stringify(v.errores));
    assert.strictEqual(v.datos.comercial, false);
    assert.strictEqual(v.datos.flagSolicitante, casos[tipo]);
  });
  // Los datos de contacto y el consentimiento se siguen exigiendo
  assert.deepStrictEqual(campos(S.validar(base({ solicitante: 'empleo', telefono: '5500', consentimiento: false }), { listas: LISTAS })), ['telefono', 'consentimiento']);
});

test('errores en el orden del formulario, con mensaje en español', function () {
  const v = S.validar({}, { listas: LISTAS });
  assert.deepStrictEqual(campos(v), ['solicitante', 'nombre', 'apellido', 'email', 'telefono', 'empresa', 'tamano', 'servicios', 'presupuesto', 'necesidad', 'consentimiento']);
  v.errores.forEach(function (e) { assert.ok(e.mensaje && e.mensaje.length > 5, e.campo); });
});

test('pilar: nunca "Bundle Completo" por 0 servicios; sí con 2+ pilares o 3+ servicios', function () {
  assert.strictEqual(S.pilar(['Publicidad Digital']), 'Google Ads');
  assert.strictEqual(S.pilar(['SEO y Posicionamiento', 'Reediseño / Desarrollo página web']), 'Sitio Web + SEO');
  assert.strictEqual(S.pilar(['Implementación de CRM']), 'CRM + Automatización');
  assert.strictEqual(S.pilar(['Publicidad Digital', 'Implementación de CRM']), 'Bundle Completo');
  assert.strictEqual(S.pilar(['Implementación de CRM', 'Automatización de procesos', 'Dashboards y reportes']), 'Bundle Completo');
});
