# Brief · Riselanding · Rediseño de riselanding.com

Versión: v1.0 · Fecha: 2026-10-20 · Responsable Riselanding: José (medición y SEO) y Rut (implementación)
Estado del gate F0: aprobado por José Luis Vázquez el 2026-10-20.

Proyecto interno: Riselanding es el cliente. No aplican propuesta PDF, precio ni solicitud de accesos (pasos 0.4 a 0.8 de F0).

## 1. Cliente

| Campo | Valor |
|---|---|
| Nombre comercial | Riselanding |
| Vertical | Servicios profesionales B2B (agencia de marketing digital, CRM y automatización) |
| Mercado y cobertura geográfica | México, con clientes en CDMX, Monterrey, Guadalajara, Querétaro, Mérida y Latinoamérica según el sitio actual [VERIFICAR] |
| Contacto decisor | José Luis Vázquez y Rut Mariñelarena (socios) |
| Sitio actual | https://riselanding.com (Vercel, repo `joluigi/riselanding-landing`) |
| Origen del proyecto | Solicitud de José del 2026-10-20 en Claude Code |

## 2. BANT

| Presupuesto | Autoridad | Necesidad | Tiempo |
|---|---|---|---|
| Interno (horas del equipo) | José y Rut | Rediseño completo conservando formulario y tracking | Lanzamiento objetivo: 2026-10-27 |

## 3. Objetivo de negocio y conversión

- Objetivo de negocio: generar solicitudes de diagnóstico de empresas B2B en México con presupuesto para marketing y automatización.
- Conversión primaria (una sola): solicitud de diagnóstico digital gratuito por el formulario de 2 pasos. Evento: `rl_lead_submit` con `lead_quality_flag` del servidor.
- Conversiones secundarias: clic en WhatsApp (`rl_whatsapp_click`, hoy sin número real en el sitio), clic en teléfono (`rl_phone_click`), interacción con el componente interactivo (evento nuevo en F8).
- KPI principal y línea base: leads calificados por mes (`lead_tier` alto o medio). Línea base: sin línea base. El filtro de calidad corre en modo shadow desde el 2026-10-08; José puede extraer las primeras 2 semanas de GA4 o de Notion CRM.
- Meta a 90 días: 50 leads calificados.

## 4. Audiencia

| Segmento | Rol de quien decide | Dolor principal | Objeción principal | Qué necesita ver para avanzar |
|---|---|---|---|---|
| PyME y empresa mediana B2B (11 a 200 empleados) | Director general, dueño o director comercial | Leads irregulares, operación comercial manual, varios proveedores sin datos unificados [VERIFICAR con notas de llamadas] | Ya pagó agencias sin resultados medibles | Proceso claro, medición transparente, salida sin candados |
| Emprendimiento con tracción | Fundador | [sin dato] | Precio | Escalones de entrada |

El sitio actual habla a `general_b2b_mx`. Si hay más de un público con mensajes distintos, se resuelve con landings por segmento en fase 2.

## 5. Oferta y pruebas

| Servicio | Pilar | Prueba verificable | Fuente |
|---|---|---|---|
| SEM (Google, Meta, TikTok Ads) | Atraer | [VERIFICAR] | |
| SEO | Atraer | [VERIFICAR] | |
| Sitio web y landing pages | Convertir | Sitios entregados a clientes [VERIFICAR permiso de mostrarlos] | |
| CRM | Convertir | [VERIFICAR] | |
| Automatización (n8n) | Convertir | Filtro de calidad de leads de este mismo sitio (demostrable) | Repo |
| Dashboards | Medir | [VERIFICAR] | |

Cifras del sitio actual sin fuente, retiradas por decisión de José del 2026-10-20:

- "-30% CPL", "8+ procesos", "45+ leads" presentados como "métricas promedio de nuestros clientes" (`index.html:1251-1258`).
- "3 cupos disponibles este mes" e "Inversión < 3% de tu revenue".

Se conservan porque son honestos: el caso de manufactura etiquetado como "Ejemplo ilustrativo" y los nombres ficticios dentro de la ilustración del dashboard. Por el principio de transparencia radical, no se inventan testimonios, métricas ni casos.

