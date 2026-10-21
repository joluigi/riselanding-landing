# Cuestionario para cerrar el copy · Riselanding · F6

Versión: v1.0 · Fecha: 2026-10-20 · Para: José (socio) · Prepara: equipo de rediseño
Insumos: `docs/sitemap.md`, `docs/wireframes/*.md`, `docs/diagnostico-madurez.md`.

## Cómo usar este cuestionario

- Consolida las marcas `[VERIFICAR...]` y `[PRUEBA PENDIENTE...]` de los borradores en 18 preguntas: 17 afectan a la ola 1 (publicación del 2026-10-27) y 1 solo a la ola 2.
- Están ordenadas por impacto en la ola 1: primero lo que aparece en todas las páginas, después lo que toca varios servicios y al final lo que afecta una sola sección.
- Las opciones son formatos de respuesta, no cifras propuestas. Donde aparece `[N]`, José pone el dato real. Si un dato no se puede respaldar, la respuesta válida es "no se publica" y el copy se reescribe sin él.
- Regla de transparencia: ninguna cifra, testimonio, logo o caso se publica sin fuente o permiso escrito.
- `docs/diagnostico-madurez.md` no tiene marcas pendientes; su aprobación va por separado (sección 8 de ese documento).
- Respuesta sugerida: escribir debajo de cada pregunta, en la línea "Respuesta de José".

---

## Ola 1: home, /servicios, CRM, automatización, Google Ads y sitio web

### 1. ¿En cuánto tiempo respondemos una solicitud?

**Por qué importa:** aparece en el bloque de contacto de las 6 páginas de la ola 1 y en `/gracias`. Es la promesa que el prospecto lee justo antes de enviar el formulario; si no se cumple, se pierde la confianza en el primer contacto. El sitio actual dice "menos de 24 horas".

**Opciones de formato:**
- a) "Te respondemos en menos de [N] horas hábiles."
- b) "Te respondemos el mismo día hábil" o "al siguiente día hábil".
- c) Con horario: "Te respondemos en [N] horas hábiles, de [día] a [día], de [hora] a [hora]."
- d) Sin plazo: se quita la frase y solo queda el enlace a WhatsApp.

**Ubicaciones:** `docs/sitemap.md:135`, `docs/wireframes/home.md:19`, `docs/wireframes/home.md:115`, `docs/wireframes/plantilla-servicio.md:20`, `docs/wireframes/plantilla-servicio.md:46`, `docs/wireframes/servicios-indice.md:16`, `docs/wireframes/crm.md:19`, `docs/wireframes/automatizacion.md:19`, `docs/wireframes/google-ads.md:20`, `docs/wireframes/sitio-web.md:21`

Respuesta de José:

### 2. ¿Siguen vigentes los datos de contacto, los perfiles de redes y las ciudades donde hay clientes?

**Por qué importa:** el teléfono va en el footer de todas las páginas; los perfiles de redes alimentan el JSON-LD `Organization` (`sameAs`), que Google y los motores de IA usan para identificar la marca. La FAQ de la home solo lista ciudades si hay clientes reales en ellas.

**Preguntas concretas:**
- a) Teléfono +52 55 5878 8983: ¿sigue vigente? (sí / no / cambiar por [número])
- b) Perfiles oficiales que se enlazan: LinkedIn, Instagram, Facebook, TikTok, YouTube u otros (URL exacta de cada uno).
- c) Ciudades o estados con clientes actuales que se pueden mencionar, o "no listar ciudades".

**Ubicaciones:** `docs/sitemap.md:92`, `docs/wireframes/home.md:120`, `docs/wireframes/home.md:102`

Respuesta de José:

### 3. ¿Nos compartes frases textuales de clientes en llamadas de discovery?

**Por qué importa:** la sección `#problema` de cada servicio usa 4 frases en primera persona para que el visitante se reconozca. Las frases actuales son redacción del equipo, no citas. Publicarlas entre comillas como si fueran de clientes sería inventar testimonios. Con frases reales, la sección convierte mejor y es honesta.

