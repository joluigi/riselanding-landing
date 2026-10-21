# Diagnóstico de madurez digital · Borrador para aprobación

Versión: v0.1 (borrador) · Fecha: 2026-10-20 · Redacta: Claude · Aprueba: José Luis Vázquez
Estado: pendiente de aprobación por escrito. Sin la tabla de la sección 8 firmada no se construye.
Entrega: ola 2, a más tardar el 2026-11-03 (`docs/brief.md`, sección 14, punto 3).

Fuentes: `docs/brief.md` (sección 14), `DESIGN.md` (sección 7, componente interactivo), `docs/contrato-integraciones.md` (sección 3, payload), `lib/lead-quality/schema.js` (catálogos), `lib/lead-quality/engine.js` (puntaje del lead) y `js/rl-tracking.js` (`pushEvent`).

## 1. Objetivo y lugar en el sitio

Objetivo: que un director comercial o dueño de PyME vea en 10 preguntas dónde está su operación de marketing y ventas en cuatro pilares (Atraer, Convertir, Medir, Automatizar), reciba un siguiente paso concreto por pilar y llegue al formulario de diagnóstico gratuito con el resumen ya escrito. Es la conversión secundaria "interacción con el componente interactivo" del brief (sección 3) y alimenta la primaria (`rl_lead_submit`).

Lo que el componente no hace: no pide nombre, correo, teléfono, empresa ni ningún dato personal; no guarda respuestas en el servidor; no envía nada a n8n.

| Lugar | Qué muestra | Comportamiento |
|---|---|---|
| Página `/diagnostico` | Componente completo: intro corta, 10 preguntas en una tarjeta, barra de progreso, resultado con barras por pilar, textos de siguiente paso y botón de precarga. Debajo, el formulario de 2 pasos (mismo marcado del contrato, camino A) | La precarga ocurre en la misma página: sin pasar datos por URL ni entre páginas |
| Bloque en home | Tarjeta con titular, una frase y botón "Haz el diagnóstico" que lleva a `/diagnostico` | No incrusta las preguntas. Así hay una sola instancia del componente y una sola del formulario por página |
| Navegación | Entrada "Diagnóstico" del menú (ya prevista en `DESIGN.md`, sección 7) | Lleva a `/diagnostico` |

Propuesta de textos de entrada (para aprobar junto con los de la sección 4):

- Titular H1 de `/diagnostico`: "Diagnóstico de madurez digital"
- Bajada: "10 preguntas sobre cómo consigues, atiendes y mides a tus prospectos hoy. Al final ves tu puntaje en cuatro pilares y un siguiente paso para cada uno."
- Nota bajo la bajada: "No te pedimos datos de contacto para ver el resultado."
- Bloque en home, titular H2: "¿Qué tan ordenada está tu operación comercial?"; frase: "Responde 10 preguntas y ve en qué pilar está tu mayor oportunidad."; botón: "Haz el diagnóstico".

Diseño (de `DESIGN.md`): tarjeta `--radius-lg`, una pregunta por pantalla con eyebrow del pilar, opciones como radios grandes (alto mínimo 48 px, texto 16 px), botones "Atrás" y "Siguiente", barra de progreso "Pregunta 3 de 10". Resultado con cuatro barras horizontales 0 a 10 y el pilar de mayor oportunidad resaltado.

## 2. Preguntas

10 preguntas de opción única. Atraer 2, Convertir 3, Medir 3, Automatizar 2. Cada opción vale de 0 a 3. El puntaje no se muestra junto a las opciones. Las opciones se presentan en el orden de la tabla (de 0 a 3).

### Atraer

**A1 · `atraer_1`. ¿De dónde llegan hoy la mayoría de tus prospectos nuevos?**

| Puntos | Opción |
|---|---|
| 0 | Casi todos por recomendación o contactos personales. No tenemos un canal digital activo |
| 1 | A veces llegan por el sitio o por redes sociales, sin una acción constante detrás |
| 2 | Tenemos un canal digital activo (anuncios, SEO o contenido), pero solo uno o por temporadas |
| 3 | Tenemos dos o más canales digitales activos todo el año, con presupuesto o calendario definido |

