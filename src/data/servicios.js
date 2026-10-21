// Fuente única de servicios y pilares (plan F4 §2, sitemap §1, §2 y §7.6).
// La usan el header (panel por pilar), el menú móvil, el footer, la 404, la home, /servicios,
// las páginas de servicio (tracking y precarga del formulario) y los enlaces #relacionados.
//
// servicioForm: texto LITERAL de SERVICIOS en lib/lead-quality/schema.js (data-zoho del formulario).
// null = sin precarga (el esquema no tiene valor para ese servicio y no se toca en el rediseño).
// ola 1 = página publicada; ola 2 = todavía sin página: nunca se enlaza a su URL hasta publicarla.

export const WHATSAPP_URL = 'https://wa.me/525548213439';
export const WHATSAPP_VISIBLE = '+52 55 4821 3439';
export const TELEFONO = '+52 55 5878 8983'; // [VERIFICAR que siga vigente] (sitemap §2, footer)
export const TELEFONO_URL = 'tel:+525558788983';
export const CORREO = 'contacto@riselanding.com';

/** Olas publicadas. Al lanzar la ola 2 basta con cambiar esto a 2. */
export const OLA_PUBLICADA = 1;

export const PILARES = [
  { id: 'atraer', nombre: 'Atraer', descripcion: 'Prospectos calificados desde búsqueda, redes y contenido.' },
  { id: 'convertir', nombre: 'Convertir', descripcion: 'Sitios y procesos que convierten visitas en oportunidades.' },
  { id: 'medir', nombre: 'Medir', descripcion: 'Datos confiables para decidir dónde invertir cada peso.' },
  { id: 'automatizar', nombre: 'Automatizar', descripcion: 'Procesos que corren solos y responden a tiempo.' }
];