**Opciones de formato:**
- a) Frases literales anónimas (sin nombre ni empresa), tomadas de notas, grabaciones, correos o WhatsApp de prospectos. Idealmente 4 por servicio: CRM, automatización, Google Ads y sitio web.
- b) José confirma que las frases actuales reflejan lo que oye seguido y se publican sin comillas, como situaciones ("Los prospectos llegan por tres canales y nadie sabe cuál ya se atendió"), no como citas.
- c) Mezcla: frases reales donde las haya y situaciones sin comillas en el resto.

**Ubicaciones:** `docs/wireframes/plantilla-servicio.md:13`, `docs/wireframes/crm.md:12`, `docs/wireframes/crm.md:39`, `docs/wireframes/automatizacion.md:12`, `docs/wireframes/automatizacion.md:41`, `docs/wireframes/google-ads.md:12`, `docs/wireframes/google-ads.md:42`, `docs/wireframes/sitio-web.md:14`, `docs/wireframes/sitio-web.md:41`

Respuesta de José:

### 4. ¿Hay clientes que autoricen mostrar su logo, su sitio o un caso?

**Por qué importa:** la sección `#prueba` de CRM, Google Ads y sitio web solo se publica con permiso escrito del cliente. Sin ella, esas páginas salen sin prueba de trabajo real. La home hoy no lleva logos de clientes por la misma razón.

**Opciones de formato, por cliente:**
- a) Solo logo (en la home o en el servicio correspondiente).
- b) Caso con nombre: reto, qué hicimos y resultado, con cifras que tengan fuente y periodo.
- c) Caso anónimo ("empresa de [giro] en [ciudad]"), sin logo.
- d) Captura anonimizada de una cuenta, pipeline o sitio, con autorización.
- e) Todavía no hay permisos: las secciones `#prueba` se omiten en la ola 1.

Indicar para cada cliente: nombre, servicio (CRM, Google Ads, sitio web), formato autorizado y quién da el permiso por escrito.

**Ubicaciones:** `docs/wireframes/plantilla-servicio.md:18`, `docs/wireframes/plantilla-servicio.md:31`, `docs/wireframes/crm.md:17`, `docs/wireframes/crm.md:85`, `docs/wireframes/google-ads.md:18`, `docs/wireframes/google-ads.md:92`, `docs/wireframes/sitio-web.md:19`, `docs/wireframes/sitio-web.md:88`, `docs/wireframes/home.md:13`

Respuesta de José:

### 5. ¿Publicamos precios, rangos o presupuestos mínimos?

**Por qué importa:** "¿Cuánto cuesta?" es la primera FAQ de la home y de sitio web, y "¿Cuánto debo invertir?" la de Google Ads. Un rango filtra prospectos que no encajan; no publicarlo obliga a que la respuesta explique bien por qué depende del alcance.

**Opciones de formato:**
- a) No se publican cifras: "cotizamos según el alcance que definimos en el diagnóstico" (texto actual).
- b) Precio de entrada: "desde $[N] MXN más IVA" por servicio.
- c) Rango por servicio: "$[N] a $[N] MXN".
- d) Escalones o paquetes con nombre.
- e) Google Ads, pauta: presupuesto mínimo mensual recomendado de $[N] MXN, o "lo estimamos en el diagnóstico" sin cifra.

**Ubicaciones:** `docs/wireframes/home.md:18`, `docs/wireframes/home.md:96`, `docs/wireframes/sitio-web.md:95`, `docs/wireframes/google-ads.md:98`

Respuesta de José:

### 6. ¿Qué plazos típicos podemos comunicar por servicio?

**Por qué importa:** se usa en el paso de "Cómo trabajamos" y en las FAQ de plazos de las 4 páginas de servicio y de la home. El sitio actual dice "CRM integrado en 3 semanas" y "entrega en 2 a 4 semanas" para sitios, sin fuente. Solo se publica un rango que se cumpla en la mayoría de los proyectos.

**Opciones de formato, por servicio:**
- a) Rango: "[N] a [N] semanas" (CRM, sitio web) o "[N] a [N] semanas por flujo" (automatización).
- b) Sin rango: "te damos un calendario con fecha por entregable después del diagnóstico" (texto actual).
- c) Google Ads: plazo de aprendizaje que se comunica a clientes ("las primeras [N] semanas") o sin plazo.
- d) ¿Se sostienen las cifras del sitio actual? (sí / no / cambiar a [rango])

