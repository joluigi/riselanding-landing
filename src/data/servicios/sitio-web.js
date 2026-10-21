// Copy de /servicios/sitio-web (docs/wireframes/sitio-web.md), listo para Servicio.astro.
// Afirmaciones con [VERIFICAR] o [PRUEBA PENDIENTE] fuera: ver docs/copy/pendientes-servicios.md.
// Formato de campos: ver src/data/servicios/crm.js.
// Regla de canibalización 1: esta página usa "empresa" y "corporativo", nunca "negocio".

export default {
  slug: 'sitio-web',
  title: 'Desarrollo de sitio web corporativo en México | Riselanding',
  description: 'Desarrollo de sitio web corporativo y rediseño de página web para empresas B2B, rápido en celular y conectado a tu CRM. Agenda tu diagnóstico sin costo.',

  hero: {
    eyebrow: 'Convertir',
    h1: 'Desarrollo de sitio web corporativo para tu empresa',
    bajada: 'Diseñamos y construimos tu sitio para que cargue rápido en celular, explique tu oferta con claridad y envíe cada solicitud a tu CRM con su origen.',
    maqueta: {
      tipo: 'sitio',
      titulo: 'ejemplo.mx',
      marca: 'Industrias Tavira',
      titular: 'Mantenimiento industrial para tu planta',
      boton: 'Cotiza tu servicio',
      campos: ['Nombre', 'Empresa', 'Correo'],
      lead: { etiqueta: 'Nuevo lead en el CRM', empresa: 'Distribuidora Ocotal', origen: 'Origen: Google Ads · Formulario' }
    }
  },

  problema: {
    h2: 'Tu sitio debería ayudarte a vender.',
    situaciones: [
      'Da pena mandarle el enlace del sitio a un prospecto.',
      'Las solicitudes llegan a un correo que nadie revisa.',
      'Para cambiar un texto hay que esperar al proveedor.',
      'Nadie sabe cuántas visitas se vuelven contactos.'
    ]
  },

  enfoque: {
    h2: 'Un sitio pensado para el prospecto que llega desde Google o desde un anuncio.',
    bajada: 'Empezamos por lo que tu cliente necesita saber para pedir una cotización y construimos alrededor de eso.',
    bloques: [
      { icono: 'layout', titulo: 'Estructura y mensaje', texto: 'Una página por servicio con su propia búsqueda objetivo, textos claros y un solo siguiente paso en cada página.' },
      { icono: 'globe', titulo: 'Diseño de tu marca', texto: 'Diseño a la medida con tu identidad, probado primero en celular.' },
      { icono: 'message', titulo: 'Formularios que llegan al CRM', texto: 'Formulario de 2 pasos con filtro de calidad, conectado a tu CRM con el origen de cada solicitud.' },
      { icono: 'chart', titulo: 'SEO técnico y medición', texto: 'Velocidad, datos estructurados, sitemap y medición con GA4 y Google Tag Manager desde el lanzamiento.' },
      { icono: 'trending-up', titulo: 'Rediseño de página web', texto: 'Si ya tienes sitio, inventariamos tus URLs y configuramos redirecciones para conservar lo que ya posiciona.' }
    ],
    enlace: { texto: 'Ver qué recibes', href: '#entregables' }
  },

  entregables: {
    h2: 'Qué recibes',
    items: [
      'Mapa del sitio y estructura de cada página aprobados antes del diseño.',
      'Diseño en celular y escritorio con tu identidad de marca.',
      'Sitio desarrollado y publicado, con certificado de seguridad.',
      'Formulario conectado a tu CRM y filtro de calidad de solicitudes.',
      'Medición con GA4 y Google Tag Manager, con las conversiones configuradas.',
      'SEO técnico base: títulos, descripciones, datos estructurados, sitemap y redirecciones si es rediseño.'
    ]
  },

  proceso: {
    eyebrow: 'Cómo trabajamos',
    h2: 'Del mapa del sitio al lanzamiento, con tu aprobación en cada paso.',
    pasos: [
      { titulo: 'Brief y arquitectura', texto: 'Definimos objetivos, páginas, mensajes y búsquedas objetivo de cada página.' },
      { titulo: 'Diseño', texto: 'Diseñamos primero en celular y te mostramos la página principal antes de seguir con las demás.' },
      { titulo: 'Desarrollo', texto: 'Construimos, conectamos formulario, CRM y medición, y revisamos velocidad y accesibilidad.' },
      { titulo: 'Lanzamiento', texto: 'Publicamos, revisamos que cada formulario y cada conversión funcionen, y damos de alta el sitio en Google Search Console.' }
    ]
  },

  herramientas: {
    eyebrow: 'Herramientas que usamos',
    lista: ['Astro', 'Vercel', 'Google Tag Manager', 'GA4', 'Google Search Console', 'HubSpot', 'Zoho CRM']
  },

  faq: {
    h2: 'Preguntas frecuentes sobre desarrollo de sitio web corporativo',
    preguntas: [
      {
        pregunta: '¿Cuánto cuesta un sitio web corporativo?',
        respuesta: 'Depende del número de páginas, las integraciones y si hay contenido por escribir. Cotizamos según el alcance que definimos contigo en el diagnóstico.'
      },
      {
        pregunta: '¿Cuánto tarda el desarrollo?',
        respuesta: 'Te damos un calendario con fecha para cada entrega desde el arranque. El plazo depende sobre todo de que tengamos textos e imágenes a tiempo.'
      },
      {
        pregunta: '¿Hacen rediseño de página web?',
        respuesta: 'Sí. Revisamos tu sitio actual, conservamos lo que ya posiciona y configuramos redirecciones para no perder tráfico de Google.'
      },
      {
        pregunta: '¿El sitio se conecta con mi CRM?',
        respuesta: 'Sí. El formulario envía cada solicitud a tu CRM con su origen, y la medición con GA4 y Google Tag Manager queda configurada desde el lanzamiento.'
      },
      {
        pregunta: '¿El sitio incluye SEO?',
        respuesta: 'Incluye el SEO técnico base para que Google pueda leer y mostrar bien tu sitio. El posicionamiento continuo con contenido es un servicio aparte.'
      }
    ]
  },

  contacto: {
    titulo: 'Cuéntanos qué necesita tu sitio y te decimos por dónde empezar.'
  },

  relacionados: ['crm', 'google-ads', 'landing-pages', 'seo']
};
