# DESIGN.md · Riselanding · riselanding.com

Versión: v0.1 (dos variantes en exploración) · Aprobado por: pendiente (gate F1)
Toda decisión visual del sitio sale de este archivo. Un color, tamaño, espaciado o radio que no esté aquí es un defecto.

Estructura, ritmo, escala y componentes son comunes. Las variantes A (clara, fiel al manual) y B (oscura, evolución del sitio actual) solo cambian la paleta y la profundidad (sección 3 y sección 11). Al aprobar F1 se elige una y la otra se elimina de este archivo.

Marca de origen: `Riselanding/DESIGN.md` y Manual de Marca v1.1 con addendum v1.2. Donde este archivo se aparta del manual, lo dice en la sección 13.

## 1. Origen

| Rol | Referencia | Qué se toma | Qué no se toma |
|---|---|---|---|
| Principal | https://www.mangomint.com (elegida por José el 2026-10-20) | Hero centrado con titular corto y maqueta de producto debajo; pestañas tipo píldora que cambian la maqueta; escala tipográfica con titulares compactos (interlineado 1.1, tracking negativo); tarjetas translúcidas con sombra difusa; muro de logos con calificaciones; sección de una columna centrada para el "por qué"; índice de funciones agrupado por categoría con chips de ícono; CTA final en tarjeta; footer oscuro en contenedor redondeado; motion por opacidad, sin desplazamientos largos | Paleta lavanda, magenta y azul marino; tipografías TT Commons Pro y Mono; ilustraciones, fotografías, logos, textos y la flecha dibujada a mano; video testimonial (no hay testimonios con permiso) |
| Secundaria | https://www.siegemedia.com | Plantilla única para todas las páginas de servicio; acento cálido solo en acciones | Todo lo demás |
| Secundaria | https://www.blendb2b.com | Para la variante B: modo oscuro sobrio, titular grande en peso regular, estructura de página de servicio (problema, enfoque, entregables, FAQ, CTA) | Chat flotante que tapa el CTA en móvil |

Tokens extraídos: `docs/referencias/mangomint-1440.json` y `docs/referencias/mangomint-390.json`.

Prueba de diferenciación (método F1, sección 6), 2026-10-20:

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Se reutiliza logo, ícono propio, ilustración o fotografía de la referencia? | No |
| 2 | ¿Se copia texto, eslogan o nombre de sección distintivo? | No |
| 3 | ¿La paleta coincide? | No (carbón y naranja frente a lavanda, magenta y azul marino) |
| 4 | ¿Mismas familias tipográficas en la misma combinación? | No (Montserrat e Inter frente a TT Commons) |
| 5 | ¿El hero replica composición, imagen y texto a la vez? | No: se comparte la composición centrada; imagen y texto son propios |
| 6 | ¿Un visitante podría creer que el sitio es de Mangomint? | No: otro vertical, otra paleta, otra marca |
| 7 | ¿Se documentó qué se toma de cada referencia? | Sí, en esta tabla y en `docs/referencias.md` |
| 8 | ¿Las secundarias aportan solo detalles puntuales? | Sí |

## 2. Principios

1. Una idea por pantalla en móvil; el titular cabe en 3 líneas a 390 px.
2. Se muestra el trabajo en lugar de prometerlo: maquetas de CRM, flujos y tableros con datos ficticios marcados como ilustrativos.
3. Un solo color de acento, el Naranja Fuego, reservado para acciones. Nunca como fondo de sección ni en bloques de texto.
4. La prueba va antes que la promesa. Si no hay prueba verificable, no hay cifra.
5. Calma visual: superficies translúcidas, sombras difusas, movimiento por opacidad.

## 3. Paleta

### Variante A · Clara (fiel al manual)

| Token | Valor | Rol | Contraste |
|---|---|---|---|
| `--color-bg` | #F7F8FA | Fondo general (Casi Blanco) | |
| `--color-surface` | #FFFFFF | Tarjetas y paneles | |
| `--color-surface-glass` | rgba(255, 255, 255, 0.65) | Header al hacer scroll, tarjeta de CTA | |
| `--color-text` | #1A202C | Titulares y texto principal | 15.36:1 sobre bg |
| `--color-text-body` | #4A5568 | Cuerpo (Carbón Claro) | 7.08:1 sobre bg |
| `--color-text-muted` | #5F6B7A | Etiquetas, eyebrows, notas | 5.11:1 sobre bg |
| `--color-accent` | #FF5A1F | Fondo de botón primario y foco | |
| `--color-accent-contrast` | #1A202C | Texto sobre acento | 5.23:1 |
| `--color-accent-text` | #B83F14 | Enlaces y texto de acento | 5.26:1 sobre bg · 5.59:1 sobre surface |
| `--color-accent-soft` | #FFB59F | Aura de fondo (con opacidad), estados hover suaves | |
| `--color-border` | #E5E7EB | Bordes y divisores | |
| `--color-inverse-bg` | #1A202C | Footer y bloques invertidos | |
| `--color-inverse-text` | #F7F8FA / #9CA3AF | Texto y secundario en invertido | 15.36:1 / 6.43:1 |
| `--color-success` | #067647 | Estados de formulario | 5.69:1 sobre surface |
| `--color-error` | #B42318 | Estados de formulario | 6.57:1 sobre surface |

