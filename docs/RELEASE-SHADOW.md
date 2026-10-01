# Release del lead quality gate en modo SHADOW

Rama: `feat/lead-quality-gate` → `main` (Vercel publica `main` en Production automáticamente).
Objetivo: publicar el gate en **shadow** para que empiece el periodo de observación. Las fases 6–9
van en PRs posteriores.

Última actualización: 1-oct-2026.

## 1. Estado de los bloqueantes

| # | Bloqueante | Estado |
|---|---|---|
| 1 | Aprobación legal del aviso de privacidad (`b2e450a`) | ⛔ **Pendiente.** El formulario nuevo recaba datos (tipo de solicitante, sitio, presupuesto, necesidad) que el aviso publicado no menciona. Sin aprobación **no se publica**. |
| 2 | `FORM_TOKEN_SECRET` en Production | ⛔ **Pendiente.** Sin él, la capa de token y tiempo mínimo queda apagada (no rompe, pero no protege). |
| 3 | `N8N_WEBHOOK_URL` y `FORM_SHARED_SECRET` en Production | ✅ Definidas (rotación del 30-sep/1-oct: n8n v5 con Header Auth; v4 despublicado). El código **ya no tiene valores de respaldo**: sin ellas, los leads reciben 503. |
| 4 | Turnstile (opcional) | Si se activa, el widget Managed debe incluir `riselanding.com` **y** `www.riselanding.com`; si falta un hostname el formulario bloquea el envío a personas reales. Ante la duda, publicar sin las claves y activarlas después. |

Ninguna de las fases 6–9 es bloqueante:

- **Fase 6 (atribución):** `rl_lid`, `rl_attr` y `rl_internal` ya existen en producción; lo que falta (`utm_id`, `referrer`, atribución en `rl_lead_submit`) es aditivo.
- **Fase 7 (UX):** el doble envío ya está cubierto (botón deshabilitado + bandera + idempotencia por `event_id`) y los errores son accesibles. Pendiente menor: los mensajes dicen "escríbenos por WhatsApp" sin número (siempre incluyen también el correo).
- **Fase 8 (payload):** el sufijo " · Calidad: …" ya sale en shadow; Title Case, minúsculas del correo y "México" son cosméticos.
- **Fase 9 (observabilidad):** los logs estructurados (`lead_evaluated`, `lead_blocked`, `destination_failed`, `destination_misconfigured`, `turnstile_*`) y la suite de pruebas ya existen.

## 2. Qué entra al release

| Commit | Contenido | ¿Entra? |
|---|---|---|
| `339f3ac` | Fase 1: token HMAC, Turnstile, honeypot, rate limit | ✅ |
| `44334e9` | `turnstile_misconfigured` y telemetría de fricción | ✅ |
| `f437146` | Fase 2: campos nuevos y validación compartida | ✅ |
| `2561a58` | `phone_sha256` consistente en logs | ✅ |
| `b2e450a` | Aviso de privacidad — **REQUIERE REVISIÓN LEGAL** | ✅ **solo con aprobación legal confirmada**; sin ella el release se bloquea |
| `73b1949` | `rl_non_commercial_submit` y "¿Elegiste mal? Cambia la opción" | ✅ |
| `170f337` | Fase 3: motor de calidad | ✅ |
| `604f760` | Motor: teclado, URLs propias, vocabulario del negocio | ✅ |
| `8e6b93d` | Fase 4: `LEAD_GATE_MODE`, idempotencia, reintento | ✅ |
| `e4558cf` | URLs `.mx` y criterio para enforce | ✅ |
| `aa373f7` | Fase 5: `user_data` con nombre/apellido y E.164 | ✅ |
| `c23fd89` | Sin valores de respaldo del destino + check de secretos | ✅ (la rotación ya está confirmada) |
| — | Baja de `/index-legacy` y `Form/` | ❌ No creado; va aparte, cuando se confirme que Zoho no alimenta nada |

## 3. Pasos para publicar

1. **Aprobación legal** de `b2e450a`. Si legal pide cambios, se aplican en un commit nuevo antes del merge.
2. **Variables en Vercel → Settings → Environment Variables → Production.** Aplican solo en el siguiente deploy, así que no afectan lo que hoy está en producción:
   - `FORM_TOKEN_SECRET`: nuevo y **distinto** del de Preview:
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   - `LEAD_GATE_MODE=shadow` (explícito, aunque es el valor por defecto).
   - Opcional: `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` de producción, **las dos juntas o ninguna**.
   - Opcional: `VENDOR_CONTACT_EMAIL`.
   - Ya están: `N8N_WEBHOOK_URL`, `FORM_SHARED_SECRET`.
