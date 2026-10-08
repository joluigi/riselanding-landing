// lib/lead-quality/schema.js — Esquema del formulario de leads, compartido cliente/servidor.
// UMD en ES5 y sin dependencias: en el navegador se expone como window.LeadSchema; en
// Node, como módulo CommonJS. El servidor es la autoridad: vuelve a validar con este
// mismo esquema y agrega lo que el navegador no puede (registros MX y libphonenumber).
// Las listas (empresas basura, dominios desechables) viven en ./data/*.json y se pasan
// en opciones.listas: el servidor las requiere y el cliente las descarga.
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LeadSchema = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Catálogos (los valores son el contrato con el HTML y con n8n) ---

  // flag: lead_quality_flag de los solicitantes que no son prospecto comercial
  var SOLICITANTES = {
    empresa: { label: 'Mi empresa o negocio', comercial: true },
    emprendimiento: { label: 'Un emprendimiento que estoy arrancando', comercial: true },
    personal: { label: 'Un proyecto personal / escolar', comercial: false, flag: 'student' },
    empleo: { label: 'Busco empleo o prácticas', comercial: false, flag: 'job_seeker' },
    proveedor: { label: 'Soy proveedor o agencia y quiero ofrecer servicios', comercial: false, flag: 'competitor' }
  };

  // Mismo texto que data-zoho del HTML: viaja tal cual a n8n dentro de "Servicios: …"
  var SERVICIOS = [
    'Publicidad Digital', 'SEO y Posicionamiento', 'Reediseño / Desarrollo página web',
    'Implementación de CRM', 'Automatización de procesos', 'Dashboards y reportes'
  ];

  // Mismo texto que las opciones del select: viaja a n8n como "Tamaño: …"
  var TAMANOS = {
    '1_10': '1–10 personas',
    '11_50': '11–50 personas',
    '51_200': '51–200 personas',
    '200_plus': 'Más de 200 personas'
  };

  var PRESUPUESTOS = {
    sin_definir: 'Aún no lo defino',
    menos_10k: 'Menos de $10,000',
    '10k_25k': '$10,000 – $25,000',
    '25k_50k': '$25,000 – $50,000',
    mas_50k: 'Más de $50,000'
  };

  // Selector de país del teléfono. INTL: la persona escribe el número con +código
  var PAISES_TELEFONO = [
    { iso: 'MX', codigo: '52', label: 'México (+52)' },
    { iso: 'US', codigo: '1', label: 'Estados Unidos (+1)' },
    { iso: 'CO', codigo: '57', label: 'Colombia (+57)' },
    { iso: 'GT', codigo: '502', label: 'Guatemala (+502)' },
    { iso: 'PE', codigo: '51', label: 'Perú (+51)' },
    { iso: 'CL', codigo: '56', label: 'Chile (+56)' },
    { iso: 'AR', codigo: '54', label: 'Argentina (+54)' },
    { iso: 'ES', codigo: '34', label: 'España (+34)' },
    { iso: 'INTL', codigo: '', label: 'Otro país (escribe +código)' }
  ];

  // Formulario en 2 pasos. El orden de CAMPOS es el del formulario: el primer error recibe el foco.
  var PASOS = {
    1: ['solicitante', 'servicios', 'tamano', 'presupuesto', 'necesidad'],
    2: ['nombre', 'email', 'telefono', 'empresa', 'sitio_web', 'consentimiento']
  };
  var CAMPOS = PASOS[1].concat(PASOS[2]);

  var MENSAJES = {
    solicitante: 'Elige para quién es la solicitud.',
    nombre_vacio: 'Escribe tu nombre completo.',
    nombre_una_palabra: 'Escribe tu nombre y apellido.',
    nombre_digitos: 'El nombre no debe llevar números.',
    nombre_simbolos: 'Escribe solo letras en el nombre.',
    nombre_corto: 'Escribe tu nombre completo, no solo la inicial.',
    nombre_largo: 'El nombre es demasiado largo.',
    email_vacio: 'Escribe tu correo para poder responderte.',
    email_formato: 'Revisa tu correo: parece incompleto o mal escrito.',
    email_desechable: 'Usa un correo permanente; los correos temporales no reciben nuestra respuesta.',
    email_sin_mx: 'Revisa tu correo: ese dominio no recibe correos.',
    telefono_vacio: 'Escribe tu teléfono o WhatsApp.',
    telefono_mx: 'Escribe tu número a 10 dígitos',
    telefono_intl: 'Revisa tu número: escríbelo con su código de país (por ejemplo +1 202 555 0123).',
    telefono_invalido: 'Revisa tu número: no parece válido para el país elegido.',
    empresa_vacia: 'Escribe el nombre de tu empresa o negocio',
    empresa_basura: 'Escribe el nombre de tu empresa o negocio',
    empresa_larga: 'El nombre de la empresa es demasiado largo.',
    sitio_formato: 'Escribe un dominio (tuempresa.mx), una URL o tu @usuario de Instagram.',
    tamano: 'Elige el tamaño de tu equipo.',
    servicios: 'Marca al menos un servicio.',
    presupuesto: 'Elige un presupuesto aproximado (puede ser "Aún no lo defino").',
    necesidad_larga: 'El mensaje es demasiado largo (máximo 2000 caracteres).',
    consentimiento: 'Para enviar, acepta el aviso de privacidad.'
  };

  // "¿Qué quieres resolver?" es OPCIONAL: sin mínimo para enviar. NECESIDAD_MIN_PUNTOS es solo el
  // largo a partir del cual el motor le da +10 al lead_score (si no hay tecleo al azar).
  var NECESIDAD_MIN_PUNTOS = 20;
  var NECESIDAD_MAX = 2000;

  // Typos frecuentes de dominios gratuitos: solo sugieren, nunca bloquean
  var TYPOS_DOMINIO = {
    'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com',
    'gmail.com.mx': 'gmail.com', 'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com', 'hotmil.com': 'hotmail.com', 'hotamil.com': 'hotmail.com',
    'homail.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'outlok.com': 'outlook.com',
    'outllok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com', 'yahoo.com.mz': 'yahoo.com.mx', 'iclod.com': 'icloud.com',
    'icoud.com': 'icloud.com'
  };
  var TYPOS_TLD = { con: 'com', cmo: 'com', ocm: 'com', vom: 'com', xom: 'com' };

  // Partículas que se quedan en minúscula dentro de un nombre ("María de la O")
  var PARTICULAS = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'van', 'von'];

  var RE_LETRA = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
  var RE_NO_LETRAS = /[^A-Za-zÀ-ÖØ-öø-ÿ]/g;
  var RE_NOMBRE_PERMITIDO = /^[A-Za-zÀ-ÖØ-öø-ÿ'’.\- ]+$/;
  var RE_EMAIL = /^[^\s@]{1,64}@([a-z0-9-]+\.)+[a-z]{2,}$/;
  var RE_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
  var RE_URL = /^(https?:\/\/)?(www\.)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,})(:\d{1,5})?(\/[^\s]*)?$/i;

  // --- Utilidades de texto ---

  function texto(v) {
    if (v === null || typeof v === 'undefined') return '';
    return String(v);
  }

  function colapsar(v) {
    return texto(v).replace(/\s+/g, ' ').trim();
  }

  function sinAcentos(v) {
    var s = texto(v);
    return typeof s.normalize === 'function' ? s.normalize('NFD').replace(/[̀-ͯ]/g, '') : s;
  }

  // Clave de comparación: minúsculas, sin acentos, espacios colapsados
  function normalizarClave(v) {
    return sinAcentos(colapsar(v)).toLowerCase();
  }

  function capitalizar(p) {
    return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p;
  }

  function tituloNombre(v) {
    var palabras = colapsar(v).split(' ');
    for (var i = 0; i < palabras.length; i++) {
      var w = palabras[i];
      if (i > 0 && PARTICULAS.indexOf(w.toLowerCase()) !== -1) { palabras[i] = w.toLowerCase(); continue; }
      palabras[i] = w.split('-').map(function (seg) {
        return seg.split(/(['’])/).map(function (t) { return /['’]/.test(t) ? t : capitalizar(t); }).join('');
      }).join('-');
    }
    return palabras.join(' ');
  }

  function letrasDe(palabra) { return palabra.replace(RE_NO_LETRAS, '').length; }

  // --- Validadores por campo: devuelven { valor, error } (error = clave de MENSAJES o '') ---

  // Nombre completo en un solo campo → { nombre: primera palabra, apellido: el resto }. Sobre el
  // texto recortado y SIN colapsar el resto: "nombre + ' ' + apellido" reproduce lo que tecleó la
  // persona (es lo que viaja a n8n, igual que cuando eran dos campos).
  function separarNombre(v) {
    var t = texto(v).trim();
    var m = t.match(/^(\S+)\s+([\s\S]+)$/);
    return m ? { nombre: m[1], apellido: m[2].trim() } : { nombre: t, apellido: '' };
  }

  // Al menos 2 palabras; la primera con 2+ letras; sin dígitos ni símbolos. Devuelve el nombre en
  // Title Case y sus dos partes.
  function validarNombreCompleto(v) {
    var s = colapsar(v);
    function con(error) { return { valor: s, nombre: '', apellido: '', error: error }; }
    if (!s) return con('nombre_vacio');
    if (s.length > 200) return con('nombre_largo');
    if (/\d/.test(s)) return con('nombre_digitos');
    if (!RE_NOMBRE_PERMITIDO.test(s) || !RE_LETRA.test(s)) return con('nombre_simbolos');
    var palabras = s.split(' ');
    var conLetras = palabras.filter(function (p) { return letrasDe(p) > 0; });
    if (conLetras.length < 2) return con('nombre_una_palabra');
    var todasDeUna = conLetras.every(function (p) { return letrasDe(p) === 1; });
    if (letrasDe(palabras[0]) < 2 || todasDeUna) return con('nombre_corto');
    var titulo = tituloNombre(s);
    var partes = separarNombre(titulo);
    return { valor: titulo, nombre: partes.nombre, apellido: partes.apellido, error: '' };
  }

  function dominioDe(email) { return (texto(email).split('@')[1] || '').toLowerCase(); }

  function enLista(dominio, lista) {
    for (var i = 0; i < (lista || []).length; i++) {
      var d = lista[i];
      if (dominio === d || dominio.slice(-(d.length + 1)) === '.' + d) return true;
    }
    return false;
  }

  // Sugerencia de corrección ('' si no hay): gmial.com → gmail.com, *.con → *.com
  function sugerirCorreo(email) {
    var s = texto(email).trim().toLowerCase();
    var at = s.lastIndexOf('@');
    if (at < 1) return '';
    var local = s.slice(0, at), dom = s.slice(at + 1);
    if (TYPOS_DOMINIO[dom]) return local + '@' + TYPOS_DOMINIO[dom];
    var partes = dom.split('.');
    var tld = partes[partes.length - 1];
    if (partes.length > 1 && TYPOS_TLD[tld]) {
      partes[partes.length - 1] = TYPOS_TLD[tld];
      var corregido = partes.join('.');
      return local + '@' + (TYPOS_DOMINIO[corregido] || corregido);
    }
    return '';
  }

  function validarEmail(v, listas) {
    var s = texto(v).trim().toLowerCase();
    if (!s) return { valor: '', error: 'email_vacio', sugerencia: '' };
    if (s.length > 254 || !RE_EMAIL.test(s)) return { valor: s, error: 'email_formato', sugerencia: sugerirCorreo(s) };
    if (enLista(dominioDe(s), listas && listas.disposable)) return { valor: s, error: 'email_desechable', sugerencia: '' };
    return { valor: s, error: '', sugerencia: sugerirCorreo(s) };
  }

  // México: 10 dígitos nacionales, el primero no es 0 ni 1. Acepta los prefijos +52 y
  // +52 1 (formato móvil anterior). Devuelve los 10 dígitos o null.
  function digitosMX(v) {
    var d = texto(v).replace(/\D/g, '');
    if (d.length === 13 && d.slice(0, 3) === '521') d = d.slice(3);
    else if (d.length === 12 && d.slice(0, 2) === '52') d = d.slice(2);
    if (d.length !== 10 || d.charAt(0) === '0' || d.charAt(0) === '1') return null;
    return d;
  }

  // Validación del cliente (regla a mano). El servidor la repite y además usa libphonenumber
  // para los países distintos de México.
  function validarTelefono(v, pais) {
    var s = colapsar(v);
    var iso = pais || 'MX';
    if (!s) return { valor: '', e164: '', error: 'telefono_vacio' };
    if (s.length > 30) return { valor: s, e164: '', error: iso === 'MX' ? 'telefono_mx' : 'telefono_invalido' };
    if (iso === 'MX') {
      var d = digitosMX(s);
      return d ? { valor: s, e164: '+52' + d, error: '' } : { valor: s, e164: '', error: 'telefono_mx' };
    }
    var digitos = s.replace(/\D/g, '');
    if (iso === 'INTL' && s.charAt(0) !== '+') return { valor: s, e164: '', error: 'telefono_intl' };
    if (digitos.length < 6 || digitos.length > 15) return { valor: s, e164: '', error: 'telefono_invalido' };
    return { valor: s, e164: '', error: '' };
  }

  function codigoPais(iso) {
    for (var i = 0; i < PAISES_TELEFONO.length; i++) if (PAISES_TELEFONO[i].iso === iso) return PAISES_TELEFONO[i].codigo;
    return null;
  }

  // Sitio web o Instagram → URL normalizada ('' si viene vacío). Nunca se hace fetch.
  function normalizarSitio(v) {
    var s = texto(v).trim();
    if (!s) return { valor: '', error: '' };
    if (s.length > 300 || /\s/.test(s)) return { valor: s, error: 'sitio_formato' };
    if (s.charAt(0) === '@') {
      var h = s.slice(1);
      return RE_HANDLE.test(h) ? { valor: 'https://instagram.com/' + h.toLowerCase(), error: '' } : { valor: s, error: 'sitio_formato' };
    }
    var m = s.match(RE_URL);
    if (!m) return { valor: s, error: 'sitio_formato' };
    var host = m[3].toLowerCase();
    var ruta = m[5] || '';
    if (host === 'instagram.com') {
      var usuario = ruta.replace(/^\/+/, '').split(/[/?#]/)[0];
      if (!RE_HANDLE.test(usuario)) return { valor: s, error: 'sitio_formato' };
      return { valor: 'https://instagram.com/' + usuario.toLowerCase(), error: '' };
    }
    var esquema = m[1] ? m[1].toLowerCase() : 'https://';
    if (ruta === '/') ruta = '';
    return { valor: esquema + (m[2] ? 'www.' : '') + host + (m[4] || '') + ruta, error: '' };
  }

  function esEmpresaBasura(empresa, lista) {
    var clave = normalizarClave(empresa);
    if (!clave) return false;
    for (var i = 0; i < (lista || []).length; i++) if (normalizarClave(lista[i]) === clave) return true;
    return false;
  }

  // Pilar para interes_pilar (select de 4 opciones en Notion). 2+ pilares o 3+ servicios →
  // Bundle Completo. Con la validación nueva siempre hay al menos un servicio.
  function pilar(servicios) {
    var ads = servicios.indexOf('Publicidad Digital') !== -1;
    var web = servicios.some(function (s) { return /SEO|web/i.test(s); });
    var ops = servicios.some(function (s) { return /CRM|Automatizaci|Dashboards/i.test(s); });
    if ((ads + web + ops) >= 2 || servicios.length >= 3) return 'Bundle Completo';
    if (ads) return 'Google Ads';
    if (web) return 'Sitio Web + SEO';
    return 'CRM + Automatización';
  }

  function esVerdadero(v) { return v === true || v === 'true' || v === 'on' || v === '1' || v === 1; }

  // --- Validación completa ---
  // raw: { solicitante, nombre, apellido, email, telefono, telefono_pais, empresa, sitio_web,
  //        tamano, servicios[], presupuesto, necesidad, consentimiento }
  // Devuelve { ok, datos, errores: [{ campo, codigo, mensaje }] } en el orden de CAMPOS.
  function validar(raw, opciones) {
    var r = raw || {};
    var listas = (opciones && opciones.listas) || {};
    var errores = {};
    function error(campo, codigo) { if (codigo && !errores[campo]) errores[campo] = codigo; }

    var solicitante = texto(r.solicitante);
    var tipo = SOLICITANTES[solicitante];
    if (!tipo) error('solicitante', 'solicitante');
    var comercial = !tipo || tipo.comercial; // sin elegir: se exige todo

    // No comercial (personal / empleo / proveedor): se resuelve en el paso 1, sin pedir ni guardar
    // datos de contacto. Solo cuenta el tipo de solicitante.
    if (tipo && !tipo.comercial) {
      return {
        ok: true, errores: [],
        datos: { solicitante: solicitante, comercial: false, flagSolicitante: tipo.flag }
      };
    }

    // Nombre completo (un campo). Compatibilidad: si llega "apellido" aparte, se une.
    var nombreCompleto = texto(r.nombre) + (texto(r.apellido).trim() ? ' ' + texto(r.apellido) : '');
    var nombre = validarNombreCompleto(nombreCompleto); error('nombre', nombre.error);
    var email = validarEmail(r.email, listas); error('email', email.error);

    var pais = codigoPais(texto(r.telefono_pais)) !== null ? texto(r.telefono_pais) : 'MX';
    var tel = validarTelefono(r.telefono, pais); error('telefono', tel.error);

    var empresa = colapsar(r.empresa);
    if (empresa.length > 200) error('empresa', 'empresa_larga');
    else if (comercial && empresa.length < 2) error('empresa', 'empresa_vacia');
    else if (comercial && esEmpresaBasura(empresa, listas.junkCompany)) error('empresa', 'empresa_basura');

    var sitio = { valor: '', error: '' };
    var tamano = '', servicios = [], presupuesto = '', necesidad = '';
    if (comercial) {
      sitio = normalizarSitio(r.sitio_web); error('sitio_web', sitio.error);

      tamano = texto(r.tamano);
      if (!TAMANOS[tamano]) { error('tamano', 'tamano'); tamano = ''; }

      var marcados = Array.isArray(r.servicios) ? r.servicios : [];
      servicios = SERVICIOS.filter(function (s) { return marcados.indexOf(s) !== -1; }); // orden canónico
      if (!servicios.length) error('servicios', 'servicios');

      presupuesto = texto(r.presupuesto);
      if (!PRESUPUESTOS[presupuesto]) { error('presupuesto', 'presupuesto'); presupuesto = ''; }

      necesidad = texto(r.necesidad).trim();
      if (necesidad.length > NECESIDAD_MAX) error('necesidad', 'necesidad_larga'); // opcional: sin mínimo
    }

    if (!esVerdadero(r.consentimiento)) error('consentimiento', 'consentimiento');

    var lista = [];
    for (var i = 0; i < CAMPOS.length; i++) {
      var c = CAMPOS[i];
      if (errores[c]) lista.push({ campo: c, codigo: errores[c], mensaje: MENSAJES[errores[c]] });
    }

    return {
      ok: lista.length === 0,
      errores: lista,
      datos: {
        solicitante: tipo ? solicitante : '',
        comercial: !!(tipo && tipo.comercial),
        flagSolicitante: (tipo && tipo.flag) || null,
        nombreCompleto: nombre.valor,
        nombre: nombre.nombre,
        apellido: nombre.apellido,
        email: email.valor,
        emailSugerencia: email.sugerencia || '',
        telefono: tel.valor,
        telefonoPais: pais,
        telefonoE164: tel.e164,
        empresa: empresa,
        sitioWeb: sitio.error ? '' : sitio.valor,
        tamano: tamano,
        servicios: servicios,
        presupuesto: presupuesto,
        necesidad: necesidad,
        consentimiento: esVerdadero(r.consentimiento)
      }
    };
  }

  return {
    SOLICITANTES: SOLICITANTES, SERVICIOS: SERVICIOS, TAMANOS: TAMANOS, PRESUPUESTOS: PRESUPUESTOS,
    PAISES_TELEFONO: PAISES_TELEFONO, CAMPOS: CAMPOS, PASOS: PASOS, MENSAJES: MENSAJES,
    NECESIDAD_MIN_PUNTOS: NECESIDAD_MIN_PUNTOS, NECESIDAD_MAX: NECESIDAD_MAX,
    validar: validar, validarNombreCompleto: validarNombreCompleto, separarNombre: separarNombre,
    validarEmail: validarEmail,
    validarTelefono: validarTelefono, digitosMX: digitosMX, normalizarSitio: normalizarSitio,
    sugerirCorreo: sugerirCorreo, esEmpresaBasura: esEmpresaBasura, normalizarClave: normalizarClave,
    tituloNombre: tituloNombre, pilar: pilar, codigoPais: codigoPais, dominioDe: dominioDe, enLista: enLista
  };
});
