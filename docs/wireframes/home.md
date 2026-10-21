# Wireframe · Inicio · /

Objetivo: explicar en 5 segundos qué hace Riselanding y para quién, repartir al visitante hacia su servicio y convertir al que ya decidió · Keyword primaria: generación de leads b2b · CTA principal: Agenda tu diagnóstico (`#contacto`)

Base: `docs/prototipos/home-variantes.html`, variante A aprobada en F1. Se conservan orden, copy e ids del prototipo salvo los cambios marcados como **Cambio**.

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Objetivo de la sección | Prueba requerida | CTA | Nota móvil |
|---|---|---|---|---|---|---|---|
| 0 | `header` | Navegación | Navegación | Ubicar y abrir el menú Servicios | | Primario "Agenda tu diagnóstico" · secundario WhatsApp | Botón compacto "Agendar" y menú de pantalla completa |
| 1 | `hero` | Hero con pestañas de pilar | Aura (§3), Pestañas de pilar (`.svc-tab`), Maqueta de producto, Botón primario, Enlace de acción | Qué es, para quién y siguiente paso; mostrar el trabajo en las 4 etapas | Ninguna cifra; maquetas con leyenda "Ejemplo ilustrativo con datos ficticios" | Primario "Agenda tu diagnóstico" · enlace "Ver cómo trabajamos" (`#proceso`) | H1 en 3 líneas a 390 px; pestañas con scroll horizontal; maqueta 4:5 |
| 2 | `herramientas` | Herramientas que operamos | Muro de prueba | Confianza técnica inmediata sin logos de clientes | Solo herramientas que operamos; sin sellos de partner [VERIFICAR] | | Lista en 2 filas centradas |
| 3 | `nosotros` | Por qué Riselanding | Una columna centrada (ancho de lectura 640 px) | Diferenciar: un solo equipo responsable del recorrido completo | | Enlace "Conoce nuestro proceso" (`#proceso`) | Texto a ancho completo |
| 4 | `servicios` | Índice de servicios por pilar | Tarjeta por pilar con Chips de servicio | Ruta a cada página de servicio; dispara `rl_service_view` | | Chips enlazados a cada servicio | Tarjetas apiladas; chips a ancho completo |
| 5 | `proceso` | Cómo trabajamos | Tarjeta con número (4 pasos) | Bajar incertidumbre sobre el trabajo conjunto | | | Pasos verticales |
| 6 | `diagnostico-madurez` | Diagnóstico de madurez (ola 2) | Tarjeta con Enlace de acción | Valor inmediato para quien aún no está listo para agendar | | Botón secundario "Haz el diagnóstico" | Tarjeta a ancho completo. **Cambio**: sección nueva, se publica en ola 2 |
| 7 | `faq` | Preguntas frecuentes | Tarjeta como acordeón (`.faq-q`) | Responder objeciones generales; JSON-LD `FAQPage` | Respuestas sobre precio, plazos y salida [VERIFICAR con José] | | Acordeón de una columna. **Cambio**: el prototipo no la tenía; el sitio actual sí |
| 8 | `contacto` | Diagnóstico y formulario | CTA final (tarjeta con aura) + Formulario | Conversión primaria | Tiempo de respuesta [VERIFICAR] | Envío del formulario · enlace WhatsApp | Formulario a ancho completo. **Cambio**: el prototipo usaba `#diagnostico` para la CTA final; pasa a `#contacto` y contiene el formulario |
| 9 | `footer` | Footer | Footer | Navegación secundaria, contacto y legales | | WhatsApp, teléfono, correo | Columnas apiladas |

Barra CTA fija móvil: sí (la home tiene más de 3 pantallas).

No hay sección `#resultados`: no existen resultados verificables (ver `docs/sitemap.md` §7, punto 3).

## Copy borrador por sección

### 1. `hero`

- Eyebrow: Elevamos tu marca. Aterrizamos tus ventas.
- H1 propuesto: **Generación de leads B2B, de la campaña al cierre.**
  - **Cambio** respecto al prototipo ("Generamos clientes y automatizamos tu operación comercial."): el mapa de keywords pide que el H1 repita la keyword primaria para que el anuncio de los grupos G01 y G04 y la página digan lo mismo. Decisión de José: H1 propuesto o el del prototipo con la keyword en title, description y bajada.
- Bajada: Campañas, CRM, automatización y medición para empresas B2B en México, operados por un solo equipo que responde por cada etapa.
- Botón primario: Agenda tu diagnóstico
- Enlace de acción: Ver cómo trabajamos
- Pestañas (`.svc-tab`, ids `tab-atraer`, `tab-convertir`, `tab-medir`, `tab-automatizar`) con las 4 maquetas del prototipo:
  - Atraer: panel de campañas de búsqueda y redes con datos ficticios.
  - Convertir: pipeline de CRM con etapas Nuevo, Calificado y Ganado.
  - Medir: tablero de leads por canal.
  - Automatizar: flujo de formulario, calificación, CRM y aviso al vendedor.
- Leyenda: Ejemplo ilustrativo con datos ficticios
- Title: Generación de leads B2B en México | Riselanding
- Meta description: Campañas, CRM, automatización y medición para empresas B2B en México, con un solo equipo responsable. Agenda tu diagnóstico sin costo.

### 2. `herramientas`

- Eyebrow (como H2 visual): Herramientas que operamos
- Lista: Google Ads · Meta Ads · GA4 · HubSpot · Zoho CRM · Notion · n8n

### 3. `nosotros`