**A2 · `atraer_2`. Si buscas en Google el servicio principal que vendes, ¿aparece tu empresa?**

| Puntos | Opción |
|---|---|
| 0 | No aparecemos, o no lo hemos revisado |
| 1 | Solo aparecemos si buscan el nombre de nuestra empresa |
| 2 | Aparecemos en algunas búsquedas del servicio, o solo con anuncios pagados |
| 3 | Aparecemos en búsquedas del servicio sin pagar, y con anuncios cuando nos conviene |

### Convertir

**C1 · `convertir_1`. Cuando llega un prospecto nuevo, ¿dónde queda registrado?**

| Puntos | Opción |
|---|---|
| 0 | En el correo o el WhatsApp de quien lo recibió |
| 1 | En una hoja de cálculo que alguien llena a mano cuando puede |
| 2 | En una hoja de cálculo o un CRM compartido, aunque no todos lo actualizan |
| 3 | En un CRM que todo el equipo usa, con etapa y responsable para cada prospecto |

**C2 · `convertir_2`. En horario laboral, ¿en cuánto tiempo responde tu equipo a un prospecto que escribe por el sitio o por WhatsApp?**

| Puntos | Opción |
|---|---|
| 0 | No lo sabemos, o a veces pasa más de un día |
| 1 | El mismo día, casi siempre |
| 2 | En menos de 2 horas, casi siempre |
| 3 | En menos de 30 minutos, casi siempre |

**C3 · `convertir_3`. ¿Qué papel tiene tu sitio web en las ventas?**

| Puntos | Opción |
|---|---|
| 0 | No tenemos sitio, o es una página informativa sin forma clara de contactarnos |
| 1 | Tiene datos de contacto, pero casi no llegan solicitudes por ahí |
| 2 | Tiene formulario o botón de WhatsApp y de vez en cuando llegan solicitudes |
| 3 | Tiene páginas por servicio con formulario, y sabemos cuántas solicitudes llegan cada mes |

### Medir

**M1 · `medir_1`. ¿Sabes cuánto te cuesta conseguir cada prospecto (costo por lead)?**

| Puntos | Opción |
|---|---|
| 0 | No lo calculamos |
| 1 | Lo estimamos de vez en cuando, sin un método fijo |
| 2 | Lo calculamos cada mes en total, sin separar por canal o campaña |
| 3 | Lo calculamos por canal o campaña y lo usamos para decidir dónde invertir |

**M2 · `medir_2`. ¿Tu sitio registra cuándo alguien envía un formulario o da clic en WhatsApp?**

| Puntos | Opción |
|---|---|
| 0 | No lo sabemos, o no tenemos sitio |
| 1 | Tenemos Google Analytics, pero no registra formularios ni clics |
| 2 | Registra algunas acciones, pero esos datos no llegan a Google Ads ni a Meta |
| 3 | Registra formularios y clics, y esos datos llegan a Google Ads o Meta |

**M3 · `medir_3`. ¿Cómo revisa la dirección los números de marketing y ventas?**

| Puntos | Opción |
|---|---|
| 0 | No hay una revisión fija; preguntamos cuando hace falta |
| 1 | Cada área arma su reporte a mano y los números no siempre coinciden |
| 2 | Hay un reporte periódico, pero se arma a mano y tarda días |
| 3 | Hay un tablero que se actualiza solo y junta marketing con ventas |

### Automatizar

**U1 · `automatizar_1`. ¿Qué pasa después de que un prospecto deja sus datos?**

| Puntos | Opción |
|---|---|
| 0 | Alguien lo ve cuando revisa el correo y decide qué hacer |
| 1 | Alguien lo copia a mano a la hoja de cálculo o al CRM y avisa al vendedor |
| 2 | Llega solo al CRM, pero la asignación y el primer mensaje se hacen a mano |
| 3 | Llega solo al CRM, se asigna a un vendedor y el prospecto recibe un primer mensaje sin que nadie intervenga |

