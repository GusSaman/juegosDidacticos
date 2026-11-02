/* =========================================================
   JUEGO 1 · "Escribiendo los números del 1 al 10"
   Reconstrucción fiel del PPT:
     portada → ruleta (Girar/Parar) → página de trazo (GIF)
   Todas las coordenadas provienen del archivo original
   (en % sobre una diapositiva 16:9).
   ========================================================= */
(function () {
  const A = 'assets/numeros/';

  /* ---------- Geometría del PPT ---------- */
  const PORTADA_ZONE = { x: 21.2, y: 63.7, w: 30.8, h: 29.7 };
  const WHEEL_BOX    = { x: 33.6, y: 1.5,  w: 54.6, h: 97.0 };
  const ARROW        = { x: 29.9, y: 23.9, w: 18.9, h: 16.4 };
  const GIRAR        = { x: 28.5, y: 67.0, w: 14.5, h: 21.9 };
  const REGRESAR     = { x: 9.0,  y: 79.0, w: 25.4, h: 21.0 };
  const LAPIZ        = { x: 21.7, y: 42.9, w: 13.7, h: 31.4 };
  const MANO         = { x: 11.7, y: 47.4, w: 5.9,  h: 14.7 };
  const LOGO         = { x: 95.3, y: 0.0,  w: 4.7,  h: 8.3 };

  // Zonas clicables de la ruleta (número → diapositiva original)
  const RULETA = [
    { n: 1,  x: 50.4, y: 12.9, w: 9.0,  h: 23.1 },
    { n: 2,  x: 59.7, y: 10.7, w: 10.4, h: 23.2 },
    { n: 3,  x: 66.1, y: 21.7, w: 12.8, h: 20.4 },
    { n: 4,  x: 70.3, y: 41.5, w: 12.4, h: 14.8 },
    { n: 5,  x: 67.7, y: 54.4, w: 12.8, h: 21.9 },
    { n: 6,  x: 62.0, y: 64.4, w: 9.4,  h: 22.9 },
    { n: 7,  x: 51.1, y: 65.4, w: 10.5, h: 23.1 },
    { n: 8,  x: 42.4, y: 58.4, w: 12.9, h: 20.0 },
    { n: 9,  x: 39.2, y: 45.3, w: 12.2, h: 14.8 },
    { n: 10, x: 39.5, y: 19.8, w: 12.1, h: 22.2 }
  ];

  // GIF de trazo y su posición en cada página (diapositivas 3…12)
  const TRAZO = {
    1:  { x: 57.7, y: 12.2, w: 15.7, h: 72.0 },
    2:  { x: 56.7, y: 18.2, w: 23.9, h: 67.7 },
    3:  { x: 56.7, y: 15.5, w: 23.7, h: 72.6 },
    4:  { x: 50.0, y: 17.0, w: 29.7, h: 72.5 },
    5:  { x: 56.1, y: 17.1, w: 23.0, h: 71.2 },
    6:  { x: 53.9, y: 18.2, w: 26.1, h: 73.1 },
    7:  { x: 53.7, y: 18.4, w: 27.0, h: 73.3 },
    8:  { x: 52.6, y: 16.7, w: 27.7, h: 76.2 },
    9:  { x: 53.2, y: 13.7, w: 27.7, h: 77.9 },
    10: { x: 47.6, y: 21.3, w: 39.8, h: 63.6 }
  };

  /* ---------- Utilidades ---------- */
  function rect(box) {
    return { left: box.x + '%', top: box.y + '%', width: box.w + '%', height: box.h + '%' };
  }
  // % de diapositiva → coordenada en el escenario (16:9) y ángulo en grados
  function angleBetween(ax, ay, bx, by) {
    const dx = (bx - ax) * 16; // 1% ancho = 16u
    const dy = (by - ay) * 9;  // 1% alto  = 9u
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }
  function norm360(a) { return ((a % 360) + 360) % 360; }

  const W_CX = WHEEL_BOX.x + WHEEL_BOX.w / 2;
  const W_CY = WHEEL_BOX.y + WHEEL_BOX.h / 2;
  // Dirección de la punta de la flecha respecto del centro de la ruleta
  const ARROW_DIR = angleBetween(W_CX, W_CY, ARROW.x + ARROW.w, ARROW.y + ARROW.h / 2);

  /* =========================================================
     Escena: portada
     ========================================================= */
  App.defineScene('numeros.portada', function (params, ui) {
    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'portada.png'));

    const hintBox = ui.make('div', Object.assign(rect(PORTADA_ZONE), {
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }), 'abs');
    hintBox.appendChild(ui.make('div', null, 'hint')).textContent = 'Tocá para empezar ▶';
    el.appendChild(hintBox);

    el.appendChild(ui.zone(rect(PORTADA_ZONE), function () {
      App.audio.sfx('click');
      App.scene.go('numeros.ruleta');
    }, { label: 'Empezar', noHover: true }));

    return { el };
  });

  /* =========================================================
     Escena: ruleta (Girar/Parar + 10 números)
     ========================================================= */
  App.defineScene('numeros.ruleta', function (params, ui) {
    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'menu-fondo.png'));

    // --- Ruleta + zonas dentro de un grupo que gira ---
    const grupo = ui.make('div', rect(WHEEL_BOX), 'ruleta-grupo');
    const imgR = document.createElement('img');
    imgR.className = 'ruleta-img';
    imgR.src = A + 'ruleta.png';
    imgR.alt = '';
    imgR.draggable = false;
    grupo.appendChild(imgR);

    const zonas = RULETA.map(function (z) {
      const box = {
        left: ((z.x - WHEEL_BOX.x) / WHEEL_BOX.w * 100) + '%',
        top: ((z.y - WHEEL_BOX.y) / WHEEL_BOX.h * 100) + '%',
        width: (z.w / WHEEL_BOX.w * 100) + '%',
        height: (z.h / WHEEL_BOX.h * 100) + '%'
      };
      const b = ui.make('button', box, 'zona-num');
      b.type = 'button';
      b.setAttribute('aria-label', 'Número ' + z.n);
      b.title = 'Número ' + z.n;
      b.addEventListener('click', function () {
        if (phase === 'stopping') return;
        App.audio.sfx('click');
        App.scene.go('numeros.trazo', { n: z.n });
      });
      grupo.appendChild(b);
      return { n: z.n, el: b, angle: angleBetween(W_CX, W_CY, z.x + z.w / 2, z.y + z.h / 2) };
    });

    // Dígitos del 1 al 10 dibujados sobre cada segmento de la ruleta
    // (reusan la misma posición que las zonas clicables)
    for (let k = 1; k <= 10; k++) {
      const z = RULETA[k - 1];
      const di = document.createElement('img');
      di.className = 'abs';
      di.src = A + 'digit-' + k + '.png';
      di.alt = '';
      di.draggable = false;
      di.style.left = ((z.x - WHEEL_BOX.x) / WHEEL_BOX.w * 100) + '%';
      di.style.top = ((z.y - WHEEL_BOX.y) / WHEEL_BOX.h * 100) + '%';
      di.style.width = (z.w / WHEEL_BOX.w * 100) + '%';
      di.style.height = (z.h / WHEEL_BOX.h * 100) + '%';
      grupo.appendChild(di);
    }

    el.appendChild(grupo);
    el.appendChild(ui.img(A + 'flecha.png', rect(ARROW)));

    /* ----- Animación de giro ----- */
    const SPIN_V = 540;        // vel. máxima (°/s)
    const SPIN_ACC = 780;      // aceleración (°/s²)
    const STOP_DUR = 1.35;     // frenado (s)
    const MAX_SPIN = 4.4;      // giro automático máx. (s)

    let angle = 0, phase = 'idle', v = 0;
    let stopFrom = 0, stopTo = 0, stopStart = 0;
    let spinStart = 0, rafId = null, lastT = 0;
    let selected = null, hintTimer = null;

    function render() { grupo.style.transform = 'rotate(' + norm360(angle) + 'deg)'; }

    function tick(now) {
      if (phase === 'idle') { rafId = null; return; }
      const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
      lastT = now;

      if (phase === 'spinning') {
        v = Math.min(SPIN_V, v + SPIN_ACC * dt);
        angle += v * dt;
        if ((now - spinStart) / 1000 > MAX_SPIN) startStop();
      } else if (phase === 'stopping') {
        const p = Math.min(1, (now - stopStart) / (STOP_DUR * 1000));
        const e = 1 - Math.pow(1 - p, 2); // easeOutQuad (continuidad de velocidad)
        angle = stopFrom + (stopTo - stopFrom) * e;
        if (p >= 1) finishStop();
      }
      render();
      rafId = requestAnimationFrame(tick);
    }

    function ensureLoop() {
      lastT = performance.now();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function startSpin() {
      clearSelection();
      phase = 'spinning';
      v = 0;
      spinStart = performance.now();
      ensureLoop();
      App.audio.sfx('click');
      btnGirar.setAttribute('aria-label', 'Detener la ruleta');
    }

    function startStop() {
      if (phase !== 'spinning') return;
      phase = 'stopping';
      stopFrom = angle;
      stopStart = performance.now();

      // Elegimos un número al azar y hacemos que la flecha coincida con él
      const pick = zonas[(Math.random() * zonas.length) | 0];
      selected = pick;
      const base = norm360(ARROW_DIR - pick.angle);
      const brake = v * 0.5 * STOP_DUR + 45;
      let to = base;
      while (to <= stopFrom + brake) to += 360;
      stopTo = to;
      App.audio.sfx('click');
      btnGirar.setAttribute('aria-label', 'Girar la ruleta');
    }

    function finishStop() {
      phase = 'idle';
      v = 0;
      angle = norm360(stopTo);
      render();
      rafId = null;
      if (selected) {
        selected.el.classList.add('sel');
        App.fx.toast('¡El número es el <b>' + selected.n + '</b>!', { kind: 'good', small: true, life: 1900 });
      }
    }

    function clearSelection() {
      zonas.forEach(function (z) { z.el.classList.remove('sel'); });
      selected = null;
    }

    /* ----- Botón Girar/Parar ----- */
    const btnGirar = ui.imgBtn(A + 'boton-girar.png', rect(GIRAR), function () {
      if (phase === 'idle') startSpin();
      else if (phase === 'spinning') startStop();
    }, { label: 'Girar o detener la ruleta' });
    btnGirar.classList.add('pulso-suave');
    el.appendChild(btnGirar);

    // Pista inicial
    const hintBox = ui.make('div', {
      left: (GIRAR.x + GIRAR.w / 2) + '%',
      top: (GIRAR.y - 7) + '%',
      transform: 'translate(-50%,-50%)'
    }, 'abs');
    const hint = ui.make('div', null, 'hint');
    hint.textContent = 'Tocá «Girar» y después elegí un número';
    hint.style.fontSize = 'calc(var(--u) * 2.2)';
    hintBox.appendChild(hint);
    hintBox.style.pointerEvents = 'none';
    el.appendChild(hintBox);
    hintTimer = setTimeout(function () { hintBox.remove(); }, 5200);

    render();

    return {
      el: el,
      exit: function () {
        if (rafId) cancelAnimationFrame(rafId);
        clearTimeout(hintTimer);
      }
    };
  });

  /* =========================================================
     Escena: página de trazo del número
     ========================================================= */
  App.defineScene('numeros.trazo', function (params, ui) {
    const n = Math.min(10, Math.max(1, parseInt(params.n, 10) || 1));
    const box = TRAZO[n];

    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'trazo-fondo.png'));
    el.appendChild(ui.img(A + 'logo.png', rect(LOGO)));

    // Manito decorativa (sólo en las páginas del 2 y del 7, como en el original)
    if (n === 2 || n === 7) el.appendChild(ui.img(A + 'mano.png', rect(MANO)));

    // GIF con la animación de trazo
    let gif = ui.img(A + 'numero-' + n + '.gif', rect(box), 'gif-trazo');
    el.appendChild(gif);

    // Lápiz: reinicia la animación de trazo (tal como indican las instrucciones)
    const lapiz = ui.imgBtn(A + 'lapiz.png', rect(LAPIZ), function () {
      App.audio.sfx('click');
      gif = App.fx.replay(gif);
      App.fx.toast('¡Mirá cómo se escribe el <b>' + n + '</b>!', { small: true, life: 1500 });
    }, { label: 'Iniciar el trazo del número ' + n });
    lapiz.classList.add('pulso-suave');
    el.appendChild(lapiz);

    // Botón REGRESAR a la ruleta
    el.appendChild(ui.imgBtn(A + 'boton-regresar.png', rect(REGRESAR), function () {
      App.audio.sfx('click');
      App.scene.back();
    }, { label: 'Regresar a la ruleta' }));

    return { el: el };
  });

  /* ---------- Alta en el registro de juegos ---------- */
  App.games.register({
    id: 'numeros',
    title: 'Escribiendo los números',
    subtitle: 'Ruleta mágica y trazo del 1 al 10',
    cover: A + 'portada.png',
    scene: 'numeros.portada'
  });
})();
