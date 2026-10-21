# Mapa keyword→URL · Rediseño de riselanding.com (F7a)

Versión: v0.1 provisional · Fecha: 2026-10-20 · Responsable: José (SEO y medición)
Insumos: `docs/brief.md` v0.2, `docs/seo/keywords-google-ads-editor.csv` (85 keywords únicas en 13 grupos), análisis de SERP con búsqueda web.
Estado: provisional hasta tener el export de Keyword Planner y validar la SERP real de google.com.mx (ver "Limitaciones").

## 1. Resumen de decisiones

| Decisión | Resultado |
|---|---|
| Páginas indexables del MVP (27-oct) | Home + `/servicios` (índice) + 8 páginas de servicio |
| Google Ads y Meta Ads | Dos páginas: `/servicios/google-ads` y `/servicios/meta-ads` |
| Sitio web, landing y tienda | Sitio web y landing pages en dos páginas MVP; tienda en línea a fase 2 |
| G10 Software a la medida | No existe en el sitio actual ni en el brief. Sin página en el MVP y grupo pausado en Ads hasta que José confirme si es oferta |
| L01 Local | Segmento distinto. Página propia `/negocios-locales` en fase 2, fuera de la navegación corporativa |
| Home | Cluster de marca (G01) + generación de leads B2B (G04) |
| Volumen | Sin volumen en todas las keywords: el CSV es de Google Ads Editor y no trae métricas |

### Por qué dos páginas para Google Ads y Meta Ads

1. Las SERP no se parecen: "agencia de google ads" devuelve consultores independientes de búsqueda pagada y directorios PPC; "agencia de facebook ads" devuelve directorios de paid social (The Manifest, listados de Semrush de facebook-advertising) y artículos tipo lista de agencias de Meta. Con la heurística del método (3 resultados compartidos en el top 10 para ir a la misma URL), no hay base para fusionarlas.
2. Concordancia de mensaje: el grupo G03 con un anuncio "agencia de Meta Ads" que aterriza en una página con H1 de Google Ads baja la relevancia de la página de destino y el nivel de calidad.
3. Comprador y argumento distintos: búsqueda (intención activa, keywords, Performance Max) frente a paid social (audiencias, creativos, Pixel y API de conversiones).

TikTok Ads no tiene keywords en el CSV: se menciona como sección dentro de `/servicios/meta-ads` (paid social), sin keyword propia.

### Por qué sitio web y landing pages separados, y tienda a fase 2

- Sitio web corporativo (G05): SERP de agencias de desarrollo web, directorios (Semrush web development) y marketplaces de cotización (Cronoshare). Intención: proyecto de sitio completo para la empresa.
- Landing pages (G06): SERP de herramientas (Landingi), freelancers (Fiverr) y rankings de agencias de diseño web. Intención: página de conversión para campañas, comprada por quien opera Ads. Es además el producto que da nombre a la marca y la pieza que une G02, G03 y G06 en Ads.
- Tienda en línea (G07): SERP dominada por plataformas y sus directorios de partners (Shopify, Tiendanube, GoDaddy). Viabilidad baja para una página de servicio y no hay oferta de ecommerce en el sitio actual ni en el brief (solo aparece "Retail y E-commerce" como industria). Fase 2, condicionada a que José confirme la oferta.

## 2. Mapa keyword→URL

Prioridad = valor de negocio (1 a 3) × intención (transaccional 3, comercial 2) × viabilidad de SERP (1 a 3). Es un criterio interno del método, no una métrica de mercado.

