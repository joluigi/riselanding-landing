# Wireframe · Automatización de procesos · /servicios/automatizacion

Objetivo: convertir tráfico que quiere quitar trabajo manual del proceso comercial · Keyword primaria: automatización de procesos para empresas · Secundarias: automatización comercial, automatización de ventas, automatización con n8n, consultoría en automatización · CTA principal: Agenda tu diagnóstico (`#contacto`)

Plantilla: `plantilla-servicio.md`. Grupo de anuncios: G09. Servicio precargado: `Automatización de procesos`. `page.template`: `servicio_automatizacion_v1`.

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Prueba requerida | Nota móvil |
|---|---|---|---|---|---|
| 1 | `hero` | Hero | Aura, Maqueta de producto (flujo de automatización), Botón primario, Botón secundario | Ninguna cifra | H1 en 3 líneas a 390 px |
| 2 | `problema` | Problema | Tarjeta (4) | Frases de discovery [VERIFICAR] | Una columna |
| 3 | `enfoque` | Qué hacemos | Tarjeta con ícono (4) | | Una columna |
| 4 | `prueba` | Lo usamos en este sitio | Tarjeta con Maqueta de producto (flujo real con datos ficticios) | Demostrable en el repo; aprobación de qué se describe [VERIFICAR] | Ancho completo; el flujo se lee de arriba abajo |
| 5 | `entregables` | Entregables | Tarjeta de lista | [VERIFICAR] | Una columna |
| 6 | `proceso` | Cómo trabajamos | Tarjeta con número (4) | Duración [VERIFICAR] | Vertical |
| 7 | `herramientas` | Herramientas | Muro de prueba | | Scroll horizontal |
| 8 | `faq` | Preguntas frecuentes | Tarjeta como acordeón (`.faq-q`) | [VERIFICAR] | Acordeón |
| 9 | `contacto` | Diagnóstico y formulario | CTA final + Formulario | Tiempo de respuesta [VERIFICAR] | Ancho completo |
| 10 | `relacionados` | Servicios relacionados | Chip de servicio | | Una columna |

En esta página `#prueba` sube antes de entregables porque es la única prueba demostrable del sitio en ola 1.

## Copy borrador por sección

### 1. `hero`

- Breadcrumb: Inicio · Servicios · Automatización
- Eyebrow: Automatizar
- H1: Automatización de procesos para empresas
- Bajada: Conectamos tus formularios, CRM, correo y WhatsApp con n8n para que cada prospecto se registre y llegue al vendedor correcto en cuanto escribe. Empezamos por el proceso comercial y seguimos con la operación.
- Botón primario: Agenda tu diagnóstico
- Botón secundario: WhatsApp
- Maqueta: flujo de 5 nodos (Formulario, Calificación, CRM, Aviso al vendedor, Seguimiento a 48 h) con un lead ficticio recorriéndolo. Leyenda: Ejemplo ilustrativo con datos ficticios.
- Title: Automatización de procesos para empresas con n8n | Riselanding
- Meta description: Automatización de procesos para empresas: captura, calificación y seguimiento de prospectos con n8n, conectados a tu CRM. Agenda tu diagnóstico.

### 2. `problema`

- H2: Las tareas repetidas se comen las horas de tu equipo comercial.
- Tarjetas [VERIFICAR: sustituir por frases textuales de discovery]:
  - "Copiamos a mano los datos del formulario al CRM."
  - "Una cotización nos toma medio día."
  - "Si alguien escribe el viernes en la tarde, le contestamos el lunes."
  - "Nadie se entera cuando una oportunidad lleva una semana sin movimiento."

### 3. `enfoque`

- H2: Automatizamos primero lo que más tiempo le quita a tu equipo.
- Bajada: Hacemos un inventario de tareas repetidas, las ordenamos por horas invertidas y riesgo de error, y empezamos por las que tocan al cliente.
- Captura y calificación: Cada solicitud de tu sitio, tus campañas o WhatsApp se registra en el CRM con su origen y una calificación según las reglas que definimos contigo. [VERIFICAR alcance de WhatsApp Business API]
- Asignación y seguimiento: El prospecto llega al vendedor que corresponde, con avisos cuando una oportunidad se queda quieta. Esta es la base de la automatización de ventas.
- Cotizaciones y documentos: Propuestas en PDF generadas con los datos del CRM, listas para revisar y enviar. [VERIFICAR: el sitio actual ofrece cotizador PDF automático]
- Alertas y reportes: Avisos por correo o WhatsApp en los momentos que importan y un resumen periódico para dirección.
- Inteligencia artificial donde aporta: clasificar mensajes entrantes, resumir conversaciones o extraer datos de documentos, siempre con revisión humana en lo que llega al cliente. [VERIFICAR alcance y proveedores de IA]