3. **PR** `feat/lead-quality-gate` → `main`. Revisar el preview del PR (usa las variables de Preview).
4. **Merge** con merge commit.
5. **Verificación posterior al deploy** (~10 min):
   - `vercel inspect riselanding.com`: deployment nuevo con el commit del merge.
   - `GET https://riselanding.com/api/form-token` → 200, `Cache-Control: no-store`, `form_token` presente y `turnstile_site_key` según las claves definidas.
   - Envío real **"Prueba Riselanding"** desde `https://riselanding.com/?rl_internal=1`. `rl_internal=1` activa la guarda G1 para que la prueba no cuente como conversión. Esperado:
     - pantalla de gracias;
     - Vercel Logs: `lead_evaluated` con `mode:"shadow"`, `forwarded:true`, `destination_status:200`;
     - n8n v5 → Executions: 200;
     - Notion: fila nueva cuyas "Notas iniciales" terminan en ` · Calidad: …`.
   - Envío como "Busco empleo": aviso de vacantes, log `lead_not_forwarded`, **sin** fila en Notion.
   - `curl -s https://riselanding.com/api/lead -H 'Content-Type: application/json' -d '{"nombre":"Bot"}'` → `{"success":true}` y log `lead_blocked` / `bad_form_token`.
   - Buscar `destination_misconfigured` en los logs: debe haber **0**.

## 4. Cómo revertir en menos de 5 minutos

- **Todo el release:**
  `vercel rollback riselanding-landing-czi0wj8ea-joluigis-projects.vercel.app`
  (o Dashboard → Deployments → ese deployment → **Instant Rollback**). Es el Production vigente al 1-oct (commit `1e2184a`, redesplegado con las variables rotadas).
  - ⚠️ **No** hacer rollback a deployments anteriores a ese (p. ej. `riselanding-landing-7f2mxu5b2…`): usan la URL vieja de n8n, que ahora responde 404, y **todos** los leads fallarían.
  - Mientras dure el rollback, los siguientes pushes a `main` no se publican solos hasta ejecutar `vercel promote` o deshacer el rollback. Corrección definitiva: `git revert -m 1 <merge>`.
- **Solo Turnstile** (p. ej. hostname mal configurado): borrar las dos claves → Redeploy (1–2 min).
- **Solo la capa de token:** borrar `FORM_TOKEN_SECRET` → Redeploy.
- **Comportamiento del gate:** ya está en `shadow`; no hay nada más permisivo que eso.

## 5. Qué revisar durante las primeras 48 h

Los logs de Vercel en Hobby duran muy poco: revisarlos varias veces al día o configurar un log drain.

| Dónde | Qué |
|---|---|
| **Vercel → Logs** | `"evento":"lead_evaluated"`: distribución de `lead_quality_flag`/`lead_tier`, y `forwarded:true` en todos (shadow). `"evento":"lead_blocked"` por `reason`: un pico de `too_fast` o `bad_form_token` puede indicar personas reales bloqueadas. Nivel error: `destination_failed`, `destination_misconfigured`, `turnstile_misconfigured` (deben ser **0**). Volumen de 422 (fricción), 429 y 502/503. |
| **n8n v5 → Executions** | Todas en verde; el `mensaje` con " · Calidad: …"; ninguna duplicada con el mismo `x-rl-event-id`. |
| **Notion** | Volumen diario frente a la semana previa; revisar **cada** fila `Calidad: spam` (falsos positivos); que no entre ningún student/job_seeker. |
| **GA4 → Realtime / DebugView** | Con `?rl_internal=1` + GTM Preview: llegan `generate_lead` y `form_error`. `rl_form_submit_attempt` y `rl_non_commercial_submit` no aparecen hasta crear sus etiquetas en GTM. |
| **Google Ads** | La conversión secundaria "Lead" puede bajar: el tier ahora lo calcula el motor del servidor. |
| **Cloudflare → Turnstile** (si está activo) | Tasa de resolución y de desafíos. |

## 6. Etiquetas de GTM que escuchan los eventos del formulario (export v2.1.1)

| Evento | Etiqueta | Bloqueos | Dispara con |
|---|---|---|---|
| `rl_lead_submit` | Ads - Lead [SECUNDARIA] | G1, G5, G2, G3 | solo `clean` + tier A/B |
| `rl_lead_submit` | Meta - Lead | G1, G5, G2 | `clean` en cualquier tier (C incluido, por diseño) |
| `rl_lead_submit` | GA4 - generate_lead | G1, G5 | todos los flags (por diseño) |
| `rl_non_commercial_submit` | — | — | ninguna |
| Rechazo duro | — (no se publica ningún evento) | — | ninguna |

G1 = tráfico interno, G2 = `lead_quality_flag ≠ clean`, G3 = `lead_tier = C`, G5 = entorno ≠ producción.

## 7. Antes de activar enforce (no es parte de este release)

Ver el criterio en `SEGURIDAD-FORMULARIO.md`: mínimo 2–4 semanas en shadow, revisión de falsos positivos con el sufijo "Calidad" y destino de descartados funcionando. Prioritario fuera del repo: deduplicación en n8n por `x-rl-event-id`.

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
- **Requisito legal:** el aviso en revisión dice que lo bloqueado "no se almacena, solo queda un hash". Antes de activar este destino hay que actualizar el aviso y agregar a Google como encargado.