**U2 · `automatizar_2`. ¿Cuánto del seguimiento comercial (recordatorios, cotizaciones, reportes) se hace a mano?**

| Puntos | Opción |
|---|---|
| 0 | Todo; depende de la memoria de cada persona |
| 1 | Usamos recordatorios del calendario o de la hoja de cálculo; lo demás es manual |
| 2 | Algunas tareas están automatizadas, pero cada herramienta funciona por separado |
| 3 | Las tareas repetitivas están automatizadas y las herramientas comparten datos entre sí |

## 3. Cálculo

### 3.1 Ponderación

- Cada pilar pesa lo mismo en el resultado, aunque tenga 2 o 3 preguntas.
- Dentro de un pilar, cada pregunta pesa lo mismo.
- No hay puntaje general: el resultado son cuatro puntajes y un pilar de mayor oportunidad.

### 3.2 Puntaje por pilar (0 a 10)

```
crudo   = suma de los puntos de las preguntas del pilar
maximo  = 3 × número de preguntas del pilar   (Atraer 6, Convertir 9, Medir 9, Automatizar 6)
puntaje = Math.round(crudo * 10 / maximo)     // entero de 0 a 10
```

Reglas de redondeo:

- Se redondea al entero más cercano; los empates en ,5 suben (comportamiento de `Math.round` con números positivos). Con estos máximos solo ocurre un caso: Atraer o Automatizar con crudo 3 da exactamente 5.
- Se multiplica antes de dividir (`crudo * 10 / maximo`) para evitar residuos de punto flotante.
- El puntaje que se muestra, el que va al evento y el que va a `necesidad` es el mismo entero.

Tabla de conversión completa:

| Crudo | Pilar de 2 preguntas (máx. 6) | Pilar de 3 preguntas (máx. 9) |
|---|---|---|
| 0 | 0 | 0 |
| 1 | 2 | 1 |
| 2 | 3 | 2 |
| 3 | 5 | 3 |
| 4 | 7 | 4 |
| 5 | 8 | 6 |
| 6 | 10 | 7 |
| 7 | | 8 |
| 8 | | 9 |
| 9 | | 10 |

### 3.3 Nivel por pilar

| Nivel | Puntaje |
|---|---|
| Bajo | 0 a 3 |
| Medio | 4 a 6 |
| Alto | 7 a 10 |

En ambos tipos de pilar, "alto" exige en promedio 2 puntos o más por pregunta.

### 3.4 Pilar de mayor oportunidad

Es el pilar con el puntaje más bajo. Desempate, en este orden:

1. Menor puntaje entero.
2. Si empatan, menor proporción sin redondear (`crudo / maximo`). Ejemplo: Atraer 1/6 (0.17, puntaje 2) y Medir 2/9 (0.22, puntaje 2) empatan en 2; gana Atraer.
3. Si siguen empatados, orden fijo: Convertir, Medir, Atraer, Automatizar. Motivo: primero se cuida la demanda que ya llega (Convertir); sin medición no se puede evaluar la inversión en atraer (Medir); automatizar sin registro ni medición repite el desorden más rápido (Automatizar al final).

Excepción: si los cuatro pilares tienen 10, `pilar_oportunidad = 'ninguno'` y se usa el texto especial de la sección 4.5.

El mismo criterio (puntaje, proporción, orden fijo) ordena los cuatro pilares de menor a mayor para la precarga (sección 5).

## 4. Textos de resultado

Estructura de la pantalla de resultado:

1. Titular: "Tu mayor oportunidad está en {Pilar}".
2. Cuatro barras con puntaje "{n}/10" y etiqueta de nivel (Bajo, Medio, Alto).
3. Texto del pilar de mayor oportunidad, destacado.
4. Textos de los otros tres pilares, en el orden del embudo (Atraer, Convertir, Medir, Automatizar).
5. Botón primario "Llevar mi resultado al formulario" y enlace secundario "Cambiar respuestas".
6. Nota: "Este resultado se basa solo en tus respuestas. En el diagnóstico gratuito lo revisamos contigo con datos de tu operación."