| URL | Cluster | Keyword primaria | Secundarias (máx. 4) | Intención | Tipo de página que posiciona | Competidores representativos | Ángulo propuesto | Prioridad | Fase |
|---|---|---|---|---|---|---|---|---|---|
| `/` | G01 Marca + G04 Leads B2B | generación de leads b2b | riselanding, rise landing, agencia de marketing b2b, agencia de generación de leads | Navegacional (marca) y transaccional | Directorios de agencias (Semrush lead generation), páginas de servicio de proveedores de citas B2B y homes de agencias B2B; probable presencia de artículos "qué es" | Callbox (citas calificadas por llamada y correo), Cliento MX y Aloha! en el directorio de Semrush (inbound, ABM), Crea Industria (B2B industrial, Monterrey) | Un solo equipo que atrae, convierte y mide para empresas B2B; diagnóstico digital gratuito como siguiente paso; medición transparente y salida sin candados (necesidades del brief) | 27 (3×3×3) | MVP |
| `/servicios` | Índice | Sin keyword primaria (hub de navegación) | | Navegacional | No aplica | No aplica | Índice de los servicios por pilar (Atraer, Convertir, Medir) con enlaces de texto exacto a cada página | No aplica | MVP |
| `/servicios/google-ads` | G02 | agencia de google ads | administración de google ads, gestión de campañas de google ads, consultor de google ads, agencia sem | Transaccional | Consultores independientes, directorios PPC (Semrush, GoodFirms) y ofertas de empleo | consultorgoogleads.mx (consultor, auditoría gratuita, trato directo con el dueño), directorio PPC de Semrush México, GoodFirms (consultor con auditoría en 48 h) | Google Ads para empresas B2B medido hasta el lead calificado, con landing dedicada por campaña y optimización semanal (copy actual); cuenta publicitaria a nombre del cliente [VERIFICAR con José] | 18 (3×3×2) | MVP |
| `/servicios/meta-ads` | G03 | agencia de facebook ads | agencia de meta ads, agencia de publicidad en facebook, agencia de publicidad en instagram, campañas de facebook e instagram para empresas | Transaccional | Directorios de paid social y artículos tipo lista de agencias | The Manifest (Top Facebook Marketing Companies in Mexico), Webtonic (lista de agencias de Meta Ads en CDMX 2026, se pone primero a sí mismo), directorio facebook-advertising de Semrush | Facebook, Instagram y TikTok para generar prospectos B2B, reportado en contactos y leads calificados, no en interacciones; Pixel y API de conversiones como servicio al cliente [VERIFICAR alcance] | 18 (3×3×2) | MVP |
| `/servicios/seo` | G12 | agencia seo | posicionamiento seo para empresas, consultor seo, seo para empresas b2b, auditoría seo | Transaccional | Homes de agencias SEO especializadas, directorios (Semrush, Ahrefs agencies) y artículos de "mejores agencias SEO" | SEO Secreto (trayectoria y SEO para buscadores con IA), OCTOPUS (SEO, web y pago; citada en Puro Marketing), PrimeWeb Querétaro (consultoría, keywords, contenido, link building) | SEO técnico y de contenido para empresas B2B, más visibilidad en motores de IA (GEO), conectado a la medición de leads; usar el propio sitio como caso demostrable cuando haya datos de Search Console | 6 (2×3×1) | MVP |
| `/servicios/sitio-web` | G05 | desarrollo de sitio web corporativo | página web corporativa, desarrollo web para empresas, página web para empresa, rediseño de página web | Transaccional | Directorios de desarrollo web, marketplaces de cotización y portafolios de estudios | Directorio web development de Semrush, Cronoshare (cotizaciones de diseño web corporativo), Laboratorio Digital (Behance, WordPress y WooCommerce) | Sitio corporativo rápido y medible, con CRM y tracking desde el día 1 (copy actual); proceso y entregables claros; portafolio solo con permiso del cliente [VERIFICAR] | 12 (2×3×2) | MVP |
| `/servicios/landing-pages` | G06 | diseño de landing page | landing page para campañas, landing page para google ads, desarrollo de landing page, agencia de landing pages | Transaccional | Herramientas de landing pages, freelancers en marketplaces y rankings de agencias de diseño web | Landingi (herramienta), Fiverr (freelancers con entrega en un día), Psicología y Mente (ranking de agencias de diseño web en México) | Landing por campaña conectada a Ads, con formulario de 2 pasos y filtro de calidad de leads (prueba demostrable: el filtro de este mismo sitio); diferencia frente a la plantilla barata: medición y calidad del lead | 18 (3×3×2) | MVP |
| `/servicios/crm` | G08 | implementación de crm | consultoría crm, implementación de hubspot, implementación de zoho crm, consultor zoho crm | Transaccional | Consultoras partner por plataforma (Salesforce, Dynamics, HubSpot, Zoho) y marketplaces de partners | Lynx9 (partner Salesforce), Clickplan (partner HubSpot con sede en México), Innobyte (partner Zoho en Jalisco, extensiones CFDI) | Implementación de Zoho CRM o HubSpot con pipeline a la medida del proceso comercial, adopción del equipo de ventas e integración con formularios y automatización; estatus de partner solo si está vigente [VERIFICAR] | 27 (3×3×3) | MVP |
| `/servicios/automatizacion` | G09 | automatización de procesos para empresas | automatización comercial, automatización de ventas, automatización con n8n, consultoría en automatización | Transaccional (la cabeza "automatización de procesos" es mixta, con mucho contenido informativo) | Artículos informativos, noticias y estudios en la cabeza; proveedores de n8n en la cola | Softland (artículo "qué es automatización de procesos"), IDConline (señales para automatizar), Duotach (automatización con n8n para México y LATAM) | Automatización comercial con n8n e IA: captura, calificación y ruteo de leads hacia el CRM; prueba demostrable: el filtro de calidad de leads de este sitio | 18 (3×3×2) | MVP |
| `/servicios/medicion` | G11 | implementación de google analytics 4 | configuración de ga4, implementación de google tag manager, medición de conversiones, consultor de google analytics | Transaccional (con SERP muy informativa) | Guías técnicas, freelancers en marketplaces y notas sobre consultores certificados | Guía de la UNAM (consideraciones mínimas de GA4), Upwork (consultores de Google Analytics en México), Informabtl (consultor autorizado, nota de la era de Universal Analytics) | GA4, GTM y medición de conversiones hasta el lead calificado, con dashboards de KPI para dirección (pilar Medir, hoy "Dashboards") | 12 (2×3×2) | MVP |
| `/servicios/tienda-en-linea` | G07 | desarrollo de tienda en línea | diseño de tienda en línea, desarrollo de ecommerce, agencia de ecommerce, cotizar tienda en línea | Transaccional | Plataformas (constructores) y directorios de partners | Directorio de partners de Shopify (The Web Factory, Guadalajara), especialistas de Tiendanube México, GoDaddy (constructor de tiendas) | Solo si José confirma la oferta: tienda B2B o B2C integrada a CRM y medición | 3 (1×3×1) | Fase 2 |
| `/servicios/software-a-la-medida` | G10 | desarrollo de software a la medida | desarrollo de software a medida, desarrollo de sistemas a la medida, sistema a la medida para empresas, desarrollo de aplicaciones web a la medida | Transaccional | Fábricas de software con páginas por ciudad y directorios de empresas | Fencode (páginas por ciudad: CDMX, Mérida, Mexicali), Intersoft (Chihuahua), directorios ensun y Cosmos | No existe en el sitio actual. Si se confirma, posicionarlo como desarrollo a la medida alrededor de CRM y automatización, no como fábrica de software general | 3 (1×3×1) | Fase 2 (condicionada) |
| `/negocios-locales` | L01 | página web para negocio | página web para mi negocio, seo local, posicionamiento en google maps, perfil de empresa en google | Comercial y transaccional, con fuerte componente informativo (precios) | Guías de precios de hosting y constructores, marketplaces de cotización; en SEO local y Maps, guías y directorios | GoDaddy (cuánto cuesta una página web en México), Neolo (precios 2026), Cronoshare (cotizar página web); en Maps: Seahawk y Ranktracker (guías) | Oferta Local separada de la corporativa: página web y perfil de Google para negocios con atención local, precio y entregables claros [oferta por definir] | 6 (2×3×1) | Fase 2 |

