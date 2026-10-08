# Release del lead quality gate en modo SHADOW

PR #4 · rama `feat/lead-quality-gate` → `main` por **Squash and merge** (lo hace José Luis en GitHub).
Vercel publica `main` en Production automáticamente. **Fecha del release y del aviso: 7 de octubre de 2026.**

Última actualización: 7-oct-2026 (preparación final: fecha del aviso puesta, `npm run check:release` en verde).

## 1. Resumen

**Entra (todo en modo `shadow`: el motor etiqueta, pero todo lo que evalúa se sigue reenviando a n8n):**
- Motor de calidad del servidor (`lib/lead-quality/engine.js`): `lead_quality_flag`, `lead_score`, `lead_tier`, `spam_points`, `signals[]`; sufijo ` · Calidad: flag/tier score` en "Notas iniciales".
- Barreras anti-bot: token HMAC (`/api/form-token`, tiempo mínimo 4 s), honeypot `website_url_2`, rate limit en memoria, idempotencia por `event_id`, reintento hacia n8n, sin secretos en el código.
- Cloudflare Turnstile **listo pero apagado** (opcional; se activa a las +48 h, sección 5).
- Formulario en 2 pasos (negocio → contacto), nombre completo, "¿Qué quieres resolver?" opcional, no comerciales resueltos en el paso 1 sin datos de contacto.
- Aviso de privacidad actualizado y aprobado (5-oct-2026 + ajuste de exactitud), con fecha 7 DE OCTUBRE DE 2026.
- Tracking `rl_*`: `rl_lead_submit` con el veredicto del servidor y `user_data` hasheado, `rl_form_step`, `rl_form_submit_attempt`, `rl_non_commercial_submit`, `rl_form_error` con `step_number`, `has_message`.
- Atribución: `utm_id` y `referrer` (solo origen) en `rl_attr`; atribución en `rl_lead_submit` y en el log del servidor (no viaja a n8n).

**No entra:**
- Fase 7: botón/número de WhatsApp y liga de agenda (ojo: `gracias.html` conserva el enlace marcador `wa.me/521XXXXXXXXXX` que ya está en producción; esa página no la usa el formulario).
- Fase 8: pieza "Necesidad: …" (y demás piezas) en las notas de Notion.
- Modo `enforce` (criterio en la sección 8).
- Baja de `/index-legacy` y `Form/`.

## 2. Squash commit sugerido

**Título:** `feat: filtro de calidad de leads + formulario en 2 pasos (modo shadow)`

**Cuerpo:**
```
- Motor de calidad del servidor (lead_quality_flag / lead_score / lead_tier / signals) en
  modo shadow: etiqueta y reenvía todo a n8n con " · Calidad: flag/tier score".
- Anti-bot: token HMAC con tiempo mínimo, honeypot, rate limit, idempotencia por event_id,
  reintento hacia n8n; Turnstile listo y apagado; sin secretos en el código (check en npm test).
- Formulario en 2 pasos con nombre completo, mensaje opcional y no comerciales resueltos en el
  paso 1 sin datos de contacto. Contrato con n8n sin cambios (mismas 11 llaves).
- Tracking rl_*: veredicto del servidor en rl_lead_submit, user_data hasheado, rl_form_step,
  rl_form_submit_attempt, rl_non_commercial_submit, has_message; atribución utm_id/referrer.
- Aviso de privacidad aprobado por revisión legal, vigente desde el 7 de octubre de 2026.

Commits clave: 339f3ac (anti-bot), f437146 (validación compartida), 170f337 (motor),
8e6b93d (shadow/enforce, idempotencia, reintento), c23fd89 (sin secretos), d92cb62
(atribución), 0a546f9 (2 pasos), 875420c (mensaje opcional + has_message), 93b4756 y
b7d907f (aviso aprobado), 450d6b6 (fecha del aviso).
```

## 3. Variables de Production (solo nombres)

