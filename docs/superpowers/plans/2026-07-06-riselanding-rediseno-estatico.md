# Migración del rediseño de Riselanding a HTML estático — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para implementar tarea por tarea. Los pasos usan checkbox (`- [ ]`) para seguimiento. **Nota de ejecución:** todo el trabajo es sobre UN archivo (`index.html`) con CSS/JS/estado compartido → ejecución **inline** (no subagentes aislados en paralelo, que se pisarían el archivo).

**Goal:** Reemplazar `index.html` por una versión estática que replica el rediseño React del prototipo, con todo el contenido en el HTML (indexable) y el SEO actual intacto.

**Architecture:** Un único HTML autocontenido. El CSS del prototipo se copia verbatim (fuentes servidas por Google Fonts en vez de base64). El contenido se construye como HTML semántico a partir del JSX ya leído; las ilustraciones SVG se extraen del DOM renderizado del prototipo. La interactividad se reimplementa en JS vanilla. El formulario se conecta a Zoho. El bloque SEO se copia verbatim del `index.html` actual.

**Tech Stack:** HTML5 estático, CSS (del prototipo), JS vanilla (IntersectionObserver, rAF), Google Fonts, Zoho Forms, Vercel (deploy estático, sin build).

## Global Constraints

- **Un solo archivo entregable:** `index.html`. Sin build, sin framework, sin React/Babel en el output.
- **SEO verbatim:** copiar sin alterar desde el `index.html` actual → GTM `GTM-P3WZC7MV` (head script + noscript iframe), title y meta description actuales, robots/author/theme-color/viewport, geo-tags, Open Graph completo, Twitter Cards, canonical + hreflang (es-MX, x-default), favicons (isotipo SVG, favicon.ico, apple-touch-icon), dns-prefetch/preconnect, JSON-LD `@graph` (ProfessionalService + WebPage).
- **Fuentes vía Google Fonts:** `Bricolage Grotesque` (700/600/500/400), `Geist` (400/500/600), `JetBrains Mono` (400/500). Nada de @font-face base64.
- **Paleta (de `:root` del prototipo):** `--bg:#0B1018`, `--surface:#161D2B`, `--ink:#F4EFE6`, `--accent:#FF5A1F`, `--green:#1FD17B`, `--yellow:#FFD23F`. Copiar el `:root` completo verbatim.
- **Contenido honesto (spec §6):** sin nombres de clientes inventados (marquee → sectores), testimonio sin atribución ficticia (rótulo "ejemplo"), precio "a medida según el alcance" (sin cifra inventada), contacto real (`hola@riselanding.com`, `tel:+525512345678`, redes `/riselanding`), métricas marcadas con comentario HTML para verificación.
- **Formulario → Zoho:** `action` = URL Zoho actual, `POST`, `multipart/form-data`. Campos: `Name_First`, `Name_Last`, `SingleLine`, `Email`, `PhoneNumber_countrycode`, y `<select name="Checkbox" multiple>` oculto sincronizado por JS. Hidden: `zf_referrer_name`, `zf_redirect_url` (`https://riselanding.com/?enviado=1`), `zc_gad`, `utm_source/medium/campaign`.
- **Idioma:** `<html lang="es">`. Todo el copy en español.
- **Artefactos de referencia** (en scratchpad, NO se commitean): `proto_component.css`, `proto_fonts.css`, `new_design_unpacked.html`, `babel1_app.js`, `babel2_app.js`, `proto_rendered_full.html` (DOM renderizado), `proto_top.png` (screenshot referencia).

Rutas absolutas usadas abajo:
- Proyecto: `/Users/josevazquez/Documents/01_Proyectos/Riselanding page2/`
- Scratchpad: `/private/tmp/claude-501/-Users-josevazquez-Documents-01-Proyectos-Riselanding-page2/c4d3c4b0-7890-4a32-a47e-8969a49272da/scratchpad/`
- Chrome: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

---

### Task 1: Preparación — referencia limpia + backup + script de verificación SEO

**Files:**
- Create: `index-legacy.html` (backup del actual)
- Create: `<scratchpad>/verify_seo.py` (chequeo reutilizable de integridad SEO)
- Reference (scratchpad, ya generados): `proto_component.css`, `proto_fonts.css`, `proto_rendered_full.html`, `proto_top.png`, `babel1_app.js`, `babel2_app.js`

**Interfaces:**
- Produces: `verify_seo.py` que, dado un archivo HTML, imprime PASS/FAIL por cada token SEO requerido y sale con código ≠0 si falta alguno. Lo consumen las Tasks 2 y 13.

- [ ] **Step 1: Backup del index actual**

```bash
cd "/Users/josevazquez/Documents/01_Proyectos/Riselanding page2"
cp index.html index-legacy.html
```

- [ ] **Step 2: Confirmar artefactos de referencia presentes**

