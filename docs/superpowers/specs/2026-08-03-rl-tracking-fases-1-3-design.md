# Tracking rl_* — Fases 1–3 (dataLayer, engagement y conversión)

**Fecha:** 2026-08-03
**Referencia:** Guía de Implementación — Tracking y Campañas v2.1 (esquema `rl_schema_version: 2.1.0`)
**Contenedor GTM:** GTM-P3WZC7MV (JSON corregido: `GTM_riselanding_tracking_v2.1.1.json`)
**Estado del contenedor:** guardas G1–G3/G5 operativas; constantes de Ads/Meta con placeholder (se reemplazan después, no bloquean este trabajo).

## Objetivo

Implementar la Capa 1 (sitio) del esquema de tracking: publicar los eventos `rl_*` al `dataLayer` con el contrato de la guía, para que el contenedor GTM ya importado dispare cada tag en el momento correcto. Sin este trabajo, ningún tag dispara.

## Decisiones tomadas (con José Luis, 2026-08-03)

1. **Sin CTA de WhatsApp por ahora.** El listener de `rl_whatsapp_click` queda implementado y dormido (delegado sobre `a[href*="wa.me"]`); cuando se agregue un enlace, el evento dispara sin tocar código.
2. **Formulario: +1 campo.** Select opcional "Tamaño de tu empresa" → `company_size_bucket`. No se agregan más campos de cualificación.
3. **Consent Mode v2 con geo-middleware de Vercel.** `denied` para EEA/UK detectado por `x-vercel-ip-country`, `granted` para el resto (incluida primera visita sin cookie).
4. **Arquitectura híbrida.** Bootstrap inline en `<head>` (obligatorio antes de GTM) + `js/rl-tracking.js` con `defer` para todo lo demás.
5. **`rl_case_study_view` mapeado a `#resultados`** (75% de la sección recorrida, `case_id: 'resultados_home'`). Aprobado explícitamente.

## Alcance

**Se implementa:** `rl_context_ready`, `rl_scroll_depth` (25/50/75/90), `rl_engaged_session`, `rl_service_view`, `rl_case_study_view`, `rl_form_start`, `rl_form_error`, `rl_lead_submit`, `rl_phone_click`, `rl_whatsapp_click` (dormido).

**Fuera de alcance (no existe la feature en el sitio):** `rl_pricing_view`, `rl_content_download`, `rl_form_step`, `rl_meeting_booked`, y todos los eventos Nivel D (CRM/server-side, Fase 6 de la guía). `api/lead.js` no se modifica.

## Arquitectura

| Pieza | Responsabilidad |
|---|---|
| `index.html` `<head>` (inline, antes del snippet GTM) | Cookies de identidad/atribución, Consent Mode v2, push de `rl_context_ready`. Síncrono, sin dependencias, ~60 líneas. |
| `js/rl-tracking.js` (nuevo, `<script defer>`) | Eventos de engagement, listeners de conversión, helpers compartidos (UUID, reset, hashing). Único emisor de eventos post-carga. |
| `middleware.js` (nuevo, raíz del repo) | Vercel Routing Middleware: copia `x-vercel-ip-country` a la cookie `rl_geo` (Set-Cookie en la respuesta del documento, así el inline script la lee en esa misma carga). Matcher limitado a rutas de documento (excluye `/Assets`, `/api`, archivos estáticos). |
| `index.html` (form + submit handler) | Campo nuevo de tamaño de empresa; el handler existente emite `rl_form_start`/`rl_form_error`/`rl_lead_submit`. El contrato con `/api/lead` (firma, honeypot `b_comments`, `X-Form-Token`, payload) no cambia. |

## Fase 1 — Capa base (bootstrap inline)

### Cookies (first-party, dominio propio, `SameSite=Lax`)

