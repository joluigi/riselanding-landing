// TEMPORAL (PR0): parte un HTML legado de la raíz (index.html, gracias.html, aviso-de-privacidad.html)
// para envolverlo en src/layouts/Base.astro sin duplicar su contenido. Se borra cuando PR3 y PR5
// reemplacen las páginas provisionales y PR7 elimine los .html de la raíz.
//
// Quita lo que Base ya emite (charset, bootstrap rl, GTM, rl-tracking, viewport, title y el noscript
// de GTM) y conserva todo lo demás tal cual: metas SEO, JSON-LD, fuentes, estilos y scripts del body.

const QUITAR_HEAD = [
  /<!--\s*RL Bootstrap[\s\S]*?-->\s*/,
  /<script id="rl-bootstrap">[\s\S]*?<\/script>\s*/,
  /<!--\s*Google Tag Manager\s*-->\s*/g,
  /<!--\s*End Google Tag Manager\s*-->\s*/g,
  /<script>\s*\(function\s*\(w,\s*d,\s*s,\s*l,\s*i\)[\s\S]*?GTM-P3WZC7MV'\);\s*<\/script>\s*/,
  /<script src="\/js\/rl-tracking\.js" defer><\/script>\s*/,
  /<meta charset="UTF-8">\s*/i,
  /<meta name="viewport"[^>]*>\s*/,
  /<title>[\s\S]*?<\/title>\s*/
];

const QUITAR_BODY = [
  /<!--\s*Google Tag Manager \(noscript\)\s*-->\s*/g,
  /<noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-P3WZC7MV"[\s\S]*?<\/noscript>\s*/,
  /<!--\s*End Google Tag Manager \(noscript\)\s*-->\s*/g
];

export function partirHtmlLegado(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/);
  const body = html.match(/<body>([\s\S]*?)<\/body>/);
  if (!head || !body) throw new Error('HTML legado sin <head> o <body> reconocibles');
  let h = head[1];
  QUITAR_HEAD.forEach(function (re) { h = h.replace(re, ''); });
  // tokens.css también declara variables en :root y Astro lo enlaza después de estos estilos:
  // se sube la especificidad del :root legado para que la página provisional se vea igual que hoy.
  h = h.replace(/:root\s*\{/g, ':root:root{');
  let b = body[1];
  QUITAR_BODY.forEach(function (re) { b = b.replace(re, ''); });
  if (/id="rl-bootstrap"|gtm\.js\?id=|\/js\/rl-tracking\.js/.test(h + b)) {
    throw new Error('El HTML legado aún trae tracking que Base ya emite: revisa los patrones de QUITAR_HEAD');
  }
  return { head: h, body: b };
}
