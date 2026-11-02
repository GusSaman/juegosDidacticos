/* =========================================================
   JUEGO 2 · "Cuento interactivo. El chango Tiago"
   Reconstrucción fiel del PPT:
     portada → menú (CUENTO / JUEGO / ✕ créditos)
       · CUENTO: 5 páginas con flecha de avance
       · JUEGO : 5 preguntas con 3 opciones, puntaje y
                 sonidos de acierto / error originales
   Las respuestas correctas salen de la lógica del archivo
   original (zona con salto de diapositiva = acierto).
   ========================================================= */
(function () {
  const A = 'assets/tiago/';

  /* ---------- Geometría del PPT ---------- */
  const BTN_CUENTO = { x: 58.0, y: 10.6, w: 41.2, h: 24.7 };
  const BTN_JUEGO  = { x: 58.0, y: 37.7, w: 41.2, h: 24.7 };
  const BTN_CREDIT = { x: 73.7, y: 76.0, w: 10.8, h: 16.0 };

  const FLECHAS = [
    { x: 88.3, y: 80.1, w: 11.6, h: 19.8 },
    { x: 88.5, y: 80.1, w: 11.5, h: 19.8 },
    { x: 88.7, y: 80.1, w: 11.3, h: 19.8 },
    { x: 88.7, y: 80.1, w: 11.3, h: 19.8 },
    { x: 88.5, y: 80.1, w: 11.5, h: 19.8 }
  ];

  // Columnas de respuesta (izquierda / centro / derecha)
  const COLS = [
    { x: 1.0,  w: 32.0 },
    { x: 33.0, w: 32.0 },
    { x: 65.0, w: 34.0 }
  ];
  const COL_Y = 29.0, COL_H = 65.0;

  // Respuesta correcta por pregunta (0 = izquierda, 1 = centro, 2 = derecha)
  const CORRECTAS = [1, 2, 0, 2, 0];

  function rect(box) {
    return { left: box.x + '%', top: box.y + '%', width: box.w + '%', height: box.h + '%' };
  }

  /* =========================================================
     Escena: portada
     ========================================================= */
  App.defineScene('tiago.portada', function (params, ui) {
    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'portada.png'));

    const hintBox = ui.make('div', {
      left: '0%', top: '78%', width: '100%', height: '14%',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }, 'abs');
    hintBox.style.pointerEvents = 'none';
    const hint = ui.make('div', null, 'hint');
    hint.textContent = 'Tocá para comenzar ▶';
    hintBox.appendChild(hint);
    el.appendChild(hintBox);

    el.appendChild(ui.zone({ left: '0%', top: '0%', width: '100%', height: '100%' }, function () {
      App.audio.sfx('boton');
      App.scene.go('tiago.menu');
    }, { label: 'Comenzar', noHover: true }));

    return {
      el: el,
      enter: function () { App.audio.sfx('tiagoPortada', { vol: 0.9 }); }
    };
  });

  /* =========================================================
     Escena: menú (CUENTO / JUEGO / créditos)
     ========================================================= */
  App.defineScene('tiago.menu', function (params, ui) {
    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'menu.png'));

    el.appendChild(ui.zone(rect(BTN_CUENTO), function () {
      App.audio.sfx('boton');
      App.scene.go('tiago.cuento', { p: 0 });
    }, { label: 'Leer el cuento' }));

    el.appendChild(ui.zone(rect(BTN_JUEGO), function () {
      App.audio.sfx('boton');
      App.scene.go('tiago.juego', { q: 0, score: 0 });
    }, { label: 'Jugar el desafío' }));

    el.appendChild(ui.zone(rect(BTN_CREDIT), function () {
      App.audio.sfx('aplausos', { vol: 0.9 });
      App.scene.go('tiago.creditos');
    }, { label: 'Créditos' }));

    return {
      el: el,
      enter: function () { App.audio.sfx('tiagoMenu', { vol: 0.8 }); }
    };
  });

  /* =========================================================
     Escena: páginas del cuento
     ========================================================= */
  App.defineScene('tiago.cuento', function (params, ui) {
    const p = Math.min(4, Math.max(0, parseInt(params.p, 10) || 0));

    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'cuento-' + (p + 1) + '.png'));

    // Puntos de progreso
    const dots = ui.make('div', null, 'dots');
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('i');
      if (i <= p) d.className = 'on';
      dots.appendChild(d);
    }
    el.appendChild(dots);

    // Flecha de avance (misma zona que en el original)
    el.appendChild(ui.zone(rect(FLECHAS[p]), function () {
      App.audio.sfx('pagina');
      if (p === 4) {
        // Al terminar el cuento vuelve al menú, como en el PPT original
        App.scene.go('tiago.menu', null, { replace: true });
      } else {
        App.scene.go('tiago.cuento', { p: p + 1 }, { replace: true });
      }
    }, { label: 'Página siguiente' }));

    // Flecha de retroceso (mejora de usabilidad, no estaba en el PPT)
    const back = ui.make('button', null, 'back-fab');
    back.type = 'button';
    back.textContent = '←';
    back.setAttribute('aria-label', 'Página anterior');
    back.title = 'Página anterior';
    back.addEventListener('click', function (ev) {
      ev.preventDefault();
      App.audio.sfx('pagina', { vol: 0.7 });
      if (p === 0) App.scene.back();          // primera página → menú
      else App.scene.go('tiago.cuento', { p: p - 1 }, { replace: true });
    });
    el.appendChild(back);

    return {
      el: el,
      enter: function () {
        if (p === 0) App.audio.sfx('pagina', { vol: 0.7 });
      }
    };
  });

  /* =========================================================
     Escena: preguntas del juego (quiz)
     ========================================================= */
  App.defineScene('tiago.juego', function (params, ui) {
    const q = Math.min(4, Math.max(0, parseInt(params.q, 10) || 0));
    let score = parseInt(params.score, 10) || 0;
    const correcta = CORRECTAS[q];
    let lock = false;
    let timer = null;

    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'pregunta-' + (q + 1) + '.png'));

    // Marcador discreto
    const chip = ui.make('div', { text: '⭐ ' + score + ' / 5' }, 'score-chip');
    el.appendChild(chip);

    // Zonas de respuesta
    const zones = COLS.map(function (c, i) {
      const z = ui.zone({
        left: c.x + '%', top: COL_Y + '%', width: c.w + '%', height: COL_H + '%'
      }, function () { answer(i, z); }, {
        label: 'Opción ' + (i + 1),
        noHover: true
      });
      el.appendChild(z);
      return z;
    });

    function answer(i, z) {
      if (lock) return;

      if (i === correcta) {
        lock = true;
        score++;
        chip.textContent = '⭐ ' + score + ' / 5';
        App.audio.sfx('acierto');
        App.fx.flash(z, 'flash-green');
        App.fx.confetti(60, cCenter(i), 55);
        App.fx.toast('¡Muy bien! 🎉', { kind: 'good', life: 1300 });

        timer = setTimeout(function () {
          if (q === 4) App.scene.go('tiago.resultado', { score: score });
          else App.scene.go('tiago.juego', { q: q + 1, score: score }, { replace: true });
        }, 1500);
      } else {
        App.audio.sfx('error');
        App.fx.flash(z, 'flash-red');
        App.fx.shake(z);
        App.fx.shake(el);
        App.fx.toast('Casi… ¡intentá de nuevo!', { kind: 'bad', small: true, life: 1200 });
      }
    }

    function cCenter(i) { return COLS[i].x + COLS[i].w / 2; }

    return {
      el: el,
      exit: function () { clearTimeout(timer); }
    };
  });

  /* =========================================================
     Escena: resultado final
     ========================================================= */
  App.defineScene('tiago.resultado', function (params, ui) {
    const score = Math.max(0, Math.min(5, parseInt(params.score, 10) || 0));

    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'menu.png'));

    const dim = ui.make('div', { left: '0%', top: '0%', width: '100%', height: '100%', background: 'rgba(6,8,16,.72)' }, 'abs');
    el.appendChild(dim);

    const card = ui.make('div', null, 'overlay-card');
    const stars = score === 5 ? '⭐⭐⭐⭐⭐' : (score >= 3 ? '⭐⭐⭐' : '⭐');
    card.innerHTML =
      '<h2>¡' + (score >= 3 ? 'Muy bien!' : 'Buen intento!') + '</h2>' +
      '<div class="stars">' + stars + '</div>' +
      '<p>Respuestas correctas: <b>' + score + ' de 5</b></p>';

    const row = ui.make('div', null, 'btn-row');
    const again = ui.make('button', null, 'btn-big');
    again.type = 'button';
    again.textContent = 'Jugar otra vez';
    again.addEventListener('click', function () {
      App.audio.sfx('boton');
      App.scene.go('tiago.juego', { q: 0, score: 0 }, { replace: true });
    });

    const menuBtn = ui.make('button', null, 'btn-big ghost');
    menuBtn.type = 'button';
    menuBtn.textContent = 'Menú';
    menuBtn.addEventListener('click', function () {
      App.audio.sfx('boton');
      App.scene.go('tiago.menu', null, { replace: true });
    });

    row.appendChild(again);
    row.appendChild(menuBtn);
    card.appendChild(row);
    el.appendChild(card);

    return {
      el: el,
      enter: function () {
        App.fx.confetti(90, 50, 40);
        if (score === 5) App.audio.sfx('aplausos', { vol: 0.9 });
        else App.audio.sfx('acierto', { vol: 0.9 });
      }
    };
  });

  /* =========================================================
     Escena: créditos
     ========================================================= */
  App.defineScene('tiago.creditos', function (params, ui) {
    const el = document.createElement('div');
    el.appendChild(ui.bg(A + 'creditos.png'));

    const hintBox = ui.make('div', {
      left: '0%', top: '82%', width: '100%', height: '14%',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }, 'abs');
    hintBox.style.pointerEvents = 'none';
    const hint = ui.make('div', null, 'hint');
    hint.textContent = 'Tocá para volver al inicio';
    hintBox.appendChild(hint);
    el.appendChild(hintBox);

    el.appendChild(ui.zone({ left: '0%', top: '0%', width: '100%', height: '100%' }, function () {
      App.scene.home();
    }, { label: 'Volver al inicio', noHover: true }));

    return {
      el: el,
      enter: function () { App.audio.sfx('aplausos', { vol: 0.95 }); }
    };
  });

  /* ---------- Alta en el registro de juegos ---------- */
  App.games.register({
    id: 'tiago',
    title: 'El chango Tiago',
    subtitle: 'Cuento interactivo y juego de 5 preguntas',
    cover: A + 'portada.png',
    scene: 'tiago.portada'
  });
})();