```bash
SCRATCH="/private/tmp/claude-501/-Users-josevazquez-Documents-01-Proyectos-Riselanding-page2/c4d3c4b0-7890-4a32-a47e-8969a49272da/scratchpad"
ls -la "$SCRATCH"/{proto_component.css,proto_fonts.css,proto_rendered_full.html,proto_top.png,babel1_app.js,babel2_app.js}
```
Expected: los 6 archivos existen.

- [ ] **Step 3: Escribir `verify_seo.py`** (lista de tokens que DEBEN aparecer verbatim en el HTML final)

```python
# <scratchpad>/verify_seo.py
import sys
target = sys.argv[1]
html = open(target, encoding="utf-8").read()
REQUIRED = [
    "GTM-P3WZC7MV",
    "www.googletagmanager.com/gtm.js",
    'googletagmanager.com/ns.html?id=GTM-P3WZC7MV',   # noscript iframe
    '<meta name="robots"',
    '<meta name="theme-color"',
    'name="geo.region" content="MX"',
    'property="og:type"', 'property="og:image"', 'og:image:width', 'content="1200"',
    'name="twitter:card"', 'twitter:image',
    'rel="canonical" href="https://riselanding.com/"',
    'hreflang="es-MX"', 'hreflang="x-default"',
    'rel="apple-touch-icon"', '/Assets/RISELANDING_isotipo.svg', 'favicon.ico',
    'rel="preconnect"',
    'application/ld+json',
    '"@type": "ProfessionalService"', '#organization',
    '"@type": "WebPage"', 'BreadcrumbList',
]
missing = [t for t in REQUIRED if t not in html]
for t in REQUIRED:
    print(("PASS " if t not in missing else "FAIL "), t)
if missing:
    print(f"\n{len(missing)} TOKENS SEO FALTANTES"); sys.exit(1)
print("\nOK: SEO íntegro"); sys.exit(0)
```

- [ ] **Step 4: Verificar que el script corre y (correctamente) PASA contra el index actual**

```bash
python3 "$SCRATCH/verify_seo.py" "index.html"
```
Expected: todas PASS, "OK: SEO íntegro", exit 0. (Confirma que la lista de tokens es correcta contra la fuente.)

- [ ] **Step 5: Commit del backup**

```bash
git add index-legacy.html
git commit -m "chore: respaldo de index.html previo al rediseño"
```

---

### Task 2: `<head>` del nuevo index — SEO verbatim + Google Fonts + CSS del prototipo

**Files:**
- Create: `index.html` (se sobrescribe el actual; el backup vive en `index-legacy.html`)
- Read: `index-legacy.html` (fuente del bloque SEO), `<scratchpad>/proto_component.css` (CSS)

**Interfaces:**
- Produces: `index.html` con `<!DOCTYPE html><html lang="es"><head>…</head><body></body></html>`; head completo; body vacío (se llena en Tasks 4–11). El `<style>` contiene el `:root` y todas las reglas del prototipo.

- [ ] **Step 1: Copiar el bloque SEO del head** de `index-legacy.html` (líneas ~1–139: GTM script, todos los `<meta>`, OG, Twitter, canonical, hreflang, favicons, preconnect, JSON-LD) verbatim al `<head>` del nuevo `index.html`. NO modificar textos, URLs ni el JSON-LD.

- [ ] **Step 2: Añadir Google Fonts** (después de los preconnect existentes; ya hay preconnect a fonts.gstatic.com en el SEO):

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Geist:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Insertar el CSS del prototipo** dentro de un `<style>` al final del `<head>`: copiar verbatim el contenido de `<scratchpad>/proto_component.css` (incluye `:root`, reset, y todas las secciones). NO incluir `proto_fonts.css` (lo reemplaza Google Fonts).

- [ ] **Step 4: Verificar SEO íntegro en el nuevo archivo**

```bash
python3 "$SCRATCH/verify_seo.py" "index.html"
```
Expected: todas PASS, exit 0.

- [ ] **Step 5: Verificar que el CSS y las fuentes cargan (sin errores de consola críticos)**

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --window-size=1440,900 --screenshot="$SCRATCH/step_head.png" "file:///Users/josevazquez/Documents/01_Proyectos/Riselanding page2/index.html" 2>/dev/null; echo "exit $?"
```
Expected: exit 0, PNG generado (página en blanco con fondo `#0B1018` — body aún vacío).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: head del nuevo index con SEO verbatim, Google Fonts y CSS del prototipo"
```

---

### Task 3: Extraer las ilustraciones SVG del DOM renderizado

**Files:**
- Create: `<scratchpad>/svgs.json` (mapa nombre→markup SVG)
- Read: `<scratchpad>/proto_rendered_full.html`

**Interfaces:**
- Consumes: `proto_rendered_full.html` (DOM ya renderizado por React → los SVG son inline, construidos con rect/circle/path).
- Produces: `<scratchpad>/svgs.json` con las ~21 ilustraciones inline listas para pegar: `hero`, `prob_leads`, `prob_clock`, `prob_eye`, `prob_oldsite`, `svc_sem/seo/web/crm/auto/dash`, `step_diag/strat/impl/opt`, `ind_pro/retail/industrial/health/real/tech`. Las consumen las Tasks 5–9.

- [ ] **Step 1: Script de extracción** — localizar cada `<svg>` por su contenedor (`.hero-illu`/`.illu`/`.svc-illu`/`.step-illu`/`.ind-illu`) y por orden de aparición, mapear a los nombres de componente según el orden del JSX (`babel2_app.js`: Problems usa IlluLeads/IlluClock/IlluEye/IlluOldSite; Services SvcSEM…SvcDashboards; Process StepDiag…StepOpt; Industries IndIcon por `type`).

```python
# <scratchpad>/extract_svgs.py
import re, json
SCRATCH="/private/tmp/claude-501/-Users-josevazquez-Documents-01-Proyectos-Riselanding-page2/c4d3c4b0-7890-4a32-a47e-8969a49272da/scratchpad"
dom = open(SCRATCH+"/proto_rendered_full.html", encoding="utf-8").read()
def svgs_in(container_class):
    # devuelve la lista de <svg>…</svg> dentro de divs con esa clase, en orden
    out=[]
    for m in re.finditer(r'<div class="%s[^"]*">(.*?)</div>' % re.escape(container_class), dom, re.S):
        s=re.search(r'<svg.*?</svg>', m.group(1), re.S)
        if s: out.append(s.group(0))
    return out
