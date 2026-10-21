# Inventario de assets · Riselanding · riselanding.com

Versión: v0.1 borrador · Fecha: 2026-10-20 · Fase: F3 (assets visuales), en paralelo con F4
Insumos: `DESIGN.md` v1.0 (secciones 3, 4, 7, 8 y 9), `docs/sitemap.md` v1.0, `docs/wireframes/*.md`, `docs/prototipos/home-variantes.html`, archivos de `Assets/` (incluida la carpeta sin versionar `Assets/Rise Landing Logo final (1)/` y su `.zip`) y `../Riselanding/logos/`.
Estado: pendiente de revisión de José.

## 1. Resumen

- El sitio no necesita imágenes generadas con IA. Las maquetas de producto se construyen en HTML y CSS (DESIGN.md §2 y §8), el aura de fondo es CSS y los íconos son Lucide. Consumo de créditos de Higgsfield previsto para ola 1 y ola 2: **0**.
- Las únicas fotografías posibles son las del equipo (José y Rut), y solo si se aprueban para `#nosotros`. Son origen **cliente**; nunca se generan personas (DESIGN.md §8).
- **No existe un SVG real del logo.** Los 5 SVG revisados (2 en `Assets/`, 3 en `../Riselanding/logos/`) son contenedores de imágenes raster incrustadas en base64. Hasta tener un vector, se usan PNG con transparencia a 2x.
- El logo correcto para header claro ya existe con transparencia, pero vive en el otro repo: `../Riselanding/logos/Logo-naranja/14.png`. Las versiones de `Assets/` con acento a color usan el verde lima anterior o tienen fondo blanco sólido.
- Quedan obsoletos: logo con acento lima, og-image actual, favicon de 32 px borroso, SVG con raster incrustado, la carpeta `Rise Landing Logo final (1)` completa y las fuentes de Google (Bricolage Grotesque, Geist, JetBrains Mono) que carga el sitio publicado (detalle en §8).

Leyenda de origen: **repo** (archivo existente en este repo o en `../Riselanding`), **código** (HTML, CSS o SVG escrito en el proyecto), **set abierto** (Lucide, fuentes OFL), **cliente** (lo entrega José o Rut), **terceros** (marcas de herramientas), **generado** (IA; ninguno previsto).
Estados (referencia F3): pendiente → generado → seleccionado → optimizado → en sitio.

## 2. Archivos revisados

Dimensiones con `sips -g pixelWidth -g pixelHeight`; transparencia y colores con ImageMagick. "Área útil" es el recorte sin márgenes vacíos.

### 2.1 `Assets/` (versionados)

| Archivo | Formato | Dimensiones | Peso | Transparencia | Contenido | Veredicto |
|---|---|---|---|---|---|---|
| `RISELANDING_logo_color.png` | PNG | 3375×625 | 124 KB | Sí | Logo completo, negro con acento **verde lima #A7CF08** | Obsoleto: paleta anterior |
| `RISELANDING_logo_black.png` | PNG | 3375×625 | 118 KB | Sí | Logo completo, monocromo negro | Respaldo monocromo (documentos, sellos); no se usa en el sitio |
| `RISELANDING_logo_white.png` | PNG | 3375×625 (área útil 3178×446) | 418 KB | Sí | Logo completo, monocromo blanco | **Fuente del logo de footer** (exportar a 2x) |
| `logo-white-horizontal.png` | PNG | 640×118 (área útil 602×85) | 33 KB | Sí | Logo completo blanco, ya reducido | Alternativa válida para footer; es la que usa el sitio actual |
| `logo-horizontal.png` | PNG | 640×296 (área útil 615×87) | 27 KB | No (fondo blanco) | Logo completo, negro con acento naranja | Obsoleto: fondo blanco sólido, no sirve sobre el aura |
| `RISELANDING_Isoltipo_white.png` | PNG | 1300×1300 | 138 KB | Sí | Isotipo blanco (nombre con errata "Isoltipo") | Respaldo; no se usa en ola 1 |
| `RISELANDING_isotipo.svg` | SVG | 800×800 | 909 KB | Sí | 8 imágenes raster en base64 dentro del SVG | Obsoleto: no es vector y pesa 909 KB |
| `RISELANDING_Isoltipo_white.svg` | SVG | 800×800 | 197 KB | Sí | 2 imágenes raster en base64 | Obsoleto: no es vector |
| `favicon-32.png` | PNG | 32×32 | 3 KB | No | Isotipo, se ve borroso | Obsoleto: regenerar |
| `favicon-192.png` | PNG | 192×192 | 13 KB | No | Isotipo con punto #FF5A1F sobre blanco | Reemplazar por el set nuevo (§5) |
| `apple-touch-icon.png` | PNG | 180×180 | 12 KB | No (correcto en este caso) | Isotipo sobre blanco | Reemplazar por el set nuevo, con margen y fondo de marca |
| `og-image.png` | PNG | 1200×630 | 54 KB | No | Logo centrado sobre blanco, sin mensaje | Obsoleto: sustituir por la og nueva (§6) |