| Variable | Estado | Notas |
|---|---|---|
| `FORM_TOKEN_SECRET` | **Configurar antes del merge** | Distinta a la de Preview. Sin ella la capa de token y tiempo mínimo queda apagada (no rompe, pero no protege). |
| `LEAD_GATE_MODE` | **Configurar antes del merge** = `shadow` | Es el valor por defecto, pero se deja explícito. |
| `N8N_WEBHOOK_URL` | ✅ Ya existe | Obligatoria (https, flujo n8n v5). Sin ella los leads reciben 503. |
| `FORM_SHARED_SECRET` | ✅ Ya existe | Obligatoria (header `x-form-secret`). Sin ella los leads reciben 503. |
| `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | ❌ **No configurar todavía** | Se activan juntas 48 h después (sección 5). |
| `VENDOR_CONTACT_EMAIL` | Opcional | Correo que ven proveedores/agencias; si no existe, el mensaje no lo incluye. |

Son todas las variables que lee el código (`api/lead.js`, `api/_lib/turnstile.js`, `api/_lib/form-token.js`).

## 4. Checklist de release

- [ ] Visto bueno de Rut
- [ ] Variables de Production configuradas (`FORM_TOKEN_SECRET`, `LEAD_GATE_MODE=shadow`; sin Turnstile)
- [ ] Squash and merge (título y cuerpo de la sección 2)
- [ ] Deploy de Production en estado Ready (`vercel inspect riselanding.com` → commit del squash)
- [ ] Prueba desde `https://riselanding.com/?rl_internal=1` con "Prueba Riselanding" y `jose.vazquez@riselanding.com`: fila en Notion (notas con " · Calidad: …"), correo de bienvenida, `lead_evaluated` en el log (`mode:"shadow"`, `forwarded:true`, `destination_status:200`), `generate_lead` con `has_message` en GA4 DebugView (requiere el parámetro `has_message` en la etiqueta "GA4 - generate_lead")
- [ ] Monitoreo de 1 hora en los logs de Vercel (`lead_evaluated`, `lead_blocked`, y en nivel error `destination_failed` / `destination_misconfigured` = 0)

Verificaciones adicionales recomendadas tras el deploy:
- `GET https://riselanding.com/api/form-token` → 200, `Cache-Control: no-store`, `form_token` presente y `turnstile_site_key: null`.
- "Busco empleo" en el paso 1 → aviso ahí mismo; el POST solo lleva `solicitante` (+ token, honeypot, `event_id`, `lead_id`); log `lead_not_forwarded` sin hashes; sin fila en Notion.
- `curl -s https://riselanding.com/api/lead -H 'Content-Type: application/json' -d '{"nombre":"Bot"}'` → `{"success":true}` y log `lead_blocked` / `bad_form_token`.
- GTM Preview: Meta - Lead no dispara con tier C (sección 7).

### Plan de rollback

- **Instant Rollback en Vercel** al deployment `riselanding-landing-czi0wj8ea-joluigis-projects.vercel.app` (Dashboard → Deployments → ese deployment → **Instant Rollback**, o `vercel rollback riselanding-landing-czi0wj8ea-joluigis-projects.vercel.app`). Es el Production vigente antes del release (commit `1e2184a`, redesplegado con las variables rotadas).
  - ⚠️ **No** hacer rollback a deployments anteriores a ese (p. ej. `riselanding-landing-7f2mxu5b2…`): usan la URL vieja de n8n, que ahora responde 404.
  - Mientras dure el rollback, los pushes a `main` no se publican solos hasta `vercel promote` o deshacer el rollback.
- **En git (si hace falta):** `git revert <commit del squash>` en `main` (un solo commit, sin `-m`).
- **Parcial:** borrar `FORM_TOKEN_SECRET` → Redeploy apaga solo la capa de token. El gate ya está en `shadow`: no hay modo más permisivo.

### Post-release

- **+48 h:** activar Turnstile con hostnames `riselanding.com` y `www.riselanding.com` (sección 5: condiciones, verificación y reversa).
- **2 a 4 semanas:** revisar los datos del modo shadow (sufijo "Calidad" en Notion, logs `lead_evaluated`) para decidir si se pasa a `enforce` (sección 8 y criterio en `SEGURIDAD-FORMULARIO.md`).

Correo para envíos de prueba que llegan a n8n: **`jose.vazquez@riselanding.com`**, siempre con el nombre "Prueba Riselanding".

## 5. Activación de Turnstile (+48 h)

**Condiciones** (las 48 h posteriores al release, sin incidentes):
- `destination_failed`, `destination_misconfigured` = 0; volumen de leads en Notion en línea con la semana previa;
- `lead_blocked` sin picos anómalos de `too_fast` / `bad_form_token`;
- ningún falso positivo grave detectado en `Calidad: spam`.

**Pasos**
1. Cloudflare → Turnstile → **Add widget** → modo **Managed** → hostnames **`riselanding.com` y `www.riselanding.com`** (los dos; sin uno de ellos el formulario bloquea el envío a personas reales). Copiar Site Key y Secret Key de **producción** (no las de prueba `1x000…`).
2. Vercel → Production: `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`, **las dos a la vez** → **Redeploy**. Anotar el deployment anterior (el del release, sin Turnstile): es el destino de la reversa.

