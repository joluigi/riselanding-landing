# Release del lead quality gate en modo SHADOW

Rama: `feat/lead-quality-gate` → `main` (Vercel publica `main` en Production automáticamente).
Objetivo: publicar el gate en **shadow** para que empiece el periodo de observación. Las fases 6–9
van en PRs posteriores.

Última actualización: 7-oct-2026 (formulario en 2 pasos; aviso aprobado + ajuste de exactitud; release sin Turnstile; Turnstile a las +48 h).

## 1. Estado de los bloqueantes

| # | Bloqueante | Estado |
|---|---|---|
| 1 | Aprobación legal del aviso de privacidad | ✅ **Cumplido.** Aviso aprobado el 5-oct-2026 con los ajustes de `93b4756` (sobre `b2e450a` y `2efc019`). Solo falta poner la fecha real el día del release (paso 1). |
| 2 | `FORM_TOKEN_SECRET` en Production | ⛔ **Pendiente.** Sin él, la capa de token y tiempo mínimo queda apagada (no rompe, pero no protege). |
| 3 | `N8N_WEBHOOK_URL` y `FORM_SHARED_SECRET` en Production | ✅ Definidas (rotación del 30-sep/1-oct: n8n v5 con Header Auth; v4 despublicado). El código **ya no tiene valores de respaldo**: sin ellas, los leads reciben 503. |
| 4 | Turnstile | **No entra al release.** Se publica sin `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` y se activa 48 h después si todo está estable (sección 5). |

Ninguna de las fases 6–9 es bloqueante:

- **Fase 6 (atribución):** ya está hecha (`d92cb62`) y entra al release; de todos modos no era bloqueante (es aditiva).
- **Fase 7 (UX):** el doble envío ya está cubierto (botón deshabilitado + bandera + idempotencia por `event_id`) y los errores son accesibles. Pendiente menor: los mensajes dicen "escríbenos por WhatsApp" sin número (siempre incluyen también el correo).
- **Fase 8 (payload):** el sufijo " · Calidad: …" ya sale en shadow; Title Case, minúsculas del correo y "México" son cosméticos.
- **Embudo del formulario en 2 pasos:** `rl_form_start` → `rl_form_step` (paso 2, `step_name:"contacto"`) → `rl_form_submit_attempt` → `rl_lead_submit`. `rl_form_error` lleva `step_number`.
- **"¿Qué quieres resolver?" es opcional:** sin mínimo para enviar; el motor da +10 solo con 20+ caracteres sin tecleo al azar (vacío o corto: 0, sin penalizar). `rl_lead_submit.has_message` (booleano, sin el texto) mide cuántos leads lo llenan. Para verlo en GA4 hace falta la variable `DLV - rl_event_data.has_message` y agregarla como parámetro a la etiqueta "GA4 - generate_lead" (acción en GTM).
- **Fase 9 (observabilidad):** los logs estructurados (`lead_evaluated`, `lead_blocked`, `destination_failed`, `destination_misconfigured`, `turnstile_*`) y la suite de pruebas ya existen.

## 2. Qué entra al release

| Commit | Contenido | ¿Entra? |
|---|---|---|
| `339f3ac` | Fase 1: token HMAC, Turnstile (dormido sin claves), honeypot, rate limit | ✅ |
| `44334e9` | `turnstile_misconfigured` y telemetría de fricción | ✅ |
| `f437146` | Fase 2: campos nuevos y validación compartida | ✅ |
| `2561a58` | `phone_sha256` consistente en logs | ✅ |
| `b2e450a` | Aviso de privacidad: datos nuevos, Turnstile, MX | ✅ (aprobado con los ajustes de `93b4756`) |
| `73b1949` | `rl_non_commercial_submit` y "¿Elegiste mal? Cambia la opción" | ✅ |
| `170f337` | Fase 3: motor de calidad | ✅ |
| `604f760` | Motor: teclado, URLs propias, vocabulario del negocio | ✅ |
| `8e6b93d` | Fase 4: `LEAD_GATE_MODE`, idempotencia, reintento | ✅ |
| `e4558cf` | URLs `.mx` y criterio para enforce | ✅ |
| `aa373f7` | Fase 5: `user_data` con nombre/apellido y E.164 | ✅ |
| `c23fd89` | Sin valores de respaldo del destino + check de secretos | ✅ (rotación confirmada) |
| `d73f745`, `c0928d3` | Documentación (este checklist, correo de pruebas, auth de git) | ✅ |
| `2efc019` | Aviso: conservación temporal de bloqueadas (retirada después en `93b4756`) | ✅ (forma parte del historial aprobado) |
| `93b4756` | Aviso: ajustes de revisión legal — **aprobado para release** (5-oct-2026) | ✅ |
| `d92cb62` | Fase 6: `utm_id`/`referrer` en `rl_attr`; atribución en `rl_lead_submit` y en el log | ✅ (lista y probada) |
| `bca7680` | Nombre completo en un campo, necesidad 20+, no comerciales sin datos de contacto | ✅ |
| `0a546f9` | Formulario en 2 pasos + `rl_form_step` | ✅ |
| `b7d907f` | Aviso: ajuste de exactitud por formulario de 2 pasos (aprobado por José Luis) | ✅ |
| _(este cambio)_ | "¿Qué quieres resolver?" opcional + `has_message` en `rl_lead_submit` | ✅ |
| — | Baja de `/index-legacy` y `Form/` | ❌ No creado; va aparte |

