// api/_lib/validar-lead.js — Validación autoritativa del servidor.
// Reusa el esquema compartido (lib/lead-quality/schema.js) y agrega lo que el navegador
// no puede comprobar: registros MX del dominio del correo y libphonenumber para los
// teléfonos de fuera de México (en México manda la regla de 10 dígitos del esquema).
'use strict';

const dns = require('dns');
const { parsePhoneNumberFromString } = require('libphonenumber-js/min');
const schema = require('../../lib/lead-quality/schema.js');
const junk = require('../../lib/lead-quality/data/junk-company.json');
const desechables = require('../../lib/lead-quality/data/disposable-email-domains.json');

const LISTAS = { junkCompany: junk.values, disposable: desechables.domains };

const TIMEOUT_MX_MS = 2000;
const CACHE_MX_MS = 10 * 60 * 1000;
const MAX_CACHE_MX = 500;
const cacheMx = new Map(); // dominio → { tiene: boolean, en: timestamp }

let resolverMx = function (dominio) { return dns.promises.resolveMx(dominio); };

// 'si' | 'no' | 'desconocido'. Sin MX (o MX nulo "." de RFC 7505) → 'no'. Timeout o
// error del DNS → 'desconocido': no bloquea.
async function tieneMx(dominio) {
  const previo = cacheMx.get(dominio);
  if (previo && Date.now() - previo.en < CACHE_MX_MS) return previo.tiene ? 'si' : 'no';

  let temporizador;
  const limite = new Promise(function (resolve) {
    temporizador = setTimeout(function () { resolve('timeout'); }, TIMEOUT_MX_MS);
  });
  let resultado;
  try {
    const registros = await Promise.race([resolverMx(dominio), limite]);
    if (registros === 'timeout') return 'desconocido';
    const utiles = (registros || []).filter(function (r) { return r && r.exchange && r.exchange !== '.'; });
    resultado = utiles.length > 0;
  } catch (e) {
    if (e && (e.code === 'ENOTFOUND' || e.code === 'ENODATA')) resultado = false;
    else return 'desconocido';
  } finally {
    clearTimeout(temporizador);
  }
  if (cacheMx.size >= MAX_CACHE_MX) cacheMx.delete(cacheMx.keys().next().value);
  cacheMx.set(dominio, { tiene: resultado, en: Date.now() });
  return resultado ? 'si' : 'no';
}

function agregarError(v, campo, codigo) {
  if (v.errores.some(function (e) { return e.campo === campo; })) return;
  v.errores.push({ campo: campo, codigo: codigo, mensaje: schema.MENSAJES[codigo] });
  v.errores.sort(function (a, b) { return schema.CAMPOS.indexOf(a.campo) - schema.CAMPOS.indexOf(b.campo); });
  v.ok = false;
}

async function validarLead(body) {
  const v = schema.validar(body, { listas: LISTAS });
  const d = v.datos;
  if (!d.comercial) return v; // no comercial: sin datos de contacto que verificar

  // Teléfono fuera de México: libphonenumber (metadata mínima) decide y normaliza a E.164
  const errorTel = v.errores.some(function (e) { return e.campo === 'telefono'; });
  if (!errorTel && d.telefonoPais !== 'MX') {
    const pais = d.telefonoPais === 'INTL' ? undefined : d.telefonoPais;
    const n = parsePhoneNumberFromString(d.telefono, pais);
    // Si escribe otro +código distinto al país elegido, vale el que escribió
    if (!n || !n.isValid()) {
      agregarError(v, 'telefono', d.telefonoPais === 'INTL' ? 'telefono_intl' : 'telefono_invalido');
    } else {
      d.telefonoE164 = n.number;
    }
  }

  // Correo: solo se consulta MX si el formato ya es válido
  const errorEmail = v.errores.some(function (e) { return e.campo === 'email'; });
  d.emailMx = 'no_consultado';
  if (!errorEmail && d.email) {
    d.emailMx = await tieneMx(schema.dominioDe(d.email));
    if (d.emailMx === 'no') agregarError(v, 'email', 'email_sin_mx');
  }

  return v;
}

module.exports = {
  validarLead: validarLead,
  LISTAS: LISTAS,
  // Solo pruebas: sustituye el resolver DNS y vacía la caché
  _setResolverMx: function (fn) { resolverMx = fn; cacheMx.clear(); }
};