**Ubicaciones:** `docs/wireframes/home.md:98`, `docs/wireframes/plantilla-servicio.md:16`, `docs/wireframes/crm.md:15`, `docs/wireframes/crm.md:74`, `docs/wireframes/crm.md:95`, `docs/wireframes/sitio-web.md:17`, `docs/wireframes/sitio-web.md:77`, `docs/wireframes/sitio-web.md:97`, `docs/wireframes/automatizacion.md:16`, `docs/wireframes/automatizacion.md:84`, `docs/wireframes/google-ads.md:102`

Respuesta de José:

### 7. ¿A nombre de quién quedan las cuentas y los activos de cada servicio?

**Por qué importa:** la propiedad es una objeción frecuente y aparece como nota en entregables y como FAQ en los 4 servicios. Hoy el copy promete que todo queda a nombre del cliente; hay que confirmarlo servicio por servicio.

**Confirmar para cada punto (sí / no / con matiz):**
- a) CRM: las licencias de HubSpot o Zoho se contratan a nombre de la empresa del cliente.
- b) Google Ads: la cuenta y el historial son del cliente, Riselanding entra con acceso de usuario y la pauta se paga directo a Google.
- c) Sitio web: dominio y hosting a nombre del cliente, con acceso de administrador.
- d) Automatización: los flujos viven en una instancia de n8n del cliente / en una instancia de Riselanding / depende del plan. Y qué se entrega al terminar (exportación de flujos, documentación, accesos).

**Ubicaciones:** `docs/wireframes/crm.md:64`, `docs/wireframes/crm.md:99`, `docs/wireframes/google-ads.md:72`, `docs/wireframes/google-ads.md:100`, `docs/wireframes/sitio-web.md:67`, `docs/wireframes/sitio-web.md:103`, `docs/wireframes/automatizacion.md:74`, `docs/wireframes/automatizacion.md:101`

Respuesta de José:

### 8. ¿Hay plazo forzoso y qué pasa cuando un cliente termina o cuando acaba una implementación?

**Por qué importa:** es la FAQ "¿Hay plazo forzoso?" de la home y la de "¿Qué pasa cuando termina la implementación?" de CRM. El sitio actual dice "compromiso inicial trimestral y mensualidad después".

**Opciones de formato:**
- a) Plazo: sin plazo forzoso / compromiso inicial de [N] meses / depende del servicio (indicar cuál).
- b) Salida: qué se entrega al terminar (accesos, documentación de campañas, CRM y automatizaciones) y en cuántos días.
- c) Después de una implementación: el cliente opera solo con la guía / soporte mensual opcional / bolsa de horas / otro modelo.

**Ubicaciones:** `docs/wireframes/home.md:106` (dos marcas: plazo y salida), `docs/wireframes/crm.md:101`

Respuesta de José:

### 9. ¿Con qué frecuencia revisamos y reportamos resultados?

**Por qué importa:** la home promete revisión mensual en el proceso y un tablero con "revisión periódica" en la FAQ; Google Ads promete revisión semanal y reporte mensual. El sitio actual dice "reporte semanal". Las tres cosas deben decir lo mismo.

**Opciones de formato:**
- a) Revisión de optimización: semanal / quincenal / mensual.
- b) Reporte al cliente: semanal / quincenal / mensual, y formato (tablero en vivo, PDF, reunión, combinación).
- c) Acceso del cliente a la cuenta y al tablero: permanente / bajo solicitud.

**Ubicaciones:** `docs/wireframes/home.md:81`, `docs/wireframes/home.md:104`, `docs/wireframes/google-ads.md:108`

Respuesta de José:

### 10. ¿Los entregables y las respuestas de las FAQ coinciden con la propuesta comercial real?

**Por qué importa:** la lista "Qué recibes" de cada servicio es un compromiso por escrito. Cada punto debe existir en la propuesta que se firma; si no, se quita. Esta pregunta cierra también las respuestas de FAQ que no dependen de otra pregunta de este cuestionario.

**Pedimos:**
- a) Revisar la sección `entregables` de CRM, automatización, Google Ads y sitio web, y marcar cada punto: se queda / se quita / se ajusta.
- b) CRM, importación de datos: ¿hay límite de registros o de fuentes (Excel, otro CRM)? ¿Incluye limpieza de duplicados?
- c) Google Ads, medición: ¿se configuran conversiones mejoradas e importación de conversiones desde el CRM, o solo GTM y GA4?
- d) Visto bueno a las FAQ de cada servicio una vez resueltas las preguntas 5 a 9.

