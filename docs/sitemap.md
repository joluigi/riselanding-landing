# Sitemap · Riselanding · v1

Versión: v1.0 borrador · Fecha: 2026-10-20 · Fase: F2 ruta B (nativa, sin Relume)
Insumos: `docs/brief.md`, `docs/estado.md` (olas), `docs/seo/mapa-urls.md` v0.1 (keywords provisionales, sin volumen), `DESIGN.md` v1.0, `docs/contrato-integraciones.md` v1.0, `docs/prototipos/home-variantes.html` (base de la home).
Estado: pendiente de aprobación de José y Rut (gate F2).

## 1. Páginas

CTA único en todo el sitio: **Agenda tu diagnóstico** (botón primario, lleva a la sección `#contacto` de la misma página o a `/#contacto` si la página no tiene formulario). Conversión secundaria en todas las páginas: WhatsApp +52 55 4821 3439 (`https://wa.me/525548213439`, botón secundario).

### Ola 1 · 2026-10-27

| # | Página | URL | Tipo | Objetivo de la página | Keyword primaria | Intención | CTA principal | Indexación | Wireframe |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Inicio | `/` | home | Explicar en 5 segundos qué hace Riselanding y para quién, repartir al visitante hacia su servicio y convertir al que ya decidió | generación de leads b2b | Navegacional (marca) y transaccional | Agenda tu diagnóstico | index | `wireframes/home.md` |
| 2 | Servicios | `/servicios` | índice | Ordenar la oferta por pilar y llevar a cada página de servicio con anclaje exacto | Sin keyword (hub) | Navegacional | Agenda tu diagnóstico | index, canonical propio | `wireframes/servicios-indice.md` |
| 3 | Implementación de CRM | `/servicios/crm` | servicio (Convertir) | Convertir tráfico que busca implementar o reordenar HubSpot o Zoho | implementación de crm | Transaccional | Agenda tu diagnóstico | index | `wireframes/crm.md` |
| 4 | Automatización | `/servicios/automatizacion` | servicio (Automatizar) | Convertir tráfico que quiere quitar trabajo manual del proceso comercial | automatización de procesos para empresas | Transaccional | Agenda tu diagnóstico | index | `wireframes/automatizacion.md` |
| 5 | Google Ads | `/servicios/google-ads` | servicio (Atraer) | Convertir tráfico que busca una agencia para operar su búsqueda pagada | agencia de google ads | Transaccional | Agenda tu diagnóstico | index | `wireframes/google-ads.md` |
| 6 | Sitio web corporativo | `/servicios/sitio-web` | servicio (Convertir) | Convertir tráfico que necesita sitio nuevo o rediseño para su empresa | desarrollo de sitio web corporativo | Transaccional | Agenda tu diagnóstico | index | `wireframes/sitio-web.md` |
| 7 | Aviso de privacidad | `/aviso-de-privacidad` | legal | Cumplimiento LFPDPPP; enlazado desde cada formulario | Sin keyword | Informativa | Ninguno (enlace a `/`) | index | Se conserva el contenido vigente (2026-10-07) en la plantilla nueva |
| 8 | Gracias | `/gracias` | gracias | Confirmar el envío, fijar expectativa de respuesta y ofrecer WhatsApp | Sin keyword | Transaccional | Escríbenos por WhatsApp | noindex, nofollow, fuera de `sitemap.xml` | Ver sección 5 |
| 9 | Página no encontrada | 404 | 404 | Recuperar al visitante hacia servicios o contacto | Sin keyword | Navegacional | Agenda tu diagnóstico (`/#contacto`) | noindex | Ver sección 6 |

Plantilla común de las páginas 3 a 6: `wireframes/plantilla-servicio.md`.

### Ola 2 · a más tardar 2026-11-03

Una línea por página. Todas usan `plantilla-servicio.md` salvo el diagnóstico de madurez.

