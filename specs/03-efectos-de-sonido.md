# Efectos de Sonido

**Estado:** Aprobado
**Depends on:** SPEC 01, SPEC 02
**Date:** 2026-09-10
**Objetivo:** Agregar sonido de rebote de bola (paleta, paredes laterales y techo) y sonido de destrucción de ladrillos, con soporte de mute mediante tecla `M` e indicador visual en el panel de info.

---

## Alcance

### Incluido en este spec

- Reproducción de `assets/sounds/ball-bounce.mp3` cuando la bola rebota contra la paleta, las paredes laterales o el techo.
- Reproducción de `assets/sounds/break-sound.mp3` cuando un ladrillo es destruido — sin reproducir `ball-bounce.mp3` en ese mismo golpe.
- Un objeto `Audio` reutilizado por sonido (no uno nuevo por reproducción); en cada trigger se reinicia `currentTime = 0` antes de `play()`, para soportar golpes rápidos consecutivos.
- Estado de mute (`muted`, booleano) fuera de `gameState`, análogo a `statusBeforePause` — no se reinicia con `resetGame()`.
- Tecla `M` (mayúscula o minúscula) alterna el mute.
- Indicador visual del estado de sonido en el panel de info (`index.html`), actualizado en `updateInfoPanel()`.

### Fuera de este spec

- Control de volumen variable (slider, niveles) — solo mute binario.
- Solapamiento real de sonidos simultáneos (clonar nodos de audio) — se acepta que un sonido interrumpa al anterior del mismo tipo.
- Sonido al perder una vida (bola cae por el suelo) — no es un "rebote", queda en silencio.
- Nuevos efectos de sonido (música de fondo, sonido de game over/victoria) — no están entre los dos MP3 existentes.
- Manejo de errores de carga de audio (archivo faltante, red caída) — no se implementa mitigación.

---

## Modelo de Datos

No se introduce ninguna estructura de datos nueva relevante al modelo del juego. Se agregan solo:

```javascript
// Objetos de audio reutilizados (uno por efecto)
const SOUND_BALL_BOUNCE = new Audio("assets/sounds/ball-bounce.mp3");
const SOUND_BREAK = new Audio("assets/sounds/break-sound.mp3");

// Estado de mute, fuera de gameState (no se resetea con R)
let muted = false;
```

---

## Plan de Implementación

### 1. Helper de reproducción y estado de mute (sin disparar aún)

**Archivos:** `game.js`

**Lógica:**

- Declarar `SOUND_BALL_BOUNCE`, `SOUND_BREAK` y `let muted = false;`.
- Agregar `function playSound(audio)`: si `muted` es `true`, no hace nada; si no, `audio.currentTime = 0; audio.play();`.

**Resultado verificable:** el juego funciona exactamente igual que antes; no hay errores de consola por los nuevos objetos `Audio`.

### 2. Sonido de bola en paredes y techo

**Archivos:** `game.js`

**Lógica:**

- En `collideWithWalls()`, llamar `playSound(SOUND_BALL_BOUNCE)` en los tres casos de rebote (pared izquierda, pared derecha, techo). No se llama en el caso de caída por el suelo (`ball.y > CANVAS_HEIGHT`).

**Resultado verificable:** al rebotar la bola contra cualquier pared o el techo, se escucha `ball-bounce.mp3`; al caer por el suelo, no suena nada.

### 3. Sonido de bola en la paleta

**Archivos:** `game.js`

**Lógica:**

- En `collideWithPaddle()`, tras confirmar la intersección válida (después del `if (!intersects || ball.vy < 0) return;`), llamar `playSound(SOUND_BALL_BOUNCE)`.

**Resultado verificable:** al rebotar la bola contra la paleta, se escucha `ball-bounce.mp3`.

### 4. Sonido de destrucción de ladrillos

**Archivos:** `game.js`

**Lógica:**

- En `collideWithBricks()`, junto con `brick.alive = false` y el `push` a `explosions`, llamar `playSound(SOUND_BREAK)`.
- No se llama a `playSound(SOUND_BALL_BOUNCE)` en esta función — el rebote contra un ladrillo no reproduce sonido de bola, solo el de destrucción.

**Resultado verificable:** al destruir un ladrillo, se escucha `break-sound.mp3` y no se superpone `ball-bounce.mp3`.

### 5. Tecla M para mute/unmute

**Archivos:** `game.js`

**Lógica:**

- En el listener de `keydown` (`setupInput()`), agregar: si `e.key === "m" || e.key === "M"`, `muted = !muted;`.

