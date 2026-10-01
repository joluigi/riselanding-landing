# Seguridad del formulario de leads — guía operativa

Flujo: `index.html` → `POST /api/lead` (función serverless en Vercel) → webhook n8n (Railway) → Notion CRM.
La URL de n8n ya NO aparece en el HTML público: vive solo en `api/lead.js` (o en la env var `N8N_WEBHOOK_URL`).

Principio de diseño: **cero fricción para leads reales**. Solo se bloquea lo bot-cierto; el contenido
sospechoso se etiqueta y SIEMPRE llega a Notion para que un humano decida.

## Capas implementadas (en `api/lead.js`)

| # | Capa | Qué hace | Si dispara |
|---|------|----------|------------|
| 1 | Honeypot | Campo oculto `website_url_2` (fuera de pantalla, `tabindex=-1`, `autocomplete=off`, `aria-hidden`). También se aceptan `website`/`b_comments` de pestañas abiertas antes del deploy | Fake success* (`honeypot`) |
| 2 | Token HMAC | `GET /api/form-token` emite un token firmado con `FORM_TOKEN_SECRET` que lleva el instante de emisión. Sin token o con firma inválida → bot | Fake success* (`bad_form_token`) |
| 3 | Tiempo mínimo | Envío a < 4 s de emitido el token (reloj del servidor) | Fake success* (`too_fast`) |
| 4 | Token vencido | Token de más de 2 h. El cliente lo renueva solo cada 90 min, así que un humano casi nunca lo ve | 409 `form_expired`: pide reenviar, **no** es spam |
| 5 | Header `X-Form-Token` | Lo añade el JS del form. Su ausencia NO bloquea | +2 al score |
| 6 | Validación de campos | Esquema compartido con el navegador (`lib/lead-quality/schema.js`): nombre (2+ letras en la primera palabra, sin dígitos), correo (formato, desechables de `lib/lead-quality/data/disposable-email-domains.json`, **registros MX** con timeout de 2 s que no bloquea), teléfono (México: 10 dígitos sin 0/1 inicial; otros países: libphonenumber), empresa (obligatoria para empresa/emprendimiento, lista `junk-company.json`), sitio, tamaño, servicios (mín. 1), presupuesto, necesidad (30+), consentimiento | 422 con un error por campo, en línea |
| 6b | Solicitante no comercial | "Proyecto personal / escolar", "Busco empleo" o "Proveedor o agencia" → mensaje propio, log `lead_not_forwarded` con `student` / `job_seeker` / `competitor` | **No** se reenvía a n8n, en ningún modo |
| 7 | Rate limit en memoria | Máx 5 envíos / 10 min por IP. **Parcial**: cada instancia serverless tiene su propia memoria y se recicla; la capa firme es el WAF (paso 4 de la escalación) | 429 visible |
| 8 | Turnstile (Managed) | Solo si existen `TURNSTILE_SITE_KEY` **y** `TURNSTILE_SECRET_KEY`. Va después de validar para no gastar el token de un solo uso en un 422 | Fallo o sin token → fake success* (`turnstile_failed`). Cloudflare con timeout de 3 s, 5xx, red o `internal-error` → **sigue** con `turnstile_unavailable` (log nivel info). Secreto ausente/inválido u otro error de configuración → **sigue** con `turnstile_misconfigured` (log nivel **error**: hay que corregir las variables) |
| 9 | Motor de calidad | `lib/lead-quality/engine.js`: `spam_points` (≥ 3 → `spam`), `lead_score` 0–100, `lead_tier` A/B/C, `lead_quality_flag` y `signals[]` auditables | Según `LEAD_GATE_MODE` (ver abajo) |
| 10 | Idempotencia | `event_id` (UUIDv4 del cliente, se conserva mientras los datos no cambien). Mismo id en 10 min → misma respuesta, sin reenviar. **Parcial**: memoria de la instancia | Respuesta previa |
| 11 | Reenvío a n8n | 2 intentos de 8 s con 1 s entre ellos; header `x-rl-event-id` para que n8n pueda deduplicar | Si ambos fallan: 502 con contacto alterno, log `destination_failed` (nivel error). **Nunca** éxito |

\* **Fake success** = respondemos `200 {"success":true}` sin reenviar nada a n8n; el bot cree que funcionó
y no muta su ataque. Consecuencia: **un 200 no garantiza que el lead llegó** — la prueba real es la fila
en Notion o los logs de Vercel.

### Qué se reenvía a n8n en cada modo

