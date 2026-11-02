/* =========================================================
   Núcleo: escenario escalable, ruteador de escenas, HUD,
   teclado/mando (navegación espacial) y pantalla completa.
   ========================================================= */
window.App = window.App || {};

/* ---------------------------------------------------------
   1) Escenario: encaja siempre en 16:9 dentro de la pantalla
   --------------------------------------------------------- */
App.stage = (function () {
  const el = document.getElementById('stage');

  function fit() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let w = vw, h = vw * 9 / 16;
    if (h > vh) { h = vh; w = vh * 16 / 9; }
    el.style.width = Math.round(w) + 'px';
    el.style.height = Math.round(h) + 'px';
    // 1u = 1% del ancho del escenario: todas las medidas usan calc(var(--u) * n)
    el.style.setProperty('--u', (w / 100) + 'px');
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 120));
  document.addEventListener('fullscreenchange', () => setTimeout(fit, 60));

  return { el, fit };
})();

/* ---------------------------------------------------------
   2) Helpers de interfaz (UI) usados por los juegos
   --------------------------------------------------------- */
App.ui = (function () {
  function make(tag, styles, cls) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (styles) apply(n, styles);
    return n;
  }

  function apply(n, styles) {
    // Los estilos se escriben en % o valores CSS crudos: {left:'10%', top:2}
    Object.keys(styles).forEach(k => {
      let v = styles[k];
      if (typeof v === 'number') v = v + 'px';
      if (k === 'text' || k === 'html') n[k === 'text' ? 'textContent' : 'innerHTML'] = v;
      else n.style[k] = v;
    });
  }

  /* Imagen a pantalla completa (fondo tipo PowerPoint) */
  function bg(src, cls) {
    const i = make('img', { left: '0%', top: '0%', width: '100%', height: '100%' }, 'bg' + (cls ? ' ' + cls : ''));
    i.src = src;
    i.alt = '';
    i.draggable = false;
    return i;
  }

  /* Imagen posicionada con coordenadas % (heredadas del PPT) */
  function img(src, box, cls) {
    const i = make('img', box, cls || 'abs');
    i.src = src;
    i.alt = '';
    i.draggable = false;
    return i;
  }

  /* Zona clicable transparente sobre la imagen */
  function zone(box, onClick, opts) {
    opts = opts || {};
    const b = make('button', box, 'zone' + (opts.cls ? ' ' + opts.cls : ''));
    b.type = 'button';
    if (opts.label) {
      b.setAttribute('aria-label', opts.label);
      b.title = opts.label;
    }
    if (opts.noHover) b.classList.add('no-hover');
    b.addEventListener('click', ev => {
      ev.preventDefault();
      onClick(ev);
    });
    return b;
  }

  /* Botón con imagen dibujada (p. ej. "REGRESAR", "Girar/Parar") */
  function imgBtn(src, box, onClick, opts) {
    opts = opts || {};
    const b = make('button', box, 'img-btn');
    b.type = 'button';
    if (opts.label) { b.setAttribute('aria-label', opts.label); b.title = opts.label; }
    const i = document.createElement('img');
    i.src = src;
    i.alt = '';
    i.draggable = false;
    b.appendChild(i);
    b.addEventListener('click', ev => { ev.preventDefault(); onClick(ev); });
    return b;
  }

  function rect(box) { return { left: box.x + '%', top: box.y + '%', width: box.w + '%', height: box.h + '%' }; }

  return { make, apply, bg, img, zone, imgBtn, rect };
})();

/* ---------------------------------------------------------
   3) Ruteador de escenas
   --------------------------------------------------------- */
App.scenes = {};
App.defineScene = function (id, factory) { App.scenes[id] = factory; };

App.scene = (function () {
  const screen = document.getElementById('screen');
  const history = [];
  let current = null;
  let animating = false;

  function swap(id, params, opts) {
    opts = opts || {};
    const factory = App.scenes[id];
    if (!factory) { console.error('[scene] Escena inexistente:', id); return; }

    const api = factory(params || {}, App.ui, App.scene) || {};
    if (!api.el) { console.error('[scene] La escena no devolvió "el":', id); return; }

    // Sale la escena anterior
    if (current) {
      if (current.api.exit) { try { current.api.exit(); } catch (e) { console.error(e); } }
      const old = current.el;
      old.classList.add('leaving');
      setTimeout(() => old.remove(), 340);
    }

    // Entra la nueva
    screen.appendChild(api.el);
    api.el.classList.add('scene', 'entering');
    requestAnimationFrame(() => requestAnimationFrame(() => api.el.classList.remove('entering')));

    current = { id, params, api, el: api.el };
    if (api.enter) { try { api.enter(params); } catch (e) { console.error(e); } }

    App.hud && App.hud.update();
    App.hud && App.hud.wake(2600);
  }

  function go(id, params, opts) {
    opts = opts || {};
    if (animating) return;
    if (current && !opts.reset && !opts.replace) {
      history.push({ id: current.id, params: current.params });
    }
    if (opts.reset) history.length = 0;
    swap(id, params, opts);
  }

  function back() {
    if (animating || !current) return;
    // La escena puede manejar "atrás" por su cuenta
    if (typeof current.api.back === 'function') {
      current.api.back();
      return;
    }
    if (history.length) {
      const prev = history.pop();
      swap(prev.id, prev.params, { replace: true });
    }
  }

  function home() { go('home', null, { reset: true }); }

  function currentInfo() { return current ? { id: current.id, params: current.params } : null; }
  function canBack() { return !!(current && (typeof current.api.back === 'function' || history.length)); }

  return { go, back, home, current: currentInfo, canBack };
})();