| # | Página | URL | Pilar | Keyword primaria | Nota |
|---|---|---|---|---|---|
| 10 | Meta Ads | `/servicios/meta-ads` | Atraer | agencia de facebook ads | Paid social para prospectos B2B; TikTok Ads como sección sin keyword propia; sin "SEM" en title ni H1 |
| 11 | SEO | `/servicios/seo` | Atraer | agencia seo | SEO técnico y de contenido para empresas B2B más visibilidad en motores de IA; sin mencionar SEO local |
| 12 | Landing pages | `/servicios/landing-pages` | Convertir | diseño de landing page | Landing por campaña con formulario de 2 pasos y filtro de calidad (prueba demostrable en este sitio) |
| 13 | Medición y tableros | `/servicios/medicion` | Medir | implementación de google analytics 4 | GA4, GTM y conversiones hasta el lead calificado; recibe los enlaces de "tableros" desde CRM |
| 14 | Tienda en línea | `/servicios/tienda-en-linea` | Convertir | desarrollo de tienda en línea | Oferta confirmada en `estado.md`; el formulario no tiene valor de servicio para tienda (ver sección 7, punto 6) |
| 15 | Software a la medida | `/servicios/software-a-la-medida` | Automatizar | desarrollo de software a la medida | Alrededor de CRM y automatización; absorbe "integración de sistemas" si así se decide; mismo hueco de valor en el formulario |
| 16 | Diagnóstico de madurez digital | `/diagnostico` (alineado con `docs/diagnostico-madurez.md`) | Los 4 | Sin keyword en el mapa [VERIFICAR "diagnóstico de marketing digital" con Keyword Planner] | Componente interactivo de DESIGN.md: 10 preguntas, barras por pilar y precarga del formulario `#contacto` en la misma página; evento nuevo en F8. Cuestionario en `docs/diagnostico-madurez.md` |

Al publicar la ola 2: activar los enlaces del menú Servicios, del índice `/servicios`, del footer y de la sección `#relacionados` de cada servicio; agregar las URLs a `sitemap.xml`.

### Fase 2 · sin fecha

| Página | URL | Nota |
|---|---|---|
| Negocios locales | `/negocios-locales` | Keyword "página web para negocio" (L01). Fuera del menú corporativo, solo en el footer. Revisar antes cómo clasifica el filtro de calidad a un negocio local |
| Nosotros | `/nosotros` | Solo con fotos reales del equipo y datos verificables. Mientras tanto, la sección `#nosotros` de la home cubre el "por qué" |
| Casos de estudio | `/casos` y `/casos/{slug}` | Solo con permiso escrito del cliente. Reactiva el evento `rl_case_study_view` |
| Blog | `/blog` | Temas informativos de `mapa-urls.md` sección 2, cada uno enlazado a su página dueña. Requiere MDX en Astro |
| Landings por segmento o campaña | `/lp/{slug}` | Sin navegación principal; `noindex` o canonical a la página de servicio si duplican |

## 2. Navegación

### Header (todas las páginas salvo `/gracias` y landings de campaña)

Componente: Navegación (DESIGN.md sección 7).

| Posición | Ola 1 | Ola 2 |
|---|---|---|
| Izquierda | Logo a color, enlace a `/` | Igual |
| Menú 1 | Servicios (abre panel por pilar) | Igual |
| Menú 2 | Cómo trabajamos (`/#proceso`) | Igual |
| Menú 3 | Nosotros (`/#nosotros`) | Igual |
| Menú 4 | | Diagnóstico (`/diagnostico`) |
| Derecha | Botón secundario WhatsApp · botón primario "Agenda tu diagnóstico" | Igual |

Total: 3 elementos en ola 1 y 4 en ola 2, más el CTA (límite: 5 más CTA).

Móvil: logo, botón primario compacto "Agendar" y menú de pantalla completa con Servicios como acordeón por pilar, los demás enlaces y los botones de diagnóstico y WhatsApp abajo.

### Panel del menú Servicios (por pilar)

Solo se enlazan páginas publicadas. Cada columna termina con "Ver todos los servicios" hacia `/servicios`.

| Pilar | Ola 1 | Se suma en ola 2 |
|---|---|---|
| Atraer | Google Ads | Meta Ads, SEO |
| Convertir | Sitio web corporativo, CRM | Landing pages, Tienda en línea |
| Medir | Columna oculta; en su lugar, enlace "Medición y tableros" a `/servicios#medir` | Medición y tableros |
| Automatizar | Automatización | Software a la medida |

### Footer (todas las páginas)

Componente: Footer (DESIGN.md sección 7). Contenedor oscuro redondeado, logo blanco.

| Grupo | Contenido |
|---|---|
| Marca | Logo blanco · "Elevamos tu marca. Aterrizamos tus ventas." · una línea: "Campañas, CRM, automatización y medición para empresas B2B en México." |
| Atraer · Convertir · Medir · Automatizar | Mismas páginas que el panel de Servicios, según la ola. Medir aparece desde la ola 2 |
| Empresa | Servicios (`/servicios`), Cómo trabajamos (`/#proceso`), Nosotros (`/#nosotros`), Diagnóstico de madurez (ola 2, `/diagnostico`), Negocios locales (fase 2) |
| Contacto | WhatsApp +52 55 4821 3439 · teléfono +52 55 5878 8983 [VERIFICAR que siga vigente] · contacto@riselanding.com · Agenda tu diagnóstico |
| Legal | Aviso de privacidad · © 2026 Riselanding |

