# Referencias de diseño · F1 · Rediseño de riselanding.com

Versión: v0.1 (propuesta) · Fecha: 2026-10-20 · Paso 1.1 del método F1 (`f1-adn-diseno.md`)
Estado: pendiente de elección de José (paso 1.2). La extracción de tokens (paso 1.3) se hace solo sobre la principal elegida.

## Contexto

- Audiencia: director general, dueño o director comercial de PyME y empresa mediana B2B en México (11 a 200 empleados). Ya pagó agencias sin resultados medibles; necesita ver proceso claro, medición transparente y salida sin candados (`docs/brief.md`).
- Conversión primaria: solicitud de diagnóstico digital gratuito (formulario de 2 pasos).
- Dos direcciones a comparar:
  - **A · Clara, fiel a la marca**: `Riselanding/DESIGN.md`. Fondo Casi Blanco `#F7F8FA`, Carbón `#2D3748`, Naranja Fuego `#FF5A1F` solo en acciones, Montserrat (títulos) e Inter (texto). El manual manda: de la referencia solo se toman layout, ritmo, escala y patrones de página.
  - **B · Oscura, evolución del sitio actual**: `index.html` hoy usa fondo `#0B1018`, superficies `#161D2B`, texto crema `#F4EFE6`, acento `#FF5A1F`, Bricolage Grotesque, Geist y JetBrains Mono, más cinco colores secundarios (verde, violeta, azul, amarillo) y unas 44 animaciones `@keyframes`. La evolución debe reducir a 2 familias y a un solo acento.

## Cómo se verificó

- Cada URL respondió HTTP 200 el 2026-10-20 (curl y WebFetch) y se abrió en navegador para revisar el primer pantallazo. En las candidatas principales se revisó también a 375 px.
- Las fuentes se leyeron con `getComputedStyle` sobre el `h1` y el primer párrafo.
- Las capturas formales a 1440 y 390 px y el JSON de tokens se generan en el paso 1.3, solo para la principal elegida.

## Regla general para todas las referencias

Nunca se copian logos, ilustraciones, fotos, renders 3D, textos, eslóganes ni nombres de secciones o metodologías. Se toman proporciones, ritmo, jerarquía y patrones de estructura. Las pruebas sociales (logos, cifras, testimonios) se replican como patrón solo cuando Riselanding tenga la prueba verificada; nunca se rellenan con datos inventados.

---

## Dirección A · Clara, fiel a la marca

| # | Tipo | Referencia | URL |
|---|---|---|---|
| A1 | Líder del vertical | Siege Media (agencia de SEO y GEO) | https://www.siegemedia.com |
| A2 | Líder del vertical | XRAY (agencia de automatización e IA) | https://www.xray.tech |
| A3 | Fuera del vertical | Stripe México | https://stripe.com/mx |
| A4 | Fuera del vertical | Attio (CRM) | https://attio.com |
| A5 | Comodín | Ramp (gestión de gasto) | https://ramp.com |

### A1 · Siege Media · https://www.siegemedia.com

Fondo blanco, una sola fuente sans (GT America, comercial), titular de 58 px en peso 500 y un único acento cálido reservado para botones. Menú de servicios con páginas individuales (`/services/...`) que repiten la misma plantilla.

- **Qué tomar**
  1. Titular a dos tonos: primera frase en tinta fuerte, segunda en gris medio. Con la marca: Carbón `#2D3748` + Gris Medio, sin tocar el naranja.
  2. Disciplina de acento: el color cálido aparece solo en CTA ("Let's Talk", "Get an Assessment"), igual que la regla del manual para el Naranja Fuego.
  3. Plantilla de página de servicio: etiqueta superior en versalitas, H1 corto en tres frases, párrafo, un CTA, visual de resultados a la derecha; debajo, logos, cómo trabajamos, resultados, testimonios y CTA de cierre.