## 6. Alcance

| Fase 1 · MVP | Fase 2 · Mejoras |
|---|---|
| Páginas: home, una página por servicio con keyword propia (lista final según F7a: SEM, SEO, Web, CRM, Automatización, Dashboards), `/aviso-de-privacidad`, `/gracias` (si se adopta la redirección tras el éxito), 404 | Blog MDX, landings por segmento o industria |
| Componente interactivo: diagnóstico de madurez digital (ola 2, del 28-oct al 3-nov) | Casos de estudio reales con permiso del cliente |
| Integraciones: formulario y API actuales sin cambios (contrato en `docs/contrato-integraciones.md`), GTM-P3WZC7MV, n8n hacia Notion CRM, Turnstile | Enhanced Conversions, Meta CAPI, banner de cookies con CMP |
| Idiomas: español (es-MX) | Inglés si hay demanda |

Fuera de alcance explícito: cambios al backend de leads, al contrato con n8n o al motor de calidad; paso de `LEAD_GATE_MODE` a `enforce` (decisión aparte, después de 2 a 4 semanas de shadow).

## 7. Referencias y competencia

Se completa en F1 con 3 a 5 referencias (2 del vertical, 2 fuera del vertical, 1 comodín). Pendiente: competidores que José considera directos.

## 8. Marca y contenido disponible

- Manual de marca: sí. `Riselanding/Riselanding_Manual_de_Marca_v1.pdf`, `docs_empresa/Riselanding_Manual_de_Marca_v1.1.pdf` y `Manual_de_Marca_Addendum_v1.2.md` (slogan oficial "Elevamos tu marca. Aterrizamos tus ventas.", hoy ausente del sitio; prohíbe el guion largo).
- Tokens de marca: `Riselanding/DESIGN.md`. Carbón `#2D3748`, Naranja Fuego `#FF5A1F`, Gris `#9CA3AF`; Montserrat en títulos y CTA, Inter en cuerpo; fondo claro y header carbón.
- Divergencia a resolver (se explora en F1 con dos variantes): el sitio actual usa modo oscuro, Bricolage Grotesque, Geist y JetBrains Mono, y acentos verde y amarillo. No coincide con DESIGN.md.
- Logo vectorial: sí (`Assets/RISELANDING_isotipo.svg`, `RISELANDING_Isoltipo_white.svg`, carpeta "Rise Landing Logo final (1)" sin versionar).
- Tipografías con licencia web: Montserrat e Inter (Google Fonts, licencia OFL).
- Fotos reales disponibles: [sin dato] (equipo, socios, oficina).
- Testimonios con permiso de publicación: no hay.
- Contenido reutilizable: servicios en 6 pestañas, proceso, FAQ de 6 preguntas, comparativa, industrias. Pasa por F6 (copy humano) antes de reutilizarse.
- Catálogos: `Riselanding_Catalogo_business_2026.pdf` y `Riselanding_Catalogo_Enterprise_2026.pdf`.

## 9. Técnico

| Campo | Valor |
|---|---|
| Registrador del dominio y titular | [sin dato] |
| Hosting | Vercel, cuenta de Riselanding. `cleanUrls`, sin `trailingSlash` |
| Stack actual | HTML estático de 2,114 líneas con CSS y JS inline (unos 166 KB), funciones de Vercel en `api/`, Node 2 dependencias |
| Stack elegido | Astro estático con `api/` intacto |
| CRM de destino de leads | Notion CRM, vía webhook de n8n |
| Automatización | n8n en Railway (instancia 417ba en producción; 15d6 es la nueva) |
| WhatsApp Business | +52 55 4821 3439 (`wa.me/525548213439`) |
| GA4 / GTM existentes | GTM-P3WZC7MV · GA4 G-Z5JP6J6NRS · Google Ads y Meta Pixel con placeholders |
| Search Console / Google Business Profile | [sin dato] |
| URLs actuales | `/`, `/aviso-de-privacidad`, `/gracias` (noindex), más `/Form/` e `/index-legacy` por dar de baja. Mismas URLs en el rediseño: no se requieren redirecciones salvo para las dos que se eliminan |

