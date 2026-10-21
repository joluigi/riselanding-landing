# Wireframe · Sitio web corporativo · /servicios/sitio-web

Objetivo: convertir tráfico que necesita sitio nuevo o rediseño para su empresa · Keyword primaria: desarrollo de sitio web corporativo · Secundarias: página web corporativa, desarrollo web para empresas, página web para empresa, rediseño de página web · CTA principal: Agenda tu diagnóstico (`#contacto`)

Plantilla: `plantilla-servicio.md`. Grupo de anuncios: G05 (negativas: landing, tienda, ecommerce, software). Servicio precargado: `Reediseño / Desarrollo página web` (texto literal de `SERVICIOS`, con la errata incluida). `page.template`: `servicio_sitio_web_v1`.

Regla de canibalización 1: esta página usa "empresa" y "corporativo", nunca "negocio" (reservado para `/negocios-locales` en fase 2).

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Prueba requerida | Nota móvil |
|---|---|---|---|---|---|
| 1 | `hero` | Hero | Aura, Maqueta de producto (sitio en celular y escritorio), Botón primario, Botón secundario | Ninguna cifra | H1 en 3 líneas a 390 px |
| 2 | `problema` | Problema | Tarjeta (4) | Frases de discovery [VERIFICAR] | Una columna |
| 3 | `enfoque` | Qué hacemos | Tarjeta con ícono (4) | | Una columna |
| 4 | `entregables` | Entregables | Tarjeta de lista | [VERIFICAR] | Una columna |
| 5 | `proceso` | Cómo trabajamos | Tarjeta con número (4) | Duración [VERIFICAR] | Vertical |
| 6 | `herramientas` | Herramientas | Muro de prueba | | Scroll horizontal |
| 7 | `prueba` | Prueba (se omite si no hay) | Tarjeta con maqueta o captura | [PRUEBA PENDIENTE] | Ancho completo |
| 8 | `faq` | Preguntas frecuentes | Tarjeta como acordeón (`.faq-q`) | [VERIFICAR] | Acordeón |
| 9 | `contacto` | Diagnóstico y formulario | CTA final + Formulario | Tiempo de respuesta [VERIFICAR] | Ancho completo |
| 10 | `relacionados` | Servicios relacionados | Chip de servicio | | Una columna |

## Copy borrador por sección

### 1. `hero`

- Breadcrumb: Inicio · Servicios · Sitio web
- Eyebrow: Convertir
- H1: Desarrollo de sitio web corporativo conectado a tu CRM
- Bajada: Diseñamos y construimos el sitio de tu empresa para que cargue rápido en celular, explique tu oferta con claridad y envíe cada solicitud a tu CRM con su origen.
- Botón primario: Agenda tu diagnóstico
- Botón secundario: WhatsApp
- Maqueta: el mismo sitio ficticio en marco de celular y de escritorio, con un formulario y la tarjeta del lead entrando al CRM. Leyenda: Ejemplo ilustrativo con datos ficticios.
- Title: Desarrollo de sitio web corporativo para empresas | Riselanding
- Meta description: Desarrollo de sitio web corporativo y rediseño de página web para empresas B2B, rápido en celular y conectado a tu CRM. Agenda tu diagnóstico.

### 2. `problema`

- H2: Tu sitio debería ayudarte a vender y hoy casi nadie lo usa.
- Tarjetas [VERIFICAR: sustituir por frases textuales de discovery]:
  - "Me da pena mandarle el link a un prospecto."
  - "Las solicitudes llegan a un correo que nadie revisa."
  - "Para cambiar un texto dependemos del proveedor."
  - "No sabemos cuántas visitas se vuelven contactos."

### 3. `enfoque`

- H2: Un sitio pensado para el prospecto que llega desde Google o desde un anuncio.
- Bajada: Empezamos por lo que tu cliente necesita saber para pedir una cotización y construimos alrededor de eso.
- Estructura y mensaje: Una página por servicio con su propia búsqueda objetivo, textos claros y un solo siguiente paso en cada página.
- Diseño de tu marca: Diseño a la medida con tu identidad, probado primero en celular.
- Formularios que llegan al CRM: Formulario de 2 pasos con filtro de calidad, conectado a tu CRM con el origen de cada solicitud.
- SEO técnico y medición: Velocidad, datos estructurados, sitemap y medición con GA4 y Google Tag Manager desde el lanzamiento.
- Rediseño de página web sin perder posiciones: Si ya tienes sitio, inventariamos tus URLs y configuramos redirecciones para conservar lo que ya posiciona.