- **`rl_lid`** (400 días): JSON compacto con `lead_id` (UUIDv4), `first_seen` (ISO), `session_count`. Sesión nueva = ausencia de flag en `sessionStorage`; incrementa `session_count` y genera `session_id` con formato `{epoch}.{sufijo5}` (§2.2 de la guía). `is_returning = session_count > 1`.
- **`rl_attr`** (90 días): `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid` (los presentes en la URL), `first_touch` y `last_touch` (`source`, `medium`, `campaign`, `content`, `term`, `timestamp`, `landing_page`), `touch_count`, y `network_meta` desde `rl_net`/`rl_mt`/`rl_dev` de la plantilla de seguimiento. Reglas: `first_touch` se escribe una sola vez y **nunca** se sobrescribe (C-checklist §6); al inicio de cada sesión nueva, si hay origen identificable (UTMs, click ID o referrer externo) se actualiza `last_touch` con ese origen; si no lo hay, `last_touch` se conserva. `touch_count` incrementa exactamente una vez por sesión nueva (identificable o directa); dentro de la misma sesión nunca incrementa.
- **`rl_internal`** (permanente, 400 días): la URL `?rl_internal=1` la fija; `user.is_internal: true` desde entonces (guarda G1). No hay mecanismo de des-marcado (igual que la guía).
- **`rl_geo`** (sesión): la escribe el middleware; el bootstrap solo la lee.

### Consent Mode v2 (antes del snippet GTM)

- `gtag('consent', 'default', …)` con la lista EEA/UK (los 27 de la UE + IS/LI/NO + GB): `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` en `denied` si `rl_geo` ∈ lista; `granted` en cualquier otro caso (MX/LATAM, cookie ausente, país desconocido). `url_passthrough: true`. Sin banner de consentimiento en este alcance (C-25: LFPDPPP no exige opt-in previo; el banner para EEA quedaría pendiente si algún día se hace campaña ahí).

### Objeto de contexto `rl_context_ready` (§2.2)

Bloques `site`, `page`, `user`, `traffic` completos. Taxonomía para este one-pager:

```
site:    environment 'production' · currency 'MXN'
page:    type 'landing' · service_line 'paquete_integral' · vertical_fit 'horizontal'
         target_segment 'general_b2b_mx' · language 'es-MX' · template 'lp_home_v1'
         path location.pathname · is_landing_page true · experiment_id/variant_id null
user:    lead_id/session_id de rl_lid · user_type 'anonymous' · consent_state (según geo)
         is_internal (cookie) · is_returning · session_count
traffic: click IDs + first_touch/last_touch/network_meta de rl_attr · touch_count
         days_since_first_touch (entero, desde first_seen)
```

`site.environment` es `'production'` fijo: el sitio no tiene entorno de staging desplegado; si algún día existe, se deriva de `location.hostname`.

## Fase 2 — Engagement (`js/rl-tracking.js`)

Reglas transversales: **reset** `dataLayer.push({ rl_event_data: null })` antes de cada push (C-13); `event_id` UUIDv4 único por evento (C-15); cada evento dispara **una sola vez por carga de página** (salvo `rl_scroll_depth`, una vez por umbral); nada de PII sin hashear (C-14).

