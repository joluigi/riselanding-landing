# Contrato de integraciones para el rediseño

Versión: v1.0 · Fecha: 2026-10-20 · Base: `main` en `28e9073` (release del filtro de calidad, mergeada el 2026-10-08)

Este documento fija qué debe respetar cualquier frontend nuevo para que el formulario, el filtro de calidad de leads y el tracking sigan funcionando sin tocar el backend ni GTM. Es requisito de entrada de F4 (construcción) y criterio de salida de F8 (medición).

## 1. Qué se conserva tal cual (no se toca)

| Pieza | Ruta | Motivo |
|---|---|---|
| API de leads | `api/lead.js`, `api/form-token.js`, `api/_lib/**`, `api/_data/**` | Validación, honeypot, token HMAC, Turnstile, idempotencia, rate limit, reenvío a n8n con 2 intentos |
| Motor de calidad | `lib/lead-quality/**` (incluye `schema.js` y `data/*.json`) | Esquema compartido cliente y servidor; `LEAD_GATE_MODE=shadow` por defecto |
| Middleware geo | `middleware.js` | Cookie `rl_geo` para Consent Mode por país |
| Núcleo de tracking | `js/rl-tracking.js` líneas 1 a 208 (`window.RL`: uuid, pushEvent, hashing SHA-256, buildLeadSubmit, attribution, classifySubmitError) | Probado por `tests/rl-core`, `rl-lead` |
| Contenedor GTM | `GTM-P3WZC7MV` (export v2.1.1) | Los 19 activadores son eventos personalizados `rl_*`: no dependen del DOM |
| Contrato n8n | `api/_lib/contrato-n8n.js` (11 llaves fijas hacia Notion CRM) | Cambiarlo rompe el flujo de n8n en producción |
| Pruebas | `tests/**`, `scripts/check-release.js` | Son la red de seguridad del rediseño |

## 2. Orden obligatorio del `<head>` en cada página

1. `<script id="rl-bootstrap">` inline (cookies `rl_lid`, `rl_attr`, `rl_internal`, consent default por geo, `rl_context_ready`, `window.__rl`). El id es literal: `tests/rl-bootstrap.test.js` lo busca y verifica que vaya antes de `gtm.js`.
2. Snippet de GTM `GTM-P3WZC7MV`.
3. `/js/rl-tracking.js` con `defer`.

Valores de página hoy fijos en el bootstrap (`page.template = lp_home_v1`, `paquete_integral`, `general_b2b_mx`, `publish_date`): en el rediseño se vuelven parámetros por página y se sube la versión de la taxonomía.

## 3. Formulario: contrato de datos

Llamadas, en este orden:

1. `GET /api/form-token` al montar el formulario. Respuesta: `{form_token, turnstile_site_key}`.
2. Si llega `turnstile_site_key`, montar Turnstile Managed en `#f-turnstile`.
3. Esperar al menos 4.5 s desde la emisión del token antes del envío (menos de 4 s se trata como bot y recibe éxito falso). Renovar el token cada 90 min (más de 2 h responde `409 form_expired`).
4. `POST /api/lead` con `Content-Type: application/json` y header `X-Form-Token: rl1`.

Payload (valores literales definidos en `lib/lead-quality/schema.js`):

| Llave | Valores |
|---|---|
| `solicitante` | `empresa`, `emprendimiento`, `personal`, `empleo`, `proveedor` |
| `servicios[]` | Textos literales de `SERVICIOS` en el esquema (hoy salen de `data-zoho`) |
| `tamano` | `1_10`, `11_50`, `51_200`, `200_plus` |
| `presupuesto` | `sin_definir`, `menos_10k`, `10k_25k`, `25k_50k`, `mas_50k` |
| `telefono_pais` | `MX`, `US`, `CO`, `GT`, `PE`, `CL`, `AR`, `ES`, `INTL` |
| `nombre`, `email`, `telefono`, `empresa`, `sitio_web` | Texto |
| `necesidad` | Opcional, hasta 2000 caracteres |
| `consentimiento` | `true` (casilla obligatoria con enlace a `/aviso-de-privacidad`) |
| `utm_source`, `utm_medium`, `utm_campaign` | Opcionales |
| `website_url_2` | Honeypot, siempre vacío |
| `event_id` | UUID v4 estable mientras no cambien los datos |
| `lead_id` | `window.__rl.leadId` |
| `form_token`, `turnstile_token` | De los pasos 1 y 2 |

Solicitante no comercial (`empleo`, `proveedor`, `personal`): solo `{solicitante, website_url_2, event_id, lead_id, form_token}`; nunca se reenvía a n8n.

Respuestas que el frontend debe manejar:

| Código | Significado | Qué mostrar |
|---|---|---|
| 200 `{success, lead_quality_flag, lead_score, lead_tier, email_domain_type, event_id, lead_id}` | Lead entregado | Éxito y disparar `rl_lead_submit` con el veredicto |
| 422 `{code:'validation', errors:{campo:msg}}` | Validación | Error inline por campo |
| 409 `form_expired` | Token vencido | Pedir token nuevo y reintentar |
| 429 | Rate limit | Mensaje de espera |
| 502 / 503 `destination_error` | n8n no recibió | Error con alternativa de contacto. Nunca mostrar éxito |