**Resultado verificable:** presionar `M` alterna el estado; mientras `muted === true`, ningún sonido se reproduce (verificable llamando a `playSound` manualmente o rebotando la bola).

### 6. Indicador visual del estado de sonido

**Archivos:** `index.html`, `game.js`

**Lógica:**

- En `index.html`, agregar un elemento al panel de info junto a score/vidas: `<span id="sound-status">Sonido: ON</span>` (o similar, siguiendo el patrón existente de `scoreEl`/`livesEl`).
- En `game.js`, agregar `const soundStatusEl = document.getElementById("sound-status");` junto a las demás referencias al DOM.
- En `updateInfoPanel()`, actualizar `soundStatusEl.textContent = muted ? "Sonido: OFF" : "Sonido: ON";`.

**Resultado verificable:** el panel muestra "Sonido: ON" por defecto; al presionar `M` cambia a "Sonido: OFF" y viceversa, en tiempo real.

---

## Criterios de Aceptación

- [ ] Al rebotar la bola contra la paleta, suena `ball-bounce.mp3`.
- [ ] Al rebotar la bola contra la pared izquierda o derecha, suena `ball-bounce.mp3`.
- [ ] Al rebotar la bola contra el techo, suena `ball-bounce.mp3`.
- [ ] Al caer la bola por el suelo (pérdida de vida), NO suena `ball-bounce.mp3`.
- [ ] Al destruir un ladrillo, suena `break-sound.mp3` y NO suena `ball-bounce.mp3` en ese mismo golpe.
- [ ] Presionar `M` activa/desactiva el mute; mientras está muteado, ningún sonido se reproduce.
- [ ] El panel de info muestra el estado de sonido ("Sonido: ON"/"Sonido: OFF") y se actualiza inmediatamente al presionar `M`.
- [ ] Reiniciar el juego (`R`) no altera el estado de mute.
- [ ] Rebotes rápidos consecutivos reproducen el sonido cada vez, reiniciando desde el principio si el anterior aún estaba sonando.
- [ ] No hay errores 404 ni de reproducción en la consola del navegador.

---

## Decisiones Tomadas y Descartadas

### Tomadas

1. **El techo cuenta como "pared" para el sonido de bola.**
   **Razón:** `collideWithWalls()` ya maneja paredes laterales y techo en la misma función; separar el techo complicaría el código sin beneficio. Confirmado explícitamente por el usuario.
2. **Un solo objeto `Audio` reutilizado por efecto, reiniciando `currentTime`.**
   **Razón:** simplicidad y sin fugas de memoria; suficiente para el ritmo de colisiones de este juego. Confirmado por el usuario sobre la alternativa de clonar nodos.
3. **Mute con tecla `M`, agregado a este mismo spec.**
   **Razón:** pedido explícito del usuario al cerrar las preguntas de clarificación; expande el alcance original pero es una pieza pequeña y directamente relacionada con el sonido.
4. **Indicador visual del estado de mute en el panel de info.**
   **Razón:** confirmado por el usuario — sin esto, el jugador no tendría forma de saber si el sonido está activo.
5. **El estado de mute no se reinicia con `resetGame()` (tecla `R`).**
   **Razón:** es una preferencia de UI del jugador, no parte del estado de la partida — inconsistente reiniciarlo junto con score/vidas/ladrillos.
6. **Sin sonido al perder una vida (bola cae por el suelo).**
   **Razón:** pedido explícito del usuario — el sonido de bola es solo para rebotes contra paleta/paredes, no para la caída.

### Descartadas

1. **Clonar el nodo `Audio` en cada reproducción (`cloneNode()`).**
   Descartada por simplicidad; el solapamiento real de sonidos no es crítico para la experiencia de este juego.
2. **Control de volumen variable (slider).**
   Descartada — fuera de alcance, el usuario solo pidió mute binario.

---

## Riesgos Identificados

### 1. Política de autoplay del navegador

**Descripción:** los navegadores modernos bloquean `play()` de audio si no hay un gesto de usuario previo. En este juego, el primer sonido siempre se dispara después de una colisión, que a su vez solo ocurre después de que el jugador lanzó la bola (tecla), por lo que ya hubo un gesto de usuario.
**Mitigación:** no se requiere ninguna en este spec — el flujo normal del juego ya garantiza interacción previa.
**Probabilidad:** Baja / **Acción:** verificar manualmente que no aparezca el error `NotAllowedError` en consola al jugar la primera partida.