### Barra CTA fija en móvil

En home, `/servicios` y cada servicio (páginas de más de 3 pantallas): aparece después del hero con "Agenda tu diagnóstico" y WhatsApp. Se oculta cuando `#contacto` está en pantalla para no tapar el formulario.

## 3. Enlazado interno

- Home: el índice `#servicios` enlaza cada servicio publicado con su nombre corto; los de ola 2 se describen en `/servicios` hasta que existan.
- Cada servicio: breadcrumb (Inicio · Servicios · {Servicio}) y sección `#relacionados` con 2 o 3 enlaces del mismo cluster, con anclaje exacto a la keyword primaria de la página destino.
- Reglas de canibalización (de `mapa-urls.md` sección 4) que afectan al copy de F2:
  - CRM enlaza a automatización con el anclaje "automatización de ventas" y nunca usa esa frase en H1 o H2.
  - CRM menciona tableros y enlaza a medición (ola 2) con el anclaje "tableros de KPI".
  - Google Ads menciona landings en una sección corta y enlaza a `/servicios/landing-pages` (ola 2) con el anclaje "landing page para google ads".
  - "agencia sem" vive en Google Ads; Meta Ads no la usa en title ni H1.
  - Sitio web usa "empresa" y "corporativo", nunca "negocio".
  - Las páginas de servicio usan "leads" solo en el cuerpo, nunca en title ni H1 (la home es dueña de "generación de leads b2b").

## 4. Dónde vive el formulario

Decisión: el formulario de 2 pasos vive en una sección `#contacto` al final de la home, de `/servicios` y de cada página de servicio. Es la misma instancia de componente (mismos ids del contrato, camino A), con estas propiedades por página:

| Propiedad | Uso | Ejemplo en `/servicios/crm` |
|---|---|---|
| Título y bajada de la sección | Copy propio por página | "Cuéntanos cómo vendes hoy" |
| Servicio precargado | Marca la casilla del servicio con el texto literal de `SERVICIOS` | `Implementación de CRM` |
| Plantilla de página para tracking | `page.template` del bootstrap | `servicio_crm_v1` |

`form_location` se queda en `contacto` en todas las páginas: describe la posición dentro de la página y hoy está fijo en el núcleo de `rl-tracking.js` (líneas 95 y 164, que el contrato marca como no tocables). La página de origen se distingue por `page.template`, `page_location` y `service_line`. Si José prefiere un `form_location` distinto por página (`contacto_crm`, por ejemplo), es un cambio al núcleo con pruebas nuevas: anotado para F8 como alternativa, no recomendado.

En ola 2, `/diagnostico` también lleva `#contacto`, precargado con el resumen del cuestionario.

Páginas sin formulario: aviso de privacidad, gracias y 404. Su CTA lleva a `/#contacto`.

## 5. Decisión sobre `/gracias`

Recomendación: **conservarla y redirigir a ella tras un envío exitoso**, con el WhatsApp real.

- Flujo: respuesta 200 de `/api/lead` para un solicitante comercial, `push` de `rl_lead_submit` con el veredicto, espera al `eventCallback` de GTM (tope de 2 s) y redirección a `/gracias`. Sin datos personales en la URL.
- Solicitante no comercial (`empleo`, `proveedor`, `personal`): mensaje inline como hoy, sin redirección.
- Las conversiones de Google Ads, Meta y GA4 siguen colgadas de `rl_lead_submit`, nunca de la vista de `/gracias`: los bots reciben un 200 idéntico al real ("fake success") y contarían como conversión.
- Para qué sirve: confirmar el envío en una página propia (se puede medir la vista como apoyo, se puede compartir con el equipo), fijar el tiempo de respuesta y ofrecer el siguiente paso.
- Contenido: eyebrow "Solicitud recibida" · H1 "Recibimos tu solicitud." · texto "Te escribimos en [VERIFICAR: tiempo de respuesta comprometido] al correo o teléfono que nos dejaste. Si prefieres adelantar la conversación, escríbenos por WhatsApp." · botón secundario "Escríbenos por WhatsApp" (`https://wa.me/525548213439`, con el token `[RL-xxxxxxxx]` que agrega `rl-tracking.js`) · enlace de acción "Conoce cómo trabajamos" (`/#proceso`). Sin header de navegación completa, con footer.
- Requisitos: bootstrap y GTM en `/gracias` (hueco del contrato, sección 7), `noindex, nofollow`, fuera de `sitemap.xml`.
- Si José prefiere no redirigir: se elimina `gracias.html` y se responde 410 o 301 a `/`. En ese caso el éxito sigue inline.

