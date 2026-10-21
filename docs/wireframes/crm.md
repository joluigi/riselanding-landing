# Wireframe · Implementación de CRM · /servicios/crm

Objetivo: convertir tráfico que busca implementar o reordenar HubSpot o Zoho · Keyword primaria: implementación de crm · Secundarias: consultoría crm, implementación de hubspot, implementación de zoho crm, consultor zoho crm · CTA principal: Agenda tu diagnóstico (`#contacto`)

Plantilla: `plantilla-servicio.md`. Grupo de anuncios: G08. Servicio precargado en el formulario: `Implementación de CRM`. `page.template`: `servicio_crm_v1`.

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Prueba requerida | Nota móvil |
|---|---|---|---|---|---|
| 1 | `hero` | Hero | Aura, Maqueta de producto (pipeline de CRM), Botón primario, Botón secundario | Ninguna cifra | H1 en 2 o 3 líneas a 390 px |
| 2 | `problema` | Problema | Tarjeta (4) | Frases de discovery [VERIFICAR] | Una columna |
| 3 | `enfoque` | Qué hacemos | Tarjeta con ícono (4) | | Una columna |
| 4 | `entregables` | Entregables | Tarjeta de lista | Entregables de la propuesta real [VERIFICAR] | Una columna |
| 5 | `proceso` | Cómo trabajamos | Tarjeta con número (4) | Duración [VERIFICAR] | Vertical |
| 6 | `herramientas` | Herramientas | Muro de prueba | Partner [VERIFICAR] | Scroll horizontal |
| 7 | `prueba` | Prueba (se omite si no hay) | Tarjeta con maqueta | [PRUEBA PENDIENTE] | Ancho completo |
| 8 | `faq` | Preguntas frecuentes | Tarjeta como acordeón (`.faq-q`) | Respuestas confirmadas [VERIFICAR] | Acordeón |
| 9 | `contacto` | Diagnóstico y formulario | CTA final + Formulario | Tiempo de respuesta [VERIFICAR] | Ancho completo |
| 10 | `relacionados` | Servicios relacionados | Chip de servicio | | Una columna |

## Copy borrador por sección

### 1. `hero`

- Breadcrumb: Inicio · Servicios · CRM
- Eyebrow: Convertir
- H1: Implementación de CRM para tu equipo de ventas
- Bajada: Configuramos HubSpot o Zoho CRM con el proceso que ya sigue tu equipo, lo conectamos con tus formularios y campañas, y acompañamos a los vendedores en las primeras semanas de uso. [VERIFICAR duración del acompañamiento]
- Botón primario: Agenda tu diagnóstico
- Botón secundario: WhatsApp
- Maqueta: pipeline con columnas Nuevo, Calificado, Propuesta y Ganado, tarjetas con empresas ficticias y el origen de cada lead (Google Ads, formulario, WhatsApp). Leyenda: Ejemplo ilustrativo con datos ficticios.
- Title: Implementación de CRM: HubSpot y Zoho para empresas B2B | Riselanding
- Meta description: Implementación de CRM con HubSpot o Zoho a la medida de tu proceso de venta, conectado a tus formularios y campañas. Agenda tu diagnóstico.

### 2. `problema`

- H2: Si el CRM no refleja cómo vendes, el equipo deja de usarlo.
- Tarjetas [VERIFICAR: sustituir por frases textuales de llamadas de discovery]:
  - "Los prospectos llegan por WhatsApp, correo y formulario, y nadie sabe cuál ya se atendió."
  - "Cada vendedor lleva su propio Excel."
  - "Pagamos licencias de CRM que casi nadie abre."
  - "Para saber cuánto hay en el pipeline tengo que pedir un reporte."

### 3. `enfoque`

- H2: Diseñamos el CRM alrededor de tu proceso de venta.
- Bajada: Antes de configurar una sola propiedad, entendemos cómo entra un prospecto, quién lo atiende y qué tiene que pasar para que avance.
- Mapeo del proceso: Documentamos tus etapas de venta, los criterios para pasar de una a otra y quién es responsable en cada momento.
- Configuración a la medida: Pipeline, campos, vistas por rol y permisos, con lo mínimo que tu equipo necesita capturar para que el seguimiento sea útil.
- Integraciones: Los formularios de tu sitio y tus campañas llegan al CRM con su origen. El seguimiento automático lo resolvemos con [automatización de ventas](/servicios/automatizacion).
- Adopción del equipo: Capacitación por rol, una guía corta de uso y una revisión con dirección para ajustar lo que el equipo no está usando. [VERIFICAR: momento de la revisión, por ejemplo a 30 días]
- Enlace de acción: Ver qué recibes (`#entregables`)