### 2.2 `Assets/Rise Landing Logo final (1)/` y su `.zip` (sin versionar)

Exportación de Canva del 2026-07-07. 12 PNG en la carpeta y 13 en el `.zip` (760 KB; incluye un `4.png` que no está descomprimido). **Ningún archivo tiene transparencia**: todo está aplanado sobre blanco.

| Archivo | Dimensiones | Peso | Contenido | Veredicto |
|---|---|---|---|---|
| `1.png`, `2.png`, `3.png`, `5.png` | 1080×1080 | 28 a 40 KB | Logo completo centrado en lienzo cuadrado blanco (1 y 2 con acento naranja, 3 y 5 en negro) | No usar: fondo blanco y lienzo de redes sociales |
| `6.png` | 1080×1080 | 48 KB | Logo blanco sobre blanco (invisible) | Inservible: exportado sin transparencia |
| `7.png` | 1080×1080 | 289 KB | Personaje robot naranja con el isotipo en el pecho | Fuera de DESIGN.md: no usar en el sitio |
| `14.png`, `15.png` | 1080×500 | 39 y 48 KB | Logo completo con acento naranja sobre blanco | Duplican `Logo-naranja/14.png` pero sin transparencia |
| `16.png`, `18.png` | 800×800 y 1181×1181 | 62 y 71 KB | Isotipo oscuro con punto naranja sobre blanco | Duplican `Logo-naranja/15.png` y `17.png` sin transparencia |
| `17.png`, `19.png` | 800×800 y 1181×1181 | 32 y 8 KB | Isotipo blanco sobre blanco | Inservibles |

Acción: no versionar la carpeta ni el `.zip`. Si José quiere conservarlos, moverlos fuera del repo del sitio.

### 2.3 `../Riselanding/logos/` (repo de marca)

| Archivo | Formato | Dimensiones | Peso | Transparencia | Contenido | Veredicto |
|---|---|---|---|---|---|---|
| `Logo-naranja/14.png` | PNG | 1080×500 (área útil 1038×144, proporción 7.2:1) | 39 KB | Sí | Logo completo, casi negro #040403 con acento naranja #FF581B | **Fuente del logo de header** |
| `Logo-naranja/15.png` | PNG | 800×800 | 76 KB | Sí | Isotipo oscuro, punto naranja con aro blanco | Alternativa para favicon |
| `Logo-naranja/16.png` | PNG | 800×800 | 72 KB | Sí | Isotipo blanco con punto naranja | Reserva para fondos oscuros (no previsto en ola 1) |
| `Logo-naranja/17.png` | PNG | 1181×1181 | 87 KB | Sí | Isotipo oscuro con punto naranja | **Fuente de favicons e íconos de app** |
| `Logo-naranja/Rise Landing Logo final.jpg` | JPG | 1080×500 | 31 KB | No | Logo con acento naranja sobre blanco | No usar |
| `Logo-naranja/Rise Landing Logo final (1).zip` | ZIP | | 274 KB | | Los 4 PNG anteriores | Respaldo |
| `RISELANDING_logo_color.png`, `_black.png`, `_white.png` | PNG | 3375×3375 | 156 a 477 KB | Sí | Mismos logos de `Assets/` en lienzo cuadrado (el de color, con acento lima) | Respaldo; el de color es obsoleto |
| `RiselanginLogo.png` | PNG | 1080×1080 | 75 KB | No | Logo azul marino, gris y lima | Obsoleto: paleta anterior |
| `Diseño sin título.png`, `(1)`, `(2)` (`.png`, `.jpg`) | PNG/JPG | 2000×2000 | 90 a 927 KB | Solo `(2).png` | Variantes de la paleta anterior (marino, gris, lima) | Obsoletos |
| `Diseño sin título.svg`, `(1).svg`, `(5).svg` | SVG | 2000×2000 | 52 a 194 KB | | Una imagen raster en base64 cada uno | No son vectores |