| Evento | Disparo | Payload clave |
|---|---|---|
| `rl_scroll_depth` | Umbrales 25/50/75/90 del documento, `passive`, rAF-throttled | `threshold` |
| `rl_engaged_session` | ≥45 s en página **y** scroll máx ≥50% **y** ≥2 interacciones (click/keydown/focus en elementos interactivos: tabs, FAQ, nav, form) | `engagement_time_sec`, `max_scroll_pct`, `interaction_count` |
| `rl_service_view` | 20 s **acumulados** de visibilidad de `#servicios` (IntersectionObserver: ratio ≥50% **o** la sección cubriendo ≥50% del viewport — en móvil la sección es más alta que la pantalla y el ratio nunca llega a 0.5) + temporizador que pausa al salir | `service_line 'paquete_integral'`, `assigned_partner 'ambos'`, `dwell_time_sec` |
| `rl_case_study_view` | El fondo de `#resultados` alcanza el 75% de recorrido visible | `case_id 'resultados_home'`, `case_segment 'general_b2b_mx'`, `read_depth_pct` |
| `rl_form_start` | Primer `focusin` en un campo de `#lead-form` (1× por instancia) | `form_id 'agenda_diagnostico'`, `form_location 'contacto'` |
| `rl_form_error` | `reportValidity()` falla (campo y `error_type 'validation'`) o el gateway responde 422/429/5xx (`error_type 'server'`) | `form_id`, `error_field`, `error_type` |
| `rl_phone_click` | Click delegado en `a[href^="tel:"]` | `cta_location` (`footer`) |
| `rl_whatsapp_click` | Click delegado en `a[href*="wa.me"]` — **dormido** hasta que exista el enlace | `transaction_id`, `prefilled_ref`, `cta_location`, `service_line` — `prefilled_ref` = `RL-` + primeros 8 caracteres del `lead_id`; el listener lo inserta en el parámetro `text` de la URL wa.me al momento del click (C-19) |

Los temporizadores usan tiempo visible (pausan con `visibilitychange`) para no contar pestañas en segundo plano en `engaged_session` y `service_view`.

## Fase 3 — Conversión (`rl_lead_submit`)

### Campo nuevo en el formulario

Select opcional "Tamaño de tu empresa": `1_10`, `11_50`, `51_200`, `200_plus` (etiquetas humanas "1–10 personas", etc.). Su valor viaja: (a) al payload del dataLayer como `company_size_bucket`; (b) concatenado al campo `mensaje` que ya llega a Notion (`· Tamaño: 51–200`), sin cambiar el contrato de n8n ni `api/lead.js`.

### Emisión

`rl_lead_submit` se emite cuando el gateway responde `success: true` (incluye el fake success que reciben los bots: llegan etiquetados, ver flag). Se emite antes de reemplazar el form por el mensaje de éxito. Payload §2.4 adaptado:

- Identidad: `event_id` (UUIDv4 nuevo), `transaction_id = lead_id`, `lead_id`.
- Origen: `form_id 'agenda_diagnostico'`, `form_location 'contacto'`, `lead_source_channel 'form'`.
- Interés: `service_line` derivado de `pilar()` existente — mapa: Bundle Completo → `paquete_integral`, Google Ads → `publicidad_digital`, Sitio Web + SEO → `web_seo`, CRM + Automatización → `crm_automatizacion`; `assigned_partner 'ambos'`.
- Cualificación: `company_size_bucket` (o `null`), `prospect_segment null`, `prospect_geo null`, `operation_volume_bucket null`, `current_marketing_maturity null` (el form no los captura; claves presentes con `null` para mantener el contrato).
- Calidad: `email_domain_type` (`corporate` | `free` | `disposable`). Lista `free`: gmail.com, hotmail.com/.es, outlook.com/.es, yahoo.com/.com.mx, live.com/.com.mx, icloud.com, proton.me, protonmail.com, aol.com, msn.com. Lista `disposable`: la misma de `api/lead.js`, duplicada en cliente (con comentario cruzado en ambos archivos para mantenerlas en sincronía). Todo lo demás → `corporate`. Además `lead_quality_flag`, `lead_score`, `lead_tier`.
- Alineación: `vertical_fit 'horizontal'`, `segment_match null` (no hay `prospect_segment` que comparar).
- `user_data`: `sha256_email_address` (correo en minúsculas, sin espacios) y `sha256_phone_number` (E.164: dígitos, con `+52` antepuesto a los 10 dígitos nacionales) vía `crypto.subtle` (ya hay un helper `sha256hex` en el sitio; se reutiliza/mueve a rl-tracking). Sin Web Crypto → claves omitidas, jamás texto plano.
- Contexto: `time_to_convert_sec` (desde `t0` existente), `touch_count`, `days_since_first_touch`.

### `lead_quality_flag`

