# Pendientes de copy · Páginas de servicio (PR4, ola 1)

Versión: v1.0 · Fecha: 2026-10-20 · Rama: `feat/f4-servicios`
Insumos: `docs/wireframes/{plantilla-servicio,servicios-indice,crm,automatizacion,google-ads,sitio-web}.md`, `docs/copy/cuestionario-verificar.md`.

Regla aplicada: toda afirmación del borrador marcada `[VERIFICAR]` o `[PRUEBA PENDIENTE]` se publicó con una formulación neutra o se quitó. Cada caso queda abajo con la pregunta del cuestionario que lo destraba. Cuando José responda, se edita el archivo de datos de la página (`src/data/servicios/{slug}.js`) o `src/pages/servicios/index.astro`; la plantilla no cambia.

Columna "Pregunta": número de `docs/copy/cuestionario-verificar.md`.

## Todas las páginas de servicio

| Página | Texto original | Texto publicado | Pregunta |
|---|---|---|---|
| CRM, automatización, Google Ads, sitio web (`#problema`) | Cuatro frases entre comillas en primera persona, como citas de clientes | Las mismas situaciones en tercera persona, sin comillas (formato b del cuestionario). Ejemplo CRM: "Cada vendedor lleva su propio Excel." | 3 |
| CRM, Google Ads, sitio web (`#prueba`) | `[PRUEBA PENDIENTE]` caso con permiso, captura anonimizada o medición de riselanding.com | Sección omitida | 4 (sitio web, opción A: medición del equipo después del 2026-10-27) |
| CRM, Google Ads (`#herramientas`) | Estatus de partner de HubSpot, Zoho o Google Partner `[VERIFICAR]` | Sin mención de partner ni sellos; solo nombres de herramientas | 11 |
| Todas (`#entregables`) | "Cada entregable debe existir en la propuesta comercial real [VERIFICAR con José]" | Se publican los entregables sin marca propia; los marcados se quitaron o neutralizaron (ver cada página). La lista completa sigue pendiente de visto bueno | 10a |
| Todas (`#faq`) | Respuestas sobre precio, plazos y propiedad `[VERIFICAR]` | Ver cada página; las de propiedad se quitaron | 5, 6, 7, 10d |
| Todas (`#contacto`) | "Te respondemos en [VERIFICAR: tiempo comprometido]" | El componente compartido `Contacto.astro` no publica plazo de respuesta (opción d) | 1 |

## /servicios/crm