Páginas sin keyword: `/aviso-de-privacidad` (indexable, sin objetivo SEO), `/gracias` (noindex, fuera del sitemap), 404.

### Contenido informativo de fase 2 (blog o FAQ)

Se anota, no se construye en el MVP. Cada artículo enlaza a la página de servicio dueña del cluster.

| Tema | Página dueña |
|---|---|
| Qué es la generación de leads B2B y cómo medirla | `/` |
| Cuánto cuesta una página web en México (la SERP de L01 está dominada por estas guías) | `/negocios-locales` y `/servicios/sitio-web` |
| Qué es la automatización de procesos y por dónde empezar | `/servicios/automatizacion` |
| Checklist de implementación de GA4 y GTM | `/servicios/medicion` |
| Atribución de marketing y tablero de KPI para dirección | `/servicios/medicion` |
| HubSpot o Zoho CRM: cómo elegir | `/servicios/crm` |
| Auditoría SEO: qué revisar | `/servicios/seo` |

## 3. Concordancia con Google Ads

Las mismas URLs son las URLs finales de las campañas. Reglas para F2 y F6:

- El H1 de cada página repite la keyword primaria o su variante natural; el title y la description también. El texto del anuncio y el H1 deben decir lo mismo.
- Cada grupo de anuncios apunta a una sola URL. Sin anclas (`#`) como URL final.
- Las páginas de servicio llevan el mismo formulario de 2 pasos con `rl_lead_submit`; el servicio se precarga según la URL para que n8n lo registre en Notion CRM [VERIFICAR con el contrato de integraciones antes de tocar el formulario].

