# Wireframe · Plantilla de página de servicio · /servicios/{slug}

Objetivo: convertir tráfico con intención de un servicio concreto (orgánico y Google Ads) · Keyword primaria: la de `docs/seo/mapa-urls.md` para cada URL · CTA principal: Agenda tu diagnóstico (lleva a `#contacto`)

Una sola plantilla para todos los servicios (patrón de Siege Media en DESIGN.md) con la estructura de Blend B2B: problema, enfoque, entregables, proceso, FAQ y CTA. Cada página llena las mismas ranuras con su copy. Las páginas de ola 1 que la usan: `crm.md`, `automatizacion.md`, `google-ads.md`, `sitio-web.md`.

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Objetivo de la sección | Contenido | Prueba requerida | CTA | Nota móvil |
|---|---|---|---|---|---|---|---|---|
| 0 | `header` | Navegación | Navegación | Ubicar y dar salida al menú Servicios | Header común (ver `docs/sitemap.md` §2) | | Primario "Agenda tu diagnóstico" a `#contacto` | Botón compacto "Agendar" y menú de pantalla completa |
| 1 | `hero` | Hero | Aura (§3), Maqueta de producto, Botón primario, Botón secundario; breadcrumb sin componente en §7 (agregar en style guide) | Decir qué servicio es, para quién y el siguiente paso en 5 segundos; concordar con el anuncio de Google Ads | Breadcrumb (Inicio · Servicios · {Servicio}) · eyebrow con el pilar (Atraer, Convertir, Medir o Automatizar) · H1 con la keyword primaria o su variante natural · bajada de 1 o 2 frases · maqueta del servicio con leyenda "Ejemplo ilustrativo con datos ficticios" | Ninguna cifra en el hero | Primario "Agenda tu diagnóstico" · secundario "WhatsApp" | H1 en 3 líneas máximo a 390 px; CTA visible sin scroll; la maqueta va debajo de los botones en proporción 4:5 |
| 2 | `problema` | Problema en palabras del cliente | Tarjeta (rejilla de 4) | Que el visitante se reconozca en la situación | H2 de una idea · 4 tarjetas con frases en primera persona, como las diría el cliente | Frases textuales de llamadas de discovery [VERIFICAR] | | Tarjetas apiladas en una columna |
| 3 | `enfoque` | Qué hacemos | Tarjeta con ícono Lucide (rejilla de 4) | Explicar cómo resolvemos cada parte del problema | H2 · bajada · 4 bloques con H3 y 2 o 3 líneas | | Enlace de acción a `#entregables` | Una columna; ícono a la izquierda del H3 |
| 4 | `entregables` | Entregables | Tarjeta de lista con ícono de check | Bajar la incertidumbre: qué recibe el cliente, por escrito | H2 · lista de 5 a 7 entregables concretos · nota de alcance si aplica | Cada entregable debe existir en la propuesta comercial real [VERIFICAR con José] | | Lista en una columna dentro de una tarjeta |
| 5 | `proceso` | Cómo trabajamos | Tarjeta con número (pasos del prototipo) | Mostrar el orden de trabajo y qué se entrega en cada paso | Eyebrow "Cómo trabajamos" · H2 · 4 pasos con H3 y una línea, adaptados al servicio · duración solo si está confirmada | Duración típica [VERIFICAR] | | Pasos verticales con número a la izquierda |
| 6 | `herramientas` | Herramientas | Muro de prueba (solo herramientas que operamos) | Confianza técnica sin inventar credenciales | Eyebrow "Herramientas que operamos" · fila de nombres o logos de herramientas · estatus de partner solo si está vigente | Partner HubSpot o Zoho [VERIFICAR] | | Fila con scroll horizontal o 2 filas |
| 7 | `prueba` | Prueba (condicional) | Tarjeta con Maqueta de producto | Mostrar trabajo real; se omite si no hay prueba | Caso con permiso, captura anonimizada o trabajo demostrable propio | [PRUEBA PENDIENTE] según página | | Tarjeta a ancho completo |
| 8 | `faq` | Preguntas frecuentes | Tarjeta como acordeón con botones `.faq-q` (el acordeón falta en §7: agregar en style guide) | Responder objeciones y aportar a SEO y GEO | H2 "Preguntas frecuentes sobre {servicio}" · 5 o 6 preguntas con respuesta de 2 a 4 frases, todas visibles al expandir y repetidas tal cual en el JSON-LD `FAQPage` | Respuestas sobre precio, plazos y propiedad confirmadas por José [VERIFICAR] | | Acordeón de una columna; la primera pregunta abierta |
| 9 | `contacto` | Diagnóstico y formulario | CTA final (tarjeta con aura) + Formulario de 2 pasos con Inputs | Conversión primaria | Eyebrow "Diagnóstico sin costo" · H2 propio de la página · bajada · 3 puntos de qué incluye el diagnóstico · formulario con el servicio de la página precargado · enlace "Escríbenos por WhatsApp" | Tiempo de respuesta comprometido [VERIFICAR] | Envío del formulario | El formulario ocupa el ancho completo; inputs de 16 px; la barra CTA fija se oculta aquí |
| 10 | `relacionados` | Servicios relacionados | Chip de servicio | Enlazado interno al cluster | Texto "También te puede interesar" · 2 o 3 chips con anclaje exacto a la keyword de la página destino (solo páginas publicadas) | | | Chips en una columna |
| 11 | `footer` | Footer | Footer | Navegación secundaria, contacto y legales | Footer común | | WhatsApp y teléfono (eventos `rl_whatsapp_click` y `rl_phone_click` con `cta_location: footer`) | Columnas apiladas |