| Veredicto | `shadow` (por defecto) | `enforce` | Respuesta al navegador |
|---|---|---|---|
| `clean` | ✅ se reenvía | ✅ se reenvía | Gracias + veredicto |
| `suspect` | ✅ | ✅ | Gracias + veredicto |
| `spam` (motor, `spam_points` ≥ 3) | ✅ (con ⚠️ y "Calidad:") | ❌ | Gracias + veredicto (mismo éxito que un lead real) |
| `competitor` por `agency-denylist` | ✅ | ❌ | Gracias + veredicto |
| `student` / `job_seeker` / `competitor` **autodeclarados** | ❌ nunca | ❌ nunca | Mensaje propio + `rl_non_commercial_submit` |
| Rechazo duro (honeypot, token ausente/inválido, < 4 s, Turnstile fallido) | ❌ nunca | ❌ nunca | Solo `{success:true}` (sin veredicto) |

En `shadow` cada nota lleva al final ` · Calidad: {flag}/{tier} {score}` (p. ej. `· Calidad: suspect/C 40`).
En `enforce` no se agrega.

### Criterio para pasar a enforce (los tres, no uno)

`enforce` **no se activa** hasta cumplir todo esto:

1. **Tiempo en shadow: mínimo 2 semanas, idealmente 4.** Hace falta volumen suficiente para ver
   casos raros (empresas con nombres poco comunes, correos gratuitos legítimos, envíos desde otros países).
2. **Revisión de falsos positivos en Notion con el sufijo "Calidad".** Filtra "Notas iniciales" por
   `Calidad: spam` y `Calidad: competitor` y revisa uno por uno: ¿alguno era un prospecto real?
   - Si hay falsos positivos, se corrige el motor o las listas (`lib/lead-quality/data/*.json`,
     `api/_data/agency-denylist.json`), se despliega y **vuelve a contar el periodo en shadow**.
   - Revisa también una muestra de `Calidad: suspect` y `clean` para detectar spam que se esté colando.
3. **Destino de descartados funcionando** (acción fuera del repo): una base de Notion o un flujo de n8n
   de "descartados" que reciba lo que `enforce` no reenvía. Sin él, lo bloqueado solo queda en los logs
   de Vercel (en Hobby, del orden de una hora) y un falso positivo sería irrecuperable. Recomendado
   también antes de producción: que n8n deduplique por el header `x-rl-event-id` (la idempotencia en
   memoria de la función no alcanza entre instancias serverless).

### Cómo pasar de shadow a enforce (cuando se cumpla el criterio)
1. Vercel → Settings → Environment Variables → `LEAD_GATE_MODE = enforce` (Production) → **Redeploy**.
2. Para volver: `LEAD_GATE_MODE = shadow` (o borra la variable) → Redeploy. Un valor inválido cae en
   `shadow` con un warning en el log.
3. En `enforce` lo bloqueado queda en el log como `lead_evaluated` con `forwarded:false` y
   `destination_status:"blocked_by_enforce"`, y (una vez exista) en el destino de descartados.

### Rechazos duros vs. modo del gate (`LEAD_GATE_MODE`)
Los rechazos duros —honeypot, token ausente/inválido, envío a < 4 s de emitido el token y Turnstile
fallido— **nunca se reenvían a n8n, en ningún modo**. `LEAD_GATE_MODE` (`shadow` / `enforce`, Fases 3–4)
gobierna **solo** el veredicto del motor de calidad (spam por puntos, student, job_seeker, competitor…),
no estas capas. Así el modo shadow no vuelve a meter en Notion el spam que hoy ya se bloquea.

Del lado del cliente (`index.html`): si al enviar no hay token (falló `/api/form-token`) o el script de
Turnstile no cargó (bloqueador, red), el formulario **no envía** y muestra un error con contacto alterno,
para que un humano nunca caiga en un fake success.

## Qué significan `spam_score` y el prefijo ⚠️ en Notion

- `spam_score` = `spam_points` del motor y `spam_flags` = sus `signals` (códigos legibles, p. ej.
  `company_junk`, `phone_invalid_len_9`, `email_name_mismatch`). n8n hoy los ignora; si se quiere una
  columna en Notion, ya viajan.
- Si el motor da `lead_quality_flag = spam`, el mensaje llega con prefijo:
  `⚠️ Posible spam (score 5: phone_invalid_len_8, company_junk, …) · <mensaje original>`.
  El lead **sí quedó registrado** (aún no hay modo `enforce`): revísalo y decide tú.
- Términos legítimos del negocio (SEO, SEM, CRM, ads, marketing, automatización, dashboards…) NO puntúan.

