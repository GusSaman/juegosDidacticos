/* =========================================================
   Efectos recreativos: confeti, toasts y utilidades visuales
   ========================================================= */
window.App = window.App || {};

App.fx = (function () {
  const COLORS = ['#ff5f6d', '#ffc531', '#47e0a0', '#4facfe', '#c471f5', '#ff9a3c', '#ffffff'];

  function layer() {
    return document.getElementById('fx-layer');
  }

  /* Confeti burst: x,y en % del escenario (por defecto, centro) */
  function confetti(count, x, y) {
    const host = layer();
    if (!host) return;
    count = count || 70;
    x = (x == null ? 50 : x);
    y = (y == null ? 42 : y);

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'confetti';
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // abanico hacia arriba
      const dist = 18 + Math.random() * 40;                       // en unidades del escenario (1u = 1% ancho)
      const tx = Math.cos(ang) * dist;
      const ty = Math.abs(Math.sin(ang)) * dist * 0.55 + 22 + Math.random() * 26; // + gravedad
      p.style.left = x + '%';
      p.style.top = y + '%';
      p.style.background = COLORS[(Math.random() * COLORS.length) | 0];
      p.style.setProperty('--tx', 'calc(var(--u) * ' + tx.toFixed(2) + ')');
      p.style.setProperty('--ty', 'calc(var(--u) * ' + ty.toFixed(2) + ')');
      p.style.setProperty('--rot', ((Math.random() * 1080) - 540) + 'deg');
      p.style.animationDelay = (Math.random() * 0.25) + 's';
      p.style.animationDuration = (1.7 + Math.random() * 1.1) + 's';
      host.appendChild(p);
      setTimeout(() => p.remove(), 3400);
    }
  }

  /* Mensaje grande en pantalla. kind: 'good' | 'bad' | null */
  function toast(msg, opts) {
    opts = opts || {};
    const host = layer();
    if (!host) return;

    const t = document.createElement('div');
    t.className = 'toast' + (opts.kind ? ' ' + opts.kind : '') + (opts.small ? ' small' : '');
    t.innerHTML = msg;
    host.appendChild(t);

    const life = opts.life || 1500;
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 320);
    }, life);
    return t;
  }

  /* Hace vibrar un elemento */
  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 600);
  }

  /* Destello de color sobre un elemento: 'flash-red' | 'flash-green' */
  function flash(el, cls) {
    if (!el) return;
    el.classList.remove('flash-red', 'flash-green');
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 800);
  }

  /* Clona un nodo para reiniciar animaciones (p. ej. un GIF) */
  function replay(el) {
    if (!el || !el.parentNode) return el;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  return { confetti, toast, shake, flash, replay };
})();
