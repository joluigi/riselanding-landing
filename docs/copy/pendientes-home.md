# Pendientes de copy · Home (PR3)

Versión: v1.0 · Fecha: 2026-10-20 · Rama: `feat/f4-home`
Fuente: `docs/wireframes/home.md`. Cada marca `[VERIFICAR]` o `[PRUEBA PENDIENTE]` del borrador se publicó en versión neutra o se quitó. Cuando José responda `docs/copy/cuestionario-verificar.md`, se ajusta el texto en el archivo indicado.

Archivos del copy publicado: `src/components/home/contenido.js` (FAQ, pasos, equipo, herramientas, title y description), `src/components/home/*.astro` y el JSON-LD de `src/pages/index.astro`.

| # | Ubicación en el borrador | Texto original | Texto publicado | Pregunta del cuestionario |
|---|---|---|---|---|
| 1 | `home.md:13`, sección `herramientas` | Solo herramientas que operamos; sin sellos de partner [VERIFICAR] | Lista solo en texto: Google Ads, Meta Ads, GA4, HubSpot, Zoho CRM, Notion, n8n. Sin sellos ni niveles de partner | 11 (partner) y 12 (plataformas) |
| 2 | `home.md:56`, sección `nosotros` | [PRUEBA PENDIENTE: nombres y fotos reales de José y Rut con su rol] | "José Luis Vázquez · Socio · Medición y SEO" y "Rut Mariñelarena · Socia · Implementación" (roles de `docs/brief.md`). Sin foto ni hueco visible: se muestran solas al existir `Assets/equipo/jose.webp` y `Assets/equipo/rut.webp` | 16 (rol exacto y fotos) |
| 3 | `home.md:81`, paso 4 de `proceso` | Revisamos resultados cada mes, ajustamos lo que rinde menos y compartimos contigo los datos completos. [VERIFICAR frecuencia de revisión] | Revisamos resultados con la frecuencia que acordamos en el plan, ajustamos lo que rinde menos y compartimos contigo los datos completos. | 9 |
| 4 | `home.md:96`, FAQ "¿Cuánto cuesta…?" | Cotizamos según el alcance que definimos en el diagnóstico. La inversión en pauta de Google o Meta se paga aparte, directo a cada plataforma. [VERIFICAR: si se publica un rango de honorarios o escalones de entrada] | Cotizamos según el alcance que definimos en el diagnóstico. En la propuesta separamos nuestros honorarios de la inversión en pauta, si tu plan la incluye. | 5 (precios) y 7b (pauta pagada directo a la plataforma) |
| 5 | `home.md:98`, FAQ "¿En cuánto tiempo veo resultados?" | Depende de la etapa en la que empecemos. En el plan te damos fechas por entregable y los indicadores que vamos a revisar en cada una, para que sepas qué esperar y cuándo. [VERIFICAR rangos típicos por servicio] | Igual al borrador, sin rangos de semanas | 6 |
| 6 | `home.md:102`, FAQ "¿Trabajan con empresas fuera de la Ciudad de México?" | Sí. Trabajamos de forma remota con videollamadas y un canal directo por WhatsApp. [VERIFICAR: ciudades con clientes actuales antes de listarlas] | Igual al borrador, sin listar ciudades | 2c |
| 7 | `home.md:104`, FAQ "¿Cómo reportan los resultados?" | Con un tablero que muestra leads, costo por lead y avance del pipeline, y una revisión periódica contigo. [VERIFICAR frecuencia: el sitio actual dice reporte semanal] | En el plan acordamos contigo qué indicadores revisamos, como leads, costo por lead y avance del pipeline, además del formato y la frecuencia de cada revisión. | 9 |
| 8 | `home.md:106`, FAQ "¿Hay plazo forzoso?" | [VERIFICAR: compromiso inicial trimestral y mensualidad después]. Si terminas el servicio, te entregamos accesos y documentación de campañas, CRM y automatizaciones. [VERIFICAR política de salida] | No se publica: la pregunta se retiró de la FAQ y del JSON-LD `FAQPage` (quedan 5 preguntas) | 8 |
| 9 | `home.md:115`, sección `contacto` | Expectativa: Te respondemos en [VERIFICAR: tiempo comprometido]. | No se publica (el componente compartido `Contacto.astro` no incluye la frase) | 1 |
| 10 | `home.md:120`, JSON-LD `Organization` | `sameAs` de redes [VERIFICAR perfiles]; teléfono +52 55 5878 8983 [VERIFICAR que siga vigente] | Sin `sameAs` y sin el teléfono fijo. `contactPoint` solo con WhatsApp (+52 55 4821 3439), `https://wa.me/525548213439` y `contacto@riselanding.com` | 2a y 2b |

Fuera de estas marcas:

- La sección `diagnostico-madurez` (ola 2) no se publica en la ola 1; se agrega cuando exista `/diagnostico`.
- Los chips de servicios solo enlazan páginas publicadas; Medir enlaza a `/servicios#medir` hasta la ola 2.