| Grupo de anuncios | URL final | Estado al lanzamiento |
|---|---|---|
| G01 Marca | `/` | Activo |
| G02 Gestión de Google Ads | `/servicios/google-ads` | Activo |
| G03 Meta Ads | `/servicios/meta-ads` | Activo |
| G04 Generación de leads B2B | `/` | Activo |
| G05 Sitio web corporativo | `/servicios/sitio-web` | Activo |
| G06 Landing pages | `/servicios/landing-pages` | Activo |
| G07 Tienda en línea | Sin página | Pausado hasta fase 2 |
| G08 CRM | `/servicios/crm` | Activo |
| G09 Automatización | `/servicios/automatizacion` | Activo |
| G10 Software a la medida | Sin página | Pausado; decisión de José sobre la oferta |
| G11 Medición | `/servicios/medicion` | Activo |
| G12 SEO | `/servicios/seo` | Activo |
| L01 Local (campaña aparte) | `/negocios-locales` | Pausado hasta fase 2. No dirigir tráfico local a páginas corporativas |

Nota sobre L01: el filtro de calidad de leads está calibrado para B2B. Antes de activar la campaña local, revisar cómo clasifica a un negocio local (probable `lead_tier` bajo por tamaño o presupuesto) para no contaminar la métrica de leads calificados.

## 4. Riesgos de canibalización

| # | Keywords en conflicto | Riesgo | Mitigación |
|---|---|---|---|
| 1 | "página web para empresa" (G05) y "página web para negocio" (L01) | Casi sinónimos; Google puede mostrar la misma SERP y las dos páginas competirían. Además mezclaría la oferta Local y la Corporativa | Corporativa se queda con "empresa" y "corporativo"; Local con "negocio", "mi negocio", Google Maps y perfil de Google. Sin enlaces cruzados en el cuerpo; Local fuera del menú corporativo (solo en el footer). Negativas cruzadas en Ads |
| 2 | "landing page para google ads" (G06) y "agencia de google ads" (G02) | La página de Google Ads habla de landings dedicadas y puede posicionar por la keyword de G06 | La landing de Google Ads menciona landings en una sección corta con enlace de texto exacto a `/servicios/landing-pages`. Negativa "landing" en G02 |
| 3 | "automatización de ventas" (G09) y la página de CRM | Las dos páginas hablan de automatizar el seguimiento comercial | La keyword vive en `/servicios/automatizacion`. CRM habla de pipeline, adopción e integración y enlaza a automatización con ese anclaje |
| 4 | "integración de sistemas" (G09) y G10 Software a la medida | La SERP de integración apunta a integradores de TI y ERP | Se usa como apoyo en automatización (integración entre CRM, formularios y herramientas). Si G10 entra en fase 2, se reasigna allí |
| 5 | "agencia de desarrollo web" (G05) y G10 | La SERP mezcla agencias web y fábricas de software | Queda en sitio web como apoyo; no se usa en G10 |
| 6 | "generación de leads b2b" (home) y todas las páginas de servicio | Todas hablan de leads; la home podría diluirse | Las páginas de servicio usan "leads" solo en el cuerpo, nunca en title ni H1. El artículo informativo de fase 2 enlaza a la home |
| 7 | "agencia sem" (G02) y `/servicios/meta-ads` | En México "SEM" se usa a veces para todo lo pagado | "agencia sem" se asigna a Google Ads (búsqueda pagada). Meta Ads no usa "SEM" en title ni H1 |
| 8 | "seo local" (L01) y "agencia seo" (G12) | Mismo término raíz; SERP distinta pero cercana | `/servicios/seo` se enfoca en empresas B2B y no menciona SEO local; negativa "local" y "maps" en G12 |
| 9 | "tablero de kpi para empresas" (G11) y "dashboards de KPIs" en la página de CRM (copy actual) | Dos páginas hablando de dashboards | Dashboards se quedan en `/servicios/medicion`; CRM los menciona con enlace a medición |
| 10 | Home y `/servicios` | El índice podría competir por términos genéricos de agencia | `/servicios` no tiene keyword primaria; title genérico de navegación y canonical propio |