### 4.1 Atraer

| Nivel | Texto |
|---|---|
| Bajo | Hoy tus prospectos llegan sobre todo por recomendación, así que es difícil prever cuántos tendrás cada mes. Siguiente paso: elige un canal digital (búsqueda en Google o anuncios en Meta) y define un presupuesto de prueba con fecha de revisión. |
| Medio | Ya tienes presencia digital, pero depende de un solo canal o de esfuerzos por temporadas. Siguiente paso: revisa en qué búsquedas de tu servicio apareces y arma un calendario fijo para el canal que ya te trae solicitudes. |
| Alto | Tienes canales activos y apareces cuando buscan tu servicio. Siguiente paso: compara cada mes qué canal trae los prospectos que terminan comprando y reparte el presupuesto con ese dato. |

### 4.2 Convertir

| Nivel | Texto |
|---|---|
| Bajo | Tus prospectos quedan repartidos en correos, chats u hojas sueltas, y así es fácil que alguno se quede sin respuesta. Siguiente paso: junta todos en un solo lugar compartido, con responsable y etapa, aunque empieces con una hoja de cálculo. |
| Medio | Ya registras prospectos, pero el registro o la respuesta dependen de quién los recibe. Siguiente paso: acuerda con tu equipo un tiempo máximo de respuesta y revisa cada semana qué prospectos siguen sin seguimiento. |
| Alto | Tu equipo registra y responde con orden. Siguiente paso: revisa en qué etapa se detienen más prospectos y ajusta esa parte del proceso o de tu sitio. |

### 4.3 Medir

| Nivel | Texto |
|---|---|
| Bajo | Hoy es difícil saber qué parte de tu inversión trae prospectos, porque las conversiones no se registran o no se cruzan entre herramientas. Siguiente paso: configura el registro de formularios y clics a WhatsApp en tu sitio antes de subir el presupuesto de anuncios. |
| Medio | Tienes algunos números, pero se arman a mano o no separan por canal. Siguiente paso: calcula durante un mes el costo por lead de cada canal con los datos que ya tienes. |
| Alto | Mides el costo por lead y tus conversiones llegan a las plataformas de anuncios. Siguiente paso: agrega al tablero cuántos prospectos se vuelven clientes por canal, para que las decisiones de inversión consideren las ventas cerradas. |

### 4.4 Automatizar

| Nivel | Texto |
|---|---|
| Bajo | El paso de prospecto a vendedor depende de que alguien copie, avise y recuerde. Siguiente paso: anota las tareas que se repiten cada semana y elige una para automatizar primero, por ejemplo el aviso al vendedor cuando llega un prospecto. |
| Medio | Ya automatizaste algunas tareas, pero tus herramientas no comparten datos y quedan pasos manuales entre ellas. Siguiente paso: dibuja el recorrido de un prospecto desde que llega hasta la cotización y marca dónde alguien copia información a mano. |
| Alto | Tus tareas repetitivas corren solas y tus herramientas comparten datos. Siguiente paso: revisa cada trimestre que los flujos sigan vigentes y define quién responde si uno falla. |

### 4.5 Textos especiales

| Caso | Titular | Texto |
|---|---|---|
| Los cuatro pilares en 10 (`ninguno`) | Tus procesos están ordenados en los cuatro pilares | Según tus respuestas, ya atraes, registras, mides y automatizas con método. Si quieres una segunda opinión, en el diagnóstico gratuito revisamos contigo tus campañas y tu CRM. |
| Los cuatro pilares en 0 | Tu mayor oportunidad está en Convertir | Estás al inicio en los cuatro pilares. Conviene empezar por registrar cada prospecto en un solo lugar, porque sin ese registro cualquier inversión en atraer es difícil de evaluar. (Debajo se muestran los textos de nivel bajo de cada pilar.) |

## 5. Precarga del formulario

Al pulsar "Llevar mi resultado al formulario", el componente baja al formulario de la misma página, marca casillas de `servicios[]` y escribe `necesidad`. La persona puede editar o borrar todo antes de enviar.

