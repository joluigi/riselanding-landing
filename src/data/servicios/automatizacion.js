// Copy de /servicios/automatizacion (docs/wireframes/automatizacion.md), listo para Servicio.astro.
// Afirmaciones con [VERIFICAR] o [PRUEBA PENDIENTE] fuera: ver docs/copy/pendientes-servicios.md.
// Formato de campos: ver src/data/servicios/crm.js. En esta página #prueba va antes de #entregables
// porque es la única prueba demostrable del sitio en la ola 1.

export default {
  slug: 'automatizacion',
  title: 'Automatización de procesos para empresas | Riselanding',
  description: 'Automatización de procesos para empresas: captura, calificación y seguimiento de prospectos con n8n, conectados a tu CRM. Agenda tu diagnóstico sin costo.',

  hero: {
    eyebrow: 'Automatizar',
    h1: 'Automatización de procesos para empresas',
    bajada: 'Conectamos tus formularios, tu CRM y tu correo con n8n para que cada prospecto se registre y llegue al vendedor correcto en cuanto escribe. Empezamos por el proceso comercial y seguimos con la operación.',
    maqueta: {
      tipo: 'flujo',
      titulo: 'Flujo · Nuevo prospecto desde el sitio',
      nodos: [
        { icono: 'message', tipo: 'Disparador', nombre: 'Formulario', detalle: 'Solicitud de diagnóstico recibida' },
        { icono: 'check', tipo: 'Condición', nombre: 'Calificación', detalle: 'Reglas definidas con tu equipo' },
        { icono: 'users', tipo: 'Acción', nombre: 'CRM', detalle: 'Crea contacto y oportunidad' },
        { icono: 'mail', tipo: 'Acción', nombre: 'Aviso al vendedor', detalle: 'Mensaje al responsable asignado' },
        { icono: 'workflow', tipo: 'Espera', nombre: 'Seguimiento', detalle: 'Recordatorio si nadie responde' }
      ],
      registro: ['Lead de ejemplo: Distribuidora Ocotal', 'Recorrido completo']
    }
  },

  problema: {
    h2: 'Las tareas repetidas se comen las horas de tu equipo comercial.',
    situaciones: [
      'Los datos del formulario se copian a mano al CRM.',
      'Cada cotización se arma desde cero.',
      'Si alguien escribe el viernes en la tarde, recibe respuesta hasta el lunes.',
      'Nadie se entera cuando una oportunidad lleva días sin movimiento.'
    ]
  },

  enfoque: {
    h2: 'Automatizamos primero lo que más tiempo le quita a tu equipo.',
    bajada: 'Hacemos un inventario de tareas repetidas, las ordenamos por horas invertidas y riesgo de error, y empezamos por las que tocan al cliente.',
    bloques: [
      { icono: 'message', titulo: 'Captura y calificación', texto: 'Cada solicitud de tu sitio o de tus campañas se registra en el CRM con su origen y una calificación según las reglas que definimos contigo.' },
      { icono: 'users', titulo: 'Asignación y seguimiento', texto: 'El prospecto llega al vendedor que corresponde, con avisos cuando una oportunidad se queda quieta. Esta es la base de la automatización de ventas.' },
      { icono: 'code', titulo: 'Integración entre tus herramientas', texto: 'Conectamos el CRM, los formularios, el correo y las hojas de cálculo que ya usas, siempre que tengan API o integración disponible.' },
      { icono: 'mail', titulo: 'Alertas y reportes', texto: 'Avisos en los momentos que importan y un resumen periódico para dirección.' }
    ],
    enlace: { texto: 'Ver qué recibes', href: '#entregables' }
  },

  prueba: {
    eyebrow: 'Lo usamos en este sitio',
    h2: 'El formulario de esta página pasa por una automatización que construimos nosotros.',
    texto: 'Cuando nos dejas tus datos, el flujo revisa la solicitud y la registra en nuestro CRM con su origen, lista para que te contactemos. Es el mismo tipo de flujo que implementamos para nuestros clientes.',
    maqueta: {
      tipo: 'flujo',
      titulo: 'Flujo · Formulario de riselanding.com',
      nodos: [
        { icono: 'message', tipo: 'Disparador', nombre: 'Envías el formulario', detalle: 'Desde cualquier página del sitio' },
        { icono: 'check', tipo: 'Condición', nombre: 'Revisión', detalle: 'Se valida la solicitud' },
        { icono: 'users', tipo: 'Acción', nombre: 'Nuestro CRM', detalle: 'Registro con su origen' },
        { icono: 'phone', tipo: 'Acción', nombre: 'Te contactamos', detalle: 'El equipo ve tu solicitud' }
      ]
    }
  },

  entregables: {
    h2: 'Qué recibes',
    items: [
      'Inventario de procesos con prioridad por tiempo invertido y riesgo de error.',
      'Diseño de cada flujo con sus reglas, excepciones y responsables, validado contigo.',
      'Flujos en n8n probados y documentados.',
      'Integración con tu CRM, tus formularios y tu correo.',
      'Guía de operación y sesión de entrega con tu equipo.'
    ]
  },

  proceso: {
    eyebrow: 'Cómo trabajamos',
    h2: 'Del inventario de tareas al flujo en producción.',
    pasos: [
      { titulo: 'Diagnóstico', texto: 'Listamos las tareas repetidas de tu proceso comercial y medimos cuánto tiempo toman hoy.' },
      { titulo: 'Diseño', texto: 'Dibujamos cada flujo con sus reglas, excepciones y responsables, y lo validamos contigo.' },
      { titulo: 'Construcción', texto: 'Construimos en n8n, probamos con datos reales de tu operación y documentamos.' },
      { titulo: 'Operación y mejora', texto: 'Activamos el flujo, vigilamos errores y sumamos el siguiente proceso de la lista.' }
    ]
  },

  herramientas: {
    eyebrow: 'Herramientas que operamos',
    lista: ['n8n', 'HubSpot', 'Zoho CRM', 'Notion']
  },

  faq: {
    h2: 'Preguntas frecuentes sobre automatización de procesos',
    preguntas: [
      {
        pregunta: '¿Qué es la automatización de procesos para empresas?',
        respuesta: 'Es usar software para que las tareas repetidas de tu operación, como registrar solicitudes, asignarlas y dar seguimiento, ocurran solas con las reglas que defines tú.'
      },
      {
        pregunta: '¿Qué procesos conviene automatizar primero?',
        respuesta: 'Los que se repiten todos los días y tocan al cliente: registrar solicitudes, asignarlas, dar seguimiento y cotizar. Ahí el tiempo ahorrado se nota rápido y el riesgo de error baja.'
      },
      {
        pregunta: '¿Qué es n8n y por qué lo usan?',
        respuesta: 'Es una plataforma para conectar aplicaciones y automatizar tareas. La usamos porque se conecta con casi cualquier herramienta por API, permite flujos con lógica compleja y puede alojarse en un servidor propio.'
      },
      {
        pregunta: '¿Tengo que cambiar mis herramientas?',
        respuesta: 'No necesariamente. Conectamos las que ya usas, como tu CRM, tu correo o tus hojas de cálculo, siempre que tengan API o integración disponible.'
      },
      {
        pregunta: '¿Qué pasa si un flujo falla?',
        respuesta: 'n8n guarda un registro de cada ejecución, así que podemos ver en qué paso falló y corregirlo. Cómo y a quién se avisa de una falla lo definimos contigo al diseñar el flujo.'
      }
    ]
  },

  contacto: {
    titulo: 'Cuéntanos qué tarea le quita más tiempo a tu equipo.'
  },

  relacionados: ['crm', 'sitio-web', 'landing-pages']
};