Regla general: un canonical propio por URL, H1 y title únicos, enlaces internos con anclaje exacto hacia la página dueña, y ninguna keyword primaria repetida como H1 en dos URLs.

## 5. Keywords descartadas para SEO o reasignadas

| Keyword | Grupo | Decisión | Motivo |
|---|---|---|---|
| perfil de empresa en google | L01 | Descartada como objetivo SEO; mantener en Ads solo con puja baja y vigilancia | La SERP la dominan las propias páginas de Google; intención de autoservicio (crear el perfil uno mismo) |
| crm para equipos de ventas | G08 | Apoyo en `/servicios/crm`, no secundaria | Intención de comprar software (comparativas de CRM), no servicio de implementación |
| crm para empresas de servicios | G08 | Apoyo; candidata a artículo comercial de fase 2 | Mismo motivo |
| tablero de kpi para empresas | G11 | Fase 2 (artículo) | Intención informativa o de plantillas y software |
| atribución de marketing | G11 | Fase 2 (artículo) | Intención informativa |
| auditoría de google analytics | G11 | Apoyo en medición | Volumen y SERP sin validar; encaja como entregable, no como primaria |
| integración de sistemas | G09 | Apoyo en automatización | Término ambiguo (integradores de TI, ERP) |
| captación de clientes para empresas | G04 | Apoyo en la home | Amplio; mezcla telemarketing y outbound |
| generación de prospectos para empresas, leads calificados para empresas | G04 | Apoyo en la home | Variantes de la primaria |
| auditoría seo | G12 | Secundaria débil | La SERP suele incluir herramientas gratuitas de auditoría [validar en google.com.mx] |
| empresa de desarrollo de software | G10 | Descartada mientras G10 no sea oferta | Comprador de TI fuera del perfil del brief |
| tienda en línea para empresas, cotizar tienda en línea | G07 | Fase 2 | Ver G07 |

## 6. Keywords negativas sugeridas para Google Ads

Basadas en lo que apareció en las SERP (vacantes, marketplaces de freelancers, cursos, plataformas de autoservicio). Para revisar con José antes de cargarlas en Editor.

Nivel cuenta (ambas campañas):
- Empleo: empleo, empleos, vacante, vacantes, trabajo, sueldo, salario, bolsa de trabajo, indeed, practicas
- Formación: curso, cursos, certificación, certificado, tutorial, diplomado, aprender, gratis, pdf, plantilla, plantillas
- Informativas: qué es, que es, significado, definición, ejemplos
- Navegacionales de terceros: iniciar sesión, login, soporte, número de teléfono de google, descargar

Campaña corporativa (`rl-lead-corp_intent-202610`):
- negocio, mi negocio, local, google maps, maps, perfil de empresa (evita mezclar con L01)
- wix, tiendanube, shopify, godaddy, wordpress gratis (autoservicio) [VERIFICAR "wordpress": puede ser comprador válido]
- Mientras G07 y G10 estén pausados: tienda, ecommerce, software, sistema, aplicación móvil

Campaña local (`rl-lead-local_intent-202610`):
- corporativo, corporativa, b2b, crm, hubspot, zoho, automatización

Negativas cruzadas entre grupos (escultura de tráfico):
- G02: facebook, meta, instagram, tiktok, landing
- G03: google
- G05: landing, tienda, ecommerce, software
- G06: tienda, ecommerce
- G09: crm (para no competir con G08)
- G12: local, maps