### 4. `prueba`

- Eyebrow: Lo usamos en este sitio
- H2: El formulario de esta página pasa por una automatización que construimos nosotros.
- Texto: Cuando nos dejas tus datos, un filtro revisa la solicitud, la califica y la envía con n8n a nuestro CRM en Notion, con el origen y la prioridad listos para que te contactemos. Es el mismo tipo de flujo que implementamos para nuestros clientes.
- Maqueta del flujo propio con datos ficticios. Leyenda: Ejemplo ilustrativo con datos ficticios.
- [VERIFICAR con José: nivel de detalle publicable; no describir las señales antibot ni el umbral de calificación]
- Sin cifras de volumen ni de precisión del filtro. [PRUEBA PENDIENTE: si se quiere una cifra, sacarla del modo shadow con fuente y fecha]

### 5. `entregables`

- H2: Qué recibes
- Inventario de procesos con prioridad por tiempo invertido y riesgo de error.
- Flujos en n8n construidos, probados y documentados.
- Integración con tu CRM, formularios y canales de mensajes.
- Avisos de error para que una falla no pase desapercibida. [VERIFICAR mecanismo de monitoreo]
- Guía de operación y sesión de entrega con tu equipo.
- Nota de propiedad: [VERIFICAR: los flujos viven en una instancia de n8n del cliente o de Riselanding, y qué se entrega al terminar]

### 6. `proceso`

- Eyebrow: Cómo trabajamos
- H2: Del inventario de tareas al flujo en producción.
- 1 Diagnóstico: Listamos las tareas repetidas de tu proceso comercial y medimos cuánto tiempo toman hoy.
- 2 Diseño: Dibujamos cada flujo con sus reglas, excepciones y responsables, y lo validamos contigo.
- 3 Construcción: Construimos en n8n, probamos con datos reales de tu operación y documentamos.
- 4 Operación y mejora: Activamos el flujo, vigilamos errores y sumamos el siguiente proceso de la lista.
- Duración: [VERIFICAR: rango típico por flujo]

### 7. `herramientas`

- Eyebrow: Herramientas que operamos
- n8n · HubSpot · Zoho CRM · Notion · WhatsApp Business [VERIFICAR] · Google Workspace [VERIFICAR]

### 8. `faq`

- H2: Preguntas frecuentes sobre automatización de procesos
- ¿Qué procesos conviene automatizar primero?
  Los que se repiten todos los días y tocan al cliente: registrar solicitudes, asignarlas, dar seguimiento y cotizar. Ahí el tiempo ahorrado se nota rápido y el riesgo de error baja.
- ¿Qué es n8n y por qué lo usan?
  Es una plataforma para conectar aplicaciones y automatizar tareas. La usamos porque se conecta con casi cualquier herramienta por API, permite flujos con lógica compleja y puede alojarse en un servidor propio.
- ¿Tengo que cambiar mis herramientas?
  No necesariamente. Conectamos las que ya usas (CRM, correo, hojas de cálculo, WhatsApp) siempre que tengan API o integración disponible.
- ¿Quién es dueño de los flujos?
  [VERIFICAR: política de propiedad e instancia donde viven los flujos]
- ¿Qué pasa si un flujo falla?
  Configuramos avisos de error y revisamos el registro de ejecuciones para corregir antes de que afecte a un cliente. [VERIFICAR mecanismo y tiempo de atención]
- ¿Usan inteligencia artificial?
  Sí, en tareas donde ahorra tiempo sin riesgo, como clasificar mensajes o extraer datos. Lo que se envía a un cliente pasa por una regla o una revisión humana. [VERIFICAR]

### 9. `contacto`

- H2: Cuéntanos qué tarea le quita más tiempo a tu equipo.
- Formulario con `Automatización de procesos` precargado. Resto: componente compartido.

### 10. `relacionados`

- Texto: También te puede interesar
- [Implementación de CRM](/servicios/crm)
- [Desarrollo de sitio web corporativo](/servicios/sitio-web)
- Ola 2: [Diseño de landing page](/servicios/landing-pages)

Datos requeridos del cliente para esta página: frases de discovery, alcance de WhatsApp e IA, política de propiedad de flujos e instancia de n8n, mecanismo de monitoreo, nivel de detalle publicable del filtro propio, duración típica.
Componente interactivo en esta página: no (la maqueta del flujo es estática).
