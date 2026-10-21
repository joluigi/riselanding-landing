# Plan F4 · Rediseño riselanding.com en Astro estático

Repo: `/Users/josevazquez/Documents/00_Repos/Riselanding-page2` · rama `rediseno/f0-brief` · base `main@28e9073`. Estado verificado hoy: `npm test` = 139 en verde; Node local 24.21.0; no hay `.vercel/` ni CLAUDE.md; `api/**` es CommonJS (`require`) y `middleware.js` es ESM sin `"type":"module"` en package.json (Vercel lo resuelve por archivo).

## 1. Compatibilidad en Vercel (verificado en docs oficiales)

Hechos confirmados:
- Astro estático no requiere adaptador: docs.astro.build/guides/deploy/vercel ("You don't need any extra configuration to deploy a static Astro site to Vercel") y vercel.com/docs/frameworks/frontend/astro ("Statically rendered Astro apps can be deployed to Vercel with zero configuration"). El adaptador `@astrojs/vercel` solo hace falta para SSR, Web Analytics o Image Optimization. No instalarlo.
- `api/` en la raíz: vercel.com/docs/functions/functions-api-reference: "You can create a function in other frameworks or with no frameworks by defining your function in a file under /api... Vercel will deploy any file in the /api directory as a function". Independiente del preset. Los archivos `api/_lib/**` y `api/_data/**` (guion bajo) no se exponen como rutas, igual que hoy.
- `middleware.js` en la raíz: vercel.com/docs/routing-middleware/js-reference, "Using the file convention: Name the file middleware.ts and place it at the root of your project, at the same level as your package.json". La restricción documentada ("You can't use `proxy` with frameworks that build their own routing middleware, such as Next.js and Astro") aplica a la propiedad `proxy` de vercel.json, que no usamos. La doc de Astro en Vercel distingue explícitamente el middleware de Astro (`src/middleware.ts`, requiere adaptador) del Routing Middleware de Vercel en la raíz, y dice que si usas este último no necesitas `edgeMiddleware`. Conclusión: el `middleware.js` actual sigue válido tal cual. Riesgo residual: la doc no muestra un ejemplo "Astro + middleware raíz sin adaptador"; se verifica en el primer preview con `curl -sI https://<preview>/servicios | grep -i set-cookie` (debe traer `rl_geo`).
- `cleanUrls: true` sirve `about.html` en `/about` y responde 308 de `/about.html` a `/about`; `trailingSlash: false` responde 308 de `/about/` a `/about` (vercel.com/docs/project-configuration/vercel-json). Con Astro `build.format: 'file'` + `trailingSlash: 'never'` el `dist/` reproduce la estructura plana de hoy: `dist/index.html`, `dist/servicios.html`, `dist/servicios/crm.html`, `dist/aviso-de-privacidad.html`, `dist/gracias.html`, `dist/404.html`. Vercel sirve `404.html` como página de error en estáticos.
- Redirects y headers en vercel.json funcionan con Astro; lo único que Vercel desaconseja con Astro son los `rewrites` (no los usamos).
- Node: la doc de instalación de Astro pide Node `v22.22.0` o superior (no impares). Hay que fijar la versión de Node del proyecto en Vercel (Settings, Node.js Version) a 22.x o 24.x; agregar `"engines": {"node": ">=22.22"}` en package.json como recordatorio.