- **Qué NO tomar**: el bloque rojo a sangre completa (el manual prohíbe el naranja como fondo principal); los carruseles de testimonios repetidos; GT America (licencia comercial, ya tenemos Montserrat).
- **Por qué encaja**: un dueño de PyME entiende en 3 segundos qué hacen y qué botón apretar. Se ve como empresa establecida, no como startup, y el CTA "evaluación" es casi idéntico a nuestro diagnóstico gratuito. En móvil (375 px) el titular y el CTA quedan arriba del pliegue y legibles.

### A2 · XRAY · https://www.xray.tech

Agencia de automatización con fondo crema `#FFFAF0`, titular display de 96 px en peso 700 (New Order, comercial), servicios empaquetados (por hora, mensual, talleres), casos de estudio y un cuestionario de diagnóstico propio (`quiz.xray.tech`).

- **Qué tomar**
  1. Doble CTA en el hero: acción principal ("hablar") y una secundaria de bajo compromiso ("evaluación gratuita"), que es exactamente la lógica de nuestro diagnóstico.
  2. Servicios presentados como formatos de contratación con su página propia, lo que responde a la objeción "ya pagué agencias sin resultados": se ve qué se compra.
  3. Fondo cálido casi blanco en lugar de blanco puro, compatible con `#F7F8FA`.
- **Qué NO tomar**: el texto que aparece con scroll en gris muy claro (contraste insuficiente al cargar); las ilustraciones decorativas de esquina; el azul de botones.
- **Por qué encaja**: es del mismo oficio que Ingrid (CRM y automatización) y habla a equipos pequeños y medianos, no a corporativos. El tono "resultados, no apps" es el que pide el decisor que desconfía de la tecnología por moda.

### A3 · Stripe México · https://stripe.com/mx

La referencia de ejecución tipográfica más sólida en español mexicano: titular largo a dos tonos, densidad controlada, franja de logos, navegación con megamenú.

- **Qué tomar**
  1. Cómo se comporta un titular largo en español a escala grande (el español ocupa más; sirve para validar la escala de Montserrat).
  2. Ritmo vertical entre secciones y anchos máximos de texto (líneas de 60 a 75 caracteres).
  3. Megamenú agrupado por tipo de solución, útil para los 4 pilares de Riselanding.
- **Qué NO tomar**: el degradado animado del hero y cualquier rasgo reconocible de Stripe (violeta, ondas, ilustraciones).
- **Por qué encaja**: el decisor mexicano asocia este nivel de acabado con empresas serias que manejan dinero; transmite confianza sin decir "confía en nosotros".

### A4 · Attio · https://attio.com

CRM con estética monocroma, mucho aire, titular centrado y producto mostrado como interfaz real.

- **Qué tomar**
  1. Mostrar el trabajo como interfaz (tableros, pipeline, reportes) en lugar de fotos de stock; encaja con "datos siempre visibles" del manual.
  2. Escala de grises con 3 o 4 niveles bien separados, que se traduce directo a Carbón, Carbón Claro, Gris Medio y Gris Claro.
  3. Densidad baja y botones pequeños y precisos.
- **Qué NO tomar**: el titular centrado en gris claro (bajo contraste); el lenguaje de producto SaaS ("plataforma", "agéntico"), que no es nuestro caso; la ausencia casi total de color.
- **Por qué encaja**: Riselanding vende CRM; ver un sitio que "se siente CRM bien hecho" le da al director comercial una pista de cómo se verá su propia operación.

### A5 · Comodín · Ramp · https://ramp.com

Hero con titular corto de dos frases y un campo de correo integrado junto al botón.

- **Qué tomar**: la idea estructural de meter el **paso 1 del formulario de 2 pasos dentro del hero** (un solo campo y un botón), para que el diagnóstico empiece arriba del pliegue. También la cuadrícula de puntos sutil como textura de fondo.
- **Qué NO tomar**: las fotos de personajes recortados, el verde lima de botón (el addendum reserva el Verde Lima `#A0D010` para el slogan), el tono humorístico.
- **Por qué encaja**: reduce fricción para un dueño de PyME con poco tiempo; un campo se siente menos comprometido que un formulario completo.

