# Estado del proyecto · Rediseño de riselanding.com

Fase actual: F1 (ADN de diseño) en paralelo con F7a (keywords) · Lanzamiento escalonado: ola 1 el 2026-10-27, ola 2 a más tardar el 2026-11-03
Rama de trabajo: `rediseno/f0-brief` (desde `main` en `28e9073`)

## Gates

| Fase | Estado | Aprobó | Fecha |
|---|---|---|---|
| F0 Brief | Aprobado | José Luis Vázquez | 2026-10-20 |
| F7a Investigación de keywords | En curso | | |
| F1 ADN de diseño | En curso (variantes clara y oscura) | | |
| F2 Arquitectura | No iniciada | | |
| F3 a F10 | No iniciadas | | |

## Entregables de F0

- `docs/brief.md` v0.2: brief con auditoría rápida y decisiones del 2026-10-20 (variantes clara y oscura en F1, multipágina, Astro, cifras sin fuente retiradas).
- `docs/contrato-integraciones.md` v1.0: qué debe respetar el frontend nuevo para conservar formulario, filtro de calidad y tracking.
- Rama `fix/sin-guion-largo` (commit `7df566c`): retira los 15 guiones largos del sitio publicado. Lista para PR independiente del rediseño.

## Pendientes

- José: aprobar por escrito las preguntas y la ponderación del diagnóstico de madurez (Claude entrega el borrador en F2).
- Campañas: se activan con el sitio completo (después de la ola 2). Antes, F8 debe dejar Google Ads y Meta medidos en GTM.
- José: el CSV entregado es de Google Ads Editor y no trae volúmenes. Para priorizar por volumen, exportar desde Keyword Planner (Descubrir nuevas palabras clave o Ver volumen de búsqueda y previsiones) con las mismas keywords.
- Fuera del rediseño, heredados de la release del filtro de calidad (`docs/RELEASE-SHADOW.md`): activación de Turnstile, revisión antes de `enforce`, deduplicación en n8n por `x-rl-event-id`, baja de `Form/` e `index-legacy.html`.