**Ubicaciones:** `docs/wireframes/plantilla-servicio.md:15`, `docs/wireframes/plantilla-servicio.md:19`, `docs/wireframes/crm.md:14`, `docs/wireframes/crm.md:18`, `docs/wireframes/crm.md:60`, `docs/wireframes/crm.md:97`, `docs/wireframes/automatizacion.md:15`, `docs/wireframes/automatizacion.md:18`, `docs/wireframes/google-ads.md:15`, `docs/wireframes/google-ads.md:19`, `docs/wireframes/google-ads.md:54`, `docs/wireframes/sitio-web.md:16`, `docs/wireframes/sitio-web.md:20`

Respuesta de José:

### 11. ¿Tenemos algún estatus de partner o certificación vigente?

**Por qué importa:** HubSpot, Zoho, Google Partner o Meta Business Partner dan confianza inmediata, pero solo se mencionan con evidencia vigente. Sin respuesta, el muro de herramientas sale sin sellos.

**Opciones de formato, por programa:**
- a) Sí, vigente: nivel y enlace al directorio público del programa o captura del certificado.
- b) Certificaciones individuales (por persona), no de agencia: se mencionan como tales.
- c) No: no se menciona.

**Ubicaciones:** `docs/wireframes/home.md:13`, `docs/wireframes/plantilla-servicio.md:17`, `docs/wireframes/plantilla-servicio.md:32`, `docs/wireframes/crm.md:16`, `docs/wireframes/crm.md:80`, `docs/wireframes/google-ads.md:17`, `docs/wireframes/google-ads.md:87`

Respuesta de José:

### 12. ¿Qué plataformas operamos de verdad en cada servicio?

**Por qué importa:** el muro de herramientas y algunas FAQ listan plataformas. Solo se nombran las que el equipo opera hoy en proyectos reales.

**Confirmar (sí / no):**
- a) CRM: ¿también Pipedrive (lo dice el sitio actual)? ¿Otras plataformas además de HubSpot y Zoho?
- b) Google Ads: ¿se usan Performance Max y Looker Studio?
- c) Sitio web: ¿también se entregan sitios en WordPress u otra plataforma? ¿Con qué herramienta edita el cliente textos e imágenes (CMS, editor visual, otra)?
- d) Automatización: ¿WhatsApp Business y Google Workspace van en el muro de herramientas?

**Ubicaciones:** `docs/wireframes/crm.md:81`, `docs/wireframes/crm.md:91`, `docs/wireframes/google-ads.md:88`, `docs/wireframes/sitio-web.md:83`, `docs/wireframes/sitio-web.md:66`, `docs/wireframes/sitio-web.md:101`, `docs/wireframes/automatizacion.md:89`

Respuesta de José:

### 13. ¿Cuál es el alcance real de la automatización: WhatsApp, cotizaciones, IA y monitoreo?

**Por qué importa:** la sección `enfoque` y las FAQ de automatización prometen capacidades concretas. Cada una debe poder entregarse hoy.

**Confirmar:**
- a) WhatsApp: ¿integración con WhatsApp Business API (mensajes entrantes al CRM, avisos) o solo enlaces y notificaciones simples?
- b) Cotizaciones: ¿se entregan propuestas en PDF generadas con datos del CRM (el sitio actual ofrece un cotizador PDF automático)?
- c) IA: tareas que sí se hacen (clasificar mensajes, resumir, extraer datos de documentos) y proveedores que se pueden nombrar o "sin nombrar proveedor".
- d) Monitoreo: cómo se avisa una falla (correo, WhatsApp, Slack u otro) y tiempo de atención comprometido, o "sin tiempo comprometido".

**Ubicaciones:** `docs/wireframes/automatizacion.md:51`, `docs/wireframes/automatizacion.md:53`, `docs/wireframes/automatizacion.md:55`, `docs/wireframes/automatizacion.md:105`, `docs/wireframes/automatizacion.md:72`, `docs/wireframes/automatizacion.md:103`

Respuesta de José:

### 14. ¿Cuánto detalle publicamos del flujo propio del formulario (filtro, n8n y Notion)?