**Principal recomendada para A: Siege Media.** Es una agencia multiservicio en fondo claro con un solo acento cálido reservado para CTA y una plantilla de servicio consistente, que es justo lo que exige el manual de Riselanding.

---

## Dirección B · Oscura, evolución del sitio actual

| # | Tipo | Referencia | URL |
|---|---|---|---|
| B1 | Líder del vertical | Blend (agencia B2B de crecimiento y HubSpot) | https://www.blendb2b.com |
| B2 | Líder del vertical | RevPartners (RevOps e ingeniería GTM sobre HubSpot) | https://revpartners.io |
| B3 | Fuera del vertical | Vercel | https://vercel.com |
| B4 | Fuera del vertical | Railway | https://railway.com |
| B5 | Comodín | Refine Labs (página de precios y filtro de calificación) | https://www.refinelabs.com/pricing |

### B1 · Blend · https://www.blendb2b.com

Fondo verde casi negro, titular de 80 px en Space Grotesk peso 400 alineado a la izquierda, texto en Onest 18 px, un CTA claro y botón de menú en un único acento. Más de 30 páginas de servicio agrupadas en 6 líneas.

- **Qué tomar**
  1. Titular grande en peso regular (no negrita), alineado a la izquierda, con mucho aire: transmite calma y autoridad en lugar del "ruido" del sitio actual.
  2. Plantilla de servicio completa y repetible (verificada en `/hubspot-partner/implementation`): hero con visual de producto, trabajos entregados, testimonios, por qué elegirnos, equipo, FAQ y CTA final.
  3. Posicionamiento "mid-market B2B": mismo tamaño de empresa que nuestro cliente ideal.
- **Qué NO tomar**: el chat de IA emergente, que en móvil (375 px) tapa el CTA principal; el verde menta como acento (el nuestro es Naranja Fuego); Space Grotesk.
- **Por qué encaja**: es la evolución natural de nuestro modo oscuro hacia algo más sobrio. Al director comercial le habla de "motor de ingresos" y procesos, no de creatividad, y la estructura de servicio contesta las objeciones en orden.

### B2 · RevPartners · https://revpartners.io

Hero oscuro azul marino con un diagrama del sistema comercial (embudo y rueda de procesos) en vez de foto. Tiene un cuestionario de madurez RevOps (`/revops-maturity-quiz`) y páginas por servicio.

- **Qué tomar**
  1. Explicar el servicio como **diagrama del sistema** (atraer, convertir, automatizar, medir) dibujado en líneas finas sobre fondo oscuro: une los 4 pilares en una sola imagen.
  2. Cuestionario de madurez como herramienta interactiva de captación, candidato al componente interactivo de F8.
- **Qué NO tomar**: la tipografía. Usa Montserrat + Inter, la misma combinación de la marca Riselanding; tomarla como principal reprobaría la prueba de diferenciación (punto 4). También evitar la densidad de texto pequeño del diagrama (13 px), ilegible en móvil.
- **Por qué encaja**: es el oficio exacto de CRM y automatización, y el diagrama hace tangible algo que el dueño de PyME no ve: cómo se conectan sus herramientas.

### B3 · Vercel · https://vercel.com

Fondo negro, titular a la izquierda, visual central único, franja de logos en monocromo y retícula de líneas finas que ordena las secciones.

- **Qué tomar**
  1. Retícula visible con bordes de 1 px que separa secciones sin tarjetas con sombra.
  2. Logos de clientes en monocromo y a la misma altura óptica.
  3. Botones en par: primario relleno, secundario con borde.
- **Qué NO tomar**: el triángulo y cualquier recurso de marca de Vercel; la combinación Geist + Geist Mono (el sitio actual ya usa Geist; si se elige B hay que decidir si se conserva y documentarlo); el tono para desarrolladores.
- **Por qué encaja**: el modo oscuro bien hecho se lee como "infraestructura confiable", que es lo que compra quien quiere automatizar sin riesgo.

