// Copy de /servicios/google-ads (docs/wireframes/google-ads.md), listo para Servicio.astro.
// Afirmaciones con [VERIFICAR] o [PRUEBA PENDIENTE] fuera: ver docs/copy/pendientes-servicios.md.
// Formato de campos: ver src/data/servicios/crm.js. La sección #landing es la mención corta que pide
// la regla de canibalización 2 (docs/seo/mapa-urls.md §4); su enlace aparece al publicar landing-pages.

export default {
  slug: 'google-ads',
  title: 'Agencia de Google Ads para empresas B2B | Riselanding',
  description: 'Agencia de Google Ads para empresas B2B en México: campañas de búsqueda, landing por campaña y medición hasta el lead calificado. Agenda tu diagnóstico.',

  hero: {
    eyebrow: 'Atraer',
    h1: 'Agencia de Google Ads para empresas B2B',
    bajada: 'Planeamos y operamos tus campañas de búsqueda con una página de destino por campaña, optimización continua y medición hasta el lead calificado que llega a tu CRM.',
    maqueta: {
      tipo: 'campanas',
      titulo: 'Google Ads · Campañas de búsqueda',
      encabezado: 'Grupos de anuncios',
      subtitulo: 'Búsqueda B2B',
      columnas: ['Clics', 'Leads', 'Calificados'],
      grupos: [
        { nombre: 'Mantenimiento industrial', tipo: 'Búsqueda', valores: [412, 31, 14] },
        { nombre: 'Refacciones para planta', tipo: 'Búsqueda', valores: [286, 19, 9] },
        { nombre: 'Marca', tipo: 'Búsqueda', valores: [97, 12, 7] }
      ],
      anuncio: {
        url: 'ejemplo.mx/mantenimiento-industrial',
        titulo: 'Mantenimiento industrial para tu planta | Agenda una visita técnica',
        texto: 'Servicio programado y de emergencia para plantas de manufactura. Cotiza con un ingeniero.'
      }
    }
  },

  problema: {
    h2: 'Pagas clics y tu equipo comercial no ve más clientes.',
    situaciones: [
      'Muchos de los formularios que llegan son spam o proveedores ofreciendo sus servicios.',
      'Nadie sabe qué búsquedas trajeron a los clientes que sí cerraron.',
      'La agencia anterior solo reportaba clics e impresiones.',
      'Todos los anuncios llevan a la página de inicio.'
    ]
  },

  enfoque: {
    h2: 'Campañas de búsqueda medidas hasta la oportunidad de venta.',
    bajada: 'Le enseñamos a Google qué solicitudes valen la pena, para que la inversión se mueva hacia las búsquedas que traen clientes.',
    bloques: [
      { icono: 'search', titulo: 'Estructura por intención', texto: 'Un grupo de anuncios por servicio y por tipo de búsqueda, con keywords negativas desde el primer día para no pagar por empleo, cursos o autoservicio.' },
      { icono: 'megaphone', titulo: 'Anuncios que dicen lo mismo que la página', texto: 'El texto del anuncio, el titular de la página y la oferta coinciden, lo que ayuda al nivel de calidad y a la tasa de conversión.' },
      { icono: 'chart', titulo: 'Medición hasta el lead calificado', texto: 'Configuramos conversiones en Google Tag Manager y GA4 con la calificación de cada solicitud, para que las campañas optimicen por oportunidades reales.' },
      { icono: 'trending-up', titulo: 'Optimización continua', texto: 'Revisamos términos de búsqueda, pujas y anuncios de forma constante, y te explicamos qué cambiamos y por qué.' }
    ],
    enlace: { texto: 'Ver qué recibes', href: '#entregables' }
  },

  landing: {
    h3: 'Una página de destino para cada campaña',
    texto: 'Cada grupo de anuncios aterriza en una página escrita para esa búsqueda, con formulario de 2 pasos y filtro de calidad. Si todavía no la tienes, la construimos como parte del arranque.',
    enlace: { slug: 'landing-pages', texto: 'Landing page para Google Ads' }
  },

  entregables: {
    h2: 'Qué recibes',
    items: [
      'Auditoría de tu cuenta actual de Google Ads, si ya tienes una.',
      'Estructura de campañas, keywords y negativas, documentada.',
      'Anuncios de búsqueda y extensiones redactados para cada grupo.',
      'Conversiones configuradas en Google Tag Manager y GA4.',
      'Reporte con leads, leads calificados y costo por lead calificado.',
      'Revisión periódica de términos de búsqueda y pujas.'
    ]
  },

  proceso: {
    eyebrow: 'Cómo trabajamos',
    h2: 'Cuatro pasos antes y después de encender las campañas.',
    pasos: [
      { titulo: 'Diagnóstico', texto: 'Revisamos tu cuenta, tu sitio y cómo mides hoy, y estimamos el costo por clic de tus búsquedas principales.' },
      { titulo: 'Plan', texto: 'Definimos servicios a anunciar, presupuesto de pauta, estructura y la página de destino de cada campaña.' },
      { titulo: 'Lanzamiento', texto: 'Configuramos medición, publicamos anuncios y revisamos de cerca los primeros términos de búsqueda.' },
      { titulo: 'Optimización', texto: 'Ajustes periódicos y un reporte con lo que funcionó, lo que cortamos y el siguiente paso.' }
    ]
  },

  herramientas: {
    eyebrow: 'Herramientas que operamos',
    lista: ['Google Ads', 'Google Tag Manager', 'GA4', 'HubSpot', 'Zoho CRM']
  },

  faq: {
    h2: 'Preguntas frecuentes sobre Google Ads',
    preguntas: [
      {
        pregunta: '¿Cuánto debo invertir en Google Ads?',
        respuesta: 'Depende del costo por clic de tus búsquedas y de cuántos prospectos necesitas al mes. En el diagnóstico estimamos contigo un presupuesto de pauta inicial.'
      },
      {
        pregunta: '¿En cuánto tiempo veo resultados?',
        respuesta: 'Las campañas reciben clics desde que se activan. El primer periodo sirve para depurar búsquedas y para que el algoritmo aprenda qué solicitudes valen la pena.'
      },
      {
        pregunta: '¿Qué es una agencia SEM y en qué se diferencia de Google Ads?',
        respuesta: 'SEM es marketing en buscadores con anuncios pagados. En México se usa casi como sinónimo de Google Ads, que es la plataforma donde operamos esas campañas.'
      },
      {
        pregunta: '¿También manejan Facebook e Instagram?',
        respuesta: 'Sí. En Meta Ads trabajamos con audiencias y creativos, así que lleva su propia estructura de campañas y su propia medición.'
      },
      {
        pregunta: '¿Qué reportes recibo?',
        respuesta: 'Un reporte con inversión, leads, leads calificados y costo por lead calificado. La frecuencia y el formato los acordamos contigo al arrancar.'
      }
    ]
  },

  contacto: {
    titulo: 'Cuéntanos qué vendes y te decimos cómo arrancaríamos tus campañas.'
  },

  relacionados: ['sitio-web', 'crm', 'meta-ads', 'landing-pages']
};
