# 🎮 Juegos Didácticos — Material Didáctico Rayitas

Aplicación recreativa y didáctica que **reproduce fielmente** los dos PowerPoint
de la carpeta de origen y los convierte en un juego web multilingüe (español)
multiplataforma: **notebook, tablet y TV smart**.

## 🎯 Juegos incluidos

| Juego | Origen | Descripción |
|---|---|---|
| **Escribiendo los números** | `INTERACTIVO ESCRIBIENDO LOS NÚMEROS.pptx` | Portada → ruleta giratoria (Girar/Parar) → página de trazo del número (GIF animada) |
| **El chango Tiago** | `105. Cuento interactivo. El chango Tiago.pptx` | Portada → menú (CUENTO / JUEGO / ✕) → cuento de 5 páginas → quiz de 5 preguntas → créditos |

## ▶️ Cómo abrirla

- **Simple:** doble clic en `index.html`.
- **Windows:** doble clic en `iniciar.bat` (o `iniciar.ps1`).

No se necesita servidor, compilación ni dependencias. Corre con
`<script>` clásicos (funciona desde `file://`).

Compatible con: notebook Windows/Chrome/Edge, tablets Android e iOS, TV smart
(sintetizadores de vídeo y navegadores Chromium).

## 🕹️ Controles

| Control | Acción |
|---|---|
| Toque / clic | Interactuar (botones del PPT, zonas) |
| Mouse / puntero | Igual que toque |
| `← ↑ → ↓` | Navegación espacial (mando / teclado) |
| `Enter` / `Space` | Elegir / confirmar |
| `Esc` / `Backspace` | Atrás |
| `H` | Ir al menú principal |
| `M` | Encender / apagar la música |
| `F` | Pantalla completa |

La barra de controles superior se puede mostrar moviendo el mouse, tocando
la pantalla o pulsando cualquier tecla; se oculta sola para no tapar el arte.

## 🎵 Música y sonidos

- **Música de fondo:** melodía alegre sintetizada con WebAudio (progresión
  I–V–vi–IV en Do mayor), activa por defecto y con interruptor.
- **Sonidos:** todos los WAV originales del PowerPoint (clic, fantasy, buzzer,
  aplausos, acierto…) se conservan tal cual, más feedback extra recreativo
  (confeti, toasts, sacudida, destellos).

## 🏗️ Arquitectura (para agregar nuevos juegos)

El menú principal se genera **automáticamente** desde un registro:

```
js/
  core/
    registry.js   → registro de juegos (agregar = sumar un registro)
    audio.js      → SFX + música generada
    effects.js    → confeti / toasts / shakes
    stage.js      → escenario 16:9, router de escenas, HUD, teclado/mando, fullscreen
  games/
    numeros.js    → Juego 1 (escenas: numeros.portada / numeros.ruleta / numeros.trazo)
    tiago.js      → Juego 2 (escenas: tiago.portada / tiago.menu / tiago.cuento /
                    tiago.juego / tiago.resultado / tiago.creditos)
  main.js         → escena "home" (tarjetas desde App.games.all())
```

Para sumar un **nuevo juego didáctico**:

1. Copiar el PPTX extraído a `assets/<id>/` (imagenes + sonidos) y renombrar
   las referencias dentro del archivo `js/games/<id>.js`.
2. Definir escenas con `App.defineScene('<id>.xxx', function(params, ui){ ... })`.
3. `App.games.register({ id, title, subtitle, cover, scene })`.
4. Agregar `<script src="js/games/<id>.js"></script>` en `index.html`.

La lógica de posiciones sigue el mismo patrón: coordenadas en `%` sobre
escenario 16:9 (el mismo sistema que usa PowerPoint).

## 📝 Notas de fidelidad

- Las coordenadas y zonas clicables de ambos juegos se extrajeron
  programáticamente del XML de cada diapositiva (XPS `%`, rels de jumps).
- La respuesta correcta de cada pregunta del quiz de "El chango Tiago"
  corresponde a la zona que disparaba `ppaction://hlinkshowjump?jump=nextslide`.
- No se incluyen materiales protegidos más allá de los clips/imagenes
  originales usados con fines didácticos internos.
