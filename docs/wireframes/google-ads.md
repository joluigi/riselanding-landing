# Wireframe · Google Ads · /servicios/google-ads

Objetivo: convertir tráfico que busca una agencia para operar su búsqueda pagada · Keyword primaria: agencia de google ads · Secundarias: administración de google ads, gestión de campañas de google ads, consultor de google ads, agencia sem · CTA principal: Agenda tu diagnóstico (`#contacto`)

Plantilla: `plantilla-servicio.md`. Grupo de anuncios: G02 (negativas: facebook, meta, instagram, tiktok, landing). Servicio precargado: `Publicidad Digital`. `page.template`: `servicio_google_ads_v1`.

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Prueba requerida | Nota móvil |
|---|---|---|---|---|---|
| 1 | `hero` | Hero | Aura, Maqueta de producto (panel de campañas), Botón primario, Botón secundario | Ninguna cifra | H1 en 2 líneas a 390 px |
| 2 | `problema` | Problema | Tarjeta (4) | Frases de discovery [VERIFICAR] | Una columna |
| 3 | `enfoque` | Qué hacemos | Tarjeta con ícono (4) | | Una columna |
| 4 | `landing` | Página de destino por campaña | Tarjeta corta con Enlace de acción | | Ancho completo |
| 5 | `entregables` | Entregables | Tarjeta de lista | [VERIFICAR] | Una columna |
| 6 | `proceso` | Cómo trabajamos | Tarjeta con número (4) | | Vertical |
| 7 | `herramientas` | Herramientas | Muro de prueba | Google Partner [VERIFICAR] | Scroll horizontal |
| 8 | `prueba` | Prueba (se omite si no hay) | Tarjeta | [PRUEBA PENDIENTE] | Ancho completo |
| 9 | `faq` | Preguntas frecuentes | Tarjeta como acordeón (`.faq-q`) | [VERIFICAR] | Acordeón |
| 10 | `contacto` | Diagnóstico y formulario | CTA final + Formulario | Tiempo de respuesta [VERIFICAR] | Ancho completo |
| 11 | `relacionados` | Servicios relacionados | Chip de servicio | | Una columna |

La sección `#landing` es la mención corta que pide la regla de canibalización 2 del mapa de keywords.

## Copy borrador por sección

### 1. `hero`

- Breadcrumb: Inicio · Servicios · Google Ads
- Eyebrow: Atraer
- H1: Agencia de Google Ads para empresas B2B
- Bajada: Planeamos y operamos tus campañas de búsqueda con una página de destino por campaña, ajustes cada semana y medición hasta el lead calificado que llega a tu CRM.
- Botón primario: Agenda tu diagnóstico
- Botón secundario: WhatsApp
- Maqueta: panel de campañas con 3 grupos de anuncios ficticios, columnas de clics, leads y leads calificados, y un anuncio de búsqueda de ejemplo. Leyenda: Ejemplo ilustrativo con datos ficticios.
- Title: Agencia de Google Ads para empresas B2B | Riselanding
- Meta description: Agencia de Google Ads para empresas B2B en México: campañas de búsqueda, landing por campaña y medición hasta el lead calificado. Agenda tu diagnóstico.

### 2. `problema`

- H2: Pagas clics y tu equipo comercial no ve más clientes.
- Tarjetas [VERIFICAR: sustituir por frases textuales de discovery]:
  - "La mitad de los formularios que llegan son spam o gente vendiéndonos algo."
  - "No sabemos qué búsquedas trajeron a los clientes que sí cerraron."
  - "La agencia anterior nos reportaba clics e impresiones."
  - "Todos los anuncios llevan a la página de inicio."

### 3. `enfoque`

- H2: Campañas de búsqueda medidas hasta la oportunidad de venta.
- Bajada: Le enseñamos a Google qué solicitudes valen la pena, para que la inversión se mueva hacia las búsquedas que traen clientes.
- Estructura por intención: Un grupo de anuncios por servicio y por tipo de búsqueda, con keywords negativas desde el primer día para no pagar por empleo, cursos o autoservicio.
- Anuncios que dicen lo mismo que la página: El texto del anuncio, el titular de la página y la oferta coinciden, lo que mejora el nivel de calidad y la tasa de conversión.
- Medición hasta el lead calificado: Configuramos conversiones en Google Tag Manager y GA4 con la calificación de cada solicitud, para que las campañas optimicen por oportunidades reales. [VERIFICAR alcance: conversiones mejoradas e importación desde el CRM]
- Optimización semanal: Revisamos términos de búsqueda, pujas y anuncios cada semana, y te explicamos qué cambiamos y por qué.

