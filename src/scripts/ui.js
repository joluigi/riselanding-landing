// ui.js: comportamiento de los componentes compartidos (Astro lo procesa y lo carga como módulo diferido).
// 1. Header translúcido al hacer scroll            [data-header]
// 2. Panel del menú Servicios (escritorio)         [data-menu-servicios-toggle] + [data-menu-servicios]
// 3. Menú móvil de pantalla completa               [data-menu-toggle] + [data-mobile-menu]
// 4. Pestañas de pilar .svc-tab                    [data-tabs]
// 5. Preguntas frecuentes .faq-q                   [data-faq]
// 6. Barra CTA fija en móvil                       [data-cta-bar]
// Pestañas y FAQ solo se activan dentro de [data-tabs] y [data-faq]: así no chocan con el script propio
// de las páginas provisionales de PR0. rl-tracking.js cuenta los clics en .svc-tab y .faq-q como
// interacción por su cuenta; aquí no se publica ningún evento.

const ESCRITORIO = window.matchMedia('(min-width: 1024px)');

function enfocables(raiz) {
  return Array.prototype.filter.call(
    raiz.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    function (el) { return el.offsetParent !== null || el === document.activeElement; }
  );
}

/* 1. Header */
function iniciarHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const alDesplazar = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  alDesplazar();
  window.addEventListener('scroll', alDesplazar, { passive: true });
}

/* 2. Menú Servicios (escritorio): se abre con clic o teclado; Escape, clic fuera o foco fuera lo cierran */
function iniciarMenuServicios() {
  const boton = document.querySelector('[data-menu-servicios-toggle]');
  const panel = document.querySelector('[data-menu-servicios]');
  if (!boton || !panel) return;
  const header = boton.closest('[data-header]');

  function abrir() {
    panel.hidden = false;
    boton.setAttribute('aria-expanded', 'true');
    if (header) header.classList.add('is-panel-open');
  }
  function cerrar(devolverFoco) {
    if (panel.hidden) return;
    panel.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
    if (header) header.classList.remove('is-panel-open');
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener('click', function () {
    if (panel.hidden) abrir(); else cerrar(false);
  });
  boton.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' && panel.hidden) {
      e.preventDefault();
      abrir();
      const primero = enfocables(panel)[0];
      if (primero) primero.focus();
    }
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) cerrar(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) cerrar(panel.contains(document.activeElement) || document.activeElement === boton);
  });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !boton.contains(e.target)) cerrar(false);
  });
  document.addEventListener('focusin', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== boton) cerrar(false);
  });
  ESCRITORIO.addEventListener('change', function (m) { if (!m.matches) cerrar(false); });
}

/* 3. Menú móvil: diálogo modal con foco atrapado */
function iniciarMenuMovil() {
  const menu = document.querySelector('[data-mobile-menu]');
  const abrirBtn = document.querySelector('[data-menu-toggle]');
  if (!menu || !abrirBtn) return;
  const body = document.body;

  function abrir() {
    menu.classList.add('is-open');
    body.classList.add('menu-open');
    abrirBtn.setAttribute('aria-expanded', 'true');
    // Espera a que visibility deje de ser hidden para poder enfocar
    window.requestAnimationFrame(function () {
      const primero = menu.querySelector('.mobile-menu__links .mobile-menu__link');
      if (primero) primero.focus();
    });
  }
  function cerrar(devolverFoco) {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    body.classList.remove('menu-open');
    abrirBtn.setAttribute('aria-expanded', 'false');
    if (devolverFoco) abrirBtn.focus();
  }

  abrirBtn.addEventListener('click', abrir);
  menu.querySelectorAll('[data-close-menu]').forEach(function (el) {
    el.addEventListener('click', function () { cerrar(el.tagName === 'BUTTON'); });
  });

  // Acordeón de Servicios
  menu.querySelectorAll('[data-acordeon]').forEach(function (btn) {
    const destino = document.getElementById(btn.getAttribute('aria-controls'));
    if (!destino) return;
    btn.addEventListener('click', function () {
      const abierto = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!abierto));
      destino.hidden = abierto;
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); cerrar(true); return; }
    if (e.key !== 'Tab') return;
    const f = enfocables(menu);
    if (!f.length) return;
    const primero = f[0];
    const ultimo = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === primero || !menu.contains(document.activeElement))) {
      e.preventDefault(); ultimo.focus();
    } else if (!e.shiftKey && (document.activeElement === ultimo || !menu.contains(document.activeElement))) {
      e.preventDefault(); primero.focus();
    }
  });
  ESCRITORIO.addEventListener('change', function (m) { if (m.matches) cerrar(false); });
}