### Cómo editar las listas (sin tocar código)

| Archivo | Para qué | Formato |
|---|---|---|
| `lib/lead-quality/data/junk-company.json` | Empresas que no son negocio ("nada", "ama de casa"…) | `values: [...]`; se comparan sin acentos, en minúsculas |
| `lib/lead-quality/data/free-email-domains.json` | Correos gratuitos (no son spam, solo no suman como corporativos) | `domains: [...]`, coincidencia exacta |
| `lib/lead-quality/data/disposable-email-domains.json` | Correos desechables (se rechazan en el formulario) | `domains: [...]`, incluye subdominios |
| `api/_data/agency-denylist.json` | Agencias competidoras → `competitor` | `entries: [{ "domain": "…", "note": "…", "added": "AAAA-MM-DD" }]`. Vive en `api/_data` para no publicarse |

Los archivos de `lib/` son públicos (el navegador los usa para validar); el de `api/_data` no. Todo cambio
requiere commit + deploy.

### Auditar un rechazo duro
Cada fake success deja una línea JSON en Vercel → proyecto → **Logs**: buscar `"evento":"lead_blocked"`.
Trae el motivo (`reason`) y los SHA-256 del correo y del teléfono, **sin datos en claro** (el body ya no se
loguea). Para confirmar si una persona concreta fue bloqueada, calcula el hash de su correo en minúsculas
(`printf '%s' 'correo@dominio.mx' | shasum -a 256`) y búscalo en los logs.

- **No se guarda PII ni en claro ni cifrada**: un falso positivo de rechazo duro no se puede recuperar
  desde los logs; solo se puede confirmar que ocurrió.
- **Retención**: los logs de runtime viven lo que marque el plan de Vercel del proyecto (en Hobby son
  pocas horas/días; revísalo en Vercel → Logs antes de depender de ellos). Para auditoría de más largo
  plazo hace falta un log drain (acción fuera del repo).
- **Rastro persistente durante shadow**: el sufijo ` · Calidad: {flag}/{tier} {score}` que el servidor
  agrega a "Notas iniciales" en Notion (Fase 8). Es lo que sobrevive a la retención de los logs.
- Cómo se registran los envíos que el motor bloquee en `enforce` se decide en la Fase 4.

### Telemetría de fricción (`rl_form_error`)
El cliente publica `rl_form_error` con un código, nunca con valores del formulario:

| Situación | `error_type` | `error_field` |
|---|---|---|
| Turnstile no cargó y se bloqueó el envío | `network_error` | `turnstile_unavailable` |
| Sin respuesta de `/api/lead` o sin token de `/api/form-token` | `network_error` | `network` |
| 429 (rate limit) | `server_error` | `rate_limited` |
| 409 (token vencido / formulario anterior) | `server_error` | `form_expired` |
| Otro `success:false` o respuesta no JSON (p. ej. 502 de n8n) | `server_error` | — |
| Validación del navegador | `client_validation` | id del campo |