| Texto original | Texto publicado | Pregunta |
|---|---|---|
| Hero: "y acompañamos a los vendedores en las primeras semanas de uso. [VERIFICAR duración del acompañamiento]" | "y acompañamos a tus vendedores mientras empiezan a usarlo." | 15a |
| Enfoque, adopción: "una revisión con dirección para ajustar lo que el equipo no está usando. [VERIFICAR: momento de la revisión, por ejemplo a 30 días]" | Misma frase sin momento de la revisión | 15b |
| Entregables: "Importación de tus contactos y oportunidades actuales desde Excel u otro CRM. [VERIFICAR alcance y límite de registros]" | Misma frase, sin alcance ni límite | 10b |
| Entregables: "Vista de pipeline para dirección. Los tableros de KPI completos viven en medición (ola 2: enlace...)" | "Vista de pipeline para dirección." (la mención a medición vuelve con la página de ola 2) | Ola 2 |
| Entregables, nota: "Las licencias de HubSpot o Zoho se contratan a nombre de tu empresa. [VERIFICAR]" | Nota quitada | 7a |
| Proceso, H2: "Cuatro pasos para que tu equipo use el CRM desde la primera semana." (plazo sin confirmar) | "Cuatro pasos para que tu equipo adopte el CRM." | 6a |
| Proceso, paso 4: "ajustamos con lo que vemos en las primeras semanas de uso" | "ajustamos con lo que vemos en el uso diario del equipo" | 15a |
| Proceso, duración: "[VERIFICAR: rango típico en semanas; el sitio actual dice 'CRM integrado en 3 semanas']" | Sin duración | 6a, 6d |
| Herramientas: "[VERIFICAR: si se ofrece también Pipedrive]" | Pipedrive no se menciona | 12a |
| FAQ "¿Trabajan con HubSpot o con Zoho?": "[VERIFICAR otras plataformas que se implementan]" | Respuesta publicada sin nombrar otras plataformas | 12a |
| FAQ "¿Cuánto tarda...?": "[VERIFICAR rango típico]" | Respuesta publicada sin rango (calendario por entregable después del diagnóstico) | 6a |
| FAQ "¿Pueden migrar mis datos...?": "Sí. Limpiamos duplicados, ordenamos los campos y cargamos contactos y oportunidades... [VERIFICAR alcance]" | "Sí. Cargamos tus contactos y oportunidades antes de que el equipo empiece a usar el CRM. El alcance de la importación lo definimos contigo en el diagnóstico." | 10b |
| FAQ "¿Las licencias están incluidas?": "Las licencias se contratan a nombre de tu empresa... [VERIFICAR]" | Pregunta quitada (la FAQ queda con 5) | 7a |
| FAQ "¿Qué pasa cuando termina la implementación?": "...o puedes contratar soporte mensual para ajustes y nuevas integraciones. [VERIFICAR modelo de soporte]" | "Tu equipo se queda con la capacitación por rol y la guía de uso para operarlo. Si más adelante necesitas ajustes o nuevas integraciones, lo revisamos contigo." | 8c |
| `#prueba`: "[PRUEBA PENDIENTE: caso de implementación de CRM con permiso escrito...]" | Sección omitida | 4 |

## /servicios/automatizacion

| Texto original | Texto publicado | Pregunta |
|---|---|---|
| Hero: "Conectamos tus formularios, CRM, correo y WhatsApp con n8n..." (alcance de WhatsApp sin confirmar en enfoque) | "Conectamos tus formularios, tu CRM y tu correo con n8n..." | 13a |
| Enfoque, captura: "Cada solicitud de tu sitio, tus campañas o WhatsApp se registra... [VERIFICAR alcance de WhatsApp Business API]" | "Cada solicitud de tu sitio o de tus campañas se registra..." | 13a |
| Enfoque, bloque "Cotizaciones y documentos: Propuestas en PDF generadas con los datos del CRM... [VERIFICAR]" | Bloque quitado. En su lugar, "Integración entre tus herramientas", tomado de la FAQ sin marca del mismo borrador | 13b |
| Enfoque, alertas: "Avisos por correo o WhatsApp en los momentos que importan..." | "Avisos en los momentos que importan y un resumen periódico para dirección." | 13a, 13d |
| Enfoque, bloque "Inteligencia artificial donde aporta... [VERIFICAR alcance y proveedores de IA]" | Bloque quitado | 13c |
| `#prueba`, texto: "un filtro revisa la solicitud, la califica y la envía con n8n a nuestro CRM en Notion, con el origen y la prioridad listos... [VERIFICAR con José: nivel de detalle publicable]" | "el flujo revisa la solicitud y la registra en nuestro CRM con su origen, lista para que te contactemos." Sin nombrar herramientas, calificación ni prioridad; maqueta de 4 pasos genéricos con datos ficticios | 14 |
| `#prueba`: "[PRUEBA PENDIENTE: si se quiere una cifra, sacarla del modo shadow]" | Sin cifras | 14c |
| Entregables: "Flujos en n8n construidos, probados y documentados." | "Flujos en n8n probados y documentados." (regla de estilo: sin tríadas) | Estilo |
| Entregables: "Integración con tu CRM, formularios y canales de mensajes." | "Integración con tu CRM, tus formularios y tu correo." | 13a |
| Entregables: "Avisos de error para que una falla no pase desapercibida. [VERIFICAR mecanismo de monitoreo]" | Quitado. Se agregó "Diseño de cada flujo con sus reglas, excepciones y responsables, validado contigo." (paso 2 del proceso, sin marca) | 13d |
| Entregables, nota de propiedad: "[VERIFICAR: los flujos viven en una instancia de n8n del cliente o de Riselanding...]" | Nota quitada | 7d |
| Proceso, duración: "[VERIFICAR: rango típico por flujo]" | Sin duración | 6a |
| Herramientas: "WhatsApp Business [VERIFICAR] · Google Workspace [VERIFICAR]" | Solo n8n, HubSpot, Zoho CRM y Notion | 12d |
| FAQ "¿Quién es dueño de los flujos?": "[VERIFICAR: política de propiedad...]" | Pregunta quitada | 7d |
| FAQ "¿Qué pasa si un flujo falla?": "Configuramos avisos de error y revisamos el registro de ejecuciones... [VERIFICAR mecanismo y tiempo de atención]" | "n8n guarda un registro de cada ejecución, así que podemos ver en qué paso falló y corregirlo. Cómo y a quién se avisa de una falla lo definimos contigo al diseñar el flujo." | 13d |
| FAQ "¿Usan inteligencia artificial?": "[VERIFICAR]" | Pregunta quitada | 13c |
| FAQ "¿Tengo que cambiar mis herramientas?": "(CRM, correo, hojas de cálculo, WhatsApp)" | Sin WhatsApp | 13a |
| (nueva) | FAQ "¿Qué es la automatización de procesos para empresas?", definición sin afirmaciones sobre Riselanding, para completar 5 preguntas | Visto bueno de José |