Aura de fondo A: dos gradientes radiales grandes y muy difusos, Naranja Suave #FFB59F al 35% y Gris Claro #E5E7EB al 60%, sobre #F7F8FA. Solo detrás del hero y del CTA final.

### Variante B · Oscura (evolución del sitio actual)

| Token | Valor | Rol | Contraste |
|---|---|---|---|
| `--color-bg` | #12161F | Fondo general | |
| `--color-surface` | #1A202C | Tarjetas y paneles (Dark UI) | |
| `--color-surface-raised` | #2D3748 | Elementos elevados, chips activos | |
| `--color-surface-glass` | rgba(26, 32, 44, 0.7) | Header al hacer scroll | |
| `--color-text` | #F7F8FA | Titulares | 17.03:1 sobre bg |
| `--color-text-body` | #C3C9D3 | Cuerpo | 10.87:1 sobre bg |
| `--color-text-muted` | #9CA3AF | Etiquetas y notas | 7.13:1 sobre bg · 4.72:1 sobre surface-raised |
| `--color-accent` | #FF5A1F | Fondo de botón primario y foco | |
| `--color-accent-contrast` | #12161F | Texto sobre acento | 5.8:1 |
| `--color-accent-text` | #FF6B35 | Enlaces y texto de acento | 5.76:1 sobre surface |
| `--color-border` | rgba(255, 255, 255, 0.08) | Bordes y divisores | |
| `--color-success` | #32D583 | Estados de formulario | 8.53:1 sobre surface |
| `--color-error` | #F97066 | Estados de formulario | 5.86:1 sobre surface |

Aura de fondo B: un brillo radial Naranja Fuego al 12% detrás del hero y uno gris azulado al 8%; nunca detrás de texto largo.

Validación: `docs/contraste.json`, 23 pares, todos AA (`contraste.py` sale con 0).

## 4. Tipografía

| Token | Familia | Licencia | Respaldo |
|---|---|---|---|
| `--font-display` | Montserrat (600, 700) | Google Fonts, OFL | system-ui, sans-serif |
| `--font-body` | Inter (400, 500, 600) | Google Fonts, OFL | system-ui, sans-serif |

La referencia usa una familia mono para etiquetas; aquí se resuelve con Inter en mayúsculas y tracking amplio para respetar el máximo de 2 familias.

| Nivel | Móvil (px / interlineado) | Escritorio (px / interlineado) | Familia y peso | Tracking |
|---|---|---|---|---|
| Display (H1 del hero) | 36 / 1.12 | 56 / 1.08 | Montserrat 700 | -0.03em |
| H2 (título de sección) | 28 / 1.18 | 40 / 1.12 | Montserrat 700 | -0.025em |
| H3 | 20 / 1.35 | 24 / 1.33 | Montserrat 600 | -0.01em |
| Lead (bajada) | 18 / 1.55 | 20 / 1.5 | Inter 400 | 0 |
| Cuerpo | 16 / 1.6 | 17 / 1.6 | Inter 400 | 0 |
| Eyebrow | 12 / 1.2 | 13 / 1.2 | Inter 600, mayúsculas | 0.08em |
| Pequeño | 14 / 1.45 | 14 / 1.45 | Inter 400 | 0 |
| Botón | 16 / 1 | 16 / 1 | Montserrat 700 | 0 |
| Navegación | 15 / 1 | 15 / 1 | Inter 500 | 0 |

La escala de Mangomint (54/36/22) se ajusta a Montserrat, más ancha que TT Commons, y a la longitud del español. Validar en F4 que el H1 real cabe en 3 líneas a 390 px. Ancho de lectura: 640 px máximo (de 60 a 75 caracteres).

## 5. Espaciado y layout