## 3. Pasos para publicar (SIN Turnstile)

Correo para envíos de prueba que llegan a n8n: **`jose.vazquez@riselanding.com`**, siempre con el
nombre "Prueba Riselanding" (n8n manda correo de bienvenida; un buzón inexistente rebota y daña la
reputación de envío del dominio).

1. **Fecha del aviso.** En `aviso-de-privacidad.html` reemplaza `[FECHA DEL RELEASE]` por la fecha real del release (formato `6 DE OCTUBRE DE 2026`), commit en la rama, y ejecuta `npm run check:release`: debe responder "✔ Listo para release". El aviso ya está aprobado por legal (5-oct-2026); no cambies otro texto sin nueva revisión.
2. **Variables en Vercel → Settings → Environment Variables → Production.** Aplican solo en el siguiente deploy:
   - `FORM_TOKEN_SECRET`: nuevo y **distinto** del de Preview:
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   - `LEAD_GATE_MODE=shadow`.
   - **No** definir `TURNSTILE_SITE_KEY` ni `TURNSTILE_SECRET_KEY` todavía (sección 5).
   - Ya están: `N8N_WEBHOOK_URL`, `FORM_SHARED_SECRET`.
3. **PR** `feat/lead-quality-gate` → `main` (con la CLI: `GH_TOKEN=$(gh auth token --user joluigi) gh pr create …`, ver `docs/git-auth-local.md`). Revisar el preview del PR.
4. **Merge** con merge commit. Anotar el nombre del deployment nuevo de Production: es el destino del rollback de Turnstile (sección 5).
5. **Verificación posterior al deploy** (~10 min):
   - `vercel inspect riselanding.com`: deployment nuevo con el commit del merge.
   - `GET https://riselanding.com/api/form-token` → 200, `Cache-Control: no-store`, `form_token` presente y `turnstile_site_key: null`.
   - Envío real **"Prueba Riselanding"** con `jose.vazquez@riselanding.com` desde `https://riselanding.com/?rl_internal=1` (G1 evita que cuente como conversión). Esperado:
     - pantalla de gracias, sin widget de Turnstile y sin espacio vacío sobre el botón;
     - Vercel Logs: `lead_evaluated` con `mode:"shadow"`, `forwarded:true`, `destination_status:200` y `attribution`;
     - n8n v5 → Executions: 200; Notion: fila nueva cuyas "Notas iniciales" terminan en ` · Calidad: …`; correo de bienvenida recibido.
   - "¿Qué quieres resolver? (opcional)": se puede continuar con el campo vacío; en GTM Preview, `rl_lead_submit.has_message` = `false` / `true` según se haya escrito.
   - Formulario en 2 pasos: "Continuar →" valida el paso 1 sin enviar nada (DevTools → Network: ningún POST a `/api/lead`); el paso 2 muestra "Paso 2 de 2", foco en "Nombre completo"; "← Atrás" conserva lo capturado.
   - "Busco empleo" en el paso 1 → "Continuar": aviso de vacantes ahí mismo, **sin** pedir datos de contacto; el POST solo lleva `solicitante` (+ token, honeypot, `event_id`, `lead_id`); log `lead_not_forwarded` sin hashes; **sin** fila en Notion; en GTM Preview, `non_commercial_submit` a GA4.
   - `curl -s https://riselanding.com/api/lead -H 'Content-Type: application/json' -d '{"nombre":"Bot"}'` → `{"success":true}` y log `lead_blocked` / `bad_form_token`.
   - En los logs: `destination_misconfigured` y `destination_failed` = **0**.
   - Confirmar en GTM Preview que Meta - Lead no dispara con tier C (sección 7).

## 4. Cómo revertir en menos de 5 minutos

- **Todo el release:**
  `vercel rollback riselanding-landing-czi0wj8ea-joluigis-projects.vercel.app`
  (o Dashboard → Deployments → ese deployment → **Instant Rollback**). Es el Production vigente al 1-oct (commit `1e2184a`, redesplegado con las variables rotadas).
  - ⚠️ **No** hacer rollback a deployments anteriores a ese (p. ej. `riselanding-landing-7f2mxu5b2…`): usan la URL vieja de n8n, que ahora responde 404, y **todos** los leads fallarían.
  - Mientras dure el rollback, los siguientes pushes a `main` no se publican solos hasta ejecutar `vercel promote` o deshacer el rollback. Corrección definitiva: `git revert -m 1 <merge>`.
- **Solo la capa de token:** borrar `FORM_TOKEN_SECRET` → Redeploy (1–2 min).
- **Comportamiento del gate:** ya está en `shadow`; no hay nada más permisivo que eso.

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
