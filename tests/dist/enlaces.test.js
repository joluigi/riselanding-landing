// Enlaces internos de dist/ (plan F4, PR7): todo href o src interno resuelve a un archivo de dist/
// y, si trae ancla, a un id que existe en la página destino. Requiere `npm run build`.
// Las URL limpias se resuelven como Vercel con cleanUrls: /servicios/crm → servicios/crm.html.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, '..', '..', 'dist');
const ORIGEN = 'https://riselanding.com';

if (!fs.existsSync(DIST)) {
  test('enlaces internos de dist/', { skip: 'corre npm run build' }, function () {});
} else {
  definirPruebas();
}

function paginasHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (e) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return paginasHtml(ruta);
    return e.name.endsWith('.html') ? [ruta] : [];
  });
}

// Ruta pública de un archivo de dist (dist/servicios/crm.html → /servicios/crm)
function rutaPublica(archivo) {
  const rel = '/' + path.relative(DIST, archivo).split(path.sep).join('/');
  if (rel === '/index.html') return '/';
  return rel.replace(/\/index\.html$/, '').replace(/\.html$/, '');
}

// Archivo de dist que sirve una ruta pública, o null si no existe
function archivoDe(ruta) {
  const limpia = decodeURIComponent(ruta).replace(/\/$/, '') || '/';
  const candidatos = limpia === '/'
    ? ['index.html']
    : [limpia.slice(1), limpia.slice(1) + '.html', limpia.slice(1) + '/index.html'];
  for (const c of candidatos) {
    const abs = path.join(DIST, c);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

function ids(html) {
  const set = new Set();
  const re = /\sid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) set.add(m[1]);
  return set;
}

// href y src de la página, sin el contenido de <script> (los JSON-LD llevan URL de schema.org)
function referencias(html) {
  const sinScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, function (s) {
    return s.slice(0, s.indexOf('>') + 1);
  });
  const out = [];
  const re = /\s(href|src)="([^"]*)"/g;
  let m;
  while ((m = re.exec(sinScripts))) out.push({ attr: m[1], valor: m[2].replace(/&amp;/g, '&') });
  return out;
}

function definirPruebas() {
  const paginas = paginasHtml(DIST);
  const idsPorArchivo = new Map(paginas.map(function (f) { return [f, ids(fs.readFileSync(f, 'utf8'))]; }));

  test('hay páginas que revisar en dist/', function () {
    assert.ok(paginas.length >= 9, 'se encontraron ' + paginas.length + ' páginas');
  });

  paginas.forEach(function (archivo) {
    const nombre = path.relative(DIST, archivo);
    test(nombre + ': cada enlace interno resuelve a un archivo de dist/ y a un id existente', function () {
      const html = fs.readFileSync(archivo, 'utf8');
      const rotos = [];
      referencias(html).forEach(function (r) {
        let v = r.valor;
        if (!v) { rotos.push(r.attr + ' vacío'); return; }
        if (/^(mailto:|tel:|data:|javascript:)/i.test(v)) return;
        if (v.startsWith(ORIGEN + '/') || v === ORIGEN) v = v.slice(ORIGEN.length) || '/';
        if (/^(https?:)?\/\//i.test(v)) return; // externo
        if (v === '#') { rotos.push(r.attr + '="#" sin destino'); return; }
        const iAncla = v.indexOf('#');
        const ancla = iAncla === -1 ? '' : v.slice(iAncla + 1);
        let ruta = iAncla === -1 ? v : v.slice(0, iAncla);
        ruta = ruta.split('?')[0];
        let destino = archivo;
        if (ruta) {
          if (!ruta.startsWith('/')) ruta = path.posix.join(path.posix.dirname(rutaPublica(archivo)), ruta);
          destino = archivoDe(ruta);
          if (!destino) { rotos.push(r.valor + ' (no existe en dist/)'); return; }
        }
        if (ancla && r.attr === 'href' && destino.endsWith('.html')) {
          if (!idsPorArchivo.get(destino).has(decodeURIComponent(ancla))) {
            rotos.push(r.valor + ' (no hay id="' + ancla + '" en ' + path.relative(DIST, destino) + ')');
          }
        }
      });
      assert.deepStrictEqual(rotos, [], 'enlaces rotos en ' + nombre);
    });
  });

  test('sitemap.xml: cada URL existe en dist/ y ninguna es /gracias', function () {
    const xml = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), function (m) { return m[1]; });
    assert.strictEqual(locs.length, 7);
    locs.forEach(function (loc) {
      assert.ok(loc.startsWith(ORIGEN + '/'), loc);
      const ruta = loc.slice(ORIGEN.length);
      assert.ok(archivoDe(ruta), loc + ' no existe en dist/');
      assert.notStrictEqual(ruta, '/gracias');
    });
  });
}
