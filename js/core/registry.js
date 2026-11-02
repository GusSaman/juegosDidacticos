/* =========================================================
   Registro de juegos (games registry)
   ---------------------------------------------------------
   Para agregar un juego nuevo:
     1) Crear js/games/mi-juego.js con App.games.register({...})
     2) Sumar la línea <script src="js/games/mi-juego.js"></script>
        en index.html
   El menú principal se dibuja solo a partir de este registro.
   ========================================================= */
window.App = window.App || {};

App.games = (function () {
  const list = [];

  function register(game) {
    // game: { id, title, subtitle, cover, scene }
    //  - scene: id de la escena de entrada del juego (debe estar definida
    //    con App.defineScene antes de que el usuario la abra)
    if (!game || !game.id || !game.scene) {
      console.error('[games] Juego inválido:', game);
      return;
    }
    if (list.some(g => g.id === game.id)) {
      console.error('[games] Id duplicado:', game.id);
      return;
    }
    list.push(game);
  }

  function all() { return list.slice(); }
  function get(id) { return list.find(g => g.id === id) || null; }

  return { register, all, get };
})();