### 5.1 Campos que se precargan y campos que no

| Campo | ¿Se precarga? | Motivo |
|---|---|---|
| `servicios[]` (`#f-servicios`, `.checks input[data-zoho]`) | Sí, de 1 a 3 casillas | Sale directo del resultado |
| `necesidad` (`#f-necesidad`) | Sí, máximo 300 caracteres | Resumen del resultado para el equipo comercial |
| `solicitante` (`empresa`, `emprendimiento`, `personal`, `empleo`, `proveedor`) | No | El diagnóstico no lo pregunta |
| `tamano` (`1_10`, `11_50`, `51_200`, `200_plus`) | No | El diagnóstico no lo pregunta y el motor suma puntos por tamaño (`PUNTOS_TAMANO`): adivinarlo alteraría el `lead_score` |
| `presupuesto` (`sin_definir`, `menos_10k`, `10k_25k`, `25k_50k`, `mas_50k`) | No | Mismo motivo (`PUNTOS_PRESUPUESTO`) |

### 5.2 Servicios por pilar (valores literales de `SERVICIOS`)

Los textos van tal cual están en `lib/lead-quality/schema.js`, incluida la errata "Reediseño": es el valor del contrato con el HTML y con n8n y no se corrige en el componente.

| Pilar | Servicios, en orden de prioridad |
|---|---|
| Atraer | `Publicidad Digital`, `SEO y Posicionamiento` |
| Convertir | `Implementación de CRM`; además `Reediseño / Desarrollo página web` solo si C3 (`convertir_3`) vale 0 o 1 |
| Medir | `Dashboards y reportes` |
| Automatizar | `Automatización de procesos` |

### 5.3 Regla de selección

1. Se marcan todos los servicios del pilar de mayor oportunidad.
2. Después, recorriendo los demás pilares de menor a mayor (criterio de la sección 3.4), se agregan los servicios de los que estén en nivel bajo, uno por uno y en su orden de prioridad, hasta llegar a 3 casillas.
3. Tope: 3 casillas. Motivo verificado en `lib/lead-quality/engine.js`: con 1 a 3 servicios el lead suma 5 puntos (línea 241) y con los 6 se activa la señal de spam `all_services` (línea 190).
4. Si `pilar_oportunidad = 'ninguno'`, no se marca ninguna casilla (el formulario exige al menos una, así que la persona elige).
5. Si alguna casilla ya estaba marcada por la persona antes de pulsar el botón, se respeta (ver sección 7, cambio de respuestas).

Ejemplos:

| Resultado | Casillas marcadas |
|---|---|
| Todo en 0 (Convertir con C3 = 0; luego Medir) | `Reediseño / Desarrollo página web`, `Implementación de CRM`, `Dashboards y reportes` |
| Medir 2, Automatizar 3, Atraer 7, Convertir 8 | `Dashboards y reportes`, `Automatización de procesos` |
| Atraer 3, los demás en medio o alto | `Publicidad Digital`, `SEO y Posicionamiento` |
| Los cuatro en 10 | Ninguna |

### 5.4 Texto de `necesidad`

Plantilla, en primera persona porque la firma quien envía:

```
Hice el diagnóstico de madurez digital. Atraer {a}/10, Convertir {c}/10, Medir {m}/10, Automatizar {u}/10. Mayor oportunidad: {Pilar}. {Frase}
```

| `pilar_oportunidad` | {Pilar} | {Frase} |
|---|---|---|
| `atraer` | Atraer | Quiero revisar qué canal conviene para conseguir prospectos de forma constante. |
| `convertir` | Convertir | Quiero ordenar cómo registramos y respondemos a los prospectos. |
| `medir` | Medir | Quiero saber cuánto nos cuesta cada prospecto y qué canal funciona mejor. |
| `automatizar` | Automatizar | Quiero reducir las tareas manuales entre la llegada del prospecto y la venta. |
| `ninguno` | Ninguna | Quiero una segunda opinión sobre lo que ya tenemos funcionando. |