- Escala de espaciado (px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96, 128.
- Espacio vertical entre secciones: móvil 72 · escritorio 120.
- Ancho máximo de contenido: 1200 px; texto centrado: 640 px; página completa hasta 1440 px.
- Margen lateral: móvil 20 · tableta 32 · escritorio 40.
- Grid: 12 columnas en escritorio, 4 en móvil, gutter 24 (móvil 16).
- Breakpoints: 640 · 768 · 1024 · 1280.

## 6. Forma y profundidad

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 10px | Inputs, chips de ícono, tarjetas pequeñas |
| `--radius-md` | 24px | Tarjetas y maquetas de producto |
| `--radius-lg` | 40px | Contenedores de sección, CTA final, footer |
| `--radius-pill` | 999px | Botones y pestañas |
| `--shadow-1` | 0 5px 30px rgba(26, 32, 44, 0.07) | Tarjetas en reposo (A) |
| `--shadow-2` | 0 10px 30px rgba(26, 32, 44, 0.10) | Hover y elementos flotantes (A) |

En B las sombras se sustituyen por borde `--color-border` y un brillo interior `inset 0 1px 0 rgba(255, 255, 255, 0.06)`.

## 7. Componentes

| Componente | Especificación |
|---|---|
| Botón primario | Píldora, fondo `--color-accent`, texto `--color-accent-contrast`, Montserrat 700 16 px, alto 48 px, padding 0 24 px. Hover: sube 1 px y `--shadow-2`. Focus: anillo de 2 px `--color-accent` con separación de 2 px. Disabled al 40%. Loading con spinner y texto "Enviando" |
| Botón secundario | Píldora con borde de 1.5 px `--color-text`, texto `--color-text`, mismo alto. Uso: WhatsApp y acciones de segundo nivel |
| Enlace de acción | Texto `--color-accent-text` con ícono a la derecha; subrayado al hover |
| Pestañas de pilar | Píldoras con eyebrow (Atraer, Convertir, Medir, Automatizar). Activa: fondo `--color-surface` con `--shadow-1` (A) o `--color-surface-raised` (B). Rol `tablist`; clase `.svc-tab` para conservar la señal de interacción de `rl-tracking.js` |
| Maqueta de producto | Tarjeta `--radius-md` con marco de ventana o teléfono, construida en HTML y CSS (CRM, flujo de automatización, tablero). Leyenda "Ejemplo ilustrativo" siempre visible |
| Tarjeta | Fondo `--color-surface` (A) o `--color-surface` con borde (B), `--radius-md`, padding 32 (móvil 24) |
| Chip de servicio | Ícono en cuadro `--radius-sm` + nombre; enlace a la página del servicio. Se agrupan en columnas por pilar (índice de servicios) |
| Muro de prueba | Solo logos de clientes con permiso escrito o herramientas que operamos (Google Ads, Meta, HubSpot, Zoho, n8n, Notion, GA4). Sin calificaciones de terceros mientras no existan |
| Input | Alto 48 px, font-size 16 px, `--radius-sm`, etiqueta visible siempre, error debajo con `aria-describedby`. Conserva los ids del contrato (`docs/contrato-integraciones.md`) |
| Formulario | 2 pasos como hoy, dentro de tarjeta `--radius-lg` |
| Navegación | Header transparente sobre el aura que pasa a `--color-surface-glass` con desenfoque de 16 px al hacer scroll. Escritorio: menú Servicios con panel por pilar, Nosotros, Diagnóstico; a la derecha botón secundario WhatsApp y primario "Agenda tu diagnóstico". Móvil: logo, botón primario compacto y menú de pantalla completa |
| Barra CTA fija móvil | Sí, en páginas de más de 3 pantallas: botón primario y botón de WhatsApp, aparece después del hero |
| CTA final | Tarjeta `--radius-lg` sobre aura, titular H2 centrado, botón primario y enlace de WhatsApp |
| Footer | Contenedor `--color-inverse-bg` (A) o `--color-surface` (B) con `--radius-lg` y margen de 20 px; columnas por pilar, contacto, legales. Logo blanco |
| Componente interactivo | Diagnóstico de madurez: 8 a 10 preguntas en tarjeta, barra de progreso, resultado con barras por pilar y botón que precarga el formulario (ola 2) |

## 8. Imágenes

- Estilo: maquetas de interfaz construidas en código (sin capturas de terceros con datos reales) y fotografía documental del equipo cuando exista.
- Proporciones: hero escritorio 16:9 (maqueta), hero móvil 4:5, tarjetas 4:3.
- Tratamiento: sin filtros; datos ficticios y etiquetados.
- Prompt base para generación con IA (solo fondos y texturas): "abstract soft gradient light, warm coral and cool gray, out of focus, no objects, no people, no text".
- Prohibido: personas generadas presentadas como clientes o empleados reales.

## 9. Íconos

Lucide, trazo 1.5, tamaños 16, 20 y 24. Color `--color-text` o `--color-text-muted`; nunca naranja salvo dentro de un botón.

## 10. Motion

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | 200ms | Hover, focus, pestañas |
| `--duration-base` | 300ms | Cambio de maqueta, menú |
| `--duration-slow` | 500ms | Aparición por opacidad |
| `--ease-standard` | ease | Hover |
| `--ease-out` | cubic-bezier(0.2, 0.8, 0.2, 1) | Entradas |

Reglas: máximo una animación de entrada por sección, solo opacidad y desplazamiento de 8 px como máximo; nada anima el H1 ni la maqueta del hero (LCP); con `prefers-reduced-motion: reduce` todas las duraciones pasan a 0.

## 11. Tokens para código

```css
:root {
  /* Comunes */
  --font-display: "Montserrat", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --radius-sm: 10px;
  --radius-md: 24px;
  --radius-lg: 40px;
  --radius-pill: 999px;
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --duration-slow: 500ms;
  --ease-standard: ease;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --container: 1200px;
  --measure: 640px;

  /* Variante A · Clara */
  --color-bg: #F7F8FA;
  --color-surface: #FFFFFF;
  --color-surface-glass: rgba(255, 255, 255, 0.65);
  --color-text: #1A202C;
  --color-text-body: #4A5568;
  --color-text-muted: #5F6B7A;
  --color-accent: #FF5A1F;
  --color-accent-contrast: #1A202C;
  --color-accent-text: #B83F14;
  --color-accent-soft: #FFB59F;
  --color-border: #E5E7EB;
  --color-inverse-bg: #1A202C;
  --color-success: #067647;
  --color-error: #B42318;
  --shadow-1: 0 5px 30px rgba(26, 32, 44, 0.07);
  --shadow-2: 0 10px 30px rgba(26, 32, 44, 0.10);
}

/* Variante B · Oscura (en exploración: se activa con data-theme="b") */
:root[data-theme="b"] {
  --color-bg: #12161F;
  --color-surface: #1A202C;
  --color-surface-raised: #2D3748;
  --color-surface-glass: rgba(26, 32, 44, 0.7);
  --color-text: #F7F8FA;
  --color-text-body: #C3C9D3;
  --color-text-muted: #9CA3AF;
  --color-accent: #FF5A1F;
  --color-accent-contrast: #12161F;
  --color-accent-text: #FF6B35;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-inverse-bg: #1A202C;
  --color-success: #32D583;
  --color-error: #F97066;
  --shadow-1: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --shadow-2: inset 0 1px 0 rgba(255, 255, 255, 0.10);
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}
```

## 12. Sí / No

| Sí | No |
|---|---|
| Maquetas de CRM, flujos y tableros hechas en código, con datos ficticios etiquetados | Cifras de resultados sin fuente (retiradas el 2026-10-20) |
| Naranja Fuego solo en botones, foco y enlaces de acción | Naranja como fondo de sección o en párrafos |
| Titulares de una idea, en sentencia (mayúscula solo inicial) | Mayúscula inicial en cada palabra del título |
| Eyebrow que nombra el pilar o la sección | Emojis en encabezados o botones |
| Una animación de entrada por sección, por opacidad | Scroll reveal en cada tarjeta, parallax, cursor personalizado |
| Logos solo con permiso escrito | Logos de clientes o sellos de partner sin verificar |
| Texto de botón en carbón oscuro sobre naranja | Texto blanco sobre Naranja Fuego (3.12:1, no cumple AA) |
| Gradiente de aura difuso detrás del hero y del CTA final | Gradientes morado y azul genéricos, degradados en el logo |

## 13. Desviaciones del manual de marca (requieren aprobación)

| Manual dice | Este archivo propone | Motivo |
|---|---|---|
| CTA "Blanco / Naranja Fuego" (DESIGN.md de marca, línea 93) | Texto carbón oscuro sobre Naranja Fuego | Blanco sobre #FF5A1F da 3.12:1 y no cumple WCAG AA en texto de botón |
| Header carbón oscuro con logo blanco (línea 168) | Variante A: header translúcido claro con logo a color; el carbón pasa al footer | Patrón de la referencia elegida; el header carbón partiría el aura del hero. En la variante B el header ya es oscuro |
| Texto secundario en Gris Medio #9CA3AF | En fondo claro, #5F6B7A | #9CA3AF sobre #F7F8FA da 2.39:1 |
| Sin degradados (aplica al logo) | Aura de fondo difusa detrás del hero y del CTA | El logo nunca se coloca sobre el degradado sin una superficie sólida debajo |
