/* =========================================================
   Menú principal y arranque de la aplicación
   El menú se dibuja a partir de App.games (registro de juegos):
   agregar un juego nuevo no requiere tocar este archivo.
   ========================================================= */
(function () {

  App.defineScene('home', function (params, ui) {
    const el = document.createElement('div');
    el.appendChild(ui.make('div', null, 'home-bg'));

    const inner = ui.make('div', null, 'home-inner');

    const h1 = document.createElement('h1');
    h1.className = 'home-title';
    h1.textContent = 'Juegos Didácticos';
    inner.appendChild(h1);

    const sub = document.createElement('p');
    sub.className = 'home-sub';
    sub.textContent = 'Elegí un juego y a divertirse · Material Didáctico Rayitas';
    inner.appendChild(sub);

    const grid = ui.make('div', null, 'home-grid');
    App.games.all().forEach(function (g) {
      const card = ui.make('button', null, 'game-card');
      card.type = 'button';
      card.setAttribute('aria-label', 'Jugar a ' + g.title);

      const cover = ui.make('div', null, 'cover');
      const img = document.createElement('img');
      img.src = g.cover;
      img.alt = '';
      img.draggable = false;
      cover.appendChild(img);

      const meta = ui.make('div', null, 'meta');
      const title = document.createElement('h2');
      title.textContent = g.title;
      const desc = document.createElement('p');
      desc.textContent = g.subtitle || '';
      const play = ui.make('span', null, 'play');
      play.textContent = 'JUGAR';
      meta.appendChild(title);
      if (g.subtitle) meta.appendChild(desc);
      meta.appendChild(play);

      card.appendChild(cover);
      card.appendChild(meta);

      card.addEventListener('click', function () {
        App.audio.sfx('click', { vol: 0.7 });
        App.scene.go(g.scene);
      });

      grid.appendChild(card);
    });
    inner.appendChild(grid);

    const foot = document.createElement('div');
    foot.className = 'home-foot';
    foot.innerHTML =
      'Controles: <b>← ↑ → ↓</b> moverse · <b>Enter</b> elegir · <b>Esc</b> volver · ' +
      '<b>H</b> inicio · <b>M</b> música · <b>F</b> pantalla completa<br>' +
      'Material Didáctico Rayitas — reproducción fiel de los PowerPoint originales (uso didáctico).';
    inner.appendChild(foot);

    el.appendChild(inner);
    return { el: el };
  });

  /* ---------- Arranque ---------- */
  function boot() {
    App.audio.refreshIcon();
    App.scene.go('home', null, { reset: true });
    App.hud.update();

    // Precarga de portadas para que el primer clic sea inmediato
    App.games.all().forEach(function (g) {
      const i = new Image();
      i.src = g.cover;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