## 4. Dos caminos para el marcado del formulario

El JS del formulario lee por id (los `name` no importan; los que dicen `Email`, `SingleLine` o `PhoneNumber_countrycode` son restos de Zoho).

- Camino A (menor riesgo, recomendado para el MVP): conservar los ids y clases de abajo y rediseñar solo el CSS. El JS de `index.html:1583-2112` se extrae a `/js/rl-form.js` sin cambiar su lógica.
- Camino B: reescribir el marcado y el JS. Exige reimplementar todo el punto 3, más los eventos `rl_form_step`, `rl_form_submit_attempt`, `rl_form_error`, `rl_non_commercial_submit` y `rl_lead_submit` con `form_id: 'agenda_diagnostico'`.

Ids requeridos hoy: `lead-form`, `f-hp`, `f-solicitante`, `f-servicios`, `f-tamano`, `f-presupuesto`, `f-necesidad`, `f-necesidad-contador`, `f-nombre`, `f-email`, `f-tel`, `f-tel-pais`, `f-empresa`, `f-sitio`, `f-sitio-campo`, `f-sitio-toggle`, `f-sitio-toggle-caja`, `f-consent`, `f-turnstile`, `f-continuar`, `f-atras`, `f-paso-1`, `f-paso-2`, `f-paso-texto`, `f-paso-barra`, `f-anuncio`, `f-progreso`, `utm_source`, `utm_medium`, `utm_campaign`.

Clases y atributos requeridos: `.field` (contenedor del error), `.checks input:checked` con `data-zoho`, `[data-solo-comercial]`, `.chk.on`, `.form-error`, `.form-notice`, `.form-success`, `.sent`, `.form-grid [hidden]`, `button[type=submit]`. El honeypot `.hp-field` va fuera de pantalla, nunca con `display:none`.

## 5. DOM que necesita `rl-tracking.js` (líneas 209 en adelante)

| Selector | Evento |
|---|---|
| `#servicios` visible 20 s | `rl_service_view` |
| `#resultados` al 75% | `rl_case_study_view` |
| `#lead-form` primer focus | `rl_form_start` |
| `a[href^="tel:"]` | `rl_phone_click` |
| `a[href*="wa.me"]` | `rl_whatsapp_click` (agrega token `[RL-xxxxxxxx]` al texto) |
| `footer` | `cta_location` |
| `.svc-tab`, `.faq-q` | Cuentan como interacción para `rl_engaged_session` |

Si el rediseño elimina o renombra una sección (por ejemplo, ya no hay bloque de resultados), el evento se remapea en `rl-tracking.js`, se documenta en la taxonomía y se sube la versión. Los nombres `rl_*` y las claves de `rl_event_data`, `user` y `site` no cambian: GTM depende de ellos.

## 6. Variables de entorno (solo nombres)

`N8N_WEBHOOK_URL`, `FORM_SHARED_SECRET` (obligatorias), `FORM_TOKEN_SECRET`, `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` (van juntas), `LEAD_GATE_MODE`, `VENDOR_CONTACT_EMAIL`. El rediseño no agrega variables nuevas.

## 7. Huecos detectados (se resuelven en F8, no bloquean el diseño)

| Hueco | Dónde | Acción propuesta |
|---|---|---|
| `gracias.html` y `aviso-de-privacidad.html` sin bootstrap: en staging disparan Pixel y Linker como producción | ambos archivos | Bootstrap en todas las páginas |
| No hay `page_view` de GA4 ni etiqueta Google tag base | GTM | Agregar etiqueta de configuración |
| `rl_form_submit_attempt` y `rl_non_commercial_submit` sin activador en GTM | GTM | Agregar o documentar como solo dataLayer |
| Meta Lead envía `prospect_segment` como texto `undefined` | GTM | Corregir la variable |
| Google Ads y Meta Pixel con placeholders (`AW-REEMPLAZAR`, `REEMPLAZAR_PIXEL_ID`) | GTM | José captura los IDs reales |
| Enhanced Conversions y advanced matching sin conectar (las variables `sha256_*` existen) | GTM | Conectar en la publicación por etapas |
| Sin CMP ni `consent update`; etiquetas con `consentStatus NOT_SET` | GTM y sitio | Banner de cookies en F8 |
| No existe `rl-taxonomy.json` versionado | repo | Crearlo en F8 |
| `/gracias` no se usa (el éxito es inline) y su WhatsApp es de relleno (`wa.me/521XXXXXXXXXX`) | `gracias.html:494` | Decidir: redirigir a `/gracias` tras el éxito o eliminarla |
| `Form/` (embed Zoho) e `index-legacy.html` marcados para baja | `docs/RELEASE-SHADOW.md:23` | Eliminar en el rediseño con redirección si tienen tráfico |
| Inputs con `font-size: 14.5px` (zoom automático en iOS) | `index.html:648` | 16 px mínimo en el rediseño |

## 8. Prueba de que el contrato sigue vivo

Antes de cada PR del rediseño: `npm test` (139 pruebas en verde al 2026-10-20) y `npm run check:release`. Si el sitio pasa a un generador (Astro), `tests/rl-bootstrap.test.js` se adapta para leer el HTML generado, no el fuente.