Las respuestas 429 y 409 muestran un mensaje en español con contacto alterno (correo y WhatsApp).

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Efecto | Si no existe |
|----------|--------|--------------|
| `N8N_WEBHOOK_URL` | Destino del reenvío (https, flujo n8n v5) | **Obligatoria, sin respaldo**: los leads reciben 503 con contacto alterno y queda un log `destination_misconfigured` (nivel error) |
| `FORM_SHARED_SECRET` | Valor del header `x-form-secret` que exige n8n v5 (Header Auth) | **Obligatoria, sin respaldo**: igual que arriba |
| `LEAD_GATE_MODE` | `shadow` o `enforce` (ver tabla de reenvío) | `shadow` |
| `VENDOR_CONTACT_EMAIL` | Correo que ven proveedores/agencias al enviar | El mensaje no incluye correo |
| `FORM_TOKEN_SECRET` | Firma HMAC del token de formulario (capas 2–4) | Capas 2–4 apagadas + warning en el log |
| `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Con las DOS, se enciende Turnstile (widget + verificación) | Con una sola o ninguna: Turnstile apagado + warning |

Valores de ejemplo en `.env.example`.

Todo cambio de env var requiere **Redeploy** para aplicarse.

## Si sigue entrando spam: escalera de escalación

Aplica en orden; cada paso es más fuerte que el anterior.

### 1) y 2) Rotar el webhook de n8n y exigir Header Auth — ✅ HECHO (30-sep / 1-oct-2026)
- Flujo n8n "v5 (Webhook protegido)": ruta nueva y Header Auth con el header `x-form-secret`; sin el
  secreto responde 403. El flujo v4 está despublicado (la ruta vieja responde 404).
- `N8N_WEBHOOK_URL` y `FORM_SHARED_SECRET` definidas en Vercel (Production y Preview). El código ya no
  tiene valores de respaldo y `tests/no-secrets.test.js` falla si vuelve a aparecer una URL del hosting de
  n8n (Railway) o un secreto escrito en el código.
- Si hay que rotar otra vez: (a) cambia la ruta/credencial en n8n y (b) las variables en Vercel →
  **Redeploy**, seguidos. En el hueco, los leads ven el 502/503 con contacto alterno (sin pérdida
  silenciosa). El historial de git conserva la URL anterior, pero ya responde 404.

### 3) Activar Cloudflare Turnstile (CAPTCHA casi invisible)
El widget ya está en el código y se pinta solo cuando `/api/form-token` entrega una site key.
1. dash.cloudflare.com → **Turnstile** → **Add widget** → hostnames `riselanding.com` y `www.riselanding.com`
   (y el dominio de previews si quieres probar ahí) → modo **Managed** → copia **Site Key** y **Secret Key**.
2. Vercel → Environment Variables: `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`, **las dos a la vez** → **Redeploy**.
   Con una sola, la capa queda apagada (no hay riesgo de "secreto sin widget").
3. Comprueba en producción que el widget aparece sobre el botón de envío y que el form sigue enviando.
4. Para apagarlo: borra las dos variables y redeploy.

### 4) Rate limiting en Vercel WAF (capa firme; disponible en plan Hobby)
1. vercel.com → proyecto → pestaña **Firewall** → **Rules** → **+ New Rule**.
2. Condición: `Request Path` *equals* `/api/lead` **AND** `Method` *equals* `POST`.
3. Acción: **Rate Limit** → ventana `600` s, límite `8` peticiones, clave `IP address`, al exceder → `Deny`.
   (Si prefieres afinar sin riesgo, crea primero la regla con acción **Log**, revisa Firewall → Traffic
   un par de días y súbela a Rate Limit.)
4. **Review Changes → Publish** — las reglas quedan en borrador hasta publicar. Lo que el WAF bloquea no se factura.
5. Notas: el contador es por región (un ataque distribuido puede exceder el límite ~N regiones); para una
   ola aguda activa temporalmente **Attack Challenge Mode** (botón en la misma pestaña Firewall).

## Probar con curl

Envíos reales que llegan a n8n: **siempre** con nombre "Prueba Riselanding" y el correo
`jose.vazquez@riselanding.com` (buzón real: n8n manda correo de bienvenida y un buzón inexistente
rebota y daña la reputación de envío del dominio). Borra la fila de Notion después.

```bash
# — Envío VÁLIDO (crea una fila real en Notion y dispara el correo de bienvenida) —
# Solo funciona con Turnstile apagado; con Turnstile, prueba desde el navegador.
BASE=https://riselanding.com
TOKEN=$(curl -s $BASE/api/form-token | node -pe 'JSON.parse(require("fs").readFileSync(0)).form_token')
sleep 5   # el servidor descarta envíos a menos de 4 s de emitido el token
curl -s $BASE/api/lead -H 'Content-Type: application/json' -H 'X-Form-Token: rl1' -d @- <<JSON
{"solicitante":"empresa","nombre":"Prueba","apellido":"Riselanding","email":"jose.vazquez@riselanding.com",
 "telefono":"55 0000 0000","telefono_pais":"MX","empresa":"Prueba Riselanding QA","sitio_web":"",
 "tamano":"1_10","servicios":["Implementación de CRM"],"presupuesto":"sin_definir",
 "necesidad":"Prueba Riselanding por curl, borrar esta fila.","consentimiento":true,
 "form_token":"$TOKEN","website_url_2":""}
JSON
# Esperado: {"success":true,"lead_quality_flag":…,"event_id":…} y una fila nueva en Notion.
```

```bash
# — BOT (sin token): éxito falso, no reenvía —
curl -s https://riselanding.com/api/lead -H 'Content-Type: application/json' -d '{"nombre":"Bot"}'
# Esperado: {"success":true} pero CERO filas en Notion
# y una línea {"evento":"lead_blocked","reason":"bad_form_token",…} en Vercel → Logs.
```

Para no ensuciar producción, ambos curl funcionan igual contra la URL de un preview deploy
(protegido: usa `vercel curl` o el token OIDC).