data={}
hero = re.search(r'<svg.*?</svg>', re.search(r'class="hero-illu[^"]*">(.*?)</section>', dom, re.S).group(1), re.S)
data["hero"]= hero.group(0) if hero else ""
for name, cls in [("prob",".illu".strip('.')),("svc","svc-illu"),("step","step-illu"),("ind","ind-illu")]:
    data[name]=svgs_in(cls)
open(SCRATCH+"/svgs.json","w").write(json.dumps(data, ensure_ascii=False, indent=1))
print("hero svg:", bool(data["hero"]))
print({k:(len(v) if isinstance(v,list) else 1) for k,v in data.items()})
```

- [ ] **Step 2: Ejecutar y verificar conteos**

```bash
python3 "$SCRATCH/extract_svgs.py"
```
Expected: `hero svg: True`; conteos `prob:4, svc:6, step:4, ind:6` (si Services renderiza solo 1 svc-illu por ser tabs, `svc` traerá 1 → en tal caso extraer los 6 leyendo `babel1_app.js`, ver Step 3).

- [ ] **Step 3: Si faltan SVGs de Services (tabs) o Hero**, traducir esos componentes desde `babel1_app.js` (son SVG estáticos sin estado: `SvcSEM…SvcDashboards`, `HeroIllustration`). Copiar el JSX del `return(...)`, convertir `className→class`, `strokeWidth→stroke-width`, `{expr}`→valor literal, y guardar en `svgs.json`. Verificar que cada uno abre/cierra `<svg>`.

- [ ] **Step 4: Commit** (no aplica — artefacto de scratchpad; sin commit).

---

### Task 4: Body scaffold + Nav (con menú móvil)

**Files:**
- Modify: `index.html` (`<body>`)

**Interfaces:**
- Produces: `<body>` con: GTM `<noscript>` iframe (primer hijo de body, verbatim de `index-legacy.html`), `<div id="ambient"></div>`, `<nav class="nav">`, y un `<main>` vacío con placeholders `<!-- HERO --> … <!-- FOOTER -->` en el orden del spec §5, y un `<script>` vacío al final. IDs de ancla: `#top,#servicios,#proceso,#resultados,#industrias,#contacto,#diagnostico`.

- [ ] **Step 1: Insertar GTM noscript** como primer elemento del `<body>` (copiar verbatim de `index-legacy.html`).

- [ ] **Step 2: `#ambient` + Nav** — construir desde el JSX `Nav()` de `babel2_app.js` (marca con `.brand-dot`, enlaces Servicios/Proceso/Resultados/Industrias, CTA "Diagnóstico gratis" → `#contacto`). Añadir botón hamburguesa `.nav-toggle` (nuevo, para móvil) y clases para panel móvil.

```html
<nav class="nav">
  <div class="nav-inner">
    <a href="#top" class="brand"><span class="brand-dot"></span>Riselanding</a>
    <button class="nav-toggle" aria-label="Menú" aria-expanded="false"><span></span><span></span></button>
    <div class="nav-links">
      <a class="nav-link" href="#servicios">Servicios</a>
      <a class="nav-link" href="#proceso">Proceso</a>
      <a class="nav-link" href="#resultados">Resultados</a>
      <a class="nav-link" href="#industrias">Industrias</a>
      <a class="cta" href="#contacto">Diagnóstico gratis <span class="arr">→</span></a>
    </div>
  </div>
</nav>
```

- [ ] **Step 3: `<main>` con placeholders** en orden: Hero, Marquee, Problemas(`#diagnostico`), Testimonio, Servicios(`#servicios`), Proceso(`#proceso`), Resultados(`#resultados`), Comparativa, Industrias(`#industrias`), FAQ, Contacto(`#contacto`), y `<footer>`. Añadir `<script>` vacío antes de `</body>`.