El naranja del logo (#FF581B) difiere en 2 unidades del Naranja Fuego #FF5A1F de DESIGN.md: es ruido de exportación. En la vectorización se normaliza a #FF5A1F.

## 3. Inventario ola 1

Columnas según la referencia F3; "Modelo" se omite porque no hay assets generados. Rutas finales propuestas para Astro: `src/assets/` para lo que procesa `astro:assets` y `public/` para lo que se sirve tal cual.

### 3.1 Globales (todas las páginas)

| ID | Sección | Tipo | Dimensiones y proporción | Origen | Fuente | Licencia y titular | Estado | Acción | Archivo final |
|---|---|---|---|---|---|---|---|---|---|
| G01 | Header claro | Logo completo a color | 7.2:1 · se muestra a 28 a 32 px de alto (unos 200 a 230 px de ancho); exportar a 2x: 460×64 | repo | `../Riselanding/logos/Logo-naranja/14.png` (recortar al área útil 1038×144) | Marca propia de Riselanding | seleccionado | Ideal: SVG vectorizado (§4). Mientras tanto: recortar, reducir a 460 px de ancho, PNG con transparencia optimizado y WebP; `width` y `height` explícitos; `alt="Riselanding"` | `src/assets/brand/logo-color.svg` (o `logo-color@2x.png`) |
| G02 | Footer oscuro | Logo completo blanco | 7.1:1 · se muestra a unos 180 px de ancho; exportar a 2x: 360×51 | repo | `Assets/RISELANDING_logo_white.png` (área útil 3178×446); alternativa `Assets/logo-white-horizontal.png` | Marca propia | seleccionado | DESIGN.md §7 pide logo blanco: se usa la versión monocroma, sin punto naranja. Recortar márgenes, exportar a 2x, PNG con transparencia; o SVG vectorizado con `fill` blanco | `src/assets/brand/logo-blanco.svg` (o `logo-blanco@2x.png`) |
| G03 | `<head>` | Favicons e íconos de app | ver §5 | repo | `../Riselanding/logos/Logo-naranja/17.png` | Marca propia | pendiente | Generar el set de §5; probar legibilidad a 16 y 32 px | `public/favicon.ico`, `public/favicon.svg`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/site.webmanifest` |
| G04 | Metadatos sociales | og-image genérica | 1200×630 · 1.91:1 | código | Plantilla HTML de §6 | Propia | pendiente | Construir la plantilla y exportar a PNG; usar en aviso de privacidad, gracias, 404 y como respaldo | `public/og/default.png` |
| G05 | Tipografía display | Fuente Montserrat 600 y 700 | WOFF2, subconjunto latino | set abierto | Fontsource o Google Fonts descargada (§7) | SIL Open Font License 1.1 | pendiente | Autoalojar (§7) | `src/` vía paquete o `public/fonts/` |
| G06 | Tipografía de texto | Fuente Inter 400, 500 y 600 | WOFF2, subconjunto latino | set abierto | Ídem | SIL Open Font License 1.1 | pendiente | Autoalojar (§7) | Ídem |
| G07 | Íconos de interfaz | Íconos Lucide | 16, 20 y 24 px · trazo 1.5 | set abierto | Sprite del prototipo (`docs/prototipos/home-variantes.html`, líneas 696 a 745) | ISC (Lucide Contributors); sin atribución visible | seleccionado | Portar el sprite a un componente Astro; sumar los íconos que faltan (§3.5) | `src/components/Icon.astro` + sprite |
| G08 | Botones de WhatsApp | Ícono | 16 a 20 px | set abierto | Lucide `message-circle` (ya en el sprite como `i-message`) | ISC | seleccionado | Lucide no incluye logos de marca. Para respetar "un solo set" se usa `message-circle` con el texto "WhatsApp" visible. Si José prefiere el glifo oficial de WhatsApp, descargarlo del centro de marca de Meta y respetar su guía (tarea asistida con José) | En el sprite |
| G09 | Hero y CTA final | Aura de fondo | Responsiva | código | DESIGN.md §3: gradientes radiales #FFB59F al 35% y #E5E7EB al 60% sobre #F7F8FA | Propia | seleccionado | CSS puro; no se genera imagen de textura (el prompt base de DESIGN.md §8 queda sin uso) | CSS global |

### 3.2 Inicio `/`

| ID | Sección | Tipo | Dimensiones y proporción | Origen | Fuente | Licencia y titular | Estado | Acción | Archivo final |
|---|---|---|---|---|---|---|---|---|---|
| H01 | `hero` · pestaña Atraer | Maqueta de producto: panel de campañas de búsqueda y redes | Escritorio 16:9 (contenedor de hasta 1120×630) · móvil 4:5 (unos 350×438) | código | Prototipo, `#panel-atraer` | Propia; datos ficticios | pendiente (prototipo listo) | Portar a componente; leyenda "Ejemplo ilustrativo con datos ficticios" visible; sin logos ni interfaz copiada de Google o Meta | `src/components/mockups/Campanas.astro` |
| H02 | `hero` · pestaña Convertir | Maqueta: pipeline de CRM (Nuevo, Calificado, Ganado) | Ídem | código | Prototipo, `#panel-convertir` | Propia; datos ficticios | pendiente (prototipo listo) | Mismo componente que C01, con 3 columnas | `src/components/mockups/Pipeline.astro` |
| H03 | `hero` · pestaña Medir | Maqueta: tablero de leads por canal | Ídem | código | Prototipo, `#panel-medir` | Propia; datos ficticios | pendiente (prototipo listo) | Barras en CSS o SVG inline, sin librería de gráficas | `src/components/mockups/Tablero.astro` |
| H04 | `hero` · pestaña Automatizar | Maqueta: flujo formulario, calificación, CRM y aviso | Ídem | código | Prototipo, `#panel-automatizar` | Propia; datos ficticios | pendiente (prototipo listo) | Mismo componente que A01, con 4 nodos | `src/components/mockups/Flujo.astro` |
| H05 | `herramientas` | Muro de herramientas | Fila de 7 elementos; 2 filas en móvil | terceros o código | Google Ads, Meta Ads, GA4, HubSpot, Zoho CRM, Notion, n8n | Marcas registradas de cada empresa; uso nominativo | pendiente (decisión) | Recomendación ola 1: nombres en texto (Inter 500, `--color-text-muted`), como dice el wireframe. Si José prefiere logos: SVG monocromos tomados de los kits de prensa oficiales de cada marca, sin sellos de partner sin verificar | Texto en el componente |
| H06 | `nosotros` | Fotos del equipo (José y Rut) | 4:5 · original mínimo 1200×1500; se muestra a unos 280×350 | cliente | Sesión fotográfica real | Riselanding; consentimiento de uso de imagen de José y Rut por escrito | pendiente (cliente) | Opcional en ola 1. Si no llegan antes del 2026-10-24, la sección sale solo con texto (el wireframe ya lo permite). Ver §9 | `src/assets/equipo/jose.jpg`, `rut.jpg` |
| H07 | `servicios` | Íconos de chips por pilar | 20 px en cuadro `--radius-sm` | set abierto | Lucide (ver §3.5) | ISC | seleccionado | Usar el mapa de §3.5 en home, `/servicios`, 404 y `#relacionados` | Sprite |
| H08 | `proceso` | Números de paso | | código | Tipografía Montserrat | | seleccionado | Sin imagen | |
| H09 | `faq` | Ícono de acordeón | 20 px | set abierto | Lucide `chevron-down` (falta en el sprite) | ISC | pendiente | Agregar al sprite | Sprite |
| H10 | `contacto` | Íconos de "qué incluye" y WhatsApp | 16 a 20 px | set abierto | Lucide `check`, `message-circle` | ISC | seleccionado | | Sprite |
| H11 | Metadatos | og-image de la home | 1200×630 | código | Plantilla §6 con el H1 "Generación de leads B2B, de la campaña al cierre." | Propia | pendiente | Exportar desde la plantilla | `public/og/home.png` |

### 3.3 Servicios `/servicios`

| ID | Sección | Tipo | Dimensiones y proporción | Origen | Fuente | Licencia | Estado | Acción | Archivo final |
|---|---|---|---|---|---|---|---|---|---|
| S01 | `hero` | Ninguno (hero corto sin maqueta) | | | | | | Solo aura CSS | |
| S02 | `servicios` | Íconos de chips por pilar | 20 px | set abierto | Lucide (§3.5) | ISC | seleccionado | Incluye los 6 servicios de ola 2 descritos sin enlace | Sprite |
| S03 | Metadatos | og-image | 1200×630 | código | Plantilla §6 con el H1 de la página | Propia | pendiente | Exportar | `public/og/servicios.png` |

### 3.4 Páginas de servicio de ola 1

Todas comparten: aura CSS en hero y `#contacto`, 4 íconos Lucide en `#enfoque`, `check` en `#entregables`, muro de herramientas en texto y la sección `#prueba` omitida mientras no haya prueba con permiso (wireframes). Las maquetas de hero se muestran debajo de los botones en móvil (4:5).

| ID | Página · sección | Tipo | Dimensiones y proporción | Origen | Fuente | Licencia | Estado | Acción | Archivo final |
|---|---|---|---|---|---|---|---|---|---|
| C01 | CRM · `hero` | Maqueta: pipeline con columnas Nuevo, Calificado, Propuesta y Ganado, empresas ficticias y origen del lead (Google Ads, formulario, WhatsApp) | 16:9 · móvil 4:5 | código | Extiende H02 | Propia; datos ficticios | pendiente | Variante de 4 columnas del componente `Pipeline`; en móvil, scroll horizontal dentro del marco o 2 columnas visibles | `Pipeline.astro` |
| C02 | CRM · `enfoque` | 4 íconos | 24 px | set abierto | Lucide: `layers`, `users`, `link`, `chart-column` (propuesta; ajustar al copy final) | ISC | pendiente | Agregar al sprite los que falten | Sprite |
| C03 | CRM · `herramientas` | Muro | | terceros o código | HubSpot, Zoho CRM, Notion, n8n, GA4 | Marcas de terceros | pendiente (decisión H05) | Texto; sin insignia de partner sin verificar | |
| C04 | CRM · metadatos | og-image | 1200×630 | código | Plantilla §6 | Propia | pendiente | | `public/og/crm.png` |
| A01 | Automatización · `hero` | Maqueta: flujo de 5 nodos (Formulario, Calificación, CRM, Aviso al vendedor, Seguimiento a 48 h) con un lead ficticio recorriéndolo | 16:9 · móvil 4:5 (flujo vertical) | código | Extiende H04 | Propia; datos ficticios | pendiente | Animación solo por opacidad (DESIGN.md §10); con `prefers-reduced-motion`, estado final estático | `Flujo.astro` |
| A02 | Automatización · `prueba` | Maqueta del flujo propio del sitio (formulario, filtro de calidad, n8n, Notion, aviso) | Ancho completo; se lee de arriba abajo en móvil | código | `docs/contrato-integraciones.md` y `lib/lead-quality/` | Propia; datos ficticios | pendiente | Mismo componente `Flujo` con otros nodos; José aprueba qué se describe [VERIFICAR del wireframe] | `Flujo.astro` |
| A03 | Automatización · `enfoque` | 4 o 5 íconos | 24 px | set abierto | Lucide: `filter`, `user-check`, `file-text`, `bell`, `sparkles` (propuesta) | ISC | pendiente | | Sprite |
| A04 | Automatización · metadatos | og-image | 1200×630 | código | Plantilla §6 | Propia | pendiente | | `public/og/automatizacion.png` |
| G10 | Google Ads · `hero` | Maqueta: panel con 3 grupos de anuncios ficticios, columnas de clics, leads y leads calificados, y un anuncio de búsqueda de ejemplo | 16:9 · móvil 4:5 | código | Extiende H01 | Propia; datos ficticios | pendiente | El anuncio de ejemplo es genérico: sin logotipo de Google ni réplica exacta de su interfaz | `Campanas.astro` |
| G11 | Google Ads · `enfoque` | 4 íconos | 24 px | set abierto | Lucide: `search`, `target`, `layout`, `chart-column` (propuesta) | ISC | pendiente | | Sprite |
| G12 | Google Ads · metadatos | og-image | 1200×630 | código | Plantilla §6 | Propia | pendiente | | `public/og/google-ads.png` |
| W01 | Sitio web · `hero` | Maqueta: el mismo sitio ficticio en marco de celular y de escritorio, con un formulario y la tarjeta del lead entrando al CRM | 16:9 · móvil 4:5 (solo celular más tarjeta) | código | Nueva; reutiliza la tarjeta de `Pipeline` | Propia; marca ficticia | pendiente | El sitio de ejemplo usa una empresa inventada y sin logo real; no usar capturas de sitios de clientes sin permiso | `src/components/mockups/SitioDispositivos.astro` |
| W02 | Sitio web · `enfoque` | 4 íconos | 24 px | set abierto | Lucide: `globe`, `smartphone`, `gauge`, `search` (propuesta) | ISC | pendiente | | Sprite |
| W03 | Sitio web · metadatos | og-image | 1200×630 | código | Plantilla §6 | Propia | pendiente | | `public/og/sitio-web.png` |

### 3.5 Mapa de íconos Lucide por servicio

Los 21 íconos del sprite del prototipo se conservan. Nombres de Lucide entre paréntesis cuando el id del sprite es abreviado.

| Servicio | Ícono | En el sprite |
|---|---|---|
| Google Ads | `search` | Sí (`i-search`) |
| Meta Ads | `megaphone` | Sí |
| SEO | `trending-up` | Sí |
| Sitio web corporativo | `globe` | Sí |
| Landing pages | `layout` (`layout-template`) | Sí |
| Tienda en línea | `shopping-cart` | Sí (`i-cart`) |
| Implementación de CRM | `users` | Sí |
| Medición y tableros | `chart-column` | Sí (`i-chart`) |
| Automatización | `workflow` | Sí |
| Software a la medida | `code` | Sí (`i-code`) |
| Interfaz (menú, cerrar, flecha, correo, info, check, campana, base de datos, archivo, filtro, mensaje) | `menu`, `x`, `arrow-right`, `mail`, `info`, `check`, `bell`, `database`, `file`, `filter`, `message-circle` | Sí |
| Faltan para ola 1 | `chevron-down`, `phone`, `layers`, `link`, `user-check`, `file-text`, `sparkles`, `target`, `smartphone`, `gauge`, `circle-check` | No: agregar en F4 |

Reglas (DESIGN.md §9): trazo 1.5, tamaños 16, 20 y 24, color `--color-text` o `--color-text-muted`, nunca naranja salvo dentro de un botón. Íconos decorativos con `aria-hidden="true"`.

### 3.6 Páginas sin assets propios

| Página | Assets | og-image |
|---|---|---|
| Aviso de privacidad | Globales (G01 a G09) | `default.png` |
| Gracias | Globales; ícono `circle-check` | `default.png` (página `noindex`) |
| 404 | Globales; chips de servicio (H07) | `default.png` |

## 4. Logo: qué versión usar

| Uso | Archivo fuente | Formato de entrega | Por qué |
|---|---|---|---|
| Header claro (translúcido sobre el aura) | `../Riselanding/logos/Logo-naranja/14.png` | SVG vectorizado; mientras tanto PNG con transparencia a 2x (460×64) | Es la única versión con acento naranja y fondo transparente. `Assets/logo-horizontal.png` tiene fondo blanco y se vería como un rectángulo sobre el aura; `Assets/RISELANDING_logo_color.png` tiene el acento verde lima de la paleta anterior |
| Footer oscuro (#1A202C) | `Assets/RISELANDING_logo_white.png` | SVG vectorizado con `fill` blanco; mientras tanto PNG con transparencia a 2x (360×51) | DESIGN.md §7 y el sitemap piden logo blanco. Blanco sobre #1A202C supera 15:1 de contraste |
| Favicons y app | `../Riselanding/logos/Logo-naranja/17.png` | ICO, SVG y PNG (§5) | Isotipo con transparencia y a 1181 px |
| JSON-LD `Organization.logo` | Mismo que el header | PNG cuadrado de 512×512 (isotipo) o el logo completo en PNG | Google pide un archivo rasterizable; usar `public/icon-512.png` o un PNG del logo completo |

**Vectorizar (recomendado).** Un SVG del logo pesa del orden de unos pocos KB, se ve nítido en cualquier densidad y permite un solo archivo para ambos colores. Dos caminos, en orden de preferencia:

1. Pedir el archivo original al diseñador o exportarlo de Canva como SVG con fondo transparente (Canva Pro). Los SVG actuales de Canva traen raster porque el logo se subió como imagen; si el original se construyó con formas y texto dentro de Canva, la exportación sí será vectorial. Responsable: José.
2. Si no existe original vectorial: vectorización como tarea aparte a partir de `RISELANDING_logo_black.png` (3375 px), con revisión de las letras, normalizando colores a #1A202C (o el negro del manual) y #FF5A1F. Requiere aprobación de José del resultado.

Mientras no haya SVG, los PNG a 2x son suficientes para ola 1. Respetar el área de protección y el tamaño mínimo del Manual de Marca v1.1, y no colocar el logo directamente sobre el degradado sin superficie sólida debajo (DESIGN.md §13): en el header, el logo va sobre `--color-surface-glass` o sobre la zona clara del aura.

## 5. Favicons e íconos de app

| Archivo | Tamaño | Fondo | Uso |
|---|---|---|---|
| `favicon.ico` | 16, 32 y 48 px en un solo archivo | Transparente | Navegadores y lectores que piden `/favicon.ico` por defecto |
| `favicon.svg` | Vectorial | Transparente; con `@media (prefers-color-scheme: dark)` dentro del SVG para aclarar el remolino | Navegadores modernos. Solo cuando exista el isotipo vectorizado |
| `apple-touch-icon.png` | 180×180 | Opaco, #F7F8FA o blanco; isotipo al 70% del lienzo | iOS (no admite transparencia) |
| `icon-192.png`, `icon-512.png` | 192 y 512 | Transparente | `site.webmanifest` |
| `icon-maskable-512.png` | 512×512 | Opaco #F7F8FA; isotipo dentro del círculo seguro central del 80% | Android, `"purpose": "maskable"` |
| `site.webmanifest` | | `theme_color` #F7F8FA, `background_color` #F7F8FA | |

Etiquetas: `<link rel="icon" href="/favicon.ico" sizes="32x32">`, `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, `<link rel="manifest" href="/site.webmanifest">`.

Riesgo: el `favicon-32.png` actual muestra que el remolino se empasta a 32 px. Probar a 16 y 32 px; si no se lee, usar una versión simplificada para tamaños chicos (remolino de trazo más grueso o solo el punto naranja con un aro). Decisión visual de José en F4.

## 6. og-image nueva

Recomendación: **una plantilla en código y una imagen por página indexable**, más una genérica. Al no gastar créditos, cada página puede mostrar su propio titular al compartirse por WhatsApp o LinkedIn, que es donde más se comparte en B2B México.

| Atributo | Valor |
|---|---|
| Tamaño | 1200×630 (1.91:1); contenido importante dentro de un margen de 64 px |
| Fondo | #F7F8FA con el aura de DESIGN.md §3 (#FFB59F al 35% y #E5E7EB al 60%), aquí sí permitida porque replica el hero |
| Logo | G01 a color, arriba a la izquierda, unos 40 px de alto, sobre una zona clara del aura |
| Eyebrow | Pilar o "Riselanding", Inter 600 mayúsculas, tracking 0.08em, #5F6B7A |
| Titular | H1 de la página, Montserrat 700, 60 a 64 px, interlineado 1.1, #1A202C, máximo 3 líneas |
| Pie | `riselanding.com`, Inter 500, #4A5568 |
| Naranja | Solo el del logo; sin botones falsos (el naranja se reserva para acciones) |
| Formato y peso | PNG o JPG de alta calidad, menos de 300 KB (WhatsApp puede omitir la vista previa con imágenes pesadas) |
| Producción | Plantilla HTML con los tokens de DESIGN.md, exportada a PNG con captura de navegador a 1200×630, o generada en build (por ejemplo con Satori). Recomendación: exportación estática; son 7 imágenes en ola 1 y 6 más en ola 2 |
| Metadatos | `og:image` con URL absoluta, `og:image:width` 1200, `og:image:height` 630, `og:image:alt` con el titular, `twitter:card` `summary_large_image` |

El texto dentro de la og-image es la excepción a "sin texto en imágenes" (referencia F3 §6): es una tarjeta para redes, repite el title de la página y no es la única fuente de esa información.

Ola 1: `default`, `home`, `servicios`, `crm`, `automatizacion`, `google-ads`, `sitio-web`.

## 7. Fuentes: recomendación

**Autoalojar Montserrat e Inter.** No cargar desde Google Fonts.

| Criterio | Autoalojadas | Google Fonts |
|---|---|---|
| Rendimiento | Mismo origen; precarga directa sin conexiones extra | Dos conexiones extra (`fonts.googleapis.com` y `fonts.gstatic.com`); la caché del navegador está particionada por sitio, así que ya no hay ventaja de caché compartida |
| Privacidad | No se envía la IP del visitante a terceros | Cada visita envía la IP a Google; habría que declararlo en el aviso de privacidad (LFPDPPP) |
| Control | Subconjunto y versión fijos en el repo | Cambios de Google fuera de nuestro control |
| Licencia | OFL 1.1 permite redistribuir y autoalojar; conservar el archivo de licencia | OFL 1.1 |

Implementación en F4:

- Paquetes de Fontsource para Montserrat e Inter (OFL), solo el subconjunto `latin`, que ya cubre á, é, í, ó, ú, ñ, ü, ¿ y ¡. Alternativa equivalente: la API de fuentes de Astro si la versión instalada la trae estable.
- Comparar el peso del archivo variable contra los estáticos necesarios (Montserrat 600 y 700; Inter 400, 500 y 600) y quedarse con el menor.
- `font-display: swap` y fuentes de respaldo con métricas ajustadas (`size-adjust`, `ascent-override`) para evitar saltos de diseño.
- `<link rel="preload">` solo para Montserrat 700 (titular del hero, candidato a LCP) e Inter 400.
- Retirar los `preconnect` y la hoja de Google Fonts que hoy cargan Bricolage Grotesque, Geist y JetBrains Mono.

## 8. Assets obsoletos del repo actual

| Archivo o recurso | Motivo | Acción propuesta |
|---|---|---|
| `Assets/RISELANDING_logo_color.png` | Acento verde lima de la paleta anterior | No migrar a Astro |
| `Assets/logo-horizontal.png` | Fondo blanco sin transparencia | No migrar |
| `Assets/RISELANDING_isotipo.svg`, `Assets/RISELANDING_Isoltipo_white.svg` | Raster en base64 dentro de SVG (909 y 197 KB); nombre con errata | No migrar |
| `Assets/favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | Se reemplazan por el set de §5 | Sustituir |
| `Assets/og-image.png` | Logo sobre blanco, sin la paleta ni el mensaje nuevos | Sustituir por `public/og/*.png` |
| `Assets/logo-white-horizontal.png` | Útil, pero queda duplicado si se exporta G02 desde el original | Conservar hasta tener G02; luego retirar |
| `Assets/RISELANDING_logo_black.png`, `RISELANDING_logo_white.png`, `RISELANDING_Isoltipo_white.png` | Originales de alta resolución sin uso directo en el sitio | Mover al repo de marca (`../Riselanding/logos/`) y fuera de lo que se publica |
| `Assets/Rise Landing Logo final (1)/` y su `.zip` (sin versionar) | Duplicados sobre blanco, 3 archivos invisibles y un personaje fuera de DESIGN.md | No versionar; borrar o mover fuera del repo (decisión de José) |
| Google Fonts: Bricolage Grotesque, Geist, JetBrains Mono (`index.html`, `gracias.html`, `aviso-de-privacidad.html`) | DESIGN.md §4 fija Montserrat e Inter autoalojadas | Retirar con la migración |
| URLs `/Assets/...` | Las vistas previas ya compartidas apuntan a `https://riselanding.com/Assets/og-image.png` | Opcional: redirigir `/Assets/og-image.png` a `/og/default.png` y los favicons viejos a los nuevos (sumar a la tabla de redirecciones de `docs/sitemap.md` §8) |

Fuera del alcance de assets, ya previstos en el sitemap: `index-legacy.html` y `Form/`. `Riselanding (1).html` (1.6 MB, sin versionar, en la raíz) no es un asset del sitio; revisar aparte si debe salir del repo.

## 9. Fotos del equipo (pendiente del cliente)

Solo si José y Rut aprueban dar cara a la sección `#nosotros` de la home (y más adelante a `/nosotros`, fase 2).

| Requisito | Valor |
|---|---|
| Personas | José Luis Vázquez y Rut, con nombre y rol reales |
| Encuadre | Retrato de medio cuerpo, 4:5, la misma luz y el mismo fondo para ambos (neutro claro, compatible con #F7F8FA) |
| Original | Mínimo 1200×1500, JPG de máxima calidad o RAW |
| Estilo | Fotografía documental, sin filtros (DESIGN.md §8) |
| Derechos | Fotos propias o del fotógrafo con cesión de uso comercial por escrito; consentimiento de uso de imagen de cada persona |
| Prohibido | Retratos generados con IA o retocados al punto de no parecer la persona |
| Plazo | Antes del 2026-10-24 para entrar en ola 1; si no, la sección sale solo con texto |

## 10. Optimización (F4)

- **Maquetas, aura e íconos:** HTML, CSS y SVG inline. Cero peso de imagen; el LCP del hero es el titular H1, no una imagen.
- **Logos:** SVG inline (o `<img>` con SVG) cuando exista; mientras tanto PNG a 2x con `width` y `height` explícitos. El logo del header no lleva `loading="lazy"`; el del footer sí.
- **Fotos del equipo:** `<Picture>` de `astro:assets` con AVIF y WebP, `srcset` de 3 anchos (400, 800 y 1200), `sizes` acorde al layout, `width` y `height` explícitos, `loading="lazy"` y `decoding="async"` (no están en el hero).
- **Imagen del hero:** no hay. Si en el futuro se agrega, `fetchpriority="high"` y sin `lazy`.
- **og-image:** no se procesa con `astro:assets`; va en `public/og/` con nombre estable para que las redes la cacheen.
- **Fuentes:** WOFF2 autoalojado con precarga de 2 archivos (§7).
- **Verificación:** Lighthouse móvil en F5 sin advertencias de imágenes sin dimensiones, formatos antiguos ni imágenes fuera de pantalla.

## 11. Ola 2 (resumen)

Todas usan la plantilla de servicio: aura CSS, 4 íconos Lucide en `#enfoque`, `check` en entregables, og-image propia de la plantilla §6 y cero assets generados.

| Página | Maqueta de hero (código, datos ficticios) | Íconos clave | Pendiente de cliente |
|---|---|---|---|
| Meta Ads `/servicios/meta-ads` | Panel de anuncios en redes con contactos y leads calificados por anuncio; reutiliza `Campanas` | `megaphone`, `users`, `target` | Ninguno |
| SEO `/servicios/seo` | Resultado de búsqueda ficticio y una respuesta de motor de IA que cita al sitio de ejemplo | `trending-up`, `search`, `sparkles` | Ninguno |
| Landing pages `/servicios/landing-pages` | Landing ficticia con formulario de 2 pasos; reutiliza `SitioDispositivos` | `layout-template`, `list-checks` | Ninguno |
| Medición `/servicios/medicion` | Tablero de leads por canal hasta el lead calificado; reutiliza `Tablero` (H03) | `chart-column`, `gauge` | Ninguno |
| Tienda en línea `/servicios/tienda-en-linea` | Tienda ficticia en celular y escritorio con productos genéricos dibujados en CSS, sin productos ni marcas reales | `shopping-cart`, `package` | Ninguno |
| Software a la medida `/servicios/software-a-la-medida` | Panel interno ficticio conectado al CRM; reutiliza `Flujo` | `code`, `plug` | Ninguno |
| Diagnóstico `/diagnostico` | Sin maqueta: el componente interactivo (preguntas, barra de progreso, barras por pilar) es el visual | Íconos de pilar | Ninguno |

Fase 2 (sin fecha): `/nosotros` requiere las fotos de §9; `/casos` requiere capturas o logos de clientes con permiso escrito; el blog usa og-images de la misma plantilla en lugar de portadas generadas.

## 12. Consumo de créditos

No hay lotes de generación previstos. Si José decide generar algo (por ejemplo una textura de fondo), se registra aquí antes de generar, con tope y aviso al 80% según la referencia F3 §5.

| Lote | Fecha | Assets | Saldo antes | Saldo después | Consumo | Acumulado | % del tope |
|---|---|---|---|---|---|---|---|
| | | Ninguno | | | 0 | 0 | 0% |

## 13. Pendientes que requieren a José

1. Archivo vectorial del logo (original del diseñador o exportación SVG de Canva Pro), o aprobar la vectorización como tarea aparte.
2. Aprobar el uso de `Logo-naranja/14.png` (header) y del logo blanco monocromo (footer).
3. Fotos de José y Rut con consentimiento escrito, antes del 2026-10-24, o confirmar que `#nosotros` sale sin fotos.
4. Muro de herramientas: nombres en texto (recomendado) o logos oficiales.
5. WhatsApp: ícono Lucide (recomendado) o glifo oficial.
6. Qué hacer con `Assets/Rise Landing Logo final (1)/`, su `.zip` y los originales de alta resolución de `Assets/`.
7. Firma de licencias (referencia F3 §11): marca propia, Lucide ISC, Montserrat e Inter OFL 1.1, fotos con cesión.

Firma de verificación de licencias comerciales: ______ (José Luis Vázquez) · Fecha: ______