- `spam`: honeypot `b_comments` lleno.
- `suspect`: correo desechable **o** teléfono que no valida como MX de 10 dígitos (tras normalizar).
- `clean`: el resto.

La guarda G2 del contenedor bloquea Ads/Meta para todo lo que no sea `clean`; GA4 lo recibe todo etiquetado ("se mide todo, se optimiza poco").

### `lead_score` (0–100) y `lead_tier`

```
base 15
+25 correo corporativo   | +5 correo gratuito | −30 correo desechable
+15 empresa llenada
+15 tamaño 51_200 o 200_plus | +10 tamaño 11_50 | +5 tamaño 1_10
+10 teléfono MX válido (10 dígitos)
+5  ≥1 servicio seleccionado
clamp [0, 100] · Tier A ≥70 · B 40–69 · C <40
Si flag = spam → score 0, tier C directo.
```

Casos de referencia (el teléfono válido y ≥1 servicio están presentes en casi todo envío real, por ser campos obligatorios/habituales):

- gmail sin empresa (+tel +servicio) = 15+5+10+5 = **35 → Tier C** → G3 bloquea Ads (caso de QA de la guía).
- gmail + empresa + tamaño 1_10 = 55 → Tier B (pyme chica con correo gratuito, realista en MX).
- Corporativo + empresa (sin tamaño) = 70 → Tier A; con tamaño 51_200 = 85 → Tier A.
- Desechable = máx. 30 → Tier C y flag `suspect`.

## Manejo de errores

- Todo `rl-tracking.js` corre dentro de guardas: si `dataLayer` no existe, lo crea; si un listener lanza, no rompe la UI (el tracking es best-effort, el formulario funciona igual sin él).
- El push de `rl_lead_submit` no bloquea el flujo de éxito del formulario: si el hashing falla, se emite sin `user_data`.
- El middleware nunca bloquea la respuesta: si el header geo no existe, no escribe cookie y el consent queda `granted` (default MX).

## Validación (checklist de salida)

En GTM Preview + DevTools, sobre `vercel dev`:

1. `rl_context_ready` es el primer evento `rl_*`, con los 4 bloques poblados; `?gclid=test123` aparece en `traffic.gclid` y persiste en `rl_attr`.
2. Segunda visita: `first_touch` intacto, `session_count` incrementa, `is_returning: true`.
3. `?rl_internal=1` → ningún tag dispara (guarda G1) y la cookie persiste.
4. Scroll completo → `rl_scroll_depth` 25/50/75/90 una vez cada uno; GA4 solo recibe 50/90.
5. `rl_engaged_session` solo tras 45 s + scroll + 2 interacciones; no dispara en pestaña oculta.
6. Envío con gmail y sin empresa → `lead_tier 'C'`, flag `clean` → `generate_lead` llega a GA4, **ningún** tag de Google Ads dispara (guarda G3). `Meta - Lead` **sí** dispara: por diseño de la guía (§2.5), G-3 aplica solo a Google Ads y G2 no bloquea flags `clean`.
7. Honeypot lleno → flag `spam` → ídem.
8. Envío real de prueba → `rl_lead_submit` con `event_id`, `transaction_id` y `user_data` hasheado; ningún dato personal en texto plano en el dataLayer.
9. Un `rl_scroll_depth` posterior al envío no arrastra datos del formulario (reset C-13).
10. `node --check js/rl-tracking.js` y middleware verificado con `vercel dev` (cookie `rl_geo` presente).

## Pendientes explícitos fuera de este trabajo

- Reemplazar constantes placeholder en GTM (IDs de Ads y Meta Pixel) y publicar el contenedor por fases (§9.6 de la guía).
- Enhanced Conversions for Leads (UI de GTM, Paso 2 §9.3) — requiere cuenta de Google Ads.
- Banner CMP para EEA/UK si algún día se pauta fuera de LATAM.
- `rl-taxonomy.json` en el repo (tarea 0.5 de la guía) — la taxonomía de este spec es la semilla.