- [ ] **Step 4: CSS del menú móvil** — añadir al `<style>` una media query (`max-width: 860px`) que oculte `.nav-links` por defecto y lo muestre con `.nav-links.open`; ocultar `.nav-toggle` en desktop. (El resto del CSS del prototipo ya es responsive.)

- [ ] **Step 5: Verificar estructura + SEO**

```bash
python3 "$SCRATCH/verify_seo.py" "index.html" && grep -c 'id="ambient"\|class="nav"\|<main\|<footer' index.html
```
Expected: SEO PASS; grep ≥ 4.

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat: scaffold del body + nav con menú móvil"
```

---

### Task 5: Hero + phase strip

**Files:**
- Modify: `index.html` (placeholder `<!-- HERO -->`)

**Interfaces:**
- Consumes: `svgs.json["hero"]`.
- Produces: `<section class="hero" id="top">` con el H1, subtítulo, CTAs, meta y phase strip.

- [ ] **Step 1: Construir el Hero** desde `Hero()` de `babel2_app.js`: `.eyebrow`, `<h1 class="display">` con los `<span class="word">` (la palabra "operación" con `.underline-word`), `.hero-sub`, `.hero-ctas` (primario → `#contacto`, ghost → `#servicios`), `.hero-meta` (3 cupos · Inversión <3% · Implementación en 3 semanas), y pegar el SVG `svgs.json["hero"]` dentro de `<div class="hero-illu">`. Añadir el `.phase-strip` (01 Atracción → 02 Conversión → 03 Automatización → 04 Crecimiento).

- [ ] **Step 2: Marcar métricas para verificación** — envolver "3 cupos disponibles este mes" e "Inversión < 3% de tu revenue" con `<!-- VERIFICAR: dato de marketing -->`.

- [ ] **Step 3: Render + screenshot del hero**

```bash
"$CHROME" --headless=new --disable-gpu --window-size=1440,1000 --screenshot="$SCRATCH/step_hero.png" "file:///Users/josevazquez/Documents/01_Proyectos/Riselanding page2/index.html" 2>/dev/null
```
- [ ] **Step 4: Ver `step_hero.png`** y comparar con la mitad superior de `proto_top.png` (H1, ilustración a la derecha, phase strip). Ajustar si difiere.

- [ ] **Step 5: Verificar contenido en HTML crudo** (indexabilidad)

```bash
grep -c "Generamos\|automatizamos\|Performance marketing" index.html
```
Expected: ≥ 1 (el texto está en el markup, no requiere JS).

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat: sección hero + phase strip"
```

---

### Task 6: Marquee (honesto: sectores) + Problemas

**Files:**
- Modify: `index.html` (placeholders Marquee y `<!-- PROBLEMAS -->`)

**Interfaces:**
- Consumes: `svgs.json["prob"]` (4 SVG: leads, clock, eye, oldsite).
- Produces: `.marquee` con etiquetas de **sector** (no clientes falsos) y `<section class="sec" id="diagnostico">` con 4 `.prob`.

- [ ] **Step 1: Marquee honesto** — reemplazar los nombres de empresa inventados por **sectores/servicios reales** (contenido honesto, spec §6). Duplicar la lista para el loop continuo:

```html
<div class="marquee"><div class="marquee-track">
  <!-- repetir el bloque de items 2x para loop continuo -->
  <div class="logo-mock"><span class="sq"></span>Servicios Profesionales</div>
  <div class="logo-mock"><span class="sq"></span>Retail y E-commerce</div>
  <div class="logo-mock"><span class="sq"></span>Manufactura Industrial</div>
  <div class="logo-mock"><span class="sq"></span>Salud y Bienestar</div>
  <div class="logo-mock"><span class="sq"></span>Inmobiliaria</div>
  <div class="logo-mock"><span class="sq"></span>Tecnología y SaaS</div>
  <!-- (segunda copia idéntica) -->
</div></div>
```

- [ ] **Step 2: Problemas** — construir desde `Problems()`: `.sec-head` (eyebrow "DIAGNÓSTICO DEL SECTOR", H2 "¿Tu operación digital está frenando tu crecimiento?", lead) y `.problems-grid` con 4 `.prob` (tag, `<h3>`, `<p>`, `.illu` con el SVG correspondiente de `svgs.json["prob"][i]`). Textos exactos del JSX.

- [ ] **Step 3: Render + screenshot + ver**

```bash
"$CHROME" --headless=new --disable-gpu --window-size=1440,1600 --screenshot="$SCRATCH/step_probs.png" "file:///Users/josevazquez/Documents/01_Proyectos/Riselanding page2/index.html" 2>/dev/null
```
Ver `step_probs.png`: marquee muestra sectores (no "Aurelia Legal"); 4 tarjetas con ilustración. Comparar con `proto_top.png`.

- [ ] **Step 4: Confirmar que NO hay nombres inventados**

```bash
grep -ci "Aurelia Legal\|Bracco Manufactura\|Cedro Inmobiliaria" index.html
```
Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: marquee de sectores (honesto) + sección problemas"
```

