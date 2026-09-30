// api/_lib/idempotencia.js — Idempotencia por event_id (UUIDv4 que genera el cliente por envío).
// Si el mismo event_id llega otra vez en 10 min, se devuelve la respuesta ya dada sin reenviar
// a n8n; si llega mientras el primero sigue en curso, espera su resultado.
// PARCIAL: vive en la memoria de la instancia. Fluid Compute reutiliza instancias, pero dos
// instancias distintas no se ven entre sí; para una garantía global hace falta un almacén
// compartido (acción fuera del repo).
'use strict';

const VENTANA_MS = 10 * 60 * 1000;
const MAX_ENTRADAS = 1000;
const mapa = new Map(); // event_id → { en, resultado: Promise<{status, cuerpo}|null> }

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function esUuid(v) { return typeof v === 'string' && RE_UUID.test(v); }

function podar(ahora) {
  for (const [id, e] of mapa) {
    if (ahora - e.en < VENTANA_MS && mapa.size <= MAX_ENTRADAS) break;
    mapa.delete(id); // orden de inserción: las primeras son las más viejas
  }
}

// Consulta y reserva en un solo paso SÍNCRONO (sin await de por medio), para que dos envíos
// simultáneos con el mismo event_id no pasen ambos. Devuelve:
//   { previo: Promise<{status, cuerpo}|null> }  si ya hay uno vigente (en curso o resuelto), o
//   { reserva: { completar(r), liberar() } }      si este envío es el primero.
// liberar() (p. ej. n8n falló) descarta la entrada para que un reintento se procese de nuevo; quien
// estaba esperando recibe null y debe procesar su envío por su cuenta.
function tomar(id, ahora) {
  const e = mapa.get(id);
  if (e && ahora - e.en < VENTANA_MS) return { previo: e.resultado };
  if (e) mapa.delete(id);
  podar(ahora);
  let resolver;
  const entrada = { en: ahora, resultado: new Promise(function (r) { resolver = r; }) };
  mapa.set(id, entrada);
  return {
    reserva: {
      completar: function (r) { resolver(r); },
      liberar: function () { if (mapa.get(id) === entrada) mapa.delete(id); resolver(null); }
    }
  };
}

module.exports = { esUuid: esUuid, tomar: tomar, VENTANA_MS: VENTANA_MS, _vaciar: function () { mapa.clear(); } };