### 4. `entregables`

- H2: Qué recibes al terminar la implementación
- Mapa de tu proceso comercial con etapas, criterios de avance y responsables.
- CRM configurado: pipeline, campos, vistas y permisos por rol.
- Importación de tus contactos y oportunidades actuales desde Excel u otro CRM. [VERIFICAR alcance y límite de registros]
- Formularios del sitio conectados al CRM, con el origen de cada lead.
- Vista de pipeline para dirección. Los tableros de KPI completos viven en medición (ola 2: enlace con el anclaje "tableros de KPI" cuando se publique `/servicios/medicion`).
- Capacitación por rol y guía de uso.
- Nota: Las licencias de HubSpot o Zoho se contratan a nombre de tu empresa. [VERIFICAR]

### 5. `proceso`

- Eyebrow: Cómo trabajamos
- H2: Cuatro pasos para que tu equipo use el CRM desde la primera semana.
- 1 Diagnóstico: Revisamos tu proceso de venta, las herramientas que usas y dónde se pierde el seguimiento.
- 2 Diseño: Definimos etapas, campos, integraciones y la plataforma que mejor encaja contigo.
- 3 Implementación: Configuramos, importamos datos, conectamos formularios y probamos con casos reales de tu equipo.
- 4 Adopción y ajuste: Capacitamos por rol y ajustamos con lo que vemos en las primeras semanas de uso.
- Duración: [VERIFICAR: rango típico en semanas; el sitio actual dice "CRM integrado en 3 semanas" sin fuente]

### 6. `herramientas`

- Eyebrow: Herramientas que operamos
- HubSpot · Zoho CRM · Notion · n8n · GA4
- [VERIFICAR: estatus de partner de HubSpot o Zoho vigente; sin verificación no se menciona]
- [VERIFICAR: si se ofrece también Pipedrive, como dice el sitio actual]

### 7. `prueba`

- [PRUEBA PENDIENTE: caso de implementación de CRM con permiso escrito del cliente, o capturas anonimizadas de un pipeline real con autorización. Sin esto, la sección no se publica]

### 8. `faq`

- H2: Preguntas frecuentes sobre implementación de CRM
- ¿Trabajan con HubSpot o con Zoho?
  Con los dos. Te recomendamos uno según el tamaño de tu equipo, tu presupuesto de licencias y las herramientas que ya usas. [VERIFICAR otras plataformas que se implementan]
- Ya tengo un CRM. ¿Tengo que cambiarlo?
  Partimos del que tienes. Si la plataforma sirve para tu proceso, la reordenamos; solo proponemos migrar cuando mantenerla sale más caro.
- ¿Cuánto tarda una implementación de CRM?
  Depende del número de etapas, usuarios e integraciones. Después del diagnóstico te entregamos un calendario con fecha para cada entregable. [VERIFICAR rango típico]
- ¿Pueden migrar mis datos de Excel o de otro CRM?
  Sí. Limpiamos duplicados, ordenamos los campos y cargamos contactos y oportunidades antes de que el equipo empiece a usar el CRM. [VERIFICAR alcance]
- ¿Las licencias están incluidas?
  Las licencias se contratan a nombre de tu empresa, directo con HubSpot o Zoho, para que la cuenta y los datos sean tuyos. [VERIFICAR]
- ¿Qué pasa cuando termina la implementación?
  Tu equipo puede operarlo por su cuenta con la guía que te entregamos, o puedes contratar soporte mensual para ajustes y nuevas integraciones. [VERIFICAR modelo de soporte]

### 9. `contacto`

- H2: Cuéntanos cómo vendes hoy y te decimos por dónde empezar con tu CRM.
- Formulario con `Implementación de CRM` precargado. Resto: componente compartido.

### 10. `relacionados`

- Texto: También te puede interesar
- [Automatización de procesos para empresas](/servicios/automatizacion)
- [Desarrollo de sitio web corporativo](/servicios/sitio-web)
- Ola 2: [Implementación de Google Analytics 4](/servicios/medicion)

Datos requeridos del cliente para esta página: frases de discovery, plataformas que se implementan, estatus de partner, duración típica, alcance de migración, política de licencias, modelo de soporte, caso con permiso.
Componente interactivo en esta página: no.
