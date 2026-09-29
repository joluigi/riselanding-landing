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
| 6 | Validación de campos | Email/teléfono/longitudes; mensajes en español | 422 visible en el form |
| 7 | Rate limit en memoria | Máx 5 envíos / 10 min por IP. **Parcial**: cada instancia serverless tiene su propia memoria y se recicla; la capa firme es el WAF (paso 4 de la escalación) | 429 visible |
| 8 | Turnstile (Managed) | Solo si existen `TURNSTILE_SITE_KEY` **y** `TURNSTILE_SECRET_KEY`. Va después de validar para no gastar el token de un solo uso en un 422 | Fallo o sin token → fake success* (`turnstile_failed`). Cloudflare con timeout de 3 s, 5xx, red o `internal-error` → **sigue** con `turnstile_unavailable` (log nivel info). Secreto ausente/inválido u otro error de configuración → **sigue** con `turnstile_misconfigured` (log nivel **error**: hay que corregir las variables) |
| 9 | Scoring suave | URLs en campos, email desechable, keywords spam, cirílico/CJK… **Nunca bloquea**: solo etiqueta | Llega a Notion con ⚠️ |

\* **Fake success** = respondemos `200 {"success":true}` sin reenviar nada a n8n; el bot cree que funcionó
y no muta su ataque. Consecuencia: **un 200 no garantiza que el lead llegó** — la prueba real es la fila
en Notion o los logs de Vercel.

### Rechazos duros vs. modo del gate (`LEAD_GATE_MODE`)
Los rechazos duros —honeypot, token ausente/inválido, envío a < 4 s de emitido el token y Turnstile
fallido— **nunca se reenvían a n8n, en ningún modo**. `LEAD_GATE_MODE` (`shadow` / `enforce`, Fases 3–4)
gobierna **solo** el veredicto del motor de calidad (spam por puntos, student, job_seeker, competitor…),
no estas capas. Así el modo shadow no vuelve a meter en Notion el spam que hoy ya se bloquea.

Del lado del cliente (`index.html`): si al enviar no hay token (falló `/api/form-token`) o el script de
Turnstile no cargó (bloqueador, red), el formulario **no envía** y muestra un error con contacto alterno,
para que un humano nunca caiga en un fake success.

## Qué significan `spam_score` y el prefijo ⚠️ en Notion

- Si un envío pasa las capas duras pero acumula señales (score ≥ 3), su mensaje llega con prefijo:
  `⚠️ Posible spam (score 5: <flags legibles>) · <mensaje original>`.
- El lead **sí quedó registrado**: revísalo y decide tú (borrar la fila, o quitar el prefijo y tratarlo como lead real).
- El payload también lleva `spam_score`, `spam_flags`, `ip` y `user_agent`. Hoy n8n los ignora; si mañana
  quieres una columna "Spam score" en Notion, ya viajan — solo hay que mapearlos en el workflow.
- Términos legítimos del negocio (SEO, SEM, CRM, ads, marketing, automatización, dashboards…) NO puntúan.

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
| `N8N_WEBHOOK_URL` | Destino del reenvío | URL de Railway quemada en `api/lead.js` |
| `FORM_SHARED_SECRET` | Valor del header `x-form-secret` que se envía a n8n | `riselanding-form-v1` |
| `FORM_TOKEN_SECRET` | Firma HMAC del token de formulario (capas 2–4) | Capas 2–4 apagadas + warning en el log |
| `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Con las DOS, se enciende Turnstile (widget + verificación) | Con una sola o ninguna: Turnstile apagado + warning |

Valores de ejemplo en `.env.example`.

Todo cambio de env var requiere **Redeploy** para aplicarse.

## Si sigue entrando spam: escalera de escalación

Aplica en orden; cada paso es más fuerte que el anterior.

### 1) Rotar el path del webhook de n8n (+ moverlo a env var)
La URL vieja (`…/webhook/lead-capture`) estuvo quemada en este repo público de GitHub: cualquiera la conoce.
1. n8n (Railway) → workflow del lead → nodo **Webhook** → campo **Path**: pon algo impredecible
   (p. ej. `lead-capture-8f3k2q9x`) → **Save**, con el workflow **Active**.
2. Vercel → Environment Variables → `N8N_WEBHOOK_URL = https://n8n-production-417ba.up.railway.app/webhook/<nuevo-path>`
   (entorno Production) → **Redeploy**.
3. Haz (1) y (2) seguidos: en el hueco entre ambos, un lead real vería el error 502 con datos de contacto
   de fallback (molesto, pero sin pérdida silenciosa).

### 2) Header Auth en el nodo Webhook de n8n
La función ya envía `x-form-secret` en cada reenvío; solo falta que n8n lo exija.
1. PRIMERO en Vercel: define `FORM_SHARED_SECRET` con un secreto fuerte → **Redeploy**.
2. DESPUÉS en n8n: nodo Webhook → **Authentication: Header Auth** → crea la credencial con
   **Name** = `x-form-secret` y **Value** = el mismo secreto → Save.
3. El orden importa: si activas n8n antes de desplegar Vercel, los leads reales verán 502 hasta sincronizar.

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

```bash
# — Envío VÁLIDO (crea una fila real en Notion; bórrala después) —
# Solo funciona con Turnstile apagado; con Turnstile, prueba desde el navegador.
TOKEN=$(curl -s https://riselanding.com/api/form-token | node -pe 'JSON.parse(require("fs").readFileSync(0)).form_token')
sleep 5   # el servidor descarta envíos a menos de 4 s de emitido el token
curl -s https://riselanding.com/api/lead \
  -H 'Content-Type: application/json' -H 'X-Form-Token: rl1' \
  -d "{\"nombre\":\"Prueba Curl\",\"empresa\":\"Rise\",\"email\":\"prueba@riselanding.com\",
      \"telefono\":\"+52 55 0000 0000\",\"mensaje\":\"Prueba de humo\",
      \"interes_pilar\":\"CRM + Automatización\",\"form_token\":\"$TOKEN\",\"website_url_2\":\"\"}"
# Esperado: {"success":true} Y una fila nueva en Notion.
```

```bash
# — BOT (sin token): éxito falso, no reenvía —
curl -s https://riselanding.com/api/lead \
  -H 'Content-Type: application/json' -H 'X-Form-Token: rl1' \
  -d '{"nombre":"Bot","email":"bot@spam.invalid","telefono":"5500000000"}'
# Esperado: {"success":true} pero CERO filas en Notion
# y una línea {"evento":"lead_blocked","reason":"bad_form_token",…} en Vercel → Logs.
```

Para no ensuciar producción, ambos curl funcionan igual contra la URL de un preview deploy.