---

### Task 7: Testimonio (honesto, sin atribución) + Servicios (tabs con 6 paneles)

**Files:**
- Modify: `index.html` (placeholders Testimonio y `<!-- SERVICIOS -->`)

**Interfaces:**
- Consumes: `svgs.json["svc"]` (6 SVG).
- Produces: `.testi-section` sin nombre/empresa inventados; `<section class="sec" id="servicios">` con `.svc-tabs` (6 botones) y **los 6 `.svc-card` presentes en el DOM** (uno visible, resto `hidden`), para que el JS de la Task 12 alterne sin recomponer.

- [ ] **Step 1: Testimonio honesto** — mantener el diseño de `Testimonial()` (frase + 3 métricas) pero: eyebrow → "EJEMPLO DE RESULTADO · MANUFACTURA INDUSTRIAL"; **eliminar** `.testi-attr` con "Ricardo Granada / Granada Industrial / Monterrey"; sustituir por una nota `.testi-note`: "Ejemplo ilustrativo del tipo de resultado que buscamos. Publicaremos casos con cliente identificado conforme obtengamos su autorización." Envolver las 3 métricas (×3, 6h→10min, −42%) con `<!-- VERIFICAR: dato de marketing -->`.

- [ ] **Step 2: Servicios — tabs** — construir `.sec-head` (eyebrow "NUESTRA SOLUCIÓN", H2, lead) y `.svc-tabs` con 6 `<button class="svc-tab" data-svc="0..5">` (`01 · Publicidad SEM` … `06 · Dashboards`).

- [ ] **Step 3: Los 6 paneles** — renderizar los 6 `.svc-card` (datos del array `svcs` en `babel2_app.js`: title, copy, 3 bullets, pill, y SVG `svgs.json["svc"][i]`). Primero visible, los otros con atributo `hidden`. Cada uno `data-panel="i"`. El `.svc-num` = `SERVICIO 0{i+1} / 06`.

- [ ] **Step 4: Render + screenshot + ver**

```bash
"$CHROME" --headless=new --disable-gpu --window-size=1440,1800 --screenshot="$SCRATCH/step_svc.png" "file:///Users/josevazquez/Documents/01_Proyectos/Riselanding page2/index.html" 2>/dev/null
```
Ver `step_svc.png`: testimonio sin nombre inventado; tabs de servicios con primer panel visible.

- [ ] **Step 5: Confirmar honestidad + 6 paneles**

```bash
grep -ci "Ricardo Granada\|Granada Industrial" index.html   # esperado 0
grep -c 'class="svc-card"' index.html                        # esperado 6
```

- [ ] **Step 6: Commit**

```bash
git add index.html && git commit -m "feat: testimonio ilustrativo (honesto) + servicios con 6 paneles"
```

---

### Task 8: Proceso (timeline) + Resultados (contadores)

**Files:**
- Modify: `index.html` (placeholders `<!-- PROCESO -->` y `<!-- RESULTADOS -->`)

**Interfaces:**
- Consumes: `svgs.json["step"]` (4 SVG).
- Produces: `<section class="sec process" id="proceso">` con `.process-line` (para la barra `--prog`) y 4 `.step`; `<section class="results-section sec" id="resultados">` con 4 `.result` cuyos números usan `<span class="countup" data-to="30" data-prefix="-" data-suffix="%">0</span>`.

- [ ] **Step 1: Proceso** — desde `Process()`: `.sec-head` + `.process-wrap` con `<div class="process-line"></div>` y 4 `.step` (step-num "0i · Semana…", h3, p, step-tag). Textos exactos del JSX.

- [ ] **Step 2: Resultados** — desde `Results()`: 4 `.result`. Convertir cada `<CountUp .../>` a `<span class="countup" data-to="N" data-prefix="" data-suffix="…">0</span>` con los valores: (30, prefix `-`, suffix `%`), (8, suffix `+`), (3, suffix ` sem`), (45, suffix `+`). Añadir el `.results-callout` (ROI, inversión <3%, retorno 4 semanas). Envolver los 4 números y el callout con `<!-- VERIFICAR: dato de marketing -->`.

- [ ] **Step 3: Render + screenshot + ver** (`step_proc.png`, window 1440x1900). Confirmar timeline de 4 pasos y 4 métricas grandes.

- [ ] **Step 4: Verificar markup de contadores**