### 4. `landing`

- H3: Una página de destino para cada campaña
- Texto: Cada grupo de anuncios aterriza en una página escrita para esa búsqueda, con formulario de 2 pasos y filtro de calidad. Si todavía no la tienes, la construimos como parte del arranque.
- Ola 2: enlace de acción con el anclaje exacto "landing page para Google Ads" hacia `/servicios/landing-pages`. En ola 1, sin enlace.

### 5. `entregables`

- H2: Qué recibes
- Auditoría de tu cuenta actual de Google Ads, si ya tienes una.
- Estructura de campañas, keywords y negativas, documentada.
- Anuncios de búsqueda y extensiones redactados para cada grupo.
- Conversiones configuradas en Google Tag Manager y GA4.
- Reporte mensual con leads, leads calificados y costo por lead calificado.
- Revisión semanal de términos de búsqueda y pujas.
- Nota: La cuenta publicitaria queda a nombre de tu empresa y la pauta la pagas directo a Google. [VERIFICAR con José]

### 6. `proceso`

- Eyebrow: Cómo trabajamos
- H2: Cuatro pasos antes y después de encender las campañas.
- 1 Diagnóstico: Revisamos tu cuenta, tu sitio y cómo mides hoy, y estimamos el costo por clic de tus búsquedas principales.
- 2 Plan: Definimos servicios a anunciar, presupuesto de pauta, estructura y la página de destino de cada campaña.
- 3 Lanzamiento: Configuramos medición, publicamos anuncios y revisamos los primeros términos de búsqueda a diario.
- 4 Optimización: Ajustes semanales y un reporte mensual con lo que funcionó, lo que cortamos y el siguiente paso.

### 7. `herramientas`

- Eyebrow: Herramientas que operamos
- Google Ads · Google Tag Manager · GA4 · HubSpot · Zoho CRM
- [VERIFICAR: certificación o insignia de Google Partner vigente; sin verificación no se menciona]
- [VERIFICAR: Performance Max y Looker Studio, si se usan]

### 8. `prueba`

- [PRUEBA PENDIENTE: caso de Google Ads con permiso del cliente y cifras con fuente y periodo, o captura anonimizada de una cuenta con autorización. Sin esto, la sección no se publica]

### 9. `faq`

- H2: Preguntas frecuentes sobre Google Ads
- ¿Cuánto debo invertir en Google Ads?
  Depende del costo por clic de tus búsquedas y de cuántos prospectos necesitas al mes. En el diagnóstico estimamos un presupuesto de pauta inicial; nuestros honorarios van aparte. [VERIFICAR: presupuesto mínimo recomendado]
- ¿La cuenta queda a mi nombre?
  Sí. La cuenta y el historial son de tu empresa y nosotros la administramos con acceso de usuario. [VERIFICAR]
- ¿En cuánto tiempo veo resultados?
  Las campañas reciben clics desde que se activan. Las primeras semanas sirven para depurar búsquedas y que el algoritmo aprenda qué solicitudes valen la pena. [VERIFICAR: plazo que se comunica a clientes]
- ¿Qué es una agencia SEM y en qué se diferencia de Google Ads?
  SEM es marketing en buscadores con anuncios pagados. En México se usa casi como sinónimo de Google Ads, que es la plataforma donde operamos esas campañas.
- ¿También manejan Facebook e Instagram?
  Sí. Meta Ads tiene su propia página y su propio enfoque, porque ahí se trabaja con audiencias y creativos. [Ola 2: enlace a `/servicios/meta-ads`]
- ¿Qué reportes recibo?
  Un reporte mensual con inversión, leads, leads calificados y costo por lead calificado, y acceso a la cuenta en todo momento. [VERIFICAR formato y frecuencia]

### 10. `contacto`

- H2: Cuéntanos qué vendes y te decimos cómo arrancaríamos tus campañas.
- Formulario con `Publicidad Digital` precargado. Resto: componente compartido.

### 11. `relacionados`

- Texto: También te puede interesar
- [Desarrollo de sitio web corporativo](/servicios/sitio-web)
- [Implementación de CRM](/servicios/crm)
- Ola 2: [Agencia de Facebook Ads](/servicios/meta-ads) · [Diseño de landing page](/servicios/landing-pages)

Datos requeridos del cliente para esta página: frases de discovery, propiedad de la cuenta, presupuesto mínimo, alcance de conversiones mejoradas, Google Partner, plazo comunicado, formato de reporte, caso con permiso.
Componente interactivo en esta página: no.
