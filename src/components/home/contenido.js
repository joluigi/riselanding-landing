// Copy de la home que se reutiliza en más de un lugar (marcado visible y JSON-LD).
// Origen: docs/wireframes/home.md. Las frases marcadas [VERIFICAR] o [PRUEBA PENDIENTE] en el
// borrador se publican en versión neutra o se quitan; cada caso está en docs/copy/pendientes-home.md.

export const TITULO = 'Agencia de generación de leads B2B en México | Riselanding';

export const DESCRIPCION = 'Generación de leads B2B en México: campañas, CRM, automatización y medición con un solo equipo responsable de cada etapa. Agenda tu diagnóstico sin costo.';

// Preguntas frecuentes visibles. El JSON-LD FAQPage se arma con esta misma lista (sitemap §7.9).
// "¿Hay plazo forzoso?" se retiró hasta que José responda la pregunta 8 del cuestionario.
export const PREGUNTAS = [
  {
    pregunta: '¿Cuánto cuesta trabajar con Riselanding?',
    respuesta: 'Cotizamos según el alcance que definimos en el diagnóstico. En la propuesta separamos nuestros honorarios de la inversión en pauta, si tu plan la incluye.'
  },
  {
    pregunta: '¿En cuánto tiempo veo resultados?',
    respuesta: 'Depende de la etapa en la que empecemos. En el plan te damos fechas por entregable y los indicadores que vamos a revisar en cada una, para que sepas qué esperar y cuándo.'
  },
  {
    pregunta: 'Ya tengo CRM y otras herramientas. ¿Tengo que cambiarlas?',
    respuesta: 'Partimos de lo que ya usas. Si tu CRM sirve para tu proceso, lo reordenamos y lo conectamos con tus formularios y campañas. Solo proponemos migrar cuando seguir con la herramienta actual cuesta más.'
  },
  {
    pregunta: '¿Trabajan con empresas fuera de la Ciudad de México?',
    respuesta: 'Sí. Trabajamos de forma remota con videollamadas y un canal directo por WhatsApp.'
  },
  {
    pregunta: '¿Cómo reportan los resultados?',
    respuesta: 'En el plan acordamos contigo qué indicadores revisamos, como leads, costo por lead y avance del pipeline, además del formato y la frecuencia de cada revisión.'
  }
];

// Equipo (sección #nosotros). Roles según docs/brief.md; el rol exacto se confirma en la
// pregunta 16 del cuestionario. Las fotos se muestran solas cuando existan los archivos
// (ver src/components/home/Nosotros.astro).
export const EQUIPO = [
  { nombre: 'José Luis Vázquez', rol: 'Socio · Medición y SEO', foto: 'jose.webp' },
  { nombre: 'Rut Mariñelarena', rol: 'Socia · Implementación', foto: 'rut.webp' }
];

export const HERRAMIENTAS = ['Google Ads', 'Meta Ads', 'GA4', 'HubSpot', 'Zoho CRM', 'Notion', 'n8n'];

export const PASOS = [
  { titulo: 'Diagnóstico', texto: 'Revisamos tus campañas, sitio, CRM y medición actuales para ubicar dónde se pierden prospectos.' },
  { titulo: 'Plan', texto: 'Priorizamos acciones por impacto y esfuerzo, con presupuesto, responsables y fechas.' },
  { titulo: 'Implementación', texto: 'Configuramos campañas, páginas, CRM y automatizaciones, con medición desde el primer día.' },
  { titulo: 'Optimización', texto: 'Revisamos resultados con la frecuencia que acordamos en el plan, ajustamos lo que rinde menos y compartimos contigo los datos completos.' }
];