**Verificación** (~10 min)
- `GET /api/form-token` → `turnstile_site_key` con la site key de producción.
- Escritorio y móvil (360 px), en `riselanding.com` **y** en `www.riselanding.com`: el widget aparece sobre el botón y se resuelve solo (Managed); sin franja roja de "solo para pruebas".
- Envío **"Prueba Riselanding"** con `jose.vazquez@riselanding.com` desde `?rl_internal=1`: pantalla de gracias, `lead_evaluated` con `forwarded:true` y **sin** `turnstile_unavailable` / `turnstile_misconfigured` en sus `signals`.
- Logs: `turnstile_misconfigured` = 0 (si aparece, la secret key está mal: revertir); `lead_blocked` con `reason:"turnstile_failed"` en niveles bajos.
- Con un bloqueador que impida cargar `challenges.cloudflare.com`, el formulario muestra el mensaje de verificación de seguridad y no envía (comportamiento esperado).
- Cloudflare → Turnstile → Analytics: tasa de resolución alta, pocos desafíos interactivos.

**Reversa**
- **Inmediata (< 1 min):** `vercel rollback <deployment del release sin Turnstile>` (Instant Rollback conserva las variables con las que se construyó ese deployment, es decir, sin las claves).
- **Definitiva (1–2 min):** borrar `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en Production → Redeploy (después `vercel promote` si se hizo rollback). Con una sola de las dos, la capa también queda apagada.

## 6. Qué revisar durante las primeras 48 h

Los logs de Vercel en Hobby duran muy poco: revisarlos varias veces al día o configurar un log drain.

| Dónde | Qué |
|---|---|
| **Vercel → Logs** | `"evento":"lead_evaluated"`: distribución de `lead_quality_flag`/`lead_tier`, y `forwarded:true` en todos (shadow). `"evento":"lead_blocked"` por `reason`: un pico de `too_fast` o `bad_form_token` puede indicar personas reales bloqueadas. Nivel error: `destination_failed`, `destination_misconfigured`, `turnstile_misconfigured` (deben ser **0**). Volumen de 422 (fricción), 429 y 502/503. |
| **n8n v5 → Executions** | Todas en verde; el `mensaje` con " · Calidad: …"; ninguna duplicada con el mismo `x-rl-event-id`. |
| **Notion** | Volumen diario frente a la semana previa; revisar **cada** fila `Calidad: spam` (falsos positivos); que no entre ningún student/job_seeker. |
| **GA4 → Realtime / DebugView** | Con GTM Preview: llegan `generate_lead`, `form_error`, `form_submit_attempt` y `non_commercial_submit` (este último con `applicant_type`). Embudo: `rl_form_start` → `rl_form_step` (paso 2) → `form_submit_attempt` → `generate_lead`. |
| **Google Ads** | La conversión secundaria "Lead" puede bajar: el tier ahora lo calcula el motor del servidor. |

## 7. Etiquetas de GTM que escuchan los eventos del formulario

Estado del contenedor tras los cambios del 1-oct-2026 (hechos en GTM por José Luis; el repo no
modifica GTM).

| Evento | Etiqueta | Bloqueos | Dispara con |
|---|---|---|---|
| `rl_lead_submit` | Ads - Lead [SECUNDARIA] | G1, G5, G2, G3 | solo `clean` + tier A/B |
| `rl_lead_submit` | Meta - Lead | G1, G5, G2, **G3** (agregado) | solo `clean` + tier A/B |
| `rl_lead_submit` | GA4 - generate_lead | G1, G5 | todos los flags (por diseño: "se mide todo") |
| `rl_form_step` | (variables `DLV - rl_event_data.step_number` / `step_name` ya existen; confirmar en GTM si hay etiqueta GA4) | G1, G5 | una vez por formulario, al pasar al paso 2 |
| `rl_form_submit_attempt` | GA4 - form_submit_attempt (nuevo; activador `CE - rl_form_submit_attempt`) | G1, G5 | siempre (solo GA4) |
| `rl_non_commercial_submit` | GA4 - non_commercial_submit (nuevo; activador `CE - rl_non_commercial_submit`, variable `DLV - rl_event_data.applicant_type`) | G1, G5 | siempre (solo GA4; ninguna conversión) |
| `rl_form_error` | GA4 - form_error | G1, G5 | siempre |
| Rechazo duro | — (no se publica ningún evento) | — | ninguna |

Eliminados: la etiqueta pausada "GAds - form submit" y su activador.

G1 = tráfico interno, G2 = `lead_quality_flag ≠ clean`, G3 = `lead_tier = C`, G5 = entorno ≠ producción.

### Confirmar en GTM Preview que Meta - Lead ya NO dispara con tier C

Sin crear un lead real ni una conversión:

1. GTM → **Preview** → URL `https://riselanding.com/?rl_internal=1` (tiene que ser el dominio de
   producción: en un preview G5 bloquea todo y no se ve el efecto de G3).