### B4 · Railway · https://railway.com

Hero oscuro con titular serif corto, dos CTA y una ventana de producto debajo que muestra un lienzo de proyecto.

- **Qué tomar**
  1. Marco de "ventana de aplicación" bajo el hero para mostrar un tablero o flujo de automatización real de Riselanding (n8n, Zoho, HubSpot) sin datos sensibles.
  2. Ritmo corto: titular de 3 o 4 palabras, una línea de apoyo, dos botones.
- **Qué NO tomar**: la ilustración de paisaje nocturno, la serif del titular (sería una tercera familia) y el violeta.
- **Por qué encaja**: muestra la operación por dentro; para quien ya pagó agencias "caja negra", ver el sistema es la prueba.

### B5 · Comodín · Refine Labs · https://www.refinelabs.com/pricing

Agencia B2B de demanda con fondo verde oscuro, página de precios pública ("Transparent pricing") y un bloque en el hero que dice a quién atienden y a quién no.

- **Qué tomar**: dos ideas de estructura. (1) Un **filtro de calificación visible en el hero** ("trabajamos con empresas que..."), coherente con el filtro de calidad de leads que ya corre en modo shadow. (2) Una página de **cómo cobramos** con escalones de entrada, que responde a la objeción de precio del segmento fundador y a "salida sin candados".
- **Qué NO tomar**: la mezcla de tres familias (Hk Sentiments, Instrument Serif y DM Sans), las cursivas serif de acento, el verde.
- **Por qué encaja**: el decisor mexicano desconfía de lo que no tiene precio ni condiciones; decir a quién no atendemos aumenta la credibilidad y mejora la calidad del lead.

**Principal recomendada para B: Blend.** Es una agencia B2B de mid-market con HubSpot en el centro, modo oscuro sobrio y una plantilla de servicio completa y repetible, el paso lógico desde el sitio oscuro actual hacia algo más serio.

---

## Descartadas en la revisión

| Sitio | Motivo |
|---|---|
| Directive (directiveconsulting.com) | Muy buena plantilla de servicio en claro, pero tiene oficina en Ciudad de México y vende servicios equivalentes: es competidor, el método pide no usarlos. |
| Aptitude 8 (aptitude8.com) | El texto del hero aparece con animación y queda casi invisible al cargar. |
| Linear (linear.app) y Raycast (raycast.com) | En la prueba el hero se quedó en blanco o casi invisible varios segundos: animación que bloquea contenido. |
| SmartBug Media (smartbugmedia.com) | Hero de video con cohete y serif slab: estética de agencia de 2018. |
| Huble (huble.com) | Renders 3D como protagonista y menú comprimido en dos líneas. |
| Kalungi (kalungi.com) | Titulares en mayúsculas completas y contador regresivo en la barra superior: presión, no confianza. |
| NoGood, Wpromote, Tinuiti | Hero sin mensaje legible al cargar, 3D o collage: alejado del decisor de PyME. |
| Zapier (zapier.com) | Buena ejecución, pero su naranja es casi idéntico al Naranja Fuego: riesgo de que el sitio parezca de Zapier. |
| n8n (n8n.io) | Cambió a fondo claro; ya no aporta a la dirección B. |
| hey.digital | Dominio en venta. |

## Elección (2026-10-20)

José eligió **Mangomint** (https://www.mangomint.com) como referencia principal única para las dos variantes; las variantes A y B solo difieren en paleta y profundidad. Siege Media y Blend quedan como secundarias puntuales (ver la sección 1 de `DESIGN.md`).

Mangomint queda fuera del vertical (software para salones y spas): aporta ejecución, no credibilidad del sector. La credibilidad B2B sale de las maquetas de trabajo propias y del proceso.

Tokens extraídos: `docs/referencias/mangomint-1440.json` y `docs/referencias/mangomint-390.json`.
