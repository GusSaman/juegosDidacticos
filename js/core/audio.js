/* =========================================================
   Audio: efectos (SFX) + música de fondo generada
   ---------------------------------------------------------
   - Los SFX son los WAV originales de los PowerPoint.
   - La música es una melodía alegre sintetizada con WebAudio
     (sin archivos externos: funciona offline y sin licencias).
   - Todo se desbloquea con el primer toque/tecla, tal como
     exigen los navegadores de notebook, tablet y TV smart.
   ========================================================= */
window.App = window.App || {};

App.audio = (function () {

  /* ---------- Biblioteca de efectos ---------- */
  const SFX_SRC = {
    click:        'assets/numeros/click.wav',   // números: selección / regresar
    tiagoPortada: 'assets/tiago/portada.wav',   // cuento: entrada
    tiagoMenu:    'assets/tiago/menu.wav',      // cuento: jingle de menú
    boton:        'assets/tiago/boton.wav',     // cuento: botones
    aplausos:     'assets/tiago/aplausos.wav',  // cuento: créditos
    pagina:       'assets/tiago/pagina.wav',    // cuento: pasar página
    error:        'assets/tiago/error.wav',     // quiz: respuesta incorrecta
    acierto:      'assets/tiago/acerto.wav'     // quiz: respuesta correcta
  };

  /* ---------- Ajustes persistidos ---------- */
  const KEY = 'jd.settings';
  const settings = Object.assign(
    { musicOn: true, musicVol: 0.38, sfxVol: 0.9 },
    load()
  );

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
  }

  /* ---------- Reproductor de SFX ---------- */
  const banks = {};
  let unlocked = false;

  function preload() {
    Object.keys(SFX_SRC).forEach(name => {
      const a = new Audio();
      a.preload = 'auto';
      a.src = SFX_SRC[name];
      banks[name] = a;
    });
  }

  function sfx(name, opts) {
    if (!settings.sfxVol) return;
    const base = banks[name];
    if (!base) { console.warn('[audio] SFX desconocido:', name); return; }
    const vol = (opts && opts.vol != null ? opts.vol : 1) * settings.sfxVol;
    const node = base.cloneNode(true);
    node.volume = Math.max(0, Math.min(1, vol));
    const p = node.play();
    if (p && p.catch) p.catch(() => {});
  }

  function setSfxVol(v) {
    settings.sfxVol = Math.max(0, Math.min(1, v));
    save();
  }

  /* =========================================================
     MÚSICA DE FONDO (secuenciador WebAudio)
     Progresión I – V – vi – IV en Do mayor, 112 BPM:
     bajo, arpegio, melodía pentatónica y shaker suave.
     ========================================================= */
  const Music = (function () {
    const BPM = 112;
    const STEP = (60 / BPM) / 2;          // corchea
    const STEPS = 32;                     // 4 compases × 8 corcheas
    const CHORDS = [
      { triad: [60, 64, 67], bass: 36 }, // C
      { triad: [59, 62, 67], bass: 43 }, // G
      { triad: [57, 60, 64], bass: 45 }, // Am
      { triad: [57, 60, 65], bass: 41 }  // F
    ];
    const ARP = [0, 1, 2, 1, 0, 1, 2, 1];
    const MELODY = [
      [76, 79, 81, 79], // C:  E5 G5 A5 G5
      [74, 79, 81, 79], // G:  D5 G5 A5 G5
      [72, 76, 79, 76], // Am: C5 E5 G5 E5
      [72, 77, 81, 77]  // F:  C5 F5 A5 F5
    ];

    let ctx = null, master = null, noiseBuf = null;
    let timer = null, nextTime = 0, step = 0, running = false;

    function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

    function ensure() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = settings.musicVol;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6500;
      master.connect(lp);
      lp.connect(ctx.destination);

      // ruido para el shaker
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }

    function tone(t, midi, dur, type, gain, filterHz) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq(midi);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterHz || 4000;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    }

    function shaker(t, gain) {
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 5200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t); s.stop(t + 0.08);
    }

    function playStep(i, t) {
      const bar = Math.floor(i / 8);
      const pos = i % 8;
      const chord = CHORDS[bar];

      // bajo
      if (pos === 0 || pos === 4) tone(t, chord.bass, 0.45, 'sine', 0.5, 1200);

      // arpegio
      const arpNote = chord.triad[ARP[pos]] + 12;
      tone(t, arpNote, 0.26, 'triangle', 0.16, 3200);

      // melodía (corcheas en tiempos fuertes de cada tiempo)
      if (pos % 2 === 0) {
        const note = MELODY[bar][pos / 2];
        tone(t, note, 0.5, 'triangle', 0.24, 3600);
        tone(t, note + 12, 0.34, 'sine', 0.10, 5000); // brillo
      }

      // shaker suave en las contratiempos
      if (pos % 2 === 1) shaker(t, 0.05);
    }

    function tick() {
      if (!running) return;
      while (nextTime < ctx.currentTime + 0.16) {
        playStep(step, nextTime);
        nextTime += STEP;
        step = (step + 1) % STEPS;
      }
    }

    function start() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (running) return;
      running = true;
      nextTime = ctx.currentTime + 0.08;
      step = 0;
      timer = setInterval(tick, 25);
      tick();
    }

    function stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
    }

    function setVolume(v) {
      settings.musicVol = Math.max(0, Math.min(1, v));
      if (master) master.gain.setTargetAtTime(settings.musicVol, ctx.currentTime, 0.05);
      save();
    }

    function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
    function resume()  { if (ctx && ctx.state === 'suspended' && running) ctx.resume(); }

    return {
      start, stop, setVolume, suspend, resume,
      get running() { return running; }
    };
  })();

  /* ---------- Estado global ---------- */
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    preload();
    if (settings.musicOn) Music.start();
  }

  function toggleMusic() {
    settings.musicOn = !settings.musicOn;
    save();
    if (settings.musicOn) Music.start(); else Music.stop();
    return settings.musicOn;
  }

  function setMusicVol(v) { Music.setVolume(v); }

  function refreshIcon() {
    const btn = document.querySelector('.hud-btn[data-act="music"]');
    if (btn) btn.classList.toggle('muted', !settings.musicOn);
  }

  return {
    sfx,
    unlock,
    toggleMusic,
    setMusicVol,
    setSfxVol,
    refreshIcon,
    music: Music,
    get settings() { return settings; }
  };
})();
