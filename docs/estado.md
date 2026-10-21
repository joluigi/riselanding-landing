# Estado del proyecto · Rediseño de riselanding.com

Fase actual: F0 · Brief y alcance (proyecto interno, sin propuesta comercial)
Rama de trabajo: `rediseno/f0-brief` (desde `main` en `28e9073`)

## Gates

| Fase | Estado | Aprobó | Fecha |
|---|---|---|---|
| F0 Brief | Pendiente de validación | | |
| F7a Investigación de keywords | No iniciada (corre en paralelo con F1) | | |
| F1 ADN de diseño | No iniciada | | |
| F2 Arquitectura | No iniciada | | |
| F3 a F10 | No iniciadas | | |

## Entregables de F0

- `docs/brief.md` v0.1: brief con auditoría rápida y 7 preguntas para José.
- `docs/contrato-integraciones.md` v1.0: qué debe respetar el frontend nuevo para conservar formulario, filtro de calidad y tracking.
- Rama `fix/sin-guion-largo` (commit `7df566c`): retira los 15 guiones largos del sitio publicado. Lista para PR independiente del rediseño.

## Pendientes

- José: responder las preguntas de la sección 13 del brief y validar la conversión primaria.
- Fuera del rediseño, heredados de la release del filtro de calidad (`docs/RELEASE-SHADOW.md`): activación de Turnstile, revisión antes de `enforce`, deduplicación en n8n por `x-rl-event-id`, baja de `Form/` e `index-legacy.html`.