## 6. Página 404

Componentes: Navegación, Tarjeta, Chip de servicio, Footer.
H1 "No encontramos esta página." · texto "Puede que el enlace haya cambiado. Estos son los lugares más visitados del sitio." · chips de los servicios publicados · botón primario "Agenda tu diagnóstico" (`/#contacto`) · enlace de acción "Ir al inicio".

## 7. Cambios para F4 y F8 que salen de esta arquitectura

| # | Cambio | Dónde | Fase |
|---|---|---|---|
| 1 | La CTA final del prototipo usaba `#diagnostico`; pasa a `#contacto` y se fusiona con el formulario. Los enlaces existentes a `/#contacto` siguen funcionando | Home y todas las plantillas | F4 |
| 2 | `#servicios` (dispara `rl_service_view` a los 20 s) existe solo en la home y en `/servicios`. En páginas de servicio, remapear `rl_service_view` para observar `#enfoque` y mandar el `service_line` de la página en lugar de `paquete_integral` (línea 297, fuera del núcleo) | `js/rl-tracking.js` | F8 |
| 3 | `#resultados` no existe en el rediseño (no hay resultados verificables y las cifras se retiraron). `rl_case_study_view` queda sin activador en ola 1; se documenta en `rl-taxonomy.json` y se reactiva con casos reales | `js/rl-tracking.js`, taxonomía | F8 |
| 4 | Valores de bootstrap por página (`page.template`, `service_line`) en lugar de `lp_home_v1` y `paquete_integral` fijos; subir versión de taxonomía | `<script id="rl-bootstrap">` de cada página | F8 |
| 5 | Servicio precargado por página: atributo `data-servicio` en `#lead-form` que el JS lee para marcar la casilla (`.chk.on`). Agregar prueba | `/js/rl-form.js` | F4 y F8 |
| 6 | Mapa de servicio precargado: google-ads y meta-ads = `Publicidad Digital`; seo = `SEO y Posicionamiento`; sitio-web y landing-pages = `Reediseño / Desarrollo página web`; crm = `Implementación de CRM`; automatizacion = `Automatización de procesos`; medicion = `Dashboards y reportes`. Tienda en línea y software a la medida no tienen valor en `SERVICIOS` y el esquema no se toca en el rediseño: sin precarga hasta que José decida | `lib/lead-quality/schema.js` (solo lectura) | Decisión |
| 7 | Redirección a `/gracias` tras éxito comercial, con conversiones en `rl_lead_submit` | `/js/rl-form.js`, `gracias` | F4 y F8 |
| 8 | `.svc-tab` se conserva en las pestañas del hero de la home; los botones de FAQ de todas las páginas llevan la clase `.faq-q` para contar como interacción | Componentes | F4 |
| 9 | JSON-LD por plantilla: home con `Organization` y `FAQPage`; servicios con `Service`, `FAQPage` y `BreadcrumbList`. Las preguntas del JSON-LD son las mismas que se ven en la página | Plantillas | F7b |
| 10 | Diagnóstico de madurez (ola 2): evento nuevo y precarga del formulario en la misma página (detalle en `docs/diagnostico-madurez.md`) | `rl-tracking.js`, taxonomía | F8 |

## 8. Redirecciones

| URL vieja | Destino | Código | Nota |
|---|---|---|---|
| `/Form`, `/Form/`, `/Form/(.*)` | `/` | 301 | Embed de Zoho dado de baja; se elimina la carpeta `Form/` |
| `/index-legacy`, `/index-legacy.html` | `/` | 301 | Se elimina `index-legacy.html` |
| `/`, `/aviso-de-privacidad`, `/gracias` | Sin cambio | | Mismas URLs |
| `/#contacto` | Sin cambio | | La home conserva el ancla `#contacto` |

Se implementan en `vercel.json` (`redirects`), conservando `cleanUrls: true` y `trailingSlash: false`.

## 9. Páginas sin keyword y por qué

- `/servicios`: hub de navegación; su title genérico evita competir con la home.
- `/aviso-de-privacidad`, `/gracias`, 404: sin objetivo SEO.
- `/diagnostico` (ola 2): la herramienta no tiene keyword en el CSV; validar una candidata con Keyword Planner.