```bash
grep -c 'class="countup"' index.html
```
Expected: `4`.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: sección proceso (timeline) + resultados (contadores)"
```

---

### Task 9: Comparativa + Industrias

**Files:**
- Modify: `index.html` (placeholders `<!-- COMPARATIVA -->` e `<!-- INDUSTRIAS -->`)

**Interfaces:**
- Consumes: `svgs.json["ind"]` (6 iconos).
- Produces: `<section class="compare">` con `.compare-table` (fila head + 6 filas) y `<section class="sec industries" id="industrias">` con 6 `.ind`.

- [ ] **Step 1: Comparativa** — desde `Compare()`: `.sec-head` (eyebrow "POR QUÉ ELEGIRNOS", H2, lead) y `.compare-table` con fila `.head` (Aspecto / Agencia genérica / Riselanding) + las 6 filas del array `rows` (cada una con `.x ✕` y `.check ✓`). Textos exactos.

- [ ] **Step 2: Industrias** — desde `Industries()`: `.sec-head` + `.industries-grid` con 6 `.ind` (h4 título, p body, `.ind-illu` con icono `svgs.json["ind"][i]`). Los 6 sectores del array `inds`.

- [ ] **Step 3: Render + screenshot + ver** (`step_comp.png`, window 1440x1700). Confirmar tabla comparativa y grid de 6 industrias.

- [ ] **Step 4: Verificar**

```bash
grep -c 'class="compare-row"\|class="ind ' index.html
```
Expected: ≥ 12 (7 filas compare + 6 ind, aprox).

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: comparativa + industrias"
```

---

### Task 10: FAQ (precio honesto) + Footer (contacto y redes reales)

**Files:**
- Modify: `index.html` (placeholders `<!-- FAQ -->` y `<footer>`)

**Interfaces:**
- Produces: `.faq-section` con 6 `.faq-item` (todos con su `.faq-a` en el DOM, toggle por JS), y `<footer>` con contacto y redes reales.

- [ ] **Step 1: FAQ** — desde `FAQ()`: `.faq-grid` con `.faq-head` (eyebrow, H2, p, `.faq-side-card`) y `.faq-list` con 6 `.faq-item`, cada uno `<button class="faq-q" data-faq="i">` (idx + pregunta + `.faq-ico`) y `<div class="faq-a">respuesta</div>`. Primer item con clase `open`. **Editar la respuesta de precio** (item 1): quitar "$35,000 MXN/mes" → "Trabajamos con paquetes a medida según el alcance. La inversión promedio de nuestros clientes representa menos del 3% de su revenue mensual, con retorno visible en las primeras 4 semanas." (marcar el %/semanas con `<!-- VERIFICAR -->`).

- [ ] **Step 2: Footer** — desde `Footer()`, con datos **reales**: columna marca + descripción; columnas Servicios/Empresa/Contacto. Redes reales (reemplazar "IN/X/GH" por LinkedIn/Instagram/Facebook `https://www.{linkedin.com/company,instagram.com,facebook.com}/riselanding`). Contacto: `hola@riselanding.com`, `tel:+525512345678`, "Ciudad de México, MX". Copyright "© 2026 Riselanding".

- [ ] **Step 3: Render + screenshot + ver** (`step_faq.png`, window 1440x1600). Confirmar FAQ (primer item abierto) y footer.

- [ ] **Step 4: Verificar honestidad + contacto real**

```bash
grep -ci '35,000\|35000' index.html                                  # esperado 0
grep -c 'hola@riselanding.com\|linkedin.com/company/riselanding' index.html  # esperado ≥ 2
```

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: FAQ (precio a medida) + footer con contacto y redes reales"
```

---

### Task 11: Formulario de contacto → Zoho

**Files:**
- Modify: `index.html` (placeholder `<!-- CONTACTO -->`)
- Read: `index-legacy.html` (líneas ~2837–2960: form Zoho de referencia)

**Interfaces:**
- Produces: `<section class="sec cta-section" id="contacto">` con el `.cta-card` (columna informativa + `<form>` real Zoho). Consumido por el JS de la Task 12 (sync checkboxes→select, captura UTM).

- [ ] **Step 1: Columna informativa** — desde `Contact()`: eyebrow "PRIMER PASO SIN COSTO", H2, lead, y los 3 pasos (01/02/03). Sin el estado "sent" de React.

- [ ] **Step 2: Form real** — construir `<form class="form-grid" id="lead-form" action="{URL_ZOHO}" method="POST" accept-charset="UTF-8" enctype="multipart/form-data" novalidate>` copiando el `action` exacto de `index-legacy.html`. Campos con `name` Zoho:

```html
<input type="hidden" name="zf_referrer_name" value="">
<input type="hidden" name="zf_redirect_url" value="https://riselanding.com/?enviado=1">
<input type="hidden" name="zc_gad" value="">
<input type="hidden" id="utm_source" name="utm_source">
<input type="hidden" id="utm_medium" name="utm_medium">
<input type="hidden" id="utm_campaign" name="utm_campaign">
<select name="Checkbox" multiple style="display:none" id="zoho-servicios" aria-hidden="true">
  <option value="Publicidad Digital">Publicidad Digital</option>
  <option value="SEO y Posicionamiento">SEO y Posicionamiento</option>
  <option value="Reediseño / Desarrollo página web">Reediseño / Desarrollo página web</option>
  <option value="Implementación de CRM">Implementación de CRM</option>
  <option value="Automatización de procesos">Automatización de procesos</option>
  <option value="Dashboards y reportes">Dashboards y reportes</option>