// Orden dentro de cada pilar = orden del panel de Servicios y del footer (sitemap §2).
export const SERVICIOS = [
  {
    slug: 'google-ads',
    nombre: 'Google Ads',
    nombreCorto: 'Google Ads',
    pilar: 'atraer',
    ola: 1,
    keyword: 'agencia de google ads',
    anclaje: 'agencia de Google Ads',
    linea: 'Campañas de búsqueda para empresas B2B, medidas hasta el lead calificado.',
    icono: 'search',
    servicioForm: 'Publicidad Digital',
    pageTemplate: 'servicio_google_ads_v1',
    serviceLine: 'publicidad_digital'
  },
  {
    slug: 'meta-ads',
    nombre: 'Meta Ads',
    nombreCorto: 'Meta Ads',
    pilar: 'atraer',
    ola: 2,
    keyword: 'agencia de facebook ads',
    anclaje: 'agencia de Facebook Ads',
    linea: 'Facebook, Instagram y TikTok para generar prospectos, con reportes de contactos y leads calificados.',
    icono: 'megaphone',
    servicioForm: 'Publicidad Digital',
    pageTemplate: 'servicio_meta_ads_v1',
    serviceLine: 'publicidad_digital'
  },
  {
    slug: 'seo',
    nombre: 'SEO',
    nombreCorto: 'SEO',
    pilar: 'atraer',
    ola: 2,
    keyword: 'agencia seo',
    anclaje: 'agencia SEO',
    linea: 'Posicionamiento técnico y de contenido en Google y en motores de IA.',
    icono: 'trending-up',
    servicioForm: 'SEO y Posicionamiento',
    pageTemplate: 'servicio_seo_v1',
    serviceLine: 'web_seo'
  },
  {
    slug: 'sitio-web',
    nombre: 'Sitio web corporativo',
    nombreCorto: 'Sitio web',
    pilar: 'convertir',
    ola: 1,
    keyword: 'desarrollo de sitio web corporativo',
    anclaje: 'desarrollo de sitio web corporativo',
    linea: 'Sitio para tu empresa, rápido en celular y conectado a tu CRM desde el primer día.',
    icono: 'globe',
    servicioForm: 'Reediseño / Desarrollo página web',
    pageTemplate: 'servicio_sitio_web_v1',
    serviceLine: 'web_seo'
  },
  {
    slug: 'landing-pages',
    nombre: 'Landing pages',
    nombreCorto: 'Landing pages',
    pilar: 'convertir',
    ola: 2,
    keyword: 'diseño de landing page',
    anclaje: 'diseño de landing page',
    linea: 'Una página por campaña con formulario de 2 pasos y filtro de calidad.',
    icono: 'layout',
    servicioForm: 'Reediseño / Desarrollo página web',
    pageTemplate: 'servicio_landing_pages_v1',
    serviceLine: 'web_seo'
  },
  {
    slug: 'tienda-en-linea',
    nombre: 'Tienda en línea',
    nombreCorto: 'Tienda en línea',
    pilar: 'convertir',
    ola: 2,
    keyword: 'desarrollo de tienda en línea',
    anclaje: 'desarrollo de tienda en línea',
    linea: 'Tienda conectada a tu CRM y a la medición de ventas.',
    icono: 'cart',
    servicioForm: null,
    pageTemplate: 'servicio_tienda_en_linea_v1',
    serviceLine: 'web_seo'
  },
  {
    slug: 'crm',
    nombre: 'Implementación de CRM',
    nombreCorto: 'CRM',
    pilar: 'convertir',
    ola: 1,
    keyword: 'implementación de crm',
    anclaje: 'implementación de CRM',
    linea: 'Implementación de HubSpot o Zoho con el pipeline que ya sigue tu equipo.',
    icono: 'users',
    servicioForm: 'Implementación de CRM',
    pageTemplate: 'servicio_crm_v1',
    serviceLine: 'crm_automatizacion'
  },
  {
    slug: 'medicion',
    nombre: 'Medición y tableros',
    nombreCorto: 'Medición y tableros',
    pilar: 'medir',
    ola: 2,
    keyword: 'implementación de google analytics 4',
    anclaje: 'implementación de Google Analytics 4',
    linea: 'GA4, Google Tag Manager y conversiones hasta el lead calificado, con tableros para dirección.',
    icono: 'chart',
    servicioForm: 'Dashboards y reportes',
    pageTemplate: 'servicio_medicion_v1',
    serviceLine: 'paquete_integral'
  },
  {
    slug: 'automatizacion',
    nombre: 'Automatización',
    nombreCorto: 'Automatización',
    pilar: 'automatizar',
    ola: 1,
    keyword: 'automatización de procesos para empresas',
    anclaje: 'automatización de procesos para empresas',
    linea: 'Captura, calificación y asignación de prospectos con n8n, conectadas a tu CRM.',
    icono: 'workflow',
    servicioForm: 'Automatización de procesos',
    pageTemplate: 'servicio_automatizacion_v1',
    serviceLine: 'crm_automatizacion'
  },
  {
    slug: 'software-a-la-medida',
    nombre: 'Software a la medida',
    nombreCorto: 'Software a la medida',
    pilar: 'automatizar',
    ola: 2,
    keyword: 'desarrollo de software a la medida',
    anclaje: 'desarrollo de software a la medida',
    linea: 'Herramientas internas alrededor de tu CRM cuando ninguna plataforma resuelve el proceso.',
    icono: 'code',
    servicioForm: null,
    pageTemplate: 'servicio_software_a_la_medida_v1',
    serviceLine: 'crm_automatizacion'
  }
].map(function (s) {
  return Object.assign({}, s, { href: '/servicios/' + s.slug });
});

/** true si la página del servicio ya existe (se puede enlazar). */
export function publicado(servicio) {
  return servicio.ola <= OLA_PUBLICADA;
}

/** Servicio por slug; lanza error si no existe (falla el build en lugar de publicar un enlace roto). */
export function servicioPorSlug(slug) {
  const s = SERVICIOS.find(function (x) { return x.slug === slug; });
  if (!s) throw new Error('servicios.js: no existe el servicio "' + slug + '"');
  return s;
}

/** Servicios de un pilar en el orden del panel. Con { soloPublicados: true } omite los de ola futura. */
export function serviciosDePilar(pilarId, opciones) {
  const solo = opciones && opciones.soloPublicados;
  return SERVICIOS.filter(function (s) {
    return s.pilar === pilarId && (!solo || publicado(s));
  });
}

/** Servicios ya publicados (404, chips de la home, sitemap). */
export function serviciosPublicados() {
  return SERVICIOS.filter(publicado);
}

/** Mapa slug → valor literal de SERVICIOS (o null) para data-servicio del formulario (sitemap §7.6). */
export const SERVICIO_FORM = Object.freeze(SERVICIOS.reduce(function (mapa, s) {
  mapa[s.slug] = s.servicioForm;
  return mapa;
}, {}));
