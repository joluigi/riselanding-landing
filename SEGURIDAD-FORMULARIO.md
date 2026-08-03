# Seguridad del formulario de leads — guía operativa

Flujo: `index.html` → `POST /api/lead` (función serverless en Vercel) → webhook n8n (Railway) → Notion CRM.
La URL de n8n ya NO aparece en el HTML público: vive solo en `api/lead.js` (o en la env var `N8N_WEBHOOK_URL`).

Principio de diseño: **cero fricción para leads reales**. Solo se bloquea lo bot-cierto; el contenido
sospechoso se etiqueta y SIEMPRE llega a Notion para que un humano decida.

## Capas implementadas (en `api/lead.js`)

| # | Capa | Qué hace | Si dispara |
|---|------|----------|------------|
| 1 | Honeypot | Campo oculto `b_comments` (viaja como `website`); un humano no lo ve, un bot lo rellena | Fake success* |
| 2 | Header `X-Form-Token` | Lo añade el JS del form; un bot que postea directo no lo manda. Su ausencia NO bloquea (una extensión de privacidad podría recortarlo) | +2 al score |
| 3 | Firma `ts` + `sig` | SHA-256 de `ts + ':' + salt`, calculada en el navegador; sin ejecutar nuestro JS no hay firma válida | Fake success* |
| 4 | Tiempo mínimo | Envío a < 2.5 s de cargar la página: imposible para un humano | Fake success* |
| 5 | Validación de campos | Email/teléfono/longitudes; mensajes en español | 422 visible en el form |
| 6 | Rate limit en memoria | Máx 4 envíos / 10 min por IP. Best-effort (la instancia serverless se recicla); la capa firme es el WAF, paso 4 de la escalación | 429 visible |
| 7 | Scoring suave | URLs en campos, email desechable, keywords spam, cirílico/CJK… **Nunca bloquea**: solo etiqueta | Llega a Notion con ⚠️ |
| 8 | Turnstile (dormido) | Solo actúa si existe `TURNSTILE_SECRET_KEY` (paso 3 de la escalación) | Fake success* |

\* **Fake success** = respondemos `200 {"success":true}` sin reenviar nada a n8n; el bot cree que funcionó
y no muta su ataque. Consecuencia: **un 200 no garantiza que el lead llegó** — la prueba real es la fila
en Notion o los logs de Vercel.

## Qué significan `spam_score` y el prefijo ⚠️ en Notion

- Si un envío pasa las capas duras pero acumula señales (score ≥ 3), su mensaje llega con prefijo:
  `⚠️ Posible spam (score 5: <flags legibles>) · <mensaje original>`.
- El lead **sí quedó registrado**: revísalo y decide tú (borrar la fila, o quitar el prefijo y tratarlo como lead real).
- El payload también lleva `spam_score`, `spam_flags`, `ip` y `user_agent`. Hoy n8n los ignora; si mañana
  quieres una columna "Spam score" en Notion, ya viajan — solo hay que mapearlos en el workflow.
- Términos legítimos del negocio (SEO, SEM, CRM, ads, marketing, automatización, dashboards…) NO puntúan.

### Rescatar un falso positivo (rechazo duro)
Cada fake success se loguea completo: Vercel → proyecto → **Logs** → buscar `[spam-blocked]`.
Ahí están el motivo, la IP y el body (hasta 1500 chars) para recuperar el contacto a mano.

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Efecto | Si no existe |
|----------|--------|--------------|
| `N8N_WEBHOOK_URL` | Destino del reenvío | URL de Railway quemada en `api/lead.js` |
| `FORM_SHARED_SECRET` | Valor del header `x-form-secret` que se envía a n8n | `riselanding-form-v1` |
| `TURNSTILE_SECRET_KEY` | Al existir, ENCIENDE la verificación Turnstile | Turnstile apagado |

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

### 3) Activar Cloudflare Turnstile (CAPTCHA invisible)
1. dash.cloudflare.com → **Turnstile** → **Add widget** → hostname `riselanding.com` → modo **Managed**
   → copia el **Site Key** (público) y el **Secret Key** (privado).
2. Pega en `index.html` (snippet listo):

```html
<!-- (a) antes de </head> -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- (b) dentro de #lead-form, justo antes del <div class="field full"> del botón de envío -->
<div class="field full cf-turnstile" data-sitekey="TU_SITE_KEY" data-theme="dark"></div>
```

```js
// (c) en el handler de submit, junto a payload.website y payload.ts:
// el widget inyecta un input oculto con el token dentro del form
var tsEl = document.querySelector('[name="cf-turnstile-response"]');
payload.turnstile_token = tsEl ? tsEl.value : '';
```

3. Deploy y comprueba en producción que el widget carga y el form sigue enviando.
4. SOLO ENTONCES: Vercel → `TURNSTILE_SECRET_KEY` = Secret Key → **Redeploy**.
   ⚠️ Si defines la env var antes de desplegar el cliente, TODOS los leads reales caerán en fake success
   (pérdida silenciosa). Cliente primero, secreto después.
5. Para apagarlo: borra la env var y redeploy (el widget puede quedarse en el HTML sin efecto en el server).

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
TS=$(node -e 'console.log(Date.now()-15000)')
SIG=$(node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]+':rl-diag-2026').digest('hex'))" "$TS")
curl -s https://riselanding.com/api/lead \
  -H 'Content-Type: application/json' -H 'X-Form-Token: rl1' \
  -d "{\"nombre\":\"Prueba Curl\",\"empresa\":\"Rise\",\"email\":\"prueba@riselanding.com\",
      \"telefono\":\"+52 55 1234 5678\",\"mensaje\":\"Prueba de humo\",
      \"interes_pilar\":\"Bundle Completo\",\"ts\":$TS,\"sig\":\"$SIG\",\"website\":\"\"}"
# Esperado: {"success":true} Y una fila nueva en Notion.
```

```bash
# — BOT (honeypot lleno): éxito falso, no reenvía —
curl -s https://riselanding.com/api/lead \
  -H 'Content-Type: application/json' -H 'X-Form-Token: rl1' \
  -d '{"nombre":"Bot","email":"bot@spam.xyz","telefono":"1234567","website":"http://spam.xyz"}'
# Esperado: {"success":true} pero CERO filas en Notion
# y una línea "[spam-blocked] honeypot …" en Vercel → Logs.
```

Para no ensuciar producción, ambos curl funcionan igual contra la URL de un preview deploy.