### 4. `entregables`

- H2: Qué recibes
- Mapa del sitio y estructura de cada página aprobados antes del diseño.
- Diseño en celular y escritorio con tu identidad de marca.
- Sitio desarrollado y publicado, con certificado de seguridad.
- Formulario conectado a tu CRM y filtro de calidad de solicitudes.
- Medición con GA4 y Google Tag Manager, con las conversiones configuradas.
- SEO técnico base: títulos, descripciones, datos estructurados, sitemap y redirecciones si es rediseño.
- Capacitación para editar textos e imágenes. [VERIFICAR: herramienta de edición que se entrega]
- Nota: El dominio y el hosting quedan a nombre de tu empresa. [VERIFICAR]

### 5. `proceso`

- Eyebrow: Cómo trabajamos
- H2: Del mapa del sitio al lanzamiento, con tu aprobación en cada paso.
- 1 Brief y arquitectura: Definimos objetivos, páginas, mensajes y búsquedas objetivo de cada página.
- 2 Diseño: Diseñamos primero en celular y te mostramos la página principal antes de seguir con las demás.
- 3 Desarrollo: Construimos, conectamos formulario, CRM y medición, y revisamos velocidad y accesibilidad.
- 4 Lanzamiento: Publicamos, revisamos que cada formulario y cada conversión funcionen, y damos de alta el sitio en Google Search Console.
- Duración: [VERIFICAR: el sitio actual dice "entrega en 2 a 4 semanas" sin fuente]

### 6. `herramientas`

- Eyebrow: Herramientas que usamos
- Astro · Vercel · Google Tag Manager · GA4 · Google Search Console · HubSpot · Zoho CRM
- [VERIFICAR: si también se entregan sitios en WordPress u otra plataforma]

### 7. `prueba`

- Opción A, disponible tras el lanzamiento: riselanding.com como sitio demostrable, con su medición de Core Web Vitals. [PRUEBA PENDIENTE: medición de PageSpeed Insights o CrUX de riselanding.com después del 2026-10-27, con fecha]
- Opción B: sitios entregados a clientes. [PRUEBA PENDIENTE: permiso escrito de cada cliente para mostrar su sitio]
- Sin ninguna de las dos, la sección no se publica. No se usa "Page speed 90+ garantizado" del sitio actual.

### 8. `faq`

- H2: Preguntas frecuentes sobre desarrollo de sitio web corporativo
- ¿Cuánto cuesta un sitio web corporativo?
  Depende del número de páginas, las integraciones y si hay contenido por escribir. Después del diagnóstico te entregamos una cotización cerrada por alcance. [VERIFICAR: si se publica un rango]
- ¿Cuánto tarda el desarrollo?
  Te damos un calendario con fecha para cada entrega desde el arranque. El plazo depende sobre todo de que tengamos textos e imágenes a tiempo. [VERIFICAR rango típico]
- ¿Hacen rediseño de página web?
  Sí. Revisamos tu sitio actual, conservamos lo que ya posiciona y configuramos redirecciones para no perder tráfico de Google.
- ¿Podré editar el contenido?
  Sí, te capacitamos para cambiar textos e imágenes. [VERIFICAR herramienta de edición]
- ¿El dominio y el hosting quedan a mi nombre?
  Sí, a nombre de tu empresa, con accesos de administrador para ti. [VERIFICAR]
- ¿El sitio incluye SEO?
  Incluye el SEO técnico base para que Google pueda leer y mostrar bien tu sitio. El posicionamiento continuo con contenido es un servicio aparte. [Ola 2: enlace a `/servicios/seo` con el anclaje "agencia SEO"]

### 9. `contacto`

- H2: Cuéntanos qué necesita tu sitio y te decimos por dónde empezar.
- Formulario con `Reediseño / Desarrollo página web` precargado. Resto: componente compartido.

### 10. `relacionados`

- Texto: También te puede interesar
- [Implementación de CRM](/servicios/crm)
- [Agencia de Google Ads](/servicios/google-ads)
- Ola 2: [Diseño de landing page](/servicios/landing-pages) · [Agencia SEO](/servicios/seo)

Datos requeridos del cliente para esta página: frases de discovery, herramienta de edición que se entrega, propiedad de dominio y hosting, plataformas además de Astro, duración típica, permiso para mostrar sitios entregados.
Componente interactivo en esta página: no.
