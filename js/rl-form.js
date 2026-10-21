// js/rl-form.js: formulario "Agenda tu diagnóstico" (#lead-form), extraído de index.html (plan F4 §4,
// camino A) sin cambiar su lógica de validación, token, Turnstile, payload ni manejo de respuestas.
// Cambios del plan, cada uno con prueba en tests/rl-form.test.js:
//   1. Precarga del servicio de la página desde data-servicio del <form> (precargarServicio).
//   2. Tras el éxito comercial, rl_lead_submit se publica con eventCallback y se navega a /gracias
//      cuando GTM confirma o a los 2 s (publicarLeadSubmit, esperarEvento, concluirEnvio).
//   3. Turnstile con theme 'light' (variante A clara).
// Requiere /lib/lead-quality/schema.js antes (window.LeadSchema). En Node solo expone las funciones
// puras para pruebas (window.RLForm / module.exports), mismo patrón que js/rl-tracking.js.
(function (global) {
  var URL_GRACIAS = '/gracias';
  var TIEMPO_MAX_GTM_MS = 2000; // tope de espera a GTM antes de navegar (GTM bloqueado o lento)

  // Marca el chip cuyo data-zoho coincide con el servicio de la página. Sin evento 'change'
  // sintético: no dispara revalidación y no toca el event_id (la huella se calcula al enviar).
  function precargarServicio(form, servicio) {
    if (!form || !servicio) return null;
    var cajas = form.querySelectorAll('.checks input[data-zoho]');
    for (var i = 0; i < cajas.length; i++) {
      var cb = cajas[i];
      if (cb.getAttribute('data-zoho') !== servicio) continue;
      cb.checked = true;
      var chk = cb.closest ? cb.closest('.chk') : null;
      if (chk) chk.classList.add('on');
      return cb;
    }
    return null;
  }

  // Réplica de los dos pushes de RL.pushEvent (reset y evento) con eventCallback para GTM.
  // El payload ya trae el event_id que confirmó el servidor (RL.buildLeadSubmit).
  function publicarLeadSubmit(p, listo) {
    var dl = global.dataLayer = global.dataLayer || [];
    dl.push({ rl_event_data: null });
    dl.push({ event: 'rl_lead_submit', rl_event_data: p, eventCallback: listo, eventTimeout: TIEMPO_MAX_GTM_MS });
  }

  // Resuelve una sola vez: con el callback de GTM (puede llamarse una vez por contenedor) o al tope.
  function esperarEvento(publicar, ms) {
    return new Promise(function (resolve) {
      var hecho = false, tope = null;
      function listo() { if (!hecho) { hecho = true; clearTimeout(tope); resolve(); } }
      tope = setTimeout(listo, typeof ms === 'number' ? ms : TIEMPO_MAX_GTM_MS);
      try { publicar(listo); } catch (e) { listo(); }
    });
  }

  // Cierre de un envío comercial con 200: publica rl_lead_submit si hay veredicto y navega a
  // /gracias. Sin veredicto (fake success de bot) no se publica nada y se navega igual: las
  // conversiones viven en rl_lead_submit, nunca en la vista de /gracias.
  function concluirEnvio(veredicto, navegar, ms) {
    return Promise.resolve(veredicto).then(function (p) {
      if (!p) return null;
      return esperarEvento(function (listo) { publicarLeadSubmit(p, listo); }, ms);
    }).catch(function () {}).then(function () { navegar(URL_GRACIAS); });
  }

  var RLForm = {
    URL_GRACIAS: URL_GRACIAS, TIEMPO_MAX_GTM_MS: TIEMPO_MAX_GTM_MS,
    precargarServicio: precargarServicio, publicarLeadSubmit: publicarLeadSubmit,
    esperarEvento: esperarEvento, concluirEnvio: concluirEnvio
  };
  global.RLForm = RLForm;
  if (typeof module !== 'undefined' && module.exports) module.exports = RLForm;
  if (typeof global.document === 'undefined') return; // Node: solo las funciones puras

  function initDom() {
    var form = document.getElementById('lead-form');
    if (!form) return;

    // Toggle visual de los chips de servicio y captura de UTM a los hidden (venían del script
    // misceláneo de index.html, puntos 8 y 9)
    document.querySelectorAll('.chk input[data-zoho]').forEach(function(cb){ cb.addEventListener('change', function(){
      cb.closest('.chk').classList.toggle('on', cb.checked);
    }); });
    var qs=new URLSearchParams(location.search);
    ['utm_source','utm_medium','utm_campaign'].forEach(function(k){ var el=document.getElementById(k); if(el&&qs.get(k)) el.value=qs.get(k); });

    var t0 = Date.now(); // instante de carga: base de time_to_convert_sec

    // --- Token de formulario (HMAC del servidor) ---
    // /api/lead descarta envíos a menos de 4 s de emitido el token y pide reenvío pasadas 2 h.
    // Se renueva solo en segundo plano; al enviar, si falta o está por vencer, se pide
    // uno nuevo y se espera lo necesario para no caer en too_fast.
    var TOKEN_RENOVAR_MS = 90 * 60 * 1000;  // renovación silenciosa
    var TOKEN_MAX_MS = 110 * 60 * 1000;     // al enviar, más viejo que esto → pedir otro
    var TOKEN_ESPERA_MS = 4500;             // margen sobre los 4 s del servidor
    var tk = { valor: null, en: 0, obtenido: false, pidiendo: null };

    function pedirToken() {
      if (tk.pidiendo) return tk.pidiendo;
      tk.pidiendo = fetch('/api/form-token', { cache: 'no-store', credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('form-token ' + r.status); return r.json(); })
        .then(function (d) {
          tk.valor = d.form_token || null; // null = capa apagada en el servidor, se envía sin token
          tk.en = Date.now();
          tk.obtenido = true;
          if (d.turnstile_site_key) montarTurnstile(d.turnstile_site_key);
        })
        .then(function () { tk.pidiendo = null; }, function () { tk.pidiendo = null; });
      return tk.pidiendo;
    }

    function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function errorCliente(tipo) { var e = new Error(tipo); e.tipo = tipo; return e; }

    function asegurarToken() {
      var vencido = !tk.obtenido || (Date.now() - tk.en) > TOKEN_MAX_MS;
      return (vencido ? pedirToken() : Promise.resolve()).then(function () {
        if (!tk.obtenido) throw errorCliente('sin_token');
        var falta = TOKEN_ESPERA_MS - (Date.now() - tk.en);
        return falta > 0 ? esperar(falta) : null;
      });
    }

    var enviando = false;
    function renovarSiToca() {
      if (!enviando && tk.obtenido && (Date.now() - tk.en) > TOKEN_RENOVAR_MS) pedirToken();
    }
    setInterval(renovarSiToca, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) renovarSiToca(); });

    // --- Cloudflare Turnstile (modo Managed; carga explícita solo con site key) ---
    var ts = { activo: false, id: null, fallo: false };

    function montarTurnstile(siteKey) {
      if (ts.activo) return;
      ts.activo = true;
      var slot = document.getElementById('f-turnstile');
      if (slot) slot.hidden = false;
      window.rlTurnstileListo = function () {
        try {
          ts.id = window.turnstile.render(slot, {
            sitekey: siteKey, theme: 'light', size: 'flexible', action: 'lead_form',
            language: 'es', 'refresh-expired': 'auto'
          });
        } catch (e) { ts.fallo = true; }
      };
      var sc = document.createElement('script');
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=rlTurnstileListo';
      sc.async = true;
      sc.onerror = function () { ts.fallo = true; }; // bloqueador o red: se avisa al enviar
      document.head.appendChild(sc);
    }

    // Resuelve con el token de Turnstile ('' si la capa está apagada); espera hasta 8 s al widget
    function tokenTurnstile() {
      if (!ts.activo) return Promise.resolve('');
      return new Promise(function (resolve, reject) {
        var inicio = Date.now();
        (function revisar() {
          var v = '';
          try { if (window.turnstile && ts.id !== null) v = window.turnstile.getResponse(ts.id) || ''; } catch (e) {}
          if (v) return resolve(v);
          if ((ts.fallo && !window.turnstile) || Date.now() - inicio > 8000) return reject(errorCliente('turnstile'));
          setTimeout(revisar, 250);
        })();
      });
    }

    // El token de Turnstile es de un solo uso: tras cada intento se pide uno nuevo
    function reiniciarTurnstile() {
      try { if (window.turnstile && ts.id !== null) window.turnstile.reset(ts.id); } catch (e) {}
    }

    var MENSAJES_CLIENTE = {
      sin_token: 'No pudimos preparar el formulario. Revisa tu conexión e inténtalo de nuevo, o escríbenos a contacto@riselanding.com o por WhatsApp.',
      turnstile: 'No pudimos completar la verificación de seguridad de Cloudflare. Si usas un bloqueador de anuncios o de scripts, desactívalo para este sitio y recarga la página, o escríbenos a contacto@riselanding.com o por WhatsApp.'
    };

    pedirToken();

    function quitarError(){
      var e = form.querySelector('.form-error');
      if (e) e.parentNode.removeChild(e);
    }

    // --- Validación en línea con el esquema compartido (el servidor vuelve a validar) ---
    var S = window.LeadSchema;
    var listas = { junkCompany: [], disposable: [] };
    // Listas editables en lib/lead-quality/data; si no cargan, el servidor igual las aplica
    function cargarLista(url, clave, prop) {
      fetch(url, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && Array.isArray(d[prop])) listas[clave] = d[prop]; })
        .catch(function () {});
    }
    cargarLista('/lib/lead-quality/data/junk-company.json', 'junkCompany', 'values');
    cargarLista('/lib/lead-quality/data/disposable-email-domains.json', 'disposable', 'domains');

    // Campo del esquema → control que recibe aria-invalid y el foco
    var CONTROL = {
      solicitante: 'f-solicitante', nombre: 'f-nombre', email: 'f-email',
      telefono: 'f-tel', empresa: 'f-empresa', sitio_web: 'f-sitio', tamano: 'f-tamano',
      servicios: 'f-servicios', presupuesto: 'f-presupuesto', necesidad: 'f-necesidad', consentimiento: 'f-consent'
    };
    var CAMPO_DE = {};
    for (var c in CONTROL) CAMPO_DE[CONTROL[c]] = c;
    CAMPO_DE['f-tel-pais'] = 'telefono';

    function $(id) { return document.getElementById(id); }
    function valor(id) { var el = $(id); return el ? el.value : ''; }

    function serviciosMarcados() {
      return Array.prototype.map.call(form.querySelectorAll('.checks input:checked'), function (cb) {
        return cb.getAttribute('data-zoho');
      });
    }

    function leerFormulario() {
      return {
        solicitante: valor('f-solicitante'), nombre: valor('f-nombre'),
        email: valor('f-email'), telefono: valor('f-tel'), telefono_pais: valor('f-tel-pais'),
        empresa: valor('f-empresa'), sitio_web: valor('f-sitio'), tamano: valor('f-tamano'),
        servicios: serviciosMarcados(), presupuesto: valor('f-presupuesto'), necesidad: valor('f-necesidad'),
        consentimiento: !!($('f-consent') && $('f-consent').checked)
      };
    }

    function validarAhora() { return S.validar(leerFormulario(), { listas: listas }); }

    function errorDe(v, campo) {
      for (var i = 0; i < v.errores.length; i++) if (v.errores[i].campo === campo) return v.errores[i];
      return null;
    }

    function quitarDescripcion(el, id) {
      var ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== id; });
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
    }

    function limpiarError(campo) {
      var el = $(CONTROL[campo]);
      if (!el) return;
      el.removeAttribute('aria-invalid');
      quitarDescripcion(el, 'err-' + campo);
      var p = $('err-' + campo);
      if (p) p.parentNode.removeChild(p);
    }

    function marcarError(campo, mensaje) {
      var el = $(CONTROL[campo]);
      var caja = el && el.closest('.field');
      if (!caja) return;
      limpiarError(campo);
      var p = document.createElement('p');
      p.className = 'field-error';
      p.id = 'err-' + campo;
      p.textContent = mensaje;
      caja.appendChild(p);
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' err-' + campo).trim());
    }

    function limpiarErrores() { S.CAMPOS.forEach(limpiarError); }

    function pasoDe(campo) { return S.PASOS[1].indexOf(campo) !== -1 ? 1 : 2; }

    // errores: [{ campo, mensaje }] en el orden del formulario; el primero recibe el foco (y si es
    // de otro paso, p. ej. un 422 del servidor, se regresa a ese paso)
    function mostrarErrores(errores) {
      limpiarErrores();
      if (!errores.length) return;
      var paso = pasoDe(errores[0].campo);
      if (paso !== pasoActual) irAPaso(paso, { sinFoco: true });
      if (errores.some(function (e) { return e.campo === 'sitio_web'; })) abrirSitio(false);
      errores.forEach(function (e) { marcarError(e.campo, e.mensaje); });
      var primero = $(CONTROL[errores[0].campo]);
      if (primero) primero.focus();
    }

    // Un campo ya marcado se revalida mientras se corrige, para quitar el error en cuanto está bien
    function revalidar(campo) {
      var el = $(CONTROL[campo]);
      if (!el || el.getAttribute('aria-invalid') !== 'true') return;
      var e = errorDe(validarAhora(), campo);
      if (e) marcarError(campo, e.mensaje); else limpiarError(campo);
    }
    function campoDelEvento(ev) {
      var t = ev.target;
      if (t && t.closest && t.closest('#f-servicios')) return 'servicios';
      return t && CAMPO_DE[t.id];
    }
    form.addEventListener('input', function (ev) { var c = campoDelEvento(ev); if (c) revalidar(c); });
    form.addEventListener('change', function (ev) { var c = campoDelEvento(ev); if (c) revalidar(c); });

    // Al salir de un campo de texto con contenido, se valida en el momento (sin regañar campos vacíos)
    var AL_SALIR = ['nombre', 'email', 'telefono', 'empresa', 'sitio_web'];
    form.addEventListener('focusout', function (ev) {
      var c = campoDelEvento(ev);
      if (!c || AL_SALIR.indexOf(c) === -1 || !String(valor(CONTROL[c])).trim()) return;
      var e = errorDe(validarAhora(), c);
      if (e) marcarError(c, e.mensaje); else limpiarError(c);
      if (c === 'email') sugerirCorreo();
    });

    // Typo en el dominio del correo: se sugiere, nunca se bloquea
    function sugerirCorreo() {
      var el = $('f-email');
      var previa = $('hint-email');
      if (previa) { previa.parentNode.removeChild(previa); quitarDescripcion(el, 'hint-email'); }
      var sugerido = S.sugerirCorreo(el.value);
      if (!sugerido || sugerido === el.value.trim().toLowerCase()) return;
      var p = document.createElement('p');
      p.className = 'field-hint';
      p.id = 'hint-email';
      p.appendChild(document.createTextNode('¿Quisiste decir '));
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = sugerido;
      b.addEventListener('click', function () {
        el.value = sugerido;
        p.parentNode.removeChild(p);
        quitarDescripcion(el, 'hint-email');
        revalidar('email');
        el.focus();
      });
      p.appendChild(b);
      p.appendChild(document.createTextNode('?'));
      el.closest('.field').appendChild(p);
      el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' hint-email').trim());
    }

    // Contador informativo de "¿Qué quieres resolver?" (opcional, sin mínimo; solo aparece al escribir)
    var necesidad = $('f-necesidad'), contador = $('f-necesidad-contador');
    function actualizarContador() {
      var n = necesidad.value.replace(/\s+/g, ' ').trim().length;
      contador.textContent = n ? n + ' / ' + S.NECESIDAD_MAX : '';
    }
    if (necesidad && contador) {
      necesidad.addEventListener('input', actualizarContador);
      actualizarContador();
    }

    // "¿Para quién es la solicitud?": los campos de negocio solo aplican a empresa/emprendimiento
    function aplicarSolicitante() {
      var tipo = S.SOLICITANTES[valor('f-solicitante')];
      var comercial = !tipo || tipo.comercial;
      Array.prototype.forEach.call(form.querySelectorAll('[data-solo-comercial]'), function (el) { el.hidden = !comercial; });
      if (!comercial) ['tamano', 'servicios', 'presupuesto', 'necesidad'].forEach(limpiarError);
    }
    $('f-solicitante').addEventListener('change', aplicarSolicitante);
    aplicarSolicitante();
    precargarServicio(form, form.getAttribute('data-servicio')); // servicio de la página (plan F4 §4.1)

    var PLACEHOLDER_TEL = { MX: '55 5878 8983', INTL: '+1 202 555 0123' };
    $('f-tel-pais').addEventListener('change', function () {
      $('f-tel').placeholder = PLACEHOLDER_TEL[this.value] || 'Número con lada';
    });

    // event_id del envío (idempotencia en /api/lead): se conserva mientras los datos no cambien, así
    // un reintento tras un error de red no crea un lead duplicado; datos distintos → id nuevo.
    var envio = { id: '', huella: '' };
    function nuevoUuid() {
      if (window.RL && RL.uuid) return RL.uuid();
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (ch) {
        var r = Math.random() * 16 | 0; return (ch === 'x' ? r : (r & 3 | 8)).toString(16);
      });
    }
    function eventIdPara(raw) {
      var huella = JSON.stringify(raw);
      if (!envio.id || envio.huella !== huella) { envio.id = nuevoUuid(); envio.huella = huella; }
      return envio.id;
    }

    // E.164 para hashear en user_data: México por la regla del esquema; otros países con su código
    // (o el "+código" que escribió la persona). El servidor ya validó el número con libphonenumber.
    function e164Cliente(d) {
      if (d.telefonoE164) return d.telefonoE164;
      var digitos = String(d.telefono || '').replace(/\D/g, '');
      if (String(d.telefono || '').trim().charAt(0) === '+') return '+' + digitos;
      var codigo = S.codigoPais(d.telefonoPais);
      return codigo ? '+' + codigo + digitos : '';
    }

    function pushEvento(nombre, datos) {
      try { if (window.RL) RL.pushEvent(nombre, datos); } catch (e) {}
    }

    function pushError(tipo, campo) {
      try { if (window.RL) RL.pushFormError(tipo, campo, pasoActual); } catch (e) {}
    }

    // --- Formulario en 2 pasos (mismo componente, sin recargar). Nada se envía al terminar el paso 1 ---
    var pasoActual = 1;
    var pasoVisto = false; // rl_form_step se emite una vez por formulario (embudo limpio)
    var TITULOS = { 1: 'Cuéntanos de tu negocio', 2: '¿A quién le enviamos el diagnóstico?' };
    function irAPaso(n, opciones) {
      var o = opciones || {};
      pasoActual = n;
      $('f-paso-1').hidden = n !== 1;
      $('f-paso-2').hidden = n !== 2;
      $('f-paso-texto').textContent = 'Paso ' + n + ' de 2';
      $('f-paso-barra').style.width = (n * 50) + '%';
      $('f-anuncio').textContent = 'Paso ' + n + ' de 2: ' + TITULOS[n];
      quitarError();
      if (n === 2 && !pasoVisto) {
        pasoVisto = true;
        pushEvento('rl_form_step', { form_id: 'agenda_diagnostico', form_location: 'contacto', step_number: 2, step_name: 'contacto' });
      }
      if (!o.sinFoco) {
        var primero = n === 1 ? $('f-solicitante') : $('f-nombre');
        if (primero) primero.focus();
      }
      var caja = $('f-progreso');
      if (caja && caja.getBoundingClientRect().top < 0) {
        var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        caja.scrollIntoView({ block: 'start', behavior: reducir ? 'auto' : 'smooth' });
      }
    }

    function abrirSitio(enfocar) {
      $('f-sitio-campo').hidden = false;
      $('f-sitio-toggle-caja').hidden = true;
      $('f-sitio-toggle').setAttribute('aria-expanded', 'true');
      if (enfocar) $('f-sitio').focus();
    }
    $('f-sitio-toggle').addEventListener('click', function () { abrirSitio(true); });
    $('f-atras').addEventListener('click', function () { irAPaso(1); });

    // "Continuar": valida solo el paso 1. Si el solicitante no es comercial, se resuelve aquí mismo
    var btnContinuar = $('f-continuar');
    function continuar() {
      if (enviando) return;
      quitarError();
      var raw = leerFormulario();
      var v = S.validar(raw, { listas: listas });
      var errores1 = v.errores.filter(function (e) { return pasoDe(e.campo) === 1; });
      if (errores1.length) {
        mostrarErrores(errores1);
        pushError('client_validation', errores1[0].campo);
        return;
      }
      S.PASOS[1].forEach(limpiarError);
      var tipo = S.SOLICITANTES[raw.solicitante];
      if (tipo && !tipo.comercial) { enviarNoComercial(raw.solicitante); return; }
      irAPaso(2);
    }
    btnContinuar.addEventListener('click', continuar);

    // No comercial: al servidor SOLO va el tipo de solicitante (+ señales anti-bot); ningún dato personal
    function enviarNoComercial(solicitante) {
      var texto = btnContinuar.textContent;
      enviando = true;
      btnContinuar.disabled = true; btnContinuar.textContent = 'Un momento…';
      var cuerpo = { solicitante: solicitante, website_url_2: valor('f-hp'), event_id: nuevoUuid() };
      if (window.__rl && window.__rl.leadId) cuerpo.lead_id = window.__rl.leadId;
      asegurarToken().then(function () {
        cuerpo.form_token = tk.valor || '';
        return fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Form-Token': 'rl1' },
          body: JSON.stringify(cuerpo)
        }).catch(function (e) { e.tipo = 'network_error'; throw e; });
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (!data.success) {
          if (data.code === 'form_expired') { tk.obtenido = false; pedirToken(); }
          var e = new Error(data.message || 'error'); e.delServidor = !!data.message; e.code = data.code; throw e;
        }
        enviando = false;
        btnContinuar.disabled = false; btnContinuar.textContent = texto;
        if (data.outcome === 'no_comercial') {
          try { if (window.RL) RL.pushNonCommercialSubmit(data.lead_quality_flag, data.event_id); } catch (e) {}
          mostrarAviso(data.message);
        }
      }).catch(function (err) {
        enviando = false;
        btnContinuar.disabled = false; btnContinuar.textContent = texto;
        try { if (window.RL) { var fe = RL.classifySubmitError(err); RL.pushFormError(fe[0], fe[1], pasoActual); } } catch (e) {}
        mostrarErrorGeneral(err);
      });
    }

    function mostrarErrorGeneral(err) {
      quitarError();
      var tipoCliente = err && MENSAJES_CLIENTE[err.tipo];
      var aviso = document.createElement('div');
      aviso.className = 'form-error';
      aviso.setAttribute('role', 'alert');
      aviso.textContent = tipoCliente ? MENSAJES_CLIENTE[err.tipo]
        : (err && err.delServidor) ? err.message
        : 'No pudimos enviar el formulario. Inténtalo de nuevo o escríbenos a contacto@riselanding.com o por WhatsApp.';
      form.appendChild(aviso);
    }

    // Solicitante no comercial: mensaje honesto en lugar de la pantalla de gracias. Los campos
    // solo se ocultan (no se borran) para que "Cambia la opción" regrese con todo lo capturado.
    function mostrarAviso(texto) {
      var ocultos = [];
      Array.prototype.forEach.call(form.children, function (el) {
        if (!el.hidden) { el.hidden = true; ocultos.push(el); }
      });
      form.classList.add('sent');
      var aviso = document.createElement('div');
      aviso.className = 'form-notice';
      aviso.setAttribute('role', 'status');
      aviso.tabIndex = -1;
      aviso.innerHTML = '<span class="eyebrow">Gracias por escribirnos</span><h3>Recibimos tu mensaje</h3><p></p>'
        + '<button type="button" class="form-notice__back">¿Elegiste mal? Cambia la opción</button>';
      aviso.querySelector('p').textContent = texto;
      aviso.querySelector('button').addEventListener('click', function () {
        form.removeChild(aviso);
        form.classList.remove('sent');
        ocultos.forEach(function (el) { el.hidden = false; });
        $('f-solicitante').value = '';
        aplicarSolicitante();
        irAPaso(1);
      });
      form.appendChild(aviso);
      aviso.focus();
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (enviando) return; // doble clic o Enter repetido mientras hay un envío en curso
      if (pasoActual === 1) { continuar(); return; } // Enter en el paso 1 = "Continuar"
      quitarError(); // cada reintento parte sin el aviso del intento anterior
      // Intento de envío (antes de validar). Embudo: form_start → form_step → submit_attempt → lead_submit
      pushEvento('rl_form_submit_attempt', { form_id: 'agenda_diagnostico', form_location: 'contacto' });

      var raw = leerFormulario();
      var v = S.validar(raw, { listas: listas });
      if (!v.ok) {
        mostrarErrores(v.errores);
        pushError('client_validation', v.errores[0].campo);
        return;
      }
      limpiarErrores();

      var btn = form.querySelector('button[type="submit"]');
      var btnTexto = btn.textContent;
      enviando = true;
      btn.disabled = true; btn.textContent = 'Enviando…';

      var payload = {};
      for (var k in raw) payload[k] = raw[k];
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (id) { if (valor(id)) payload[id] = valor(id); });
      // Señales anti-bot que valida /api/lead: honeypot, token HMAC y Turnstile (si está activo)
      payload.website_url_2 = valor('f-hp');
      payload.event_id = eventIdPara(raw);
      if (window.__rl && window.__rl.leadId) payload.lead_id = window.__rl.leadId;

      asegurarToken().then(tokenTurnstile).then(function (tokenTs) {
        payload.form_token = tk.valor || '';
        if (tokenTs) payload.turnstile_token = tokenTs;
        return fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Form-Token': 'rl1' },
          body: JSON.stringify(payload)
        }).catch(function (e) { e.tipo = 'network_error'; throw e; }); // sin respuesta HTTP
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (!data.success) {
          if (data.code === 'form_expired') { tk.obtenido = false; pedirToken(); }
          var e = new Error(data.message || 'error'); e.delServidor = !!data.message; e.code = data.code;
          if (data.code === 'validation' && data.errors) {
            e.errores = S.CAMPOS.filter(function (c) { return data.errors[c]; })
              .map(function (c) { return { campo: c, mensaje: data.errors[c] }; });
            e.campo = e.errores.length ? e.errores[0].campo : undefined;
          }
          throw e;
        }

        // Veredicto del servidor; un fake success (rechazo duro) no lo trae: buildLeadSubmit resuelve
        // null, no se publica rl_lead_submit y se navega igual. `enviando` sigue en true hasta salir
        // de la página: no hay segundo envío mientras se espera a GTM.
        var veredicto = Promise.resolve(null);
        if (window.RL && RL.buildLeadSubmit) {
          try {
            veredicto = RL.buildLeadSubmit({
              email: raw.email, phoneRaw: raw.telefono, phoneE164: e164Cliente(v.datos),
              firstName: v.datos.nombre, lastName: v.datos.apellido, sizeBucket: v.datos.tamano || null,
              pilar: S.pilar(v.datos.servicios), t0: t0, eventId: data.event_id, leadId: data.lead_id,
              hasMessage: !!v.datos.necesidad,
              verdict: {
                lead_quality_flag: data.lead_quality_flag, lead_score: data.lead_score,
                lead_tier: data.lead_tier, email_domain_type: data.email_domain_type
              }
            });
          } catch (e) { veredicto = Promise.resolve(null); }
        }
        concluirEnvio(veredicto, function (url) { location.assign(url); });
      }).catch(function (err) {
        enviando = false;
        reiniciarTurnstile();
        btn.disabled = false; btn.textContent = btnTexto;
        quitarError();
        try { if (window.RL) { var fe = RL.classifySubmitError(err); RL.pushFormError(fe[0], fe[1], pasoActual); } } catch (e) {}
        if (err && err.errores && err.errores.length) { mostrarErrores(err.errores); return; } // 422: errores en línea
        mostrarErrorGeneral(err);
      });
    });
  }

  initDom();
})(typeof window !== 'undefined' ? window : globalThis);
