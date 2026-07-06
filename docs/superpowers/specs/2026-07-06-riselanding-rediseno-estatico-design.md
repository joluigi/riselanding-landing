# Diseño: Migración del rediseño de Riselanding a HTML estático (SEO intacto)

- **Fecha:** 2026-07-06
- **Estado:** Aprobado (diseño) — pendiente plan de implementación

## 1. Contexto y problema

Existen dos artefactos:

- **`index.html`** (sitio en vivo, 120 KB): HTML estático con SEO completo ya trabajado
  (GTM, meta, Open Graph, Twitter, canonical, hreflang, JSON-LD, favicons, preconnect).
  El formulario envía a **Zoho Forms** y es el flujo real de captación de leads.
- **`Riselanding (1).html`** (rediseño, 1.6 MB): un **prototipo React** empaquetado en formato
  bundler. Carga `react-dom.development.js` (1 MB) + Babel standalone (3 MB) en base64 y
  transpila JSX en el navegador. **Todo el contenido se renderiza client-side**, por lo que
  es invisible para los buscadores y la carga es pesadísima. Solo trae `<title>` + viewport
  como SEO.

El rediseño tiene 13 secciones bien estructuradas y un look nuevo (dark, fuentes Bricolage
Grotesque + JetBrains Mono, acento amarillo `#FFD23F`). El objetivo es **llevar ese diseño a
producción sin perder nada del SEO** del sitio en vivo.

## 2. Objetivo

Producir un **único `index.html` estático y autocontenido** (mismo modelo que el actual) que:

1. Replique visualmente el rediseño y sus 13 secciones como **HTML semántico** (contenido
   visible en el markup → 100% indexable).
2. Reimplemente toda la interactividad en **JS vanilla** (sin React ni Babel).
3. Conserve **íntegro** el SEO del `index.html` actual.
4. Conecte el formulario al **Zoho real** con redirección, no a la maqueta.

Reemplaza al `index.html` actual. Se guarda copia `index-legacy.html` (además del historial git).

## 3. Enfoque

HTML estático de un solo archivo, desplegado en Vercel igual que hoy (`vercel.json` sin
cambios). Se descarta montar un build React/Vite/Next: cambiaría el setup de archivos estáticos
y añade complejidad de mantenimiento innecesaria para una landing.

## 4. SEO a preservar (bloque intocable)

Se traslada **tal cual** desde el `index.html` actual:

| Elemento | Detalle |
|---|---|
| Google Tag Manager | `GTM-P3WZC7MV` — script en `<head>` + `<noscript>` iframe en `<body>` |
| Title + meta description | Los actuales (los que ya rankean); no se cambian |
| Meta básicos | `robots`, `author`, `theme-color`, `viewport` |
| Geo | `geo.region` MX, `geo.placename`, `geo.position`, `ICBM` |
| Open Graph | type, site_name, locale, title, description, url, image (1200×630), image:alt |
| Twitter Cards | summary_large_image, site `@riselanding`, title, description, image |
| Canonical + hreflang | canonical `/`, hreflang `es-MX` y `x-default` |
| Favicons | isotipo SVG, `favicon.ico`, `apple-touch-icon` |
| Rendimiento | `dns-prefetch` + `preconnect` (googletagmanager, fonts) |
| JSON-LD | `@graph`: `ProfessionalService` (#organization) + `WebPage` (#webpage) con breadcrumb |
| Archivos raíz | `robots.txt`, `sitemap.xml`, `vercel.json` — sin cambios |

**Decisión:** el title/description y el JSON-LD se mantienen idénticos a los actuales para no
arriesgar el ranking. El `<h1>` de la página será el del rediseño ("Generamos clientes y
automatizamos tu operación comercial") — que el H1 difiera del title tag es correcto y esperado.

## 5. Estructura / secciones (orden del rediseño)

1. **Nav** — marca + enlaces (Servicios, Proceso, Resultados, Industrias) + CTA "Diagnóstico gratis" + menú móvil (nuevo, responsive)
2. **Hero** — eyebrow, H1, subtítulo, 2 CTAs, meta, ilustración SVG, "phase strip" (Atracción → Conversión → Automatización → Crecimiento)
3. **Marquee** — ver §6 (contenido honesto)
4. **Problemas** (`#diagnostico`) — 4 tarjetas con ilustración
5. **Testimonio** — ver §6 (contenido honesto)
6. **Servicios** (`#servicios`) — tabs con 6 servicios (SEM, SEO, Web, CRM, Automatización, Dashboards)
7. **Proceso** (`#proceso`) — timeline de 4 pasos con barra de progreso
8. **Resultados** (`#resultados`) — 4 contadores animados + callout
9. **Comparativa** — tabla Agencia genérica vs Riselanding
10. **Industrias** (`#industrias`) — 6 tarjetas de sector
11. **FAQ** — 6 preguntas (acordeón)
12. **Formulario** (`#contacto`) — ver §7
13. **Footer** — marca, columnas de enlaces, contacto real, redes

Todas en HTML semántico con headings jerárquicos correctos. Fuentes vía Google Fonts `<link>`
(no base64). Ilustraciones SVG reconstruidas a partir de los componentes del prototipo.

## 6. Contenido honesto (decisión del usuario: nada falso en vivo)

- **Marquee de "clientes" inventados** (Aurelia Legal, Bracco Manufactura…) → se convierte en
  **sectores/industrias que se atienden** (etiquetas genéricas), sin nombres de empresa falsos.
- **Testimonio ficticio** ("Ricardo Granada · Granada Industrial · Monterrey") → se reemplaza por
  un bloque **ilustrativo sin atribución**: se conserva el diseño de la sección (frase +
  métricas) pero **sin nombre, cargo ni empresa inventados**, con un rótulo que lo enmarca como
  "ejemplo del tipo de resultado" hasta tener un caso real. Las métricas del bloque se marcan
  con comentario HTML para verificación.
- **Precio "$35,000 MXN/mes"** → en la FAQ, la respuesta describe el precio como **"a medida
  según el alcance"** sin cifra inventada (si el usuario confirma un rango real más tarde, se
  añade).
- **Contacto y redes** → los **reales** del sitio actual: `hola@riselanding.com`,
  `tel:+525512345678`, LinkedIn/Instagram/Facebook `/riselanding`.
- **Métricas** (−30% CPL, ×3 pipeline, 8+ procesos, 45+ leads, −42% CPL) → se conservan pero se
  **marcan con comentario HTML** para que el usuario las verifique antes de publicar.

## 7. Formulario → Zoho (mapeo de campos)

`action` = URL de Zoho actual, `method=POST`, `enctype=multipart/form-data`.

| Campo visible (rediseño) | `name` Zoho |
|---|---|
| Nombre | `Name_First` |
| Apellido | `Name_Last` |
| Empresa | `SingleLine` |
| Correo de trabajo | `Email` |
| WhatsApp / Teléfono | `PhoneNumber_countrycode` |
| Servicios (checkboxes) | se sincronizan por JS al `<select name="Checkbox" multiple>` oculto |

Valores de servicios en el select Zoho oculto: `Publicidad Digital`, `SEO y Posicionamiento`,
`Reediseño / Desarrollo página web`, `Implementación de CRM`, `Automatización de procesos`,
`Dashboards y reportes`.

Hidden a conservar: `zf_referrer_name`, `zf_redirect_url` (= `https://riselanding.com/?enviado=1`),
`zc_gad`, y los UTM (`utm_source/medium/campaign`) con su captura JS desde la query string.
Se elimina el estado "sent" ficticio de React.

## 8. Interactividad en JS vanilla

- Tabs de servicios (cambio de panel al click)
- Acordeón FAQ (abrir/cerrar)
- Contadores animados on-scroll (CountUp con `IntersectionObserver` + `requestAnimationFrame`)
- Reveal-on-scroll (`IntersectionObserver`, clase `.is-in`)
- Marquee (animación CSS pura)
- Luz ambiental que sigue el cursor (`mousemove` → CSS vars `--mx/--my`)
- Barra de progreso del timeline de Proceso (scroll)
- Menú móvil (nuevo)
- Sincronización checkboxes → select Zoho + captura UTM

## 9. Fuera de alcance (YAGNI)

- No se monta build/bundler ni framework.
- No se crean páginas nuevas (`gracias.html` se mantiene como está).
- No se rediseña ni reescribe copy más allá de lo indicado en §6.
- No se corrige/crea `og-image.png` (se conserva la referencia actual); solo se señala si falta.

## 10. Criterios de éxito

1. `index.html` abre y se ve igual que el prototipo (mismo layout, colores, tipografías, animaciones).
2. Todo el contenido de texto está presente en el HTML sin ejecutar JS (verificable con JS
   deshabilitado / "ver código fuente").
3. Todos los elementos SEO de §4 están presentes e íntegros.
4. El formulario postea a Zoho con los `name` correctos y redirige.
5. Peso de la página drásticamente menor (~60–90 KB vs 1.6 MB) y sin dependencias React/Babel.
6. Nada de contenido falso presentado como real (§6).
