// api/_lib/calidad.js — Conecta la ruta con el motor de calidad (lib/lead-quality/engine.js):
// carga las listas editables y traduce los datos ya validados a la entrada del motor.
'use strict';

const engine = require('../../lib/lead-quality/engine.js');
const { LISTAS } = require('./validar-lead');
const libres = require('../../lib/lead-quality/data/free-email-domains.json');
const agencias = require('../_data/agency-denylist.json');

const LISTAS_MOTOR = {
  junkCompany: LISTAS.junkCompany,
  disposable: LISTAS.disposable,
  freeEmail: libres.domains,
  agencyDenylist: (agencias.entries || [])
    .map(function (e) { return String((e && e.domain) || '').trim().toLowerCase(); })
    .filter(Boolean)
};

// datos: salida de validarLead; extras: señales de auditoría de la ruta (0 puntos)
function evaluar(datos, extras) {
  return engine.evaluateLead({
    solicitante: datos.solicitante,
    nombre: datos.nombre,
    apellido: datos.apellido,
    email: datos.email,
    telefono: datos.telefono,
    telefono_pais: datos.telefonoPais,
    telefono_e164: datos.telefonoE164,
    empresa: datos.empresa,
    sitio_web: datos.sitioWeb,
    tamano: datos.tamano,
    servicios: datos.servicios,
    presupuesto: datos.presupuesto,
    necesidad: datos.necesidad,
    extra_signals: extras
  }, { listas: LISTAS_MOTOR });
}

module.exports = { evaluar: evaluar, LISTAS_MOTOR: LISTAS_MOTOR };