## 7. Clasificación de todas las keywords

Concordancia: E = exacta, F = frase. Rol: P = primaria, S = secundaria, A = apoyo en el cuerpo, D = descartada o fase 2.

| Grupo | Keyword | Conc. | Intención | URL | Rol |
|---|---|---|---|---|---|
| G01 | riselanding | E, F | Navegacional | `/` | S |
| G01 | rise landing | E | Navegacional | `/` | S |
| G02 | agencia de google ads | E, F | Transaccional | `/servicios/google-ads` | P |
| G02 | administración de google ads | F | Transaccional | `/servicios/google-ads` | S |
| G02 | gestión de campañas de google ads | F | Transaccional | `/servicios/google-ads` | S |
| G02 | consultor de google ads | F | Transaccional | `/servicios/google-ads` | S |
| G02 | especialista en google ads | F | Transaccional (con riesgo de búsquedas de empleo) | `/servicios/google-ads` | A |
| G02 | campañas de google ads para empresas | F | Transaccional | `/servicios/google-ads` | A |
| G02 | agencia de publicidad en google | F | Transaccional | `/servicios/google-ads` | A |
| G02 | agencia sem | F | Transaccional | `/servicios/google-ads` | S |
| G03 | agencia de facebook ads | F | Transaccional | `/servicios/meta-ads` | P |
| G03 | agencia de meta ads | F | Transaccional | `/servicios/meta-ads` | S |
| G03 | agencia de publicidad en facebook | F | Transaccional | `/servicios/meta-ads` | S |
| G03 | agencia de publicidad en instagram | F | Transaccional | `/servicios/meta-ads` | S |
| G03 | publicidad en facebook para empresas | F | Comercial (mezcla guías de autoservicio) | `/servicios/meta-ads` | A |
| G03 | campañas de facebook e instagram para empresas | F | Transaccional | `/servicios/meta-ads` | S |
| G03 | administración de campañas de facebook | F | Transaccional | `/servicios/meta-ads` | A |
| G04 | generación de leads b2b | E, F | Transaccional y comercial (con componente informativo) | `/` | P |
| G04 | agencia de generación de leads | F | Transaccional | `/` | S |
| G04 | generación de prospectos para empresas | F | Transaccional | `/` | A |
| G04 | agencia de marketing b2b | F | Transaccional | `/` | S |
| G04 | captación de clientes para empresas | F | Comercial | `/` | A |
| G04 | leads calificados para empresas | F | Transaccional | `/` | A |
| G05 | desarrollo de sitio web corporativo | E | Transaccional | `/servicios/sitio-web` | P |
| G05 | sitio web corporativo | F | Comercial (mezcla ejemplos e inspiración) | `/servicios/sitio-web` | A |
| G05 | página web corporativa | F | Comercial | `/servicios/sitio-web` | S |
| G05 | desarrollo web para empresas | F | Transaccional | `/servicios/sitio-web` | S |
| G05 | agencia de desarrollo web | F | Transaccional | `/servicios/sitio-web` | A |
| G05 | rediseño de página web | F | Transaccional | `/servicios/sitio-web` | S |
| G05 | cotizar página web para empresa | F | Transaccional | `/servicios/sitio-web` | A |
| G05 | página web para empresa | F | Transaccional | `/servicios/sitio-web` | S |
| G06 | landing page para campañas | F | Transaccional | `/servicios/landing-pages` | S |
| G06 | landing page para google ads | F | Transaccional | `/servicios/landing-pages` | S |
| G06 | diseño de landing page | F | Transaccional | `/servicios/landing-pages` | P |
| G06 | desarrollo de landing page | F | Transaccional | `/servicios/landing-pages` | S |
| G06 | agencia de landing pages | F | Transaccional | `/servicios/landing-pages` | S |
| G06 | página de aterrizaje para empresas | F | Transaccional | `/servicios/landing-pages` | A |
| G07 | desarrollo de tienda en línea | F | Transaccional | `/servicios/tienda-en-linea` | D (fase 2) |
| G07 | diseño de tienda en línea | F | Transaccional | `/servicios/tienda-en-linea` | D (fase 2) |
| G07 | tienda en línea para empresas | F | Comercial | `/servicios/tienda-en-linea` | D (fase 2) |
| G07 | desarrollo de ecommerce | F | Transaccional | `/servicios/tienda-en-linea` | D (fase 2) |
| G07 | agencia de ecommerce | F | Transaccional | `/servicios/tienda-en-linea` | D (fase 2) |
| G07 | cotizar tienda en línea | F | Transaccional | `/servicios/tienda-en-linea` | D (fase 2) |
| G08 | implementación de crm | E, F | Transaccional | `/servicios/crm` | P |
| G08 | consultoría crm | F | Transaccional | `/servicios/crm` | S |
| G08 | consultor de crm | F | Transaccional | `/servicios/crm` | A |
| G08 | implementación de hubspot | F | Transaccional | `/servicios/crm` | S |
| G08 | implementación de zoho crm | F | Transaccional | `/servicios/crm` | S |
| G08 | consultor zoho crm | F | Transaccional | `/servicios/crm` | S |
| G08 | crm para equipos de ventas | F | Comercial (compra de software) | `/servicios/crm` | A |
| G08 | crm para empresas de servicios | F | Comercial (compra de software) | `/servicios/crm` | A |
| G09 | automatización de procesos | E | Mixta (informativa y transaccional) | `/servicios/automatizacion` | A (cabeza de Ads) |
| G09 | automatización de procesos para empresas | F | Transaccional | `/servicios/automatizacion` | P |
| G09 | automatización de procesos empresariales | F | Mixta | `/servicios/automatizacion` | A |
| G09 | automatización de ventas | F | Comercial | `/servicios/automatizacion` | S |
| G09 | automatización comercial | F | Comercial | `/servicios/automatizacion` | S |
| G09 | consultoría en automatización | F | Transaccional | `/servicios/automatizacion` | S |
| G09 | agencia de automatización | F | Transaccional | `/servicios/automatizacion` | A |
| G09 | integración de sistemas | F | Transaccional (ambigua) | `/servicios/automatizacion` | A |
| G09 | automatización con n8n | F | Transaccional y técnica | `/servicios/automatizacion` | S |
| G09 | automatización con inteligencia artificial para empresas | F | Transaccional | `/servicios/automatizacion` | A |
| G10 | desarrollo de software a la medida | E, F | Transaccional | `/servicios/software-a-la-medida` | D (fase 2, condicionada) |
| G10 | desarrollo de software a medida | F | Transaccional | `/servicios/software-a-la-medida` | D |
| G10 | empresa de desarrollo de software | F | Transaccional | Ninguna | D |
| G10 | desarrollo de sistemas a la medida | F | Transaccional | `/servicios/software-a-la-medida` | D |
| G10 | sistema a la medida para empresas | F | Transaccional | `/servicios/software-a-la-medida` | D |
| G10 | desarrollo de aplicaciones web a la medida | F | Transaccional | `/servicios/software-a-la-medida` | D |
| G11 | medición de conversiones | F | Mixta | `/servicios/medicion` | S |
| G11 | implementación de google analytics 4 | F | Transaccional | `/servicios/medicion` | P |
| G11 | configuración de ga4 | F | Mixta (muchos tutoriales) | `/servicios/medicion` | S |
| G11 | consultor de google analytics | F | Transaccional | `/servicios/medicion` | S |
| G11 | implementación de google tag manager | F | Transaccional | `/servicios/medicion` | S |
| G11 | auditoría de google analytics | F | Transaccional | `/servicios/medicion` | A |
| G11 | tablero de kpi para empresas | F | Informativa | `/servicios/medicion` | D (artículo fase 2) |
| G11 | atribución de marketing | F | Informativa | `/servicios/medicion` | D (artículo fase 2) |
| G12 | agencia seo | F | Transaccional | `/servicios/seo` | P |
| G12 | posicionamiento seo para empresas | F | Transaccional | `/servicios/seo` | S |
| G12 | consultor seo | F | Transaccional | `/servicios/seo` | S |
| G12 | auditoría seo | F | Mixta (herramientas gratuitas) | `/servicios/seo` | S |
| G12 | seo para empresas b2b | F | Transaccional | `/servicios/seo` | S |
| L01 | página web para negocio | F | Comercial | `/negocios-locales` | P (fase 2) |
| L01 | página web para mi negocio | F | Comercial | `/negocios-locales` | S (fase 2) |
| L01 | perfil de empresa en google | F | Navegacional o de autoservicio | `/negocios-locales` | D para SEO |
| L01 | seo local | F | Transaccional y comercial | `/negocios-locales` | S (fase 2) |
| L01 | posicionamiento en google maps | F | Transaccional | `/negocios-locales` | S (fase 2) |