**Por qué importa:** es la única prueba demostrable de la página de automatización en la ola 1. Describirlo de más expone el filtro antispam; de menos, pierde fuerza como prueba.

**Opciones de formato:**
- a) Descripción general (texto actual): filtro, calificación y envío con n8n al CRM en Notion, sin señales ni umbrales.
- b) Más detalle: pasos del flujo con maqueta de datos ficticios, sin señales antibot ni umbral de calificación.
- c) Con una cifra del modo shadow (por ejemplo, porcentaje de solicitudes filtradas), con fuente y fecha. Solo si hay datos suficientes; si no, sin cifras.

**Ubicaciones:** `docs/wireframes/automatizacion.md:14`, `docs/wireframes/automatizacion.md:63`, `docs/wireframes/automatizacion.md:64`

Respuesta de José:

### 15. ¿Cómo es el acompañamiento al equipo después de implementar un CRM?

**Por qué importa:** la bajada de CRM promete acompañar a los vendedores "en las primeras semanas" y una revisión con dirección para ajustar. Es el diferenciador de la página, así que debe decir cuánto dura y cuándo ocurre.

**Opciones de formato:**
- a) Duración del acompañamiento: [N] semanas / hasta que el equipo use el CRM sin ayuda / según plan.
- b) Revisión con dirección: a los [N] días del arranque / al cierre del acompañamiento / sin fecha fija.

**Ubicaciones:** `docs/wireframes/crm.md:29`, `docs/wireframes/crm.md:52`

Respuesta de José:

### 16. ¿Publicamos nombres, fotos y roles de José y Rut?

**Por qué importa:** la sección `#nosotros` de la home promete "un solo equipo responsable". Poner cara a ese equipo refuerza la promesa, sobre todo porque no hay logos ni casos de clientes en la ola 1.

**Opciones de formato:**
- a) Sí, con foto profesional, nombre y rol de cada uno (indicar rol exacto y enviar fotos).
- b) Solo nombres y roles, sin foto.
- c) No, la sección queda sin personas.

**Ubicaciones:** `docs/wireframes/home.md:56`

Respuesta de José:

### 17. ¿Sostenemos el compromiso de recomendar otro proveedor si conviene más?

**Por qué importa:** `/servicios` dice que en el diagnóstico decimos qué etapa atender primero "aunque sea con otro proveedor". Es una promesa fuerte de recomendación honesta; si no se cumple siempre, hay que suavizarla.

**Opciones de formato:**
- a) Sí, se queda tal cual.
- b) Se suaviza: "te decimos qué etapa conviene atender primero y si podemos ayudarte con ella".
- c) Se quita la frase.

**Ubicaciones:** `docs/wireframes/servicios-indice.md:72`

Respuesta de José:

---

## Solo ola 2 (a más tardar 2026-11-03)

### 18. ¿Cuál es el alcance de Tienda en línea y Software a la medida?

**Por qué importa:** ambas páginas son de ola 2, pero su línea descriptiva ya aparece en `/servicios` desde la ola 1 con el enlace "Pregúntanos por este servicio". Si no hay respuesta antes del 2026-10-27, la línea se publica genérica y se ajusta en la ola 2.

**Pedimos, por servicio:**
- a) Plataformas que se usan (por ejemplo, Shopify, WooCommerce u otra para tienda; lenguaje o stack para software).
- b) Qué incluye y qué no (integración con CRM, pasarela de pago, medición de ventas, herramientas internas).
- c) Si "integración de sistemas" se absorbe en Software a la medida o queda aparte.

**Ubicaciones:** `docs/wireframes/servicios-indice.md:48`, `docs/wireframes/servicios-indice.md:62`

Respuesta de José:

---

## Marcas que no requieren respuesta de José

Se resuelven dentro del equipo; se listan para que la consolidación quede completa.

| Marca | Ola | Responsable y acción |
|---|---|---|
| `docs/sitemap.md:39` | 2 | Equipo: validar "diagnóstico de marketing digital" como keyword de `/diagnostico` con Keyword Planner |
| `docs/wireframes/sitio-web.md:87` | 1, después del lanzamiento | Equipo: medir riselanding.com con PageSpeed Insights o CrUX después del 2026-10-27 y publicar la medición con fecha. Hasta entonces, la opción A de `#prueba` no se publica |