2. En la consola del navegador de esa pestaña:
   ```js
   dataLayer.push({ rl_event_data: null });
   dataLayer.push({ event: 'rl_lead_submit', rl_event_data: {
     event_id: 'qa-tier-c', transaction_id: 'qa-tier-c', lead_id: 'qa-tier-c', form_id: 'agenda_diagnostico',
     lead_quality_flag: 'clean', lead_score: 36, lead_tier: 'C', email_domain_type: 'free' } });
   ```
3. Tag Assistant → evento `rl_lead_submit` → **Meta - Lead** en "Tags Not Fired" → *Blocking Triggers*:
   `EXC - G3 Lead Tier C` evaluado como **verdadero** (además de G1, por `rl_internal`).
4. Repetir con `lead_tier: 'A'` y `event_id` distinto: en Meta - Lead, G3 aparece como **falso** (solo
   bloquea G1). La diferencia entre ambos casos confirma que G3 está aplicado.
5. Lo mismo debe verse en **Ads - Lead**. GA4 - generate_lead no tiene G3 (por diseño).

## 8. Antes de activar enforce (no es parte de este release)

Ver el criterio en `SEGURIDAD-FORMULARIO.md`: mínimo 2–4 semanas en shadow, revisión de falsos positivos con el sufijo "Calidad" y destino de descartados funcionando. Prioritario fuera del repo: deduplicación en n8n por `x-rl-event-id`.

**Requisito obligatorio adicional:** actualizar el aviso de privacidad para describir la conservación de hasta 30 días de los descartados en Google Workspace (Google LLC como encargado) y publicarlo antes o junto con la activación.

Borrador de referencia (texto retirado del aviso en la revisión legal del 5-oct-2026; requiere nueva revisión antes de usarlo):

- §02, después del párrafo de "Solicitudes que no se registran en nuestro CRM":
  > Las solicitudes que nuestros filtros automáticos de calidad bloqueen tampoco se registran en el CRM, pero **podrán conservarse hasta 30 días**, solo con los datos mínimos de contacto (nombre, correo, teléfono y empresa) y el resultado de la evaluación, con la única finalidad de revisar y corregir errores del filtro. Al vencer ese plazo se eliminan. Este almacenamiento lo realiza Google LLC como encargado (ver sección 05).
- §03, finalidad primaria 5, después de "…para distinguir solicitudes comerciales de envíos no válidos":
  > , así como la revisión temporal de las solicitudes que esa evaluación bloquee para corregir sus errores
- §05, antes del párrafo de Cloudflare:
  > **Google LLC** (Estados Unidos), a través de Google Workspace, actúa como encargado del almacenamiento temporal de las solicitudes bloqueadas por nuestros filtros automáticos de calidad descrito en la sección 02: trata esos datos solo por cuenta y bajo las instrucciones del Responsable, durante un máximo de 30 días.

### Propuesta de contrato del webhook de descartados (n8n → Google Sheet)

Solo para lo que enforce no reenvía (spam del motor y `competitor` por agency-denylist). Se enviaría a `N8N_DISCARD_WEBHOOK_URL` con los headers `x-form-secret` y `x-rl-event-id`:

```json
{
  "schema_version": 1,
  "event_id": "uuid", "lead_id": "uuid", "received_at": "2026-10-01T15:04:05Z",
  "mode": "enforce", "reason": "engine_spam | agency_denylist",
  "lead_quality_flag": "spam", "lead_score": 35, "lead_tier": "C",
  "spam_points": 5, "signals": ["phone_invalid_len_8", "company_junk"],
  "contacto_para_rescate": { "nombre": "…", "email": "…", "telefono_e164": "+52…", "empresa": "…" },
  "contexto": {
    "solicitante": "empresa", "tamano": "11_50", "presupuesto": "sin_definir",
    "servicios": ["Implementación de CRM"], "sitio_web": "https://…", "email_domain_type": "free",
    "necesidad_extracto": "primeros 280 caracteres",
    "utm_source": "…", "utm_medium": "…", "utm_campaign": "…"
  }
}
```

- Solo los 4 datos de contacto mínimos para rescatar un falso positivo. Sin IP, sin user agent y sin el mensaje completo. Los rechazos duros (bots) no se envían.
- Retención: borrado automático a los 30 días en la Sheet.
- **Requisito legal:** el aviso aprobado (5-oct-2026) **no** describe este almacenamiento; hay que actualizarlo con el borrador de arriba (y nueva revisión legal) antes o junto con la activación.
