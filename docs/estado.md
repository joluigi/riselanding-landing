# Estado del proyecto · Rediseño de riselanding.com

Fase actual: ola 1 construida (F4) y en preview; siguen F8 (prueba E2E del formulario) y QA de F10
Rama de trabajo: `rediseno/f0-brief` (desde `main` en `28e9073`)

## Gates

| Fase | Estado | Aprobó | Fecha |
|---|---|---|---|
| F0 Brief | Aprobado | José Luis Vázquez | 2026-10-20 |
| F7a Investigación de keywords | Mapa provisional (sin volúmenes) | | |
| F1 ADN de diseño | Aprobado (variante A clara y 3 desviaciones del manual) | José Luis Vázquez | 2026-10-20 |
| F2 Arquitectura | Aprobado (sitemap, wireframes de ola 1 y diagnóstico de madurez) | José Luis Vázquez | 2026-10-20 |
| F3 Assets | Inventario listo (`docs/assets-inventario.md`); faltan logo vector y fotos | | |
| F4 Construcción | Ola 1 completa (PR0 a PR7) en preview: https://riselanding-landing-git-rediseno-f0-brief-joluigis-projects.vercel.app (2026-10-21) | | |
| F5 Móvil | Auditoría automática sin bloqueantes (`docs/qa/movil/`); falta prueba en dispositivos físicos | | |
| F6 Copy | Sin patrones bloqueantes; pendientes de verificar en `docs/copy/pendientes-*.md` | | |
| F7b SEO | `seo_audit.py` sin errores; falta Search Console | | |
| F8 a F10 | Pendientes | | |

## Entregables de F0

- `docs/brief.md` v0.2: brief con auditoría rápida y decisiones del 2026-10-20 (variantes clara y oscura en F1, multipágina, Astro, cifras sin fuente retiradas).
- `docs/contrato-integraciones.md` v1.0: qué debe respetar el frontend nuevo para conservar formulario, filtro de calidad y tracking.
- Rama `fix/sin-guion-largo` (commit `7df566c`): retira los 15 guiones largos del sitio publicado. Lista para PR independiente del rediseño.

## Decisiones del 2026-10-20 (José)

- Referencia principal de F1: Mangomint para ambas variantes (cambio de José sobre Siege y Blend, que quedan como secundarias).
- Ola 1 (27-oct): home, `/servicios`, `/servicios/crm`, `/servicios/automatizacion`, `/servicios/google-ads`, `/servicios/sitio-web`, legales y formulario.
- Ola 2 (a más tardar 3-nov): `/servicios/meta-ads`, `/seo`, `/landing-pages`, `/medicion`, `/software-a-la-medida` (G10, sí es oferta), `/tienda-en-linea` (G07, sí es oferta) y diagnóstico de madurez.
- Fase 2: `/negocios-locales` (L01).

## Decisiones de F2 (José, 2026-10-20)

- H1 de la home con keyword: "Generación de leads B2B, de la campaña al cierre."
- Tienda en línea se registra en el formulario como "Reediseño / Desarrollo página web" y Software a la medida como "Automatización de procesos" (sin tocar backend ni Notion).
- Diagnóstico: precarga `necesidad` con el resumen y el motor de calidad solo suma los +10 de mensaje si el usuario escribe texto propio (cambio en `lib/lead-quality/engine.js` con pruebas, ola 2).
- Preguntas y ponderación del diagnóstico aprobadas.

## Decisiones de F3 (José, 2026-10-20)

- Logo: José entrega el original en vector (lo deja en `Assets/`). Mientras llega, se construye con PNG a 2x.
- Sección Nosotros con fotos de José y Rut, con consentimiento, a más tardar el 2026-10-24.
- Herramientas que operamos: solo texto, sin logos de terceros.
- WhatsApp: ícono oficial en monocromo.

## Pendientes

- Campañas: se activan con el sitio completo (después de la ola 2). Antes, F8 debe dejar Google Ads y Meta medidos en GTM.
- José: el CSV entregado es de Google Ads Editor y no trae volúmenes. Para priorizar por volumen, exportar desde Keyword Planner (Descubrir nuevas palabras clave o Ver volumen de búsqueda y previsiones) con las mismas keywords.
- Fuera del rediseño, heredados de la release del filtro de calidad (`docs/RELEASE-SHADOW.md`): activación de Turnstile, revisión antes de `enforce`, deduplicación en n8n por `x-rl-event-id`, baja de `Form/` e `index-legacy.html`.
- Rut: corregir el typo "Reediseño" en el valor de servicio, a la vez en `lib/lead-quality/schema.js`, n8n y Notion.
- José: resolver las marcas [VERIFICAR] del copy (cuestionario en F6).
- José: logo en vector en `Assets/`.
- José y Rut: fotos para Nosotros a más tardar el 2026-10-24 (misma luz y fondo neutro).
- José: responder `docs/copy/cuestionario-verificar.md` a más tardar el 2026-10-23.
- José (F8, antes de activar campañas): en GTM crear la etiqueta de configuración de Google; activadores para `rl_form_submit_attempt`, `rl_non_commercial_submit`, `rl_tool_start` y `rl_tool_complete`; enviar `page_template` en etiquetas GA4; corregir `prospect_segment` en Meta Lead; capturar IDs reales de Google Ads y Meta; decidir si la conversión compuesta de Ads cuenta también en páginas de servicio. Detalle en `docs/tracking/rl-taxonomy.json`.