## 8. Limitaciones y pendientes

1. Volumen: todas las keywords quedan "sin volumen". Falta el export de Keyword Planner con estas 85 keywords (pendiente de José desde `docs/estado.md`). Con volumen, recalcular prioridades y confirmar si `/servicios/medicion` y `/servicios/seo` justifican página propia frente a su costo de copy.
2. SERP: el análisis se hizo con la herramienta de búsqueda web disponible, que usa un índice orientado a Estados Unidos y devuelve resultados resumidos, no el top 10 posicionado de google.com.mx. Los tipos de página y competidores son representativos, no un ranking. La heurística de 3 resultados compartidos no se pudo calcular con rigor. Validar las 13 keywords cabeza en google.com.mx (incógnito, ubicación México) o con una herramienta SEO de pago antes del gate de F2.
3. Marca: la búsqueda "riselanding" no devolvió el sitio en ese índice (la confundió con otros términos). Prioridad en F7b: Search Console, sitemap con todas las URLs nuevas y Google Business Profile si aplica, para que la SERP de marca la ocupe riselanding.com.
4. Decisiones de José:
   - ¿Riselanding vende software a la medida (G10) y tienda en línea (G07)? Mientras no, ambos grupos pausados.
   - ¿Se activa la campaña Local antes de que exista `/negocios-locales`? Recomendación: no.
   - Confirmar compromisos marcados [VERIFICAR]: cuenta publicitaria a nombre del cliente, estatus de partner de HubSpot o Zoho, alcance de Pixel y API de conversiones como servicio, permiso para mostrar sitios entregados.
