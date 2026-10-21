# Wireframe · Servicios · /servicios

Objetivo: ordenar la oferta por pilar y llevar a cada página de servicio con anclaje exacto · Keyword primaria: sin keyword (hub de navegación, canonical propio) · CTA principal: Agenda tu diagnóstico (`#contacto`)

Es la página que recibe "Ver todos los servicios" desde el menú y la home. En ola 1 también describe los servicios de ola 2, que todavía no tienen página, para que ningún enlace del sitio lleve a un 404.

## Estructura

| Orden | ID | Sección | Componente (DESIGN.md §7) | Objetivo de la sección | Prueba requerida | CTA | Nota móvil |
|---|---|---|---|---|---|---|---|
| 0 | `header` | Navegación | Navegación | | | Primario a `#contacto` | Común |
| 1 | `hero` | Hero corto | Aura (§3), Botón primario | Decir qué cubre la oferta y cómo está ordenada | | Primario "Agenda tu diagnóstico" | Sin maqueta; titular y botón caben en la primera pantalla |
| 2 | `servicios` | Índice por pilar | Tarjeta por pilar con Chips de servicio; subanclas `#atraer`, `#convertir`, `#medir`, `#automatizar` | Ruta a cada servicio; dispara `rl_service_view` como en la home | | Chip enlazado (ola 1) o enlace "Pregúntanos por este servicio" a `#contacto` (ola 2 aún sin página) | Pilares apilados; cada servicio en una fila con nombre, una línea y enlace |
| 3 | `por-donde-empezar` | ¿Por dónde empezar? | Tarjeta | Ayudar al que no sabe qué servicio necesita | | Enlace a `#contacto`; en ola 2, botón secundario al diagnóstico de madurez | Tarjeta a ancho completo |
| 4 | `proceso` | Cómo trabajamos | Tarjeta con número (4 pasos) | Mismo proceso para todos los servicios | | | Pasos verticales |
| 5 | `contacto` | Diagnóstico y formulario | CTA final + Formulario | Conversión primaria | Tiempo de respuesta [VERIFICAR] | Envío del formulario | Común |
| 6 | `footer` | Footer | Footer | | | | Común |

## Copy borrador por sección

### 1. `hero`

- Eyebrow: Servicios
- H1: Servicios de marketing, CRM y automatización para empresas B2B
- Bajada: Organizamos el trabajo en cuatro etapas: atraer prospectos, convertirlos en oportunidades, medir cada peso invertido y automatizar el seguimiento. Puedes contratar una etapa o el recorrido completo.
- Botón primario: Agenda tu diagnóstico
- Title: Servicios de marketing digital, CRM y automatización | Riselanding
- Meta description: Google Ads, Meta Ads, SEO, sitios web, CRM, medición y automatización para empresas B2B en México, ordenados por etapa.

### 2. `servicios`

H2: Elige por etapa o por servicio.

**Atraer** (`#atraer`): Prospectos calificados desde búsqueda, redes y contenido.

| Servicio | Línea | Enlace en ola 1 | Ola de la página |
|---|---|---|---|
| Google Ads | Campañas de búsqueda para empresas B2B, medidas hasta el lead calificado. | `/servicios/google-ads` (anclaje "agencia de Google Ads") | 1 |
| Meta Ads | Facebook, Instagram y TikTok para generar prospectos, con reportes de contactos y leads calificados. | "Pregúntanos por este servicio" | 2 |
| SEO | Posicionamiento técnico y de contenido en Google y en motores de IA. | "Pregúntanos por este servicio" | 2 |

**Convertir** (`#convertir`): Sitios y procesos que convierten visitas en oportunidades.

| Servicio | Línea | Enlace en ola 1 | Ola de la página |
|---|---|---|---|
| Sitio web corporativo | Sitio para tu empresa, rápido en celular y conectado a tu CRM desde el primer día. | `/servicios/sitio-web` (anclaje "desarrollo de sitio web corporativo") | 1 |
| Landing pages | Una página por campaña con formulario de 2 pasos y filtro de calidad. | "Pregúntanos por este servicio" | 2 |
| Tienda en línea | Tienda conectada a tu CRM y a la medición de ventas. [VERIFICAR alcance de la oferta] | "Pregúntanos por este servicio" | 2 |
| CRM | Implementación de HubSpot o Zoho con el pipeline que ya sigue tu equipo. | `/servicios/crm` (anclaje "implementación de CRM") | 1 |

**Medir** (`#medir`): Datos confiables para decidir dónde invertir cada peso.

| Servicio | Línea | Enlace en ola 1 | Ola de la página |
|---|---|---|---|
| Medición y tableros | GA4, Google Tag Manager y conversiones hasta el lead calificado, con tableros para dirección. | "Pregúntanos por este servicio" | 2 |

**Automatizar** (`#automatizar`): Procesos que corren solos y responden a tiempo.

| Servicio | Línea | Enlace en ola 1 | Ola de la página |
|---|---|---|---|
| Automatización | Captura, calificación y asignación de prospectos con n8n, conectadas a tu CRM. | `/servicios/automatizacion` (anclaje "automatización de procesos para empresas") | 1 |
| Software a la medida | Herramientas internas alrededor de tu CRM cuando ninguna plataforma resuelve el proceso. [VERIFICAR alcance de la oferta] | "Pregúntanos por este servicio" | 2 |

"Pregúntanos por este servicio" lleva a `#contacto` y precarga el servicio cuando exista valor en `SERVICIOS` (no aplica a tienda ni software, ver `docs/sitemap.md` §7, punto 6).

### 3. `por-donde-empezar`

- H2: ¿No sabes por dónde empezar?
- Texto: Es lo más común. En el diagnóstico revisamos tu operación completa y te decimos qué etapa conviene atender primero, aunque sea con otro proveedor.
- Enlace de acción: Agenda tu diagnóstico (`#contacto`)
- Ola 2, botón secundario: Haz el diagnóstico (`/diagnostico`)
- [VERIFICAR con José: "aunque sea con otro proveedor" es un compromiso de recomendación honesta; confirmar que se sostiene]

### 4. `proceso`

Mismo copy que la home (`home.md`, sección 5).

### 5. `contacto`

- H2: Cuéntanos qué necesitas y te ayudamos a ordenar las prioridades.
- Resto: componente compartido sin servicio precargado.

Datos requeridos del cliente para esta página: alcance de tienda en línea y software a la medida; confirmación del compromiso de la sección 3.
Componente interactivo en esta página: no (en ola 2, enlace al diagnóstico de madurez).
JSON-LD: `BreadcrumbList` e `ItemList` de los servicios publicados.