## /servicios/google-ads

| Texto original | Texto publicado | Pregunta |
|---|---|---|
| Problema: "La mitad de los formularios que llegan son spam..." (cifra) | "Muchos de los formularios que llegan son spam o proveedores ofreciendo sus servicios." | 3 |
| Hero: "ajustes cada semana"; enfoque: "Optimización semanal... cada semana"; entregables: "Reporte mensual" y "Revisión semanal"; proceso: "a diario", "Ajustes semanales y un reporte mensual" (frecuencias que deben coincidir con la home) | "optimización continua", "de forma constante", "Reporte con...", "Revisión periódica", "revisamos de cerca", "Ajustes periódicos y un reporte" | 9a, 9b |
| Enfoque, medición: "[VERIFICAR alcance: conversiones mejoradas e importación desde el CRM]" | Texto del borrador sin mencionar conversiones mejoradas ni importación desde el CRM | 10c |
| Enfoque, anuncios: "lo que mejora el nivel de calidad y la tasa de conversión" | "lo que ayuda al nivel de calidad y a la tasa de conversión" (sin prometer resultado) | Estilo |
| Entregables, nota: "La cuenta publicitaria queda a nombre de tu empresa y la pauta la pagas directo a Google. [VERIFICAR con José]" | Nota quitada | 7b |
| Herramientas: Google Partner, Performance Max y Looker Studio `[VERIFICAR]` | No se mencionan | 11, 12b |
| FAQ "¿Cuánto debo invertir...?": "...estimamos un presupuesto de pauta inicial; nuestros honorarios van aparte. [VERIFICAR: presupuesto mínimo recomendado]" | "...En el diagnóstico estimamos contigo un presupuesto de pauta inicial." Sin mínimo ni modelo de honorarios | 5e, 7b |
| FAQ "¿La cuenta queda a mi nombre?": "[VERIFICAR]" | Pregunta quitada | 7b |
| FAQ "¿En cuánto tiempo veo resultados?": "Las primeras semanas sirven para depurar... [VERIFICAR: plazo que se comunica a clientes]" | "El primer periodo sirve para depurar búsquedas..." | 6c |
| FAQ "¿También manejan Facebook e Instagram?": "Meta Ads tiene su propia página..." (la página es de ola 2) | "Sí. En Meta Ads trabajamos con audiencias y creativos, así que lleva su propia estructura de campañas y su propia medición." | Ola 2 |
| FAQ "¿Qué reportes recibo?": "Un reporte mensual con... y acceso a la cuenta en todo momento. [VERIFICAR formato y frecuencia]" | "Un reporte con inversión, leads, leads calificados y costo por lead calificado. La frecuencia y el formato los acordamos contigo al arrancar." | 9b, 9c |
| `#prueba`: "[PRUEBA PENDIENTE: caso de Google Ads con permiso...]" | Sección omitida | 4 |