/* 4. Pestañas: role tablist/tab/tabpanel, flechas, Inicio y Fin */
function iniciarPestanas() {
  document.querySelectorAll('[data-tabs]').forEach(function (grupo) {
    const tabs = Array.prototype.slice.call(grupo.querySelectorAll('.svc-tab[role="tab"]'));
    if (!tabs.length) return;

    function seleccionar(tab, enfocar) {
      tabs.forEach(function (t) {
        const activo = t === tab;
        t.setAttribute('aria-selected', String(activo));
        t.tabIndex = activo ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.classList.toggle('is-active', activo);
      });
      if (enfocar) tab.focus();
    }

    const inicial = tabs.find(function (t) { return t.getAttribute('aria-selected') === 'true'; }) || tabs[0];
    seleccionar(inicial, false);

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { seleccionar(t, false); });
      t.addEventListener('keydown', function (e) {
        let siguiente = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') siguiente = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') siguiente = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') siguiente = tabs[0];
        if (e.key === 'End') siguiente = tabs[tabs.length - 1];
        if (siguiente) { e.preventDefault(); seleccionar(siguiente, true); }
      });
    });
  });
}

/* 5. FAQ: sin JS todo queda abierto; aquí se pliega y cada .faq-q abre o cierra su respuesta */
function iniciarFaq() {
  document.querySelectorAll('[data-faq] .faq-q[aria-controls]').forEach(function (btn) {
    const respuesta = document.getElementById(btn.getAttribute('aria-controls'));
    if (!respuesta) return;
    const abierta = btn.hasAttribute('data-faq-abierta');
    btn.setAttribute('aria-expanded', String(abierta));
    respuesta.hidden = !abierta;
    btn.addEventListener('click', function () {
      const abrir = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(abrir));
      respuesta.hidden = !abrir;
    });
  });
}

/* 6. Barra CTA: visible tras el inicio de la página y oculta mientras #contacto está en pantalla */
function iniciarBarraCta() {
  const barra = document.querySelector('[data-cta-bar]');
  if (!barra || !('IntersectionObserver' in window)) return;
  const inicio = document.querySelector('[data-cta-bar-start]') || document.querySelector('main > :first-child');
  const contacto = document.getElementById('contacto');
  const enlaces = barra.querySelectorAll('a, button');
  let inicioFuera = false;
  let contactoVisible = false;

  function actualizar() {
    const mostrar = inicioFuera && !contactoVisible;
    barra.classList.toggle('is-visible', mostrar);
    barra.setAttribute('aria-hidden', String(!mostrar));
    enlaces.forEach(function (a) { a.tabIndex = mostrar ? 0 : -1; });
  }

  if (inicio) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { inicioFuera = !en.isIntersecting && en.boundingClientRect.top < 0; });
      actualizar();
    }).observe(inicio);
  }
  if (contacto) {
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { contactoVisible = en.isIntersecting; });
      actualizar();
    }).observe(contacto);
  }
}

iniciarHeader();
iniciarMenuServicios();
iniciarMenuMovil();
iniciarPestanas();
iniciarFaq();
iniciarBarraCta();
