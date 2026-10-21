// Copy de /servicios/crm (docs/wireframes/crm.md), listo para src/layouts/Servicio.astro.
// Las afirmaciones marcadas [VERIFICAR] o [PRUEBA PENDIENTE] en el borrador no se publican: cada
// cambio está registrado en docs/copy/pendientes-servicios.md con su pregunta del cuestionario.
// Tracking, servicio precargado y anclajes salen de src/data/servicios.js (slug 'crm').
//
// Campos propios de estos archivos (no existen en src/data/servicios.js):
// title, description, hero, problema, enfoque, landing, prueba, entregables, proceso, herramientas,
// faq, contacto y relacionados. En textos con enlace, un objeto { slug, texto } se pinta como enlace
// solo si el servicio destino ya está publicado; si no, queda como texto plano.

export default {
  slug: 'crm',
  title: 'Implementación de CRM con HubSpot y Zoho | Riselanding',
  description: 'Implementación de CRM con HubSpot o Zoho a la medida de tu proceso de venta, conectado a tus formularios y campañas. Agenda tu diagnóstico sin costo.',

  hero: {
    eyebrow: 'Convertir',
    h1: 'Implementación de CRM para tu equipo de ventas',
    bajada: 'Configuramos HubSpot o Zoho CRM con el proceso que ya sigue tu equipo, lo conectamos con tus formularios y campañas, y acompañamos a tus vendedores mientras empiezan a usarlo.',
    maqueta: {
      tipo: 'pipeline',
      titulo: 'CRM · Pipeline comercial',
      encabezado: 'Oportunidades',
      subtitulo: 'Pipeline B2B',
      etapas: [
        { nombre: 'Nuevo', tarjetas: [
          { empresa: 'Industrias Tavira', area: 'Compras', origen: 'Google Ads' },
          { empresa: 'Distribuidora Ocotal', area: 'Dirección', origen: 'Formulario' }
        ] },
        { nombre: 'Calificado', tarjetas: [
          { empresa: 'Transportes Cedral', area: 'Operaciones', origen: 'WhatsApp' },
          { empresa: 'Clínica Valdivia', area: 'Administración', origen: 'Google Ads' }
        ] },
        { nombre: 'Propuesta', tarjetas: [
          { empresa: 'Constructora Ámbar', area: 'Dirección', origen: 'Formulario' }
        ] },
        { nombre: 'Ganado', tarjetas: [
          { empresa: 'Grupo Lumbre', area: 'Comercial', origen: 'Google Ads', ganado: true }
        ] }
      ]
    }
  },

  problema: {
    h2: 'Si el CRM no refleja cómo vendes, el equipo deja de usarlo.',
    situaciones: [
      'Los prospectos llegan por WhatsApp, correo y formulario, y nadie sabe cuál ya se atendió.',
      'Cada vendedor lleva su propio Excel.',
      'La empresa paga licencias de CRM que casi nadie abre.',
      'Para saber cuánto hay en el pipeline, alguien tiene que armar un reporte.'
    ]
  },

  enfoque: {
    h2: 'Diseñamos el CRM alrededor de tu proceso de venta.',
    bajada: 'Antes de configurar una sola propiedad, entendemos cómo entra un prospecto, quién lo atiende y qué tiene que pasar para que avance.',
    bloques: [
      { icono: 'workflow', titulo: 'Mapeo del proceso', texto: 'Documentamos tus etapas de venta, los criterios para pasar de una a otra y quién es responsable en cada momento.' },
      { icono: 'layout', titulo: 'Configuración a la medida', texto: 'Pipeline, campos, vistas por rol y permisos, con lo mínimo que tu equipo necesita capturar para que el seguimiento sea útil.' },
      { icono: 'code', titulo: 'Integraciones', texto: [
        'Los formularios de tu sitio y tus campañas llegan al CRM con su origen. El seguimiento automático lo resolvemos con ',
        { slug: 'automatizacion', texto: 'automatización de ventas' },
        '.'
      ] },
      { icono: 'users', titulo: 'Adopción del equipo', texto: 'Capacitación por rol, una guía corta de uso y una revisión con dirección para ajustar lo que el equipo no está usando.' }
    ],
    enlace: { texto: 'Ver qué recibes', href: '#entregables' }
  },

  entregables: {
    h2: 'Qué recibes al terminar la implementación',
    items: [
      'Mapa de tu proceso comercial con etapas, criterios de avance y responsables.',
      'CRM configurado: pipeline, campos, vistas y permisos por rol.',
      'Importación de tus contactos y oportunidades actuales desde Excel u otro CRM.',
      'Formularios del sitio conectados al CRM, con el origen de cada lead.',
      'Vista de pipeline para dirección.',
      'Capacitación por rol y guía de uso.'
    ]
  },

  proceso: {
    eyebrow: 'Cómo trabajamos',
    h2: 'Cuatro pasos para que tu equipo adopte el CRM.',
    pasos: [
      { titulo: 'Diagnóstico', texto: 'Revisamos tu proceso de venta, las herramientas que usas y dónde se pierde el seguimiento.' },
      { titulo: 'Diseño', texto: 'Definimos etapas, campos, integraciones y la plataforma que mejor encaja contigo.' },
      { titulo: 'Implementación', texto: 'Configuramos, importamos datos, conectamos formularios y probamos con casos reales de tu equipo.' },
      { titulo: 'Adopción y ajuste', texto: 'Capacitamos por rol y ajustamos con lo que vemos en el uso diario del equipo.' }
    ]
  },

  herramientas: {
    eyebrow: 'Herramientas que operamos',
    lista: ['HubSpot', 'Zoho CRM', 'Notion', 'n8n', 'GA4']
  },

  faq: {
    h2: 'Preguntas frecuentes sobre implementación de CRM',
    preguntas: [
      {
        pregunta: '¿Trabajan con HubSpot o con Zoho?',
        respuesta: 'Con los dos. Te recomendamos uno según el tamaño de tu equipo, tu presupuesto de licencias y las herramientas que ya usas.'
      },
      {
        pregunta: 'Ya tengo un CRM. ¿Tengo que cambiarlo?',
        respuesta: 'Partimos del que tienes. Si la plataforma sirve para tu proceso, la reordenamos; solo proponemos migrar cuando mantenerla sale más caro.'
      },
      {
        pregunta: '¿Cuánto tarda una implementación de CRM?',
        respuesta: 'Depende del número de etapas, usuarios e integraciones. Después del diagnóstico te entregamos un calendario con fecha para cada entregable.'
      },
      {
        pregunta: '¿Pueden migrar mis datos de Excel o de otro CRM?',
        respuesta: 'Sí. Cargamos tus contactos y oportunidades antes de que el equipo empiece a usar el CRM. El alcance de la importación lo definimos contigo en el diagnóstico.'
      },
      {
        pregunta: '¿Qué pasa cuando termina la implementación?',
        respuesta: 'Tu equipo se queda con la capacitación por rol y la guía de uso para operarlo. Si más adelante necesitas ajustes o nuevas integraciones, lo revisamos contigo.'
      }
    ]
  },

  contacto: {
    titulo: 'Cuéntanos cómo vendes hoy y te decimos por dónde empezar con tu CRM.'
  },

  // Solo se pintan los publicados; medicion aparece sola al publicar la ola 2
  relacionados: ['automatizacion', 'sitio-web', 'medicion']
};