## /servicios/sitio-web

| Texto original | Texto publicado | Pregunta |
|---|---|---|
| H1: "Desarrollo de sitio web corporativo conectado a tu CRM" (4 líneas a 390 px) | "Desarrollo de sitio web corporativo para tu empresa" (3 líneas); la conexión al CRM sigue en la bajada | Regla de 3 líneas |
| Problema, H2: "Tu sitio debería ayudarte a vender y hoy casi nadie lo usa." | "Tu sitio debería ayudarte a vender." | Estilo |
| Entregables: "Capacitación para editar textos e imágenes. [VERIFICAR: herramienta de edición que se entrega]" | Quitado | 12c |
| Entregables, nota: "El dominio y el hosting quedan a nombre de tu empresa. [VERIFICAR]" | Nota quitada | 7c |
| Proceso, duración: "[VERIFICAR: el sitio actual dice 'entrega en 2 a 4 semanas']" | Sin duración | 6a, 6d |
| Herramientas: "[VERIFICAR: si también se entregan sitios en WordPress u otra plataforma]" | Solo las herramientas del borrador | 12c |
| FAQ "¿Cuánto cuesta...?": "Después del diagnóstico te entregamos una cotización cerrada por alcance. [VERIFICAR: si se publica un rango]" | "Cotizamos según el alcance que definimos contigo en el diagnóstico." Sin rango ni "cotización cerrada" | 5a |
| FAQ "¿Cuánto tarda el desarrollo?": "[VERIFICAR rango típico]" | Respuesta publicada sin rango | 6a |
| FAQ "¿Podré editar el contenido?": "[VERIFICAR herramienta de edición]" | Pregunta quitada | 12c |
| FAQ "¿El dominio y el hosting quedan a mi nombre?": "[VERIFICAR]" | Pregunta quitada | 7c |
| (nueva) | FAQ "¿El sitio se conecta con mi CRM?", armada con el hero y el enfoque del borrador (sin marca), para completar 5 preguntas | Visto bueno de José |
| `#prueba`, opciones A y B `[PRUEBA PENDIENTE]` | Sección omitida | 4 |

## /servicios

| Texto original | Texto publicado | Pregunta |
|---|---|---|
| H1: "Servicios de marketing, CRM y automatización para empresas B2B" (4 líneas a 390 px) | "Servicios de marketing, CRM y automatización" | Regla de 3 líneas |
| Tienda en línea: "Tienda conectada a tu CRM y a la medición de ventas. [VERIFICAR alcance de la oferta]" | "Tienda en línea para tu empresa. El alcance lo definimos contigo en el diagnóstico." | 18 |
| Software a la medida: "Herramientas internas alrededor de tu CRM cuando ninguna plataforma resuelve el proceso. [VERIFICAR alcance de la oferta]" | "Herramientas hechas para tu operación. El alcance lo definimos contigo en el diagnóstico." | 18 |
| ¿Por dónde empezar?: "...qué etapa conviene atender primero, aunque sea con otro proveedor. [VERIFICAR con José]" | "...qué etapa conviene atender primero." | 17 |
| Proceso, paso 4: "Revisamos resultados cada mes... [VERIFICAR frecuencia de revisión con José]" | "Revisamos resultados de forma periódica..." | 9a |

## Pendientes técnicos (no son de copy)

- "Pregúntanos por este servicio" lleva a `#contacto` sin precargar el servicio: `js/rl-form.js` solo lee `data-servicio` al cargar. Si se quiere precarga desde el enlace, lo resuelve el dueño de `js/rl-form.js` (PR2).
- Los enlaces de ola 2 (`#relacionados`, `#landing` de Google Ads, medición en CRM) ya están en los datos y aparecen solos al cambiar `OLA_PUBLICADA` a 2 en `src/data/servicios.js`.