Largo máximo resultante: 212 caracteres (cota superior, caso `automatizar` con los cuatro puntajes de dos dígitos; verificado con Node), por debajo del tope de 300 de este componente y de los 2000 del esquema. El contador `#f-necesidad-contador` se actualiza al precargar.

Efecto en el puntaje del lead, a decidir por José: el motor suma 10 puntos cuando `necesidad` tiene 20 caracteres o más sin tecleo al azar (`engine.js`, línea 250). El texto precargado cumple esa condición, así que quien llega desde el diagnóstico obtiene esos 10 puntos aunque no escriba nada propio. Recomendación: aceptarlo, porque completar 10 preguntas es una señal de intención real, y revisar en Notion CRM durante el primer mes si esos leads se comportan distinto. La alternativa exige tocar `lib/lead-quality/`, que el contrato marca como intocable.

### 5.5 Mecánica (para la construcción)

- Marcar cada casilla con `input.checked = true`, aplicar la clase `.chk.on` a su contenedor y disparar `change` con `bubbles: true`, para que el JS del formulario vea el cambio.
- Escribir `#f-necesidad` y disparar `input` para actualizar el contador.
- Hacer scroll al formulario y llevar el foco a `#f-solicitante`. Ese foco dispara `rl_form_start` por la vía normal (`focusin` en `#lead-form`).
- Mostrar un aviso breve sobre el formulario: "Precargamos tus servicios y un resumen de tu resultado. Puedes cambiar todo antes de enviar."

## 6. Tracking

Ambos eventos se envían con `window.RL.pushEvent(nombre, datos)` de `js/rl-tracking.js`, que primero empuja `{rl_event_data: null}` (reset C-13), omite las claves vacías y agrega `event_id` (C-15). Si `window.RL` no existe (tracking bloqueado), el componente funciona igual y no envía nada.

| Evento | Cuándo | Parámetros |
|---|---|---|
| `rl_tool_start` | Al responder la primera pregunta, una vez por carga de página | `tool_id: 'diagnostico_madurez'`, `question_count: 10` |
| `rl_tool_complete` | La primera vez que se muestra el resultado en esa carga de página | `tool_id: 'diagnostico_madurez'`, `score_atraer`, `score_convertir`, `score_medir`, `score_automatizar` (enteros 0 a 10), `pilar_oportunidad` (`atraer`, `convertir`, `medir`, `automatizar` o `ninguno`), `question_count: 10` |

```js
if (window.RL) window.RL.pushEvent('rl_tool_complete', {
  tool_id: 'diagnostico_madurez',
  score_atraer: 3, score_convertir: 6, score_medir: 2, score_automatizar: 5,
  pilar_oportunidad: 'medir',
  question_count: 10
});
```

Reglas:

- Sin datos personales: ningún parámetro lleva texto libre ni respuestas individuales; solo puntajes, el pilar y el conteo.
- Las respuestas por pregunta no se envían a GA4.
- Si la persona cambia respuestas después de ver el resultado, no se vuelve a enviar `rl_tool_complete`: el evento registra el primer resultado completo.

Pendiente para F8 (no bloquea esta aprobación):

- Agregar `rl_tool_start` y `rl_tool_complete` a `rl-taxonomy.json` (que se crea en F8, `docs/contrato-integraciones.md`, sección 7) y subir la versión de la taxonomía.
- En GTM `GTM-P3WZC7MV`: dos activadores de evento personalizado, variables de capa de datos `rl_event_data.*` para cada parámetro y etiquetas de evento GA4.
- En GA4: registrar `tool_id` y `pilar_oportunidad` como dimensiones personalizadas y los cuatro `score_*` como métricas personalizadas.
- Recomendación: marcar `rl_tool_complete` como evento clave secundario en GA4 y no enviarlo como conversión a Google Ads ni a Meta.
- `rl_form_start` y los eventos del formulario hoy fijan `form_location: 'contacto'`. En `/diagnostico` conviene parametrizarlo (`form_location: 'diagnostico'`) para separar los leads que vienen del componente.

## 7. Casos límite

