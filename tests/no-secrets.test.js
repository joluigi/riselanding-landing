'use strict';
// Check de secretos: falla si en cualquier archivo versionado reaparece una URL de railway.app,
// el secreto compartido anterior o algo con forma de credencial escrita en el código. Corre con
// `npm test` (y por tanto en cualquier CI que ejecute las pruebas). Lee la lista de archivos de git.
const { test } = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const ESTE_ARCHIVO = path.relative(RAIZ, __filename);
const BINARIO = /\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|woff2?|ttf|otf|mp4|mov)$/i;

// Archivos versionados + nuevos sin ignorar (para atraparlo antes del commit)
function archivos() {
  const salida = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: RAIZ, encoding: 'utf8' });
  return salida.split('\n').filter(function (f) {
    return f && f !== ESTE_ARCHIVO && !BINARIO.test(f) && !f.startsWith('node_modules/') && !f.startsWith('Assets/') &&
      fs.existsSync(path.join(RAIZ, f));
  });
}

// Prohibido en TODOS los archivos (código, docs, pruebas)
const PROHIBIDO_EN_TODO = [
  { nombre: 'URL de railway.app', re: /railway\.app/i },
  { nombre: 'secreto compartido anterior', re: /riselanding-form-v1/ },
  { nombre: 'Turnstile secret key real (0x4…)', re: /\b0x4[A-Za-z0-9_-]{20,}/ },
  { nombre: 'token de GitHub', re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { nombre: 'clave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }
];

// En código de producción (no en pruebas): una variable con nombre de secreto que recibe un literal,
// o un process.env.X_SECRET/… con valor de respaldo NO vacío ("|| 'algo'"; "|| ''" es válido:
// equivale a "no definida").
const CODIGO = /^(api\/|lib\/|js\/|middleware\.js$|.*\.html$)/;
const PROHIBIDO_EN_CODIGO = [
  { nombre: 'secreto con valor de respaldo', re: /process\.env\.[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|WEBHOOK)[A-Z0-9_]*\s*\|\|\s*(['"`])(?!\1)/ },
  { nombre: 'secreto escrito en el código', re: /\b[A-Za-z0-9_]*(secret|password|api[_-]?key|token)[A-Za-z0-9_]*\s*[:=]\s*['"`][A-Za-z0-9_\-+/=]{16,}['"`]/i },
  { nombre: 'URL de webhook escrita en el código', re: /https?:\/\/[^\s'"`]*\/webhook\//i }
];

test('ningún archivo versionado contiene URLs de railway.app ni secretos conocidos', function () {
  const hallazgos = [];
  archivos().forEach(function (f) {
    const texto = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    const reglas = PROHIBIDO_EN_TODO.concat(CODIGO.test(f) ? PROHIBIDO_EN_CODIGO : []);
    texto.split('\n').forEach(function (linea, i) {
      reglas.forEach(function (r) { if (r.re.test(linea)) hallazgos.push(f + ':' + (i + 1) + ' → ' + r.nombre); });
    });
  });
  assert.deepStrictEqual(hallazgos, [], 'Secretos o URLs prohibidas:\n' + hallazgos.join('\n'));
});

test('no hay archivos .env versionados salvo .env.example, y este solo trae placeholders', function () {
  const env = archivos().filter(function (f) { return /(^|\/)\.env(\.|$)/.test(f); });
  assert.deepStrictEqual(env, ['.env.example']);
  const lineas = fs.readFileSync(path.join(RAIZ, '.env.example'), 'utf8').split('\n')
    .filter(function (l) { return /^[A-Z0-9_]+=/.test(l); });
  const PERMITIDOS = /^(reemplazar|https:\/\/example\.invalid\/|proveedores@example\.invalid$|0x0+$|shadow$)/;
  lineas.forEach(function (l) {
    const valor = l.slice(l.indexOf('=') + 1);
    assert.match(valor, PERMITIDOS, 'valor no placeholder en .env.example: ' + l.split('=')[0]);
  });
});

test('el propio check detecta lo que debe detectar (autoprueba)', function () {
  const muestras = [
    "const URL = 'https://n8n-production-x.up.railway.app/webhook/abc';",
    "'x-form-secret': process.env.FORM_SHARED_SECRET || 'riselanding-form-v1',",
    "const destino = process.env.N8N_WEBHOOK_URL || 'https://n8n.example/webhook/x';",
    "const apiKey = 'abcd1234efgh5678ijkl';",
    "TURNSTILE_SECRET_KEY=0x4AAAAAAAabcdefghijklmnopqrstuv"
  ];
  const todas = PROHIBIDO_EN_TODO.concat(PROHIBIDO_EN_CODIGO);
  muestras.forEach(function (m) {
    assert.ok(todas.some(function (r) { return r.re.test(m); }), 'no detectó: ' + m);
  });
  // Y no marca usos legítimos
  ["const secreto = String(process.env.FORM_SHARED_SECRET || '').trim();",
    "'x-form-secret': destino.secreto,",
    "const FORM_TOKEN = 'rl1';"].forEach(function (m) {
    assert.ok(!PROHIBIDO_EN_CODIGO.concat(PROHIBIDO_EN_TODO).some(function (r) { return r.re.test(m); }), 'falso positivo: ' + m);
  });
});
