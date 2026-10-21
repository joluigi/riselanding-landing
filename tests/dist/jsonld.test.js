// JSON-LD de dist/ (plan F4, PR7): cada <script type="application/ld+json"> es JSON válido con
// @context de schema.org, y FAQPage solo incluye preguntas que la página muestra (sitemap §7.9).
// Requiere `npm run build`.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, '..', '..', 'dist');

if (!fs.existsSync(DIST)) {
  test('JSON-LD de dist/', { skip: 'corre npm run build' }, function () {});
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

function decodificar(s) {
  return s
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCodePoint(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCodePoint(parseInt(n, 16)); })
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function normalizar(s) {
  return s.replace(/\s+/g, ' ').trim();
}

// Texto de cada botón de pregunta del acordeón (.faq-q), que es lo que el usuario ve
function preguntasVisibles(html) {
  const out = [];
  const re = /<button\b[^>]*class="[^"]*\bfaq-q\b[^"]*"[^>]*>([\s\S]*?)<\/button>/g;
  let m;
  while ((m = re.exec(html))) out.push(normalizar(decodificar(m[1].replace(/<[^>]+>/g, ' '))));
  return out;
}

function textoVisible(html) {
  const cuerpo = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/) || [, html])[1];
  return normalizar(decodificar(cuerpo
    .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')));
}

// Recorre el bloque (objeto, arreglo o @graph) y junta los nodos de un @type
function nodos(valor, tipo, out) {
  if (Array.isArray(valor)) { valor.forEach(function (v) { nodos(v, tipo, out); }); return out; }
  if (valor && typeof valor === 'object') {
    const t = valor['@type'];
    if (t === tipo || (Array.isArray(t) && t.indexOf(tipo) !== -1)) out.push(valor);
    Object.keys(valor).forEach(function (k) { nodos(valor[k], tipo, out); });
  }
  return out;
}

function definirPruebas() {
  const paginas = paginasHtml(DIST);

  paginas.forEach(function (archivo) {
    const nombre = path.relative(DIST, archivo);
    const html = fs.readFileSync(archivo, 'utf8');
    const bloques = Array.from(html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
      function (m) { return m[1]; });

    test(nombre + ': cada bloque JSON-LD es JSON válido con @context de schema.org', function () {
      bloques.forEach(function (codigo, i) {
        let datos;
        assert.doesNotThrow(function () { datos = JSON.parse(codigo); }, nombre + ' bloque ' + (i + 1));
        const lista = Array.isArray(datos) ? datos : [datos];
        lista.forEach(function (d) {
          assert.ok(/^https?:\/\/schema\.org\/?$/.test(d['@context']), nombre + ' bloque ' + (i + 1) + ': @context');
        });
      });
    });

    const faqs = bloques.flatMap(function (codigo) {
      try { return nodos(JSON.parse(codigo), 'FAQPage', []); } catch (e) { return []; }
    });
    if (!faqs.length) return;

    test(nombre + ': FAQPage solo incluye preguntas y respuestas visibles en la página', function () {
      const visibles = preguntasVisibles(html);
      const texto = textoVisible(html);
      faqs.forEach(function (faq) {
        const preguntas = nodos(faq.mainEntity, 'Question', []);
        assert.ok(preguntas.length > 0, 'FAQPage sin preguntas');
        preguntas.forEach(function (q) {
          const nombreQ = normalizar(q.name || '');
          assert.ok(visibles.indexOf(nombreQ) !== -1, 'pregunta del JSON-LD que no está en el acordeón: ' + nombreQ);
          const respuesta = normalizar((q.acceptedAnswer && q.acceptedAnswer.text) || '');
          assert.ok(respuesta, 'pregunta sin acceptedAnswer.text: ' + nombreQ);
          // Las respuestas pueden partirse en párrafos: cada fragmento debe aparecer en el texto visible
          respuesta.split(/(?<=[.!?:])\s+/).forEach(function (frase) {
            assert.ok(texto.indexOf(frase) !== -1, 'respuesta no visible para "' + nombreQ + '": ' + frase);
          });
        });
      });
    });
  });
}