</select>
<!-- visibles -->
<div class="field"><label>Nombre *</label><input name="Name_First" required placeholder="María"></div>
<div class="field"><label>Apellido *</label><input name="Name_Last" required placeholder="González"></div>
<div class="field full"><label>Empresa</label><input name="SingleLine" placeholder="Tu empresa S.A."></div>
<div class="field full"><label>Correo de trabajo *</label><input type="email" name="Email" required placeholder="maria@tuempresa.mx"></div>
<div class="field full"><label>WhatsApp / Teléfono *</label><input type="tel" name="PhoneNumber_countrycode" required placeholder="+52 55 1234 5678" autocomplete="tel" inputmode="numeric"></div>
<div class="field full"><label>¿Qué servicio(s) te interesan?</label>
  <div class="checks">
    <!-- data-zoho = value exacto del <option> Zoho de arriba -->
    <label class="chk"><input type="checkbox" data-zoho="Publicidad Digital"><span class="box"></span>SEM</label>
    <label class="chk"><input type="checkbox" data-zoho="SEO y Posicionamiento"><span class="box"></span>SEO</label>
    <label class="chk"><input type="checkbox" data-zoho="Reediseño / Desarrollo página web"><span class="box"></span>Web</label>
    <label class="chk"><input type="checkbox" data-zoho="Implementación de CRM"><span class="box"></span>CRM</label>
    <label class="chk"><input type="checkbox" data-zoho="Automatización de procesos"><span class="box"></span>Automatización</label>
    <label class="chk"><input type="checkbox" data-zoho="Dashboards y reportes"><span class="box"></span>Dashboards</label>
  </div>
</div>
<div class="field full">
  <button type="submit" class="btn btn-primary">Quiero mi diagnóstico gratuito →</button>
  <span class="form-note">TUS DATOS ESTÁN SEGUROS · NO COMPARTIMOS CON TERCEROS</span>
</div>
```

- [ ] **Step 3: Verificar campos Zoho presentes**

```bash
for f in Name_First Name_Last SingleLine Email PhoneNumber_countrycode 'name="Checkbox"' zf_redirect_url; do
  printf "%s: " "$f"; grep -c "$f" index.html; done
```
Expected: cada uno ≥ 1.

- [ ] **Step 4: Render + screenshot + ver** (`step_form.png`, window 1440x1400). Confirmar el form con los campos y checkboxes.

- [ ] **Step 5: Commit**

```bash
git add index.html && git commit -m "feat: formulario de contacto conectado a Zoho"
```

---

### Task 12: JS vanilla — toda la interactividad

**Files:**
- Modify: `index.html` (el `<script>` final antes de `</body>`)

**Interfaces:**
- Consumes: el markup de Tasks 4–11 (`.svc-tab`/`.svc-card`, `.faq-q`, `.countup`, `.reveal`/`.hero`/`.step`, `.process-line`, `.nav-toggle`/`.nav-links`, `.chk input[data-zoho]`, `#zoho-servicios`).
- Produces: comportamiento completo sin frameworks.

- [ ] **Step 1: Escribir el script completo**

```html
<script>
(function(){
  // 1) Reveal on scroll
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target);} });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal, .hero, .step').forEach(function(el){ io.observe(el); });

  // 2) Ambient cursor light
  window.addEventListener('mousemove', function(e){
    document.documentElement.style.setProperty('--mx', e.clientX+'px');
    document.documentElement.style.setProperty('--my', e.clientY+'px');
  });

  // 3) Service tabs
  var tabs = document.querySelectorAll('.svc-tab');
  var panels = document.querySelectorAll('.svc-card');
  tabs.forEach(function(t){ t.addEventListener('click', function(){
    var i = +t.dataset.svc;
    tabs.forEach(function(x){ x.classList.toggle('active', +x.dataset.svc===i); });
    panels.forEach(function(p){ p.hidden = (+p.dataset.panel !== i); });
  }); });

  // 4) FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(q){ q.addEventListener('click', function(){
    var item = q.closest('.faq-item');
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(function(x){ x.classList.remove('open'); });
    if(!wasOpen) item.classList.add('open');
  }); });

  // 5) CountUp
  function countup(el){
    var to=+el.dataset.to, pre=el.dataset.prefix||'', suf=el.dataset.suffix||'', dec=+(el.dataset.decimals||0), dur=1800, start=null;
    function tick(t){ if(!start)start=t; var p=Math.min(1,(t-start)/dur); var eased=1-Math.pow(1-p,3);
      var v=eased*to; el.textContent = pre + (dec?v.toFixed(dec):Math.round(v)) + suf;
      if(p<1) requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }
  var cio = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ countup(e.target); cio.unobserve(e.target);} }); }, {threshold:0.4});
  document.querySelectorAll('.countup').forEach(function(el){ cio.observe(el); });

  // 6) Process timeline progress
  var line = document.querySelector('.process-line');
  if(line){ var wrap = line.parentElement;
    function prog(){ var r=wrap.getBoundingClientRect(), vh=innerHeight, s=vh*0.65, en=-r.height+vh*0.45;
      var p=Math.max(0,Math.min(1,(s-r.top)/(s-en))); wrap.style.setProperty('--prog',(p*100)+'%'); }
    prog(); addEventListener('scroll', prog, {passive:true});
  }

  // 7) Mobile nav
  var tgl=document.querySelector('.nav-toggle'), links=document.querySelector('.nav-links');
  if(tgl){ tgl.addEventListener('click', function(){ var o=links.classList.toggle('open'); tgl.setAttribute('aria-expanded', o); }); }
  document.querySelectorAll('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ links.classList.remove('open'); if(tgl) tgl.setAttribute('aria-expanded','false'); }); });

  // 8) Checkbox → Zoho hidden select
  var zoho=document.getElementById('zoho-servicios');
  document.querySelectorAll('.chk input[data-zoho]').forEach(function(cb){ cb.addEventListener('change', function(){
    cb.closest('.chk').classList.toggle('on', cb.checked);
    if(!zoho) return;
    Array.prototype.forEach.call(zoho.options, function(o){ if(o.value===cb.dataset.zoho) o.selected=cb.checked; });
  }); });

  // 9) UTM capture
  var qs=new URLSearchParams(location.search);
  ['utm_source','utm_medium','utm_campaign'].forEach(function(k){ var el=document.getElementById(k); if(el&&qs.get(k)) el.value=qs.get(k); });
})();
</script>
```