- Eyebrow: Por qué Riselanding
- H2: Un solo equipo responsable de atraer, convertir, medir y automatizar.
- Texto: Cuando las campañas, el sitio y el CRM quedan en manos de proveedores distintos, cada quien cuida su parte y el recorrido completo del cliente se queda sin dueño. En Riselanding el mismo equipo diseña, opera y mide todo tu sistema comercial, así sabes quién responde, qué se hizo y con qué datos se tomó cada decisión.
- Enlace de acción: Conoce nuestro proceso
- [PRUEBA PENDIENTE: nombres y fotos reales de José y Rut con su rol, para dar cara al "un solo equipo"; si se aprueban, van en esta sección]

### 4. `servicios`

- Eyebrow: Servicios
- H2: Todo lo que necesitas para vender más, ordenado por etapa.
- Tarjetas por pilar (descripción del prototipo, chips según la ola):

| Pilar | Descripción | Chips en ola 1 | Se suman en ola 2 |
|---|---|---|---|
| Atraer | Prospectos calificados desde búsqueda, redes y contenido. | Google Ads | Meta Ads, SEO |
| Convertir | Sitios y procesos que convierten visitas en oportunidades. | Sitio web, CRM | Landing pages, Tienda en línea |
| Medir | Datos confiables para decidir dónde invertir cada peso. | Medición y tableros (enlace a `/servicios#medir`) | Medición y tableros (enlace a su página) |
| Automatizar | Procesos que corren solos y responden a tiempo. | Automatización | Software a la medida |

- En ola 1 los servicios de ola 2 no aparecen como chips en la home; viven descritos en `/servicios` para no enlazar a páginas inexistentes.
- Enlace de acción al final: Ver todos los servicios (`/servicios`)

### 5. `proceso`

- Eyebrow: Cómo trabajamos
- H2: Cuatro pasos, con entregables claros en cada uno.
- 1 Diagnóstico: Revisamos tus campañas, sitio, CRM y medición actuales para ubicar dónde se pierden prospectos.
- 2 Plan: Priorizamos acciones por impacto y esfuerzo, con presupuesto, responsables y fechas.
- 3 Implementación: Configuramos campañas, páginas, CRM y automatizaciones, con medición desde el primer día.
- 4 Optimización: Revisamos resultados cada mes, ajustamos lo que rinde menos y compartimos contigo los datos completos. [VERIFICAR frecuencia de revisión con José]

### 6. `diagnostico-madurez` (ola 2)

Copy tomado de `docs/diagnostico-madurez.md` (sección 1) para que ambos documentos digan lo mismo.

- Eyebrow: Diagnóstico de madurez digital
- H2: ¿Qué tan ordenada está tu operación comercial?
- Texto: Responde 10 preguntas y ve en qué pilar está tu mayor oportunidad.
- Botón secundario: Haz el diagnóstico (`/diagnostico`)

### 7. `faq`

- H2: Preguntas frecuentes
- ¿Cuánto cuesta trabajar con Riselanding?
  Cotizamos según el alcance que definimos en el diagnóstico. La inversión en pauta de Google o Meta se paga aparte, directo a cada plataforma. [VERIFICAR: si se publica un rango de honorarios o escalones de entrada]
- ¿En cuánto tiempo veo resultados?
  Depende de la etapa en la que empecemos. En el plan te damos fechas por entregable y los indicadores que vamos a revisar en cada una, para que sepas qué esperar y cuándo. [VERIFICAR rangos típicos por servicio]
- Ya tengo CRM y otras herramientas. ¿Tengo que cambiarlas?
  Partimos de lo que ya usas. Si tu CRM sirve para tu proceso, lo reordenamos y lo conectamos con tus formularios y campañas. Solo proponemos migrar cuando seguir con la herramienta actual cuesta más.
- ¿Trabajan con empresas fuera de la Ciudad de México?
  Sí. Trabajamos de forma remota con videollamadas y un canal directo por WhatsApp. [VERIFICAR: ciudades con clientes actuales antes de listarlas]
- ¿Cómo reportan los resultados?
  Con un tablero que muestra leads, costo por lead y avance del pipeline, y una revisión periódica contigo. [VERIFICAR frecuencia: el sitio actual dice reporte semanal]
- ¿Hay plazo forzoso?
  [VERIFICAR: el sitio actual dice compromiso inicial trimestral y mensualidad después]. Si terminas el servicio, te entregamos accesos y documentación de campañas, CRM y automatizaciones. [VERIFICAR política de salida]

### 8. `contacto`

- Eyebrow: Diagnóstico sin costo
- H2: Empieza con un diagnóstico de tu operación comercial.
- Bajada: Revisamos cómo llegan, se atienden y se miden tus prospectos hoy, y te entregamos recomendaciones concretas para los siguientes 90 días.
- Qué incluye: los 3 puntos del componente compartido (`plantilla-servicio.md`).
- Formulario de 2 pasos sin servicio precargado.
- Expectativa: Te respondemos en [VERIFICAR: tiempo comprometido].
- Enlace: Escríbenos por WhatsApp

Datos requeridos del cliente para esta página: decisión sobre el H1; frecuencia de revisión y reporte; política de plazo y salida; tiempo de respuesta comprometido; fotos y roles de los socios (opcional); ciudades con clientes actuales.
Componente interactivo en esta página: pestañas de pilar con maquetas (ola 1); enlace al diagnóstico de madurez en `/diagnostico` (ola 2).
JSON-LD: `Organization` (nombre, logo, contacto, WhatsApp, `sameAs` de redes [VERIFICAR perfiles]) y `FAQPage` con las 6 preguntas visibles.
