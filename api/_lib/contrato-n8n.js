// api/_lib/contrato-n8n.js — Arma los valores del payload hacia n8n con el MISMO formato
// que antes armaba el navegador (index.html), ahora del lado del servidor:
//   nombre  = "Nombre Apellido"
//   mensaje = "Servicios: A, B · Tamaño: 11–50 personas · utm_source=x utm_medium=y"
// n8n copia `mensaje` a "Notas iniciales" en Notion. Cambiar este formato es Fase 8.
'use strict';

const schema = require('../../lib/lead-quality/schema.js');

const UTM = ['utm_source', 'utm_medium', 'utm_campaign'];

function texto(v) {
  return (v === null || typeof v === 'undefined') ? '' : String(v).trim();
}

// "utm_source=google utm_medium=cpc" con solo los presentes; sin saltos ni caracteres de control
function utmTexto(body) {
  return UTM.map(function (k) {
    const v = texto(body[k]).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200);
    return v ? k + '=' + v : null;
  }).filter(Boolean).join(' ');
}

function nombreSaliente(body) {
  return (texto(body.nombre) + ' ' + texto(body.apellido)).trim();
}

// México: tal cual lo tecleó la persona (como hoy). Otro país sin "+": se antepone su
// código para que en Notion no se pierda de qué país es. E.164 en México = acción externa.
function telefonoSaliente(body, datos) {
  const t = texto(body.telefono);
  if (datos.telefonoPais === 'MX' || t.charAt(0) === '+') return t;
  const codigo = schema.codigoPais(datos.telefonoPais);
  return codigo ? '+' + codigo + ' ' + t : t;
}

function mensajeBase(datos, body) {
  const tamanoTexto = schema.TAMANOS[datos.tamano] || '';
  const utm = utmTexto(body);
  return 'Servicios: ' + (datos.servicios.join(', ') || 'no indicó')
    + (tamanoTexto ? ' · Tamaño: ' + tamanoTexto : '')
    + (utm ? ' · ' + utm : '');
}

module.exports = {
  nombreSaliente: nombreSaliente,
  telefonoSaliente: telefonoSaliente,
  mensajeBase: mensajeBase,
  utmTexto: utmTexto
};