- [ ] **Step 2: Render con JS + screenshot completo (full page)**

```bash
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,3200 --virtual-time-budget=4000 --screenshot="$SCRATCH/new_top.png" "file:///Users/josevazquez/Documents/01_Proyectos/Riselanding page2/index.html" 2>/dev/null
```
- [ ] **Step 3: Ver `new_top.png` vs `proto_top.png`** — deben verse equivalentes (hero, marquee de sectores, problemas, testimonio sin atribución). Ajustar CSS/markup si algo se rompe.

- [ ] **Step 4: Commit**

```bash
git add index.html && git commit -m "feat: interactividad en JS vanilla (tabs, FAQ, contadores, reveal, nav móvil, sync Zoho, UTM)"
```

---

### Task 13: Verificación final e integración

**Files:**
- Modify: (ninguno nuevo) — validación del `index.html` final

**Interfaces:**
- Produces: confirmación de los 6 criterios de éxito del spec §10.

- [ ] **Step 1: SEO íntegro**

```bash
python3 "$SCRATCH/verify_seo.py" "index.html"
```
Expected: todas PASS, exit 0.

- [ ] **Step 2: Contenido presente sin JS** (indexabilidad) — verificar textos clave de cada sección en el HTML crudo

```bash
for s in "Generamos" "DIAGNÓSTICO DEL SECTOR" "NUESTRA SOLUCIÓN" "CÓMO TRABAJAMOS" "RESULTADOS COMPROBADOS" "POR QUÉ ELEGIRNOS" "NUESTRO ECOSISTEMA" "DUDAS COMUNES" "PRIMER PASO SIN COSTO"; do
  printf "%s: " "$s"; grep -c "$s" index.html; done
```
Expected: cada uno ≥ 1.

- [ ] **Step 3: Sin contenido falso ni artefactos React/Babel**

```bash
grep -ci "Aurelia Legal\|Ricardo Granada\|35,000\|text/babel\|react-dom\|__bundler" index.html
```
Expected: `0`.

- [ ] **Step 4: Peso razonable**

```bash
wc -c index.html    # esperado < 200 KB (vs 1.6 MB del prototipo)
```

- [ ] **Step 5: Screenshot full-page final + revisión visual completa** (window 1440x6000, virtual-time-budget 5000) → ver y confirmar paridad con el prototipo de arriba a abajo. Registrar cualquier `<!-- VERIFICAR -->` pendiente para el usuario.

- [ ] **Step 6: Verificar que gracias.html, robots.txt, sitemap.xml, vercel.json siguen intactos**

```bash
git status --porcelain   # solo index.html, index-legacy.html, docs/ deben aparecer
```

- [ ] **Step 7: Commit final**

```bash
git add index.html && git commit -m "test: verificación final del rediseño estático (SEO, indexabilidad, paridad visual)"
```

---

## Self-Review (cobertura del spec)

- Spec §4 (SEO) → Task 2 (copia verbatim) + `verify_seo.py` (Tasks 1,2,13). ✅
- Spec §5 (13 secciones) → Tasks 4–11. ✅
- Spec §6 (contenido honesto): marquee→sectores (T6), testimonio sin atribución (T7), precio a medida (T10), contacto real (T10), métricas marcadas (T5,7,8). ✅
- Spec §7 (form Zoho) → Task 11 (campos+hidden) + Task 12 (sync+UTM). ✅
- Spec §8 (JS vanilla) → Task 12. ✅
- Spec §9 (fuera de alcance): no build, gracias.html intacto (T13 step 6), sin reescritura de copy. ✅
- Spec §10 (criterios) → Task 13. ✅
- Fuentes vía Google Fonts (constraint) → Task 2 step 2. ✅
- Menú móvil (nuevo) → Task 4 (markup+CSS) + Task 12 (JS). ✅