Auditoría rápida del sitio actual (encuadre de oportunidad):

| Área | Hallazgo | Impacto |
|---|---|---|
| Experiencia en celular | Inputs a 14.5 px provocan zoom automático en iOS | Fricción en el formulario |
| Base técnica por afinar | Todo el CSS y JS inline en un solo archivo | Cada cambio de copy toca el archivo que contiene el formulario |
| SEO por completar | Sin JSON-LD `FAQPage` pese a tener FAQ visible; `og:image:alt` no coincidía con el title (corregido en `fix/sin-guion-largo`) | Visibilidad en resultados enriquecidos y motores generativos |
| Conversión por ampliar | Teléfono y correo solo en el footer; sin WhatsApp en la home; `/gracias` con WhatsApp de relleno y sin uso | Se pierden contactos de baja fricción |
| Medición por activar | Sin `page_view` de GA4; Ads y Pixel sin IDs reales; sin banner de consentimiento | Campañas sin optimización por conversión |
| Confianza por respaldar | Cifras de resultados sin fuente | Riesgo frente a la LFPC y al principio de transparencia |
| Copy | 15 guiones largos (corregidos en la rama `fix/sin-guion-largo`) y construcciones contrastivas ("no seis proveedores", "en semanas, no meses") | Señal de texto generado |

## 10. Legal y cumplimiento

- Datos personales que recaba el sitio: nombre, email, teléfono, empresa, sitio web, tamaño, presupuesto, necesidad; IP y user agent en el servidor.
- Aviso de privacidad vigente: sí, `/aviso-de-privacidad`, en vigor desde el 2026-10-07. Se actualiza antes de pasar a `enforce`.
- Restricciones regulatorias: LFPDPPP y LFPC (publicidad comprobable).
- Política de cookies deseada: [pregunta para José]. Hoy hay Consent Mode v2 con default por geo, sin banner.

## 11. Fechas y aprobaciones

| Hito | Fecha objetivo | Aprueba |
|---|---|---|
| Brief (gate F0) | 2026-10-20 (aprobado) | José |
| DESIGN.md (gate F1) | | José y Rut |
| Sitemap y wireframes (gate F2) | | José y Rut |
| Copy final (gate F6) | | José |
| Go-live (gate F10) | 2026-10-27 | José y Rut |

## 12. Accesos

Proyecto interno: el equipo ya tiene acceso a Vercel, GitHub, GTM, GA4, n8n y Notion. Pendiente confirmar Search Console y Google Business Profile.

## 13. Decisiones de José (2026-10-20)

| Tema | Decisión |
|---|---|
| Dirección visual | Explorar ambas en F1: una variante con la marca de DESIGN.md (clara) y otra que evoluciona el estilo oscuro actual. Se decide con las dos variantes de hero enfrente |
| Alcance MVP | Multipágina desde el inicio: home más una página por servicio con keyword propia. F7a (investigación de keywords) pasa a ser crítica antes de F2 |
| Stack | Astro estático con `api/` de Vercel intacto |
| Cifras sin fuente | Se retiran: "-30% CPL", "8+ procesos", "45+ leads", "3 cupos", "< 3% de revenue" |

## 14. Respuestas de José (2026-10-20)

1. WhatsApp: +52 55 4821 3439, visible como conversión secundaria.
2. Componente interactivo: diagnóstico de madurez digital (8 a 10 preguntas, puntaje por pilar Atraer, Convertir, Medir y Automatizar, siguientes pasos y precarga del formulario). Claude redacta preguntas y ponderación; José las aprueba por escrito antes de F4.
3. Lanzamiento escalonado. 2026-10-27: home, páginas de servicio de las campañas activas, legales y formulario. 2026-10-28 a 2026-11-03: resto de servicios y diagnóstico de madurez. Meta: 50 leads calificados a 90 días.
4. Keywords: `docs/seo/keywords-google-ads-editor.csv` (estructura de campañas de Google Ads Editor con 12 grupos corporativos y 1 local). No trae volumen ni dificultad: la priorización por volumen queda pendiente de un export de Keyword Planner con métricas.