Barra CTA fija móvil: aparece después del hero, se oculta cuando `#contacto` está en pantalla.

## Reglas de la plantilla

- H1 único por URL con la keyword primaria. Title: "{Keyword con mayúscula inicial} para empresas B2B | Riselanding" o variante natural, 60 caracteres máximo. Meta description con la keyword y el siguiente paso.
- "Leads" solo en el cuerpo, nunca en title ni H1 (la home es dueña de "generación de leads b2b").
- La FAQ visible y el JSON-LD `FAQPage` tienen exactamente las mismas preguntas y respuestas. JSON-LD adicional: `Service` (provider Riselanding, areaServed México) y `BreadcrumbList`.
- Sin cifras de resultados. Si una sección necesita prueba y no la hay, se escribe [PRUEBA PENDIENTE: qué se necesita] y la sección `#prueba` se omite al publicar.
- Estatus de partner de HubSpot o Zoho, Google Partner o Meta Business Partner: no se menciona sin verificación vigente [VERIFICAR].
- Maquetas en código con datos ficticios y la leyenda "Ejemplo ilustrativo con datos ficticios" siempre visible.
- Una animación de entrada por sección, solo opacidad.

## Componente `#contacto` (compartido con home y `/servicios`)

Misma instancia en todas las páginas: ids del contrato (`lead-form`, `f-solicitante`, `f-servicios`, etc.), 2 pasos, Turnstile, honeypot fuera de pantalla. Propiedades por página:

| Propiedad | Valor por defecto (home) | Cambia por página |
|---|---|---|
| Eyebrow | Diagnóstico sin costo | No |
| H2 | Empieza con un diagnóstico de tu operación comercial. | Sí |
| Bajada | Revisamos cómo llegan, se atienden y se miden tus prospectos hoy, y te entregamos recomendaciones concretas para los siguientes 90 días. | Opcional |
| Qué incluye | 1. Revisión de tus campañas, sitio, CRM y medición actuales. 2. Las oportunidades de mayor impacto, ordenadas por esfuerzo. 3. Recomendaciones concretas para los siguientes 90 días. | No |
| Expectativa de respuesta | "Te respondemos en [VERIFICAR: tiempo comprometido; el sitio actual dice menos de 24 horas]." | No |
| Servicio precargado (`data-servicio`) | Ninguno | Sí (mapa en `docs/sitemap.md` §7, punto 6) |
| `form_location` | `contacto` | No (ver `docs/sitemap.md` §4) |
| Alternativa | Enlace "Escríbenos por WhatsApp" | No |

Datos requeridos del cliente para cualquier página de servicio: frases reales de discovery, entregables y plazos tal como están en la propuesta comercial, política de propiedad de cuentas y datos, estatus de partner vigente.
Componente interactivo en esta plantilla: no (el diagnóstico de madurez vive en `/diagnostico` en ola 2 y se enlaza desde `#contacto` cuando exista).
