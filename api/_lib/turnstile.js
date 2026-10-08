// api/_lib/turnstile.js — Cloudflare Turnstile (modo Managed).
// Las dos claves entran juntas: con solo una, la capa se comporta como si no
// hubiera ninguna (widget y verificación apagados) y deja un warning en el log.
// Si Cloudflare no responde (timeout 3 s, 5xx o red) NO se marca spam: fail-open
// controlado, el envío sigue por las demás capas con la señal turnstile_unavailable.
// Si siteverify rechaza NUESTRA configuración (secreto ausente o inválido) también
// sigue, pero con turnstile_misconfigured: es un error nuestro que hay que corregir.
'use strict';

const URL_SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 3000;

// Códigos que indican un error de configuración nuestro, no un bot: no castigan al usuario
const ERRORES_CONFIG = ['missing-input-secret', 'invalid-input-secret', 'invalid-widget-id', 'invalid-parsed-secret', 'sitekey-secret-mismatch'];
// Falla del lado de Cloudflare: se trata igual que un timeout
const ERRORES_CLOUDFLARE = ['internal-error'];

let avisado = '';

function avisarUnaVez(motivo, texto) {
  if (avisado === motivo) return;
  avisado = motivo;
  console.warn('[turnstile] ' + texto);
}

function config() {
  const siteKey = process.env.TURNSTILE_SITE_KEY || '';
  const secret = process.env.TURNSTILE_SECRET_KEY || '';
  if (siteKey && secret) return { activo: true, siteKey: siteKey, secret: secret };
  if (siteKey || secret) {
    avisarUnaVez('incompleto', 'Solo hay una de TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY: capa desactivada hasta definir las dos.');
  } else {
    avisarUnaVez('ausente', 'Sin TURNSTILE_SITE_KEY ni TURNSTILE_SECRET_KEY: capa desactivada.');
  }
  return { activo: false, siteKey: '', secret: '' };
}

// Resultado: { estado: 'ok' | 'fallido' | 'no_disponible' | 'mal_configurado', codigos: string[] }
async function verificar(token, ip, secret) {
  if (typeof token !== 'string' || !token) return { estado: 'fallido', codigos: ['missing-input-response'] };

  const controlador = new AbortController();
  const temporizador = setTimeout(function () { controlador.abort(); }, TIMEOUT_MS);
  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (ip) params.append('remoteip', ip);
    const resp = await fetch(URL_SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controlador.signal
    });
    if (!resp.ok) return { estado: 'no_disponible', codigos: ['http_' + resp.status] };
    const data = await resp.json();
    if (data && data.success) return { estado: 'ok', codigos: [] };
    const codigos = (data && Array.isArray(data['error-codes'])) ? data['error-codes'] : [];
    for (let i = 0; i < codigos.length; i++) {
      if (ERRORES_CONFIG.indexOf(codigos[i]) !== -1) return { estado: 'mal_configurado', codigos: codigos };
    }
    for (let i = 0; i < codigos.length; i++) {
      if (ERRORES_CLOUDFLARE.indexOf(codigos[i]) !== -1) return { estado: 'no_disponible', codigos: codigos };
    }
    return { estado: 'fallido', codigos: codigos };
  } catch (e) {
    return { estado: 'no_disponible', codigos: [e && e.name === 'AbortError' ? 'timeout' : 'network'] }; // timeout, red o JSON ilegible
  } finally {
    clearTimeout(temporizador);
  }
}

module.exports = { config: config, verificar: verificar, TIMEOUT_MS: TIMEOUT_MS };