| Caso | Comportamiento |
|---|---|
| Abandona a la mitad | No se envía `rl_tool_complete`. El abandono se mide como `rl_tool_start` sin `rl_tool_complete`. Las respuestas se guardan en `sessionStorage` (llave `rl_diag_v1`, solo los puntos por pregunta) para retomar si recarga la página en la misma pestaña; toda lectura y escritura va en `try/catch` y, si falla, empieza desde cero. No se usa `beforeunload` |
| Responde todo en 0 | Los cuatro pilares en 0, nivel bajo. Desempate por orden fijo: Convertir. Titular y texto especial de la sección 4.5. Precarga: `Reediseño / Desarrollo página web`, `Implementación de CRM`, `Dashboards y reportes` |
| Responde todo en 3 | Los cuatro pilares en 10. `pilar_oportunidad = 'ninguno'`, texto especial de la sección 4.5, ninguna casilla marcada y `necesidad` con la frase de `ninguno` |
| Regresa y cambia respuestas antes del resultado | "Atrás" muestra la pregunta anterior con su respuesta marcada. Cambiarla no envía eventos. El resultado se calcula con las respuestas finales |
| Cambia respuestas después del resultado | "Cambiar respuestas" vuelve a la pregunta 1 con todo marcado. Al terminar, se recalculan puntajes, textos y precarga; no se reenvía `rl_tool_complete`. Si ya precargó y luego editó el formulario, al volver a pulsar el botón solo se reemplaza `necesidad` cuando sigue igual al último texto precargado o está vacía, y solo se cambian las casillas cuando siguen igual a la última precarga; si la persona las tocó, se respetan y se muestra "Conservamos lo que escribiste" |
| JS desactivado | El contenedor de preguntas va con `hidden` y solo se muestra cuando carga el JS. En su lugar, un bloque estático con el texto "Para usar el diagnóstico necesitas JavaScript activado. Puedes ir directo al formulario o escribirnos por WhatsApp." y dos enlaces: "Ir al formulario" (`#contacto`) y WhatsApp (`https://wa.me/525548213439`). El WhatsApp es necesario porque el formulario también depende de JS (token y envío por `fetch`) |
| Tracking bloqueado | El componente funciona igual; los eventos no se envían |
| Elige un solicitante no comercial | Si la persona elige `empleo`, `proveedor` o `personal`, el formulario oculta los campos comerciales como hoy (`[data-solo-comercial]`) y la precarga deja de enviarse; aplica el flujo de `rl_non_commercial_submit` |

## 8. Aprobación de José

Marca cada casilla y deja la fecha. Si algo cambia, anótalo en la columna de comentarios y Claude ajusta el borrador antes de construir.

| Elemento | Sección | Aprobado | Comentarios | Fecha |
|---|---|---|---|---|
| Lugar en el sitio y textos de entrada | 1 | [ ] | | |
| Preguntas y opciones (10) | 2 | [ ] | | |
| Puntos por opción (0 a 3) | 2 | [ ] | | |
| Ponderación: pilares iguales, preguntas iguales dentro del pilar | 3.1 | [ ] | | |
| Normalización y redondeo a 0 a 10 | 3.2 | [ ] | | |
| Cortes de nivel (bajo 0 a 3, medio 4 a 6, alto 7 a 10) | 3.3 | [ ] | | |
| Desempate del pilar de mayor oportunidad | 3.4 | [ ] | | |
| Textos de resultado por pilar y nivel | 4.1 a 4.4 | [ ] | | |
| Textos especiales (todo 10, todo 0) | 4.5 | [ ] | | |
| Servicios por pilar y tope de 3 casillas | 5.2 y 5.3 | [ ] | | |
| Texto precargado de `necesidad` | 5.4 | [ ] | | |
| Efecto de +10 puntos en el `lead_score` por `necesidad` precargada | 5.4 | [ ] | | |
| Eventos `rl_tool_start` y `rl_tool_complete` | 6 | [ ] | | |

Firma de aprobación: ______________________ (José Luis Vázquez) · Fecha: ____________