5. Revisión del mapa a 60 días del lanzamiento con datos de Search Console (consultas reales por URL).

## Fuentes consultadas (búsqueda web, 2026-10-20)

- G02: consultorgoogleads.mx (vía Trustpilot), agencies.semrush.com (advertising y PPC México), goodfirms.co/company/consultor-google-ads
- G03: themanifest.com/mx/social-media/facebook/agencies, webtonic.io/blog/best-meta-ads-fb-ig-agencies-mexico-city, agencies.semrush.com/list/facebook-advertising/mexico-city
- G04 y home: callboxinc.com/lead-generation-services-mexico-city, agencies.semrush.com (lead generation México), mexicoindustry.com (Crea Industria), revenuebase.ai (B2B y ABM México)
- G05: es.semrush.com/agencies/list/web-development/mexico, cronoshare.com.mx/servicios/diseno-web-corporativo, behance.net/labdigitalmx
- G06: landingi.com/es/landing-page/diseno, es.fiverr.com, psicologiaymente.com (rankings de agencias de diseño web en México)
- G07: shopify.com/partners/directory, tiendanube.com/mx/especialistas, xataka.com.mx (GoDaddy y MercadoPago)
- G08: g2.com/sellers/lynx9-soluciones-mexico, ecosystem.hubspot.com/marketplace/solutions/clickplan, zoho.com (Innobyte), comparasoftware.com/zoho-crm/partners
- G09: softland.com/mx, idconline.mx, duotach.com/servicios/automatizacion-n8n
- G10: fencode.dev/ubicaciones/cdmx, mx.linkedin.com/company/intersoftmx, ensun.io, cosmos.com.mx
- G11: visibilidadweb.unam.mx (GA4), upwork.com/hire/google-analytics-consultants/mx, informabtl.com
- G12: agencies.semrush.com (SEO México), puromarketing.com (mejores agencias SEO México), ahrefs.com/agencies/mexico
- L01: godaddy.com/resources/latam (cuánto cuesta una página web en México), neolo.com/blog, cronoshare.com.mx, seahawkmedia.com/es (Google Maps), ranktracker.com (SEO local en México)