/* ---------------------------------------------------------
   4) HUD (controles superiores) + pantalla completa
   --------------------------------------------------------- */
App.hud = (function () {
  const hud = document.getElementById('hud');
  const tab = document.getElementById('hud-tab');
  const bar = hud.querySelector('.hud-bar');
  const btnBack = hud.querySelector('[data-act="back"]');
  const btnHome = hud.querySelector('[data-act="home"]');
  const btnMusic = hud.querySelector('[data-act="music"]');
  const btnFull = hud.querySelector('[data-act="full"]');

  let sleepTimer = null;
  let hovering = false;

  function wake(ms) {
    hud.classList.remove('sleep');
    hud.classList.add('awake');
    schedule(ms || 3500);
  }

  function schedule(ms) {
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(() => {
      if (hovering) { schedule(2500); return; }
      if (bar.contains(document.activeElement) && document.activeElement !== document.body) {
        schedule(2500); return;
      }
      hud.classList.add('sleep');
      hud.classList.remove('awake');
    }, ms);
  }

  function update() {
    btnBack.hidden = !App.scene.canBack();
    const s = App.audio.settings;
    btnMusic.classList.toggle('muted', !s.musicOn);
    if (document.fullscreenElement || document.webkitFullscreenElement) btnFull.classList.add('active');
    else btnFull.classList.remove('active');
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (!fsEl) {
        const req = root.requestFullscreen || root.webkitRequestFullscreen;
        if (req) req.call(root);
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    } catch (e) { console.warn('No se pudo cambiar la pantalla completa', e); }
  }

  tab.addEventListener('click', () => wake(6000));
  btnBack.addEventListener('click', () => { App.scene.back(); wake(3000); });
  btnHome.addEventListener('click', () => { App.scene.home(); wake(3000); });
  btnMusic.addEventListener('click', () => { App.audio.toggleMusic(); update(); wake(3000); });
  btnFull.addEventListener('click', () => { toggleFullscreen(); wake(3000); });

  hud.addEventListener('pointerenter', () => { hovering = true; wake(6000); });
  hud.addEventListener('pointerleave', () => { hovering = false; schedule(3000); });

  return { wake, update, toggleFullscreen };
})();

/* ---------------------------------------------------------
   5) Entrada: gestos, teclado y navegación espacial (TV)
   --------------------------------------------------------- */
(function inputSetup() {
  // Desbloquea audio con el primer gesto (política de autoplay)
  const unlock = () => { App.audio.unlock(); App.hud.update(); };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });

  // Mostrar HUD ante cualquier entrada
  const poke = () => App.hud.wake();
  window.addEventListener('pointermove', e => {
    // solo si el puntero está dentro del escenario (no en las barras negras)
    const r = App.stage.el.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (inside) poke();
  });
  window.addEventListener('touchstart', poke, { passive: true });
  window.addEventListener('keydown', poke);

  // Sin menú contextual al mantener presionado (tablets)
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Evita gestos de zoom no deseados
  document.addEventListener('dblclick', e => {
    const r = App.stage.el.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) e.preventDefault();
  });

  function focusables() {
    const nodes = Array.prototype.slice.call(
      document.querySelectorAll('#screen button:not([disabled]), #screen [tabindex="0"]')
    );
    return nodes.filter(n => n.offsetParent !== null && n.offsetWidth > 0);
  }

  function centerOf(n) {
    const r = n.getBoundingClientRect();
    const s = App.stage.el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  }

  function spatial(dx, dy) {
    const nodes = focusables();
    if (!nodes.length) return;
    const active = document.activeElement;
    const inScreen = active && App.stage.el.contains(active) && active.tagName === 'BUTTON';
    if (!inScreen) {
      // primer foco: el elemento más arriba / izquierda
      let best = nodes[0], bestScore = Infinity;
      nodes.forEach(n => {
        const c = centerOf(n);
        const score = c.y * 2 + c.x;
        if (score < bestScore) { bestScore = score; best = n; }
      });
      best.focus();
      return;
    }
    const from = centerOf(active);
    let best = null, bestScore = Infinity;
    nodes.forEach(n => {
      if (n === active) return;
      const c = centerOf(n);
      const vx = c.x - from.x, vy = c.y - from.y;
      const proj = vx * dx + vy * dy;
      if (proj <= 6) return;
      const off = Math.abs(vx * -dy + vy * dx); // distancia perpendicular
      const score = proj + off * 2.4;
      if (score < bestScore) { bestScore = score; best = n; }
    });
    if (best) best.focus();
  }

  window.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'Escape' || k === 'Backspace') {
      e.preventDefault();
      App.scene.back();
      return;
    }
    if (k === 'ArrowLeft')  { e.preventDefault(); spatial(-1, 0); }
    else if (k === 'ArrowRight') { e.preventDefault(); spatial(1, 0); }
    else if (k === 'ArrowUp')    { e.preventDefault(); spatial(0, -1); }
    else if (k === 'ArrowDown')  { e.preventDefault(); spatial(0, 1); }
    else if (k === 'f' || k === 'F') { App.hud.toggleFullscreen(); }
    else if (k === 'm' || k === 'M') { App.audio.toggleMusic(); App.hud.update(); }
    else if (k === 'h' || k === 'H') { App.scene.home(); }
  });

  // Pausa la música si la pestaña queda en segundo plano
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) App.audio.music.suspend();
    else App.audio.music.resume();
  });
})();