Riesgo principal de despliegue (el que puede tumbar producción): hoy el preset es "Other" sin build y Vercel sirve la raíz. Según vercel.com/docs/builds/configure-a-build, con "Other" el Output Directory es `public` si existe, si no `.`. Al crear `public/` y un script `build`, un deploy sin configurar serviría `public/` vacío o la raíz sin `dist/`. Mitigación obligatoria en el MISMO commit que agrega Astro:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "astro dev --port $PORT",
  "installCommand": "npm ci"
}
```

No fijar `framework` (dejar el preset actual; `buildCommand`/`outputDirectory` explícitos mandan sobre cualquier detección). Todos los PRs de F4 se integran en `rediseno/f0-brief` (previews por rama); `main` solo recibe el merge final el 2026-10-27, así producción no cambia hasta el lanzamiento. No agregar `"type":"module"` a package.json (rompería `api/**`, `lib/**` y las pruebas CommonJS); la config va en `astro.config.mjs`.

`astro.config.mjs` esencial:

```js
import { defineConfig } from 'astro/config';
import estaticosRaiz from './scripts/vite-estaticos-raiz.mjs';
export default defineConfig({
  site: 'https://riselanding.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  vite: { plugins: [estaticosRaiz()] }
});
```

Dependencias nuevas: solo `astro` (devDependency). Sin Tailwind, sin React en ola 1: el prototipo aprobado es CSS puro con custom properties y los componentes interactivos de ola 1 (pestañas, menú, FAQ) se resuelven en vanilla. Desviación documentada del método F4 §5 (Tailwind) por decisión técnica (prototipo aprobado en CSS puro) y cero dependencias.

## 2. Estructura de carpetas y qué se mueve

Regla: lo que requieren `api/**` y las pruebas por ruta relativa NO se mueve. `api/_lib/*.js` hacen `require('../../lib/lead-quality/...')` y `tests/rl-core.test.js`, `tests/rl-lead.test.js` hacen `require('../js/rl-tracking.js')`. Por eso `js/` y `lib/` se quedan en la raíz como fuente de verdad y se copian a `dist/` tras el build.

```
astro.config.mjs
package.json                  scripts: dev, build (astro build && node scripts/copiar-estaticos.js), preview, test, test:dist, check:release
.gitignore                    + dist/ .astro/
vercel.json                   build, redirects, headers
middleware.js                 sin cambios
api/**                        sin cambios
lib/lead-quality/**           sin cambios (engine.js solo servidor; schema.js y data/*.json se copian a dist/lib/lead-quality/)
js/rl-tracking.js             remapeo mínimo (sección 5); se copia a dist/js/
js/rl-form.js                 NUEVO, extraído de index.html:1584-2111; se copia a dist/js/
Assets/                       se queda; se copian a dist/Assets/ los 12 archivos versionados (lista explícita; excluye el zip y la carpeta sin versionar)
scripts/copiar-estaticos.js   NUEVO: copia js/, lib/lead-quality/schema.js, lib/lead-quality/data/*.json, Assets/ (allowlist) a dist/
scripts/vite-estaticos-raiz.mjs  NUEVO: plugin Vite configureServer que sirve /js, /lib/lead-quality, /Assets desde la raíz en `astro dev`
scripts/check-release.js      ajustar ruta: lee src/pages/aviso-de-privacidad.astro (o src/data/legal.js con la fecha)
public/
  robots.txt                  movido desde la raíz
  sitemap.xml                 movido desde la raíz y actualizado (sección 7)
  fonts/                      opcional ola 2 (Montserrat e Inter autoalojadas); ola 1 mantiene el <link> de Google Fonts del prototipo
src/
  styles/tokens.css           DESIGN.md §11 literal (incluye prefers-reduced-motion)
  styles/base.css             reset, tipografía (§4), contenedor, utilidades .container .stack .eyebrow .sr-only
  styles/componentes.css      botones, tarjeta, chip, pestañas, header, footer, barra CTA (DESIGN.md §7)
  styles/form.css             mismos selectores del contrato, rediseñados: inputs 48 px / 16 px
  tracking/rl-bootstrap.js    el IIFE de index.html:9-147 parametrizado (sección 3)
  layouts/Base.astro          <head> en orden del contrato + slots SEO + Header/Footer opcionales
  layouts/Servicio.astro      plantilla de plantilla-servicio.md (recibe un objeto de src/data/servicios/)
  components/tracking/RlBootstrap.astro, Gtm.astro, GtmNoscript.astro
  components/layout/Header.astro, MenuServicios.astro, MenuMovil.astro, Footer.astro, BarraCta.astro
  components/ui/Boton.astro, Tarjeta.astro, ChipServicio.astro, Eyebrow.astro, Faq.astro, Maqueta*.astro
  components/forms/LeadForm.astro        marcado de index.html:1344-1450 con ids del contrato, prop `servicio`
  components/forms/Contacto.astro        sección #contacto: CTA final + LeadForm + enlace WhatsApp
  components/seo/JsonLd.astro            <script type="application/ld+json" set:html={JSON.stringify(data)}>
  scripts/ui.js                          header scroll, menú móvil, pestañas .svc-tab, FAQ .faq-q, barra CTA (procesado por Astro)
  data/servicios.js                      fuente única: slug, nombre, pilar, ola, keyword, anclaje, servicioForm (valor literal de SERVICIOS), pageTemplate, serviceLine
  data/servicios/{crm,automatizacion,google-ads,sitio-web}.js   copy por página (de docs/wireframes/*.md)
  data/legal.js                          fecha de última actualización del aviso
  pages/index.astro
  pages/servicios/index.astro
  pages/servicios/crm.astro, automatizacion.astro, google-ads.astro, sitio-web.astro
  pages/aviso-de-privacidad.astro
  pages/gracias.astro
  pages/404.astro
tests/dist/paginas.test.js    NUEVO (sección 6)
tests/rl-form.test.js         NUEVO
docs/tracking/rl-taxonomy.json  NUEVO (v2.2.0)
```

Se eliminan al final de ola 1 (PR de pulido): `index.html`, `gracias.html`, `aviso-de-privacidad.html`, `index-legacy.html`, `Form/`, y los sin versionar `Riselanding (1).html` y el zip no se tocan (no son del repo). Rutas públicas que no cambian: `/js/rl-tracking.js`, `/lib/lead-quality/schema.js`, `/lib/lead-quality/data/*.json`, `/api/*`, `/Assets/*`.

Mapa de servicio precargado (sitemap §7.6) en `src/data/servicios.js`: google-ads y meta-ads = `Publicidad Digital`; seo = `SEO y Posicionamiento`; sitio-web y landing-pages = `Reediseño / Desarrollo página web`; crm = `Implementación de CRM`; automatizacion = `Automatización de procesos`; medicion = `Dashboards y reportes`; tienda-en-linea y software-a-la-medida = `null` (sin precarga, esquema intocable).

## 3. Bootstrap como componente sin que Astro lo procese

Enfoque: el código vive en `src/tracking/rl-bootstrap.js` (archivo plano, ES5, testeable en `node:vm` igual que hoy) y el componente lo inyecta con `set:html`, que en `<script>` implica `is:inline` (directives-reference: cualquier atributo distinto de `src` deja el script inline, "rendered in the final output HTML exactly where it is authored", sin bundling ni deduplicación).

`src/components/tracking/RlBootstrap.astro`:

```astro
---
import bootstrap from '../../tracking/rl-bootstrap.js?raw';
const { template, serviceLine = 'paquete_integral', type = 'landing', publishDate, isLandingPage = true, targetSegment = 'general_b2b_mx' } = Astro.props;
const page = { template, service_line: serviceLine, type, publish_date: publishDate, is_landing_page: isLandingPage, target_segment: targetSegment };
---
<script id="rl-bootstrap" set:html={`window.__rlPage=${JSON.stringify(page)};\n${bootstrap}`}></script>
```

Cambios en el IIFE (`src/tracking/rl-bootstrap.js`): leer `var P = window.__rlPage || {}` y usar `P.template || 'lp_home_v1'`, `P.service_line || 'paquete_integral'`, etc. en el objeto `page` de `rl_context_ready`; agregar al handoff `window.__rl.page = { template, serviceLine }` para que `rl-tracking.js` lo lea (sección 5); `rl_schema_version: '2.2.0'`. Con defaults = valores de hoy, las 13 pruebas actuales siguen válidas sin `__rlPage`.

`src/layouts/Base.astro`, `<head>` en este orden literal, antes de cualquier `<meta>`: `<meta charset>`, `<RlBootstrap {...tracking} />`, `<Gtm />` (snippet GTM-P3WZC7MV con `is:inline`), `<script src="/js/rl-tracking.js" defer is:inline></script>`, luego viewport, title, description, canonical (prop `path` explícita, nunca `Astro.url.pathname`: con `build.format: 'file'` puede traer `.html`), OG, favicons, JSON-LD por slot, estilos. Astro agrega su `<link rel=stylesheet>` al final del head, después de lo autorado, así que el orden bootstrap, GTM, rl-tracking no se altera. `<GtmNoscript />` como primer hijo de `<body>`. Al final del body: `<script src="/lib/lead-quality/schema.js" defer is:inline>` y `<script src="/js/rl-form.js" defer is:inline>` solo cuando la página incluye `Contacto`; `defer` conserva el orden.

Props de tracking por página (`page.template`, `type`, `serviceLine`, `publishDate`):

| Página | template | type | serviceLine |
|---|---|---|---|
| `/` | `home_v2` | `home` | `paquete_integral` |
| `/servicios` | `servicios_indice_v1` | `indice` | `paquete_integral` |
| `/servicios/crm` | `servicio_crm_v1` | `servicio` | `crm_automatizacion` |
| `/servicios/automatizacion` | `servicio_automatizacion_v1` | `servicio` | `crm_automatizacion` |
| `/servicios/google-ads` | `servicio_google_ads_v1` | `servicio` | `publicidad_digital` |
| `/servicios/sitio-web` | `servicio_sitio_web_v1` | `servicio` | `web_seo` |
| `/aviso-de-privacidad` | `legal_v1` | `legal` | `paquete_integral` (`isLandingPage: false`) |
| `/gracias` | `gracias_v1` | `gracias` | `paquete_integral` (`isLandingPage: false`, noindex) |
| 404 | `error_404_v1` | `error` | `paquete_integral` (`isLandingPage: false`) |

Gracias, aviso y 404 usan el mismo `Base.astro`, lo que cierra el hueco §7 del contrato (hoy sin bootstrap y con consent sin default por geo). Gracias se renderiza con `header={false}`.

## 4. Formulario (camino A)

- `src/components/forms/LeadForm.astro`: copia literal del `<form class="form-grid" id="lead-form" novalidate>` de `index.html:1344-1450` (todos los ids y clases del contrato §4, honeypot `.hp-field` fuera de pantalla, `.form-grid [hidden]{display:none!important}`), con prop `servicio` que se emite como `data-servicio="Implementación de CRM"` solo si no es null. Las etiquetas visibles de los chips (`SEM`, `Web`...) se pueden reescribir; `data-zoho` no. Un solo `LeadForm` por página (ids únicos).
- `js/rl-form.js`: el IIFE de `index.html:1584-2111` sin cambios de lógica, más las partes del script misceláneo que son del formulario: toggle visual `.chk.on` (`index.html:1572-1575`) y captura de UTM a los hidden (`1577-1579`). El resto de ese script (pestañas, FAQ, nav, countup, reveal) no se migra; lo nuevo va en `src/scripts/ui.js`.
- Cambios mínimos en `js/rl-form.js` (cada uno con prueba):
  1. Precarga: tras `aplicarSolicitante()` inicial, `precargarServicio(form, form.getAttribute('data-servicio'))`: busca `.checks input[data-zoho="<valor>"]`, lo marca y agrega `.on` al `.chk`. Sin `change` sintético (evita revalidación prematura); no afecta `eventIdPara` porque la huella se calcula al enviar.
  2. Redirección a `/gracias` tras éxito comercial (sitemap §5): sustituir `seguimiento.then(mostrarExito, mostrarExito)` por `seguimiento.then(irAGracias, irAGracias)`, donde la publicación de `rl_lead_submit` se hace con `eventCallback`. Como `RL.pushEvent` (núcleo intocable) no acepta `eventCallback` y mete el payload dentro de `rl_event_data`, `rl-form.js` replica sus dos pushes con el `event_id` que ya trae el payload de `buildLeadSubmit`:
     ```js
     function publicarLeadSubmit(p, listo) {
       var dl = window.dataLayer = window.dataLayer || [];
       dl.push({ rl_event_data: null });
       dl.push({ event: 'rl_lead_submit', rl_event_data: p, eventCallback: listo, eventTimeout: 2000 });
     }
     ```
     `irAGracias` arma una promesa que resuelve con el callback o con `setTimeout` de 2000 ms (GTM bloqueado) y entonces `location.assign('/gracias')`. `enviando` permanece `true` hasta navegar (no hay doble envío). Si no hay veredicto (fake success de bot: `buildLeadSubmit` devuelve null) no se publica nada y se navega igual; las conversiones viven en `rl_lead_submit`, no en la vista de `/gracias`. No comercial: `mostrarAviso` inline como hoy, sin redirección.
  3. `theme: 'dark'` de Turnstile pasa a `'light'` (variante A).
- Para que sea testeable en Node sin jsdom: exponer `precargarServicio`, `publicarLeadSubmit` y `esperarEvento` en `window.RLForm` (y `module.exports` cuando exista `module`), con el `initDom` detrás de `if (typeof document === 'undefined') return`, mismo patrón que `rl-tracking.js`. `tests/rl-form.test.js` prueba con objetos falsos: la precarga marca solo el chip correcto; `publicarLeadSubmit` empuja primero `{rl_event_data:null}` y conserva `event_id`; sin veredicto no hay push; el timeout navega a los 2 s.
- `src/components/forms/Contacto.astro`: eyebrow fijo "Diagnóstico sin costo", props `titulo`, `bajada`, `servicio`; incluye los 3 puntos de qué incluye y el enlace `https://wa.me/525548213439`.

## 5. Tracking

Cambios en `js/rl-tracking.js` fuera del núcleo (líneas 209 en adelante), con pruebas:
- `rl_service_view`: observar `document.getElementById('servicios') || document.getElementById('enfoque')`; `service_line: (global.__rl && global.__rl.page && global.__rl.page.serviceLine) || 'paquete_integral'` (sustituye la línea 297 fija). Mismo valor en `rl_whatsapp_click` (línea ~330).
- `rl_case_study_view`: sin cambio de código (si no existe `#resultados` ya es no-op); se documenta como dormido en la taxonomía.
- `docs/tracking/rl-taxonomy.json` v2.2.0: eventos, parámetros, selectores DOM por plantilla, valores de `page.template` y `service_line`, estado (activo, dormido) y la nota de `form_location: 'contacto'` fijo en todas las páginas.
- `rl_schema_version` 2.1.0 a 2.2.0 en el bootstrap; ajustar la aserción de `tests/rl-bootstrap.test.js`. GTM no depende de la versión ni del DOM (19 activadores por evento `rl_*`).

## 6. Pruebas

- `tests/rl-bootstrap.test.js`: cambiar las dos primeras líneas de carga: leer `src/tracking/rl-bootstrap.js` directo (sin regex). La prueba "existe antes de GTM" se mueve a `tests/dist/paginas.test.js`. Agregar: con `sandbox.window.__rlPage = {template:'servicio_crm_v1', service_line:'crm_automatizacion', type:'servicio'}` el `rl_context_ready.page` refleja esos valores y `__rl.page.serviceLine` coincide; sin `__rlPage` siguen los defaults actuales.
- `tests/dist/paginas.test.js` (nuevo): si no existe `dist/`, un único test con `{ skip: 'corre npm run build' }`; si existe, para cada HTML esperado (`index.html`, `servicios.html`, `servicios/crm.html`, `servicios/automatizacion.html`, `servicios/google-ads.html`, `servicios/sitio-web.html`, `aviso-de-privacidad.html`, `gracias.html`, `404.html`): (a) `indexOf('id="rl-bootstrap"') < indexOf('googletagmanager.com/gtm.js') < indexOf('/js/rl-tracking.js')`; (b) ejecutar el script extraído por regex en el mismo sandbox vm y comprobar `rl_context_ready.page.template` esperado por página y consent `denied` con `rl_geo=DE`; (c) en las 6 páginas con formulario, presencia de todos los ids del contrato §4 y de `data-zoho` para los 6 valores de `SERVICIOS` (leídos de `lib/lead-quality/schema.js`), `/lib/lead-quality/schema.js` antes de `/js/rl-form.js`, y `data-servicio` igual al mapa; (d) `gracias.html` con `noindex, nofollow` y sin `wa.me/521XXXXXXXXXX`; (e) existencia de `dist/js/rl-tracking.js`, `dist/js/rl-form.js`, `dist/lib/lead-quality/schema.js`, `dist/lib/lead-quality/data/*.json`, `dist/Assets/og-image.png`, `dist/sitemap.xml`, `dist/robots.txt`.
- `tests/no-secrets.test.js`: sin cambios funcionales; `dist/` y `.astro/` en `.gitignore` para que `git ls-files --others` no los escanee. Opcional: ampliar `CODIGO` a `^(api\/|lib\/|js\/|src\/|public\/|middleware\.js$|.*\.html$)`.
- `scripts/check-release.js`: lee la fecha desde `src/data/legal.js` (o el `.astro` del aviso) en lugar de `aviso-de-privacidad.html`.
- `package.json`: `"test": "node --test"` (sin cambio), `"test:dist": "npm run build && node --test tests/dist/"`, `"verificar": "npm run build && npm test && npm run check:release"`. Criterio de cada PR: `npm run verificar` en verde y `grep -rnE "#[0-9a-fA-F]{3,8}\b" src/ --include='*.astro' --include='*.css' --include='*.js' | grep -v src/styles/tokens.css` vacío (regla F4 §5 adaptada a CSS puro).

## 7. Redirecciones, headers, sitemap, robots

`vercel.json` final (base `assets/vercel-plantilla.json` de la skill, ajustada):
- `redirects`: `{ "source": "/Form", "destination": "/", "statusCode": 301 }`, `{ "source": "/Form/(.*)", ... }`, `{ "source": "/index-legacy", ... }`, `{ "source": "/index-legacy.html", ... }`. Usar `statusCode: 301` porque `permanent: true` responde 308. Requiere borrar `Form/` e `index-legacy.html` del repo (la plantilla dice que el filesystem tiene precedencia).
- `headers`: los de seguridad de la plantilla sobre `/(.*)`. Corregir dos cosas: (1) la regla `Cache-Control: immutable` de la plantilla NO debe cubrir `/js/*.js`, `/lib/**` ni `/Assets/*` (no llevan hash; congelaría `rl-tracking.js`, `rl-form.js`, `schema.js` y los JSON por un año); aplicar `immutable` solo a `/_astro/(.*)` y `/fonts/(.*)`, y `public, max-age=300, stale-while-revalidate=86400` a `/js/(.*)`, `/lib/(.*)`; `public, max-age=86400` a `/Assets/(.*)`. (2) CSP Report-Only: agregar `https://fonts.googleapis.com` a `style-src` y `https://fonts.gstatic.com` a `font-src` mientras se use Google Fonts; `challenges.cloudflare.com` ya está. `X-Frame-Options: DENY` y `frame-ancestors 'none'` no afectan a Turnstile (es hijo, no ancestro).
- `middleware.js`: sin cambios; su matcher ya excluye rutas con extensión. Opcional: agregar `lib/|_astro/` al negative lookahead.
- `public/sitemap.xml`: 7 URLs de ola 1 (`/`, `/servicios`, 4 servicios, `/aviso-de-privacidad`) con `lastmod` 2026-10-27, hreflang es-MX; sin `/gracias`. En ola 2 se agregan 7 más. A mano, sin `@astrojs/sitemap` (genera `sitemap-index.xml` y cambiaría la URL que ya referencian robots y GSC).
- `public/robots.txt`: igual al actual (`Sitemap: https://riselanding.com/sitemap.xml`).

## 8. Secuencia de PRs (hacia `rediseno/f0-brief`; preview ola 1 el 2026-10-24)

| # | Rama | Día | Archivos propios (sin solape) | Terminado cuando |
|---|---|---|---|---|
| PR0 | `feat/f4-scaffold` | 10-20 noche / 10-21 am | `package.json`, `package-lock.json`, `astro.config.mjs`, `.gitignore`, `vercel.json`, `scripts/copiar-estaticos.js`, `scripts/vite-estaticos-raiz.mjs`, `scripts/check-release.js`, `src/styles/tokens.css`, `src/styles/base.css`, `src/tracking/rl-bootstrap.js`, `src/components/tracking/*`, `src/layouts/Base.astro` (mínimo), `src/data/legal.js`, páginas provisionales `src/pages/{index,aviso-de-privacidad,gracias,404}.astro` con el contenido actual envuelto en Base, `public/robots.txt`, `public/sitemap.xml`, `tests/rl-bootstrap.test.js`, `tests/dist/paginas.test.js` (primera versión) | `npm run verificar` verde; preview de Vercel: `/` 200, `/aviso-de-privacidad` 200, `/aviso-de-privacidad.html` 308, `/Form/` 301, `/api/form-token` 200 JSON, `Set-Cookie: rl_geo` presente, `/js/rl-tracking.js` y `/lib/lead-quality/schema.js` 200. Este PR se mergea solo y primero |
| PR1 | `feat/f4-layout` | 10-21 | `src/data/servicios.js`, `src/components/layout/*`, `src/components/ui/*`, `src/styles/componentes.css`, `src/scripts/ui.js`, `src/pages/404.astro` definitiva, Base.astro completo (slots SEO, Header/Footer) | Header con panel por pilar y menú móvil por teclado; footer; barra CTA; 404 del sitemap §6; capturas 390/1440 |
| PR2 | `feat/f4-formulario` | 10-21 | `js/rl-form.js`, `src/components/forms/*`, `src/styles/form.css`, `tests/rl-form.test.js`, bloque (c) de `tests/dist/paginas.test.js` | Envío real en preview (shadow) llega a n8n; redirección a `/gracias`; no comercial inline; inputs 16 px; pruebas nuevas verdes |
| PR6 | `feat/f4-tracking` | 10-21 | `js/rl-tracking.js` (209+), `tests/rl-core.test.js` (casos nuevos), `docs/tracking/rl-taxonomy.json`, `docs/contrato-integraciones.md` (nota de versión) | `rl_service_view` en `#enfoque` con `service_line` de la página; taxonomía v2.2.0 |
| PR3 | `feat/f4-home` | 10-22 | `src/pages/index.astro`, `src/components/home/*` (hero con pestañas, maquetas, herramientas, nosotros, servicios, proceso, faq), `src/styles/home.css` | Secciones y copy de `docs/wireframes/home.md`; H1 en 3 líneas a 390; JSON-LD Organization + FAQPage; `[VERIFICAR]` reportados |
| PR4 | `feat/f4-servicios` | 10-22 | `src/layouts/Servicio.astro`, `src/pages/servicios/**`, `src/data/servicios/*.js`, `src/styles/servicio.css` | 5 páginas con keyword en H1, breadcrumb, `#enfoque`, `#relacionados`, JSON-LD Service + FAQPage + BreadcrumbList, servicio precargado |
| PR5 | `feat/f4-legales-gracias` | 10-22 | `src/pages/aviso-de-privacidad.astro` (contenido vigente del 2026-10-07 sin cambios de texto), `src/pages/gracias.astro` (sitemap §5, WhatsApp real, sin temporizador) | `check:release` verde; gracias con noindex y `rl_whatsapp_click` funcionando |
| PR7 | `feat/f4-pulido` | 10-23 | borrado de `index.html`, `gracias.html`, `aviso-de-privacidad.html`, `index-legacy.html`, `Form/`; ajustes CSP y cache en `vercel.json`; motion y foco; revisión 360/390/768/1024/1440 | Lighthouse móvil sin regresión de LCP frente al sitio actual; cero valores fuera de tokens; `npm run verificar` verde; preview completo para José y Rut el 10-24 |

Paralelización: tras PR0, tres agentes en paralelo (PR1, PR2, PR6: cero archivos compartidos; PR2 y PR6 tocan `js/` pero archivos distintos). Después, otros tres (PR3, PR4, PR5) que solo consumen `src/data/servicios.js` y los componentes de PR1/PR2 sin editarlos; si necesitan un cambio en un componente compartido, lo piden al dueño del PR o lo hacen en un commit separado y pequeño. `package.json`, `vercel.json` y `tests/rl-bootstrap.test.js` solo los toca PR0 (y PR7 vercel.json). 10-25 y 10-26: correcciones de QA. 10-27: PR `rediseno/f0-brief` a `main`, deploy de producción, verificación post-deploy (misma lista del PR0 contra riselanding.com más un lead de prueba con `?rl_internal=1`). Ola 2 (10-28 a 11-03): 6 páginas más con `Servicio.astro` + datos, `/diagnostico` con `src/lib/diagnostico/reglas.js` (módulo puro, pruebas desde la tabla de `docs/diagnostico-madurez.md`) y el cambio de `lib/lead-quality/engine.js` aprobado en F2.

Acciones humanas (José/Rut): fijar Node 22.x o 24.x en Vercel antes del PR0; confirmar que el preset del proyecto es "Other" (si fuera "Astro" también funciona por los overrides); resolver `[VERIFICAR]` del copy; número de WhatsApp real ya definido (`525548213439`).

## 9. Riesgos y verificación

1. Deploy roto al agregar build: `buildCommand` + `outputDirectory` en el mismo commit; verificar preview antes de mergear PR0.
2. Middleware raíz con Astro: verificar `Set-Cookie: rl_geo` en el preview de PR0 y en `/servicios/crm` (ruta anidada). Si faltara, fallback inmediato: `vercel.json` con `"framework": null` (reproduce el preset "Other" de hoy).
3. Fake success del honeypot: `api/lead.js:109-250` responde 200 sin veredicto cuando `website_url_2` tiene valor; `buildLeadSubmit` devuelve null y no se publica `rl_lead_submit` (prueba en `tests/rl-form.test.js` y manual: llenar `#f-hp` por consola, enviar, confirmar en dataLayer que no hay `rl_lead_submit` y que n8n no recibe). La redirección a `/gracias` ocurre igual; es aceptable porque ninguna conversión escucha la vista.
4. Idempotencia por `event_id`: `eventIdPara(raw)` intacto; reintento tras error de red conserva el id (`tests/lead-api.test.js` cubre `lead_duplicate`); la redirección no permite segundo envío (`enviando` no se libera en éxito). Verificación manual: desconectar red, enviar, reconectar, reenviar, un solo lead en Notion.
5. Consentimiento: default por `rl_geo` ahora en las 9 páginas (incluye gracias y aviso); prueba (b) de dist con `rl_geo=DE` → `denied` en cada HTML. Sigue sin CMP (F8).
6. 16 px en inputs: `src/styles/form.css` con `font-size:16px` en `.field input, .field select, .field textarea`; prueba estática que falla si en `form.css` aparece `font-size` menor a 16 px en esos selectores; comprobación en iPhone real (sin zoom al enfocar).
7. Cache immutable sobre archivos sin hash: resuelto en sección 7; verificar `curl -sI /js/rl-form.js` tras el deploy.
8. Canonical con `.html` por `build.format: 'file'`: pasar `path` explícito; prueba de dist verifica `rel="canonical" href="https://riselanding.com/servicios/crm"`.
9. Orden de scripts alterado por Astro o por `compressHTML`: la prueba (a) y (b) de dist lo detectan en cada build.
10. Pérdida de `rl_lead_submit` al navegar: `eventCallback` + tope 2 s; en QA con GTM Preview confirmar que GA4 y Ads reciben el evento antes de la navegación; si Ads usa imagen sin beacon, ampliar `eventTimeout` a 2500 ms.
11. `no-secrets` escaneando `dist/`: `.gitignore` en PR0; la prueba corre en cada PR.
12. `window.LeadSchema` indefinido si cambia el orden de scripts: prueba (c) verifica `schema.js` antes de `rl-form.js`.
13. Astro dev no sirve `/js`, `/lib`, `/Assets`: plugin Vite `scripts/vite-estaticos-raiz.mjs`; para probar el formulario local se usa `vercel dev` (corre `api/`, `middleware.js` y `astro dev` por `devCommand`).

Fuentes consultadas: vercel.com/docs/frameworks/frontend/astro, vercel.com/docs/functions/functions-api-reference, vercel.com/docs/routing-middleware y /js-reference, vercel.com/docs/project-configuration/vercel-json, vercel.com/docs/builds/configure-a-build, docs.astro.build/en/guides/deploy/vercel, docs.astro.build/en/reference/configuration-reference, docs.astro.build/en/reference/directives-reference, docs.astro.build/en/install-and-setup.

### Critical Files for Implementation
- /Users/josevazquez/Documents/00_Repos/Riselanding-page2/index.html (fuente del bootstrap 9-147, del formulario 1344-1450 y de su JS 1584-2111)
- /Users/josevazquez/Documents/00_Repos/Riselanding-page2/js/rl-tracking.js (remapeo de `#servicios`/`#enfoque` y `service_line` fuera del núcleo)
- /Users/josevazquez/Documents/00_Repos/Riselanding-page2/tests/rl-bootstrap.test.js (adaptar a `src/tracking/rl-bootstrap.js` y mover la prueba de orden a `tests/dist/paginas.test.js`)
- /Users/josevazquez/Documents/00_Repos/Riselanding-page2/vercel.json (buildCommand, outputDirectory, redirects 301, headers con cache corregido)
- /Users/josevazquez/Documents/00_Repos/Riselanding-page2/docs/contrato-integraciones.md (qué no se puede romper; se actualiza con la versión 2.2.0 de la taxonomía)
