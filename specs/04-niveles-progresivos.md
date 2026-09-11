# Niveles Progresivos

**Estado:** Aprobado
**Depends on:** SPEC 01, SPEC 02
**Date:** 2026-09-10
**Objetivo:** Reemplazar la grilla única de ladrillos por 5 niveles con patrones geométricos distintos, dificultad creciente (velocidad de bola) y pantalla de transición entre niveles, terminando en una pantalla de victoria final.

---

## Alcance

### Incluido en este spec

- 5 layouts de ladrillos fijos, definidos a mano, uno por nivel:
  1. **Completo** — grilla llena (patrón actual).
  2. **Hueco central** — ventana vacía en el centro de la grilla.
  3. **Pirámide** — forma triangular.
  4. **Diamante** — forma de rombo.
  5. **Columnas** — rayas verticales alternadas (nivel final).
- Nuevo campo `gameState.level` (empieza en 1, máximo `LEVEL_COUNT = 5`).
- `createBricks()` deja de generar siempre la grilla completa y en su lugar consulta `LEVEL_LAYOUTS[gameState.level - 1]`, creando solo los ladrillos donde el layout marca `1`. El color por fila (`ROW_COLORS`) no cambia.
- Incremento fijo de velocidad de la bola por nivel (`BALL_SPEED_INCREMENT_PER_LEVEL`), aplicado en `launchBall()` y `collideWithPaddle()` cuando se asigna una nueva velocidad a la bola.
- Pantalla de transición "Nivel X completado" al destruir todos los ladrillos de un nivel que no sea el último, reutilizando el overlay existente (`#overlay`) con un hint distinto ("Presiona Espacio para continuar").
- Tecla **Espacio** (o `↑`, igual que lanzar la bola) avanza del nivel actual al siguiente mientras el overlay de "Nivel completado" está visible.
- Al completar el nivel 5 (último), se muestra una pantalla de victoria final ("¡Completaste el juego!") en vez de la pantalla de transición — no hay más niveles después.
- Las vidas se reinician a `INITIAL_LIVES` al empezar cada nivel nuevo (incluido el nivel 1 vía `R`).
- El puntaje **no** se reinicia entre niveles — sigue acumulado durante toda la partida, solo se resetea con `R`.
- Reiniciar el juego (`R`) siempre vuelve a `gameState.level = 1`.
- Nuevo indicador de nivel actual en el panel de info (`index.html`), siguiendo el mismo patrón visual que `Puntaje`/`Vidas`.

### Fuera de este spec

- Ladrillos irrompibles o de múltiples golpes — todos los ladrillos siguen destruyéndose de un golpe, igual que ahora.
- Generación procedural de niveles — los 5 layouts son matrices fijas escritas a mano en `game.js`.
- Más de 5 niveles o un modo "infinito" tras completarlos — el spec cierra el ciclo con la pantalla de victoria final.
- Cambios al sistema de sonido (`SPEC 03`) — si esa spec ya está implementada, esta no le agrega ni quita triggers.
- Guardar el progreso de nivel entre sesiones (no hay persistencia en este proyecto).
- Cambiar el layout de un nivel según dificultad seleccionada por el jugador — el orden de niveles es fijo (1→5).

---

## Modelo de Datos

### Constantes nuevas

```javascript
const LEVEL_COUNT = 5;
const BALL_SPEED_INCREMENT_PER_LEVEL = 0.5; // px/frame agregado por nivel

// Cada layout es una matriz BRICK_ROWS x BRICK_COLS (5x8).
// 1 = hay ladrillo en esa celda, 0 = celda vacía.
const LEVEL_LAYOUTS = [
  // Nivel 1: completo
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Nivel 2: hueco central
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Nivel 3: pirámide
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Nivel 4: diamante
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ],
  // Nivel 5: columnas verticales alternadas (final)
  [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
  ],
];
```

### `gameState` — campo nuevo

```javascript
const gameState = {
  score: 0,
  lives: INITIAL_LIVES,
  status: "waiting", // agrega nuevos valores: "levelcomplete", "gamecomplete"
  bricksRemaining: 0,
  level: 1, // NUEVO — 1..LEVEL_COUNT
};
```

`bricksRemaining` ya no es siempre `BRICK_COLS * BRICK_ROWS`: pasa a contarse a partir de las celdas en `1` del layout activo.

---

## Plan de Implementación

### 1. Definir layouts y constantes de progresión

**Archivos:** `game.js`

**Lógica:**

- Agregar `LEVEL_COUNT`, `BALL_SPEED_INCREMENT_PER_LEVEL` y `LEVEL_LAYOUTS` (las 5 matrices de arriba) junto a las demás constantes.
- Agregar `level: 1` a `gameState`.

**Resultado verificable:** el juego sigue funcionando exactamente igual que antes (las constantes no se usan todavía).

### 2. `createBricks()` consulta el layout del nivel activo

**Archivos:** `game.js`

**Lógica:**

- Modificar `createBricks()` para recorrer `LEVEL_LAYOUTS[gameState.level - 1]` en vez de generar siempre una celda por cada `row`/`col`.
- Solo agregar un objeto de ladrillo (`alive: true`, con su `color` por fila) cuando `layout[row][col] === 1`.
- `gameState.bricksRemaining` se calcula contando las celdas en `1` del layout, no `BRICK_COLS * BRICK_ROWS`.

**Resultado verificable:** al iniciar el juego (nivel 1), se ve la grilla completa igual que antes. Cambiando manualmente `gameState.level = 3` antes de recargar, se ve el patrón de pirámide.

### 3. Incremento de velocidad de bola por nivel

**Archivos:** `game.js`

**Lógica:**

- En `launchBall()`, calcular `vy = BALL_LAUNCH_VY - (gameState.level - 1) * BALL_SPEED_INCREMENT_PER_LEVEL` (más negativo = más rápido hacia arriba) y asignarlo a `ball.vy` en vez del valor fijo.
- En `collideWithPaddle()`, aplicar el mismo incremento a las magnitudes de `ball.vx` (3 y -3) y `ball.vy` (-5) según `gameState.level`, manteniendo el signo que ya determina la posición de impacto.
- Los rebotes en `collideWithWalls()` y `collideWithBricks()` no cambian: solo invierten el signo de la velocidad existente, así que heredan el incremento ya aplicado.

**Resultado verificable:** lanzando la bola en el nivel 1 se ve la velocidad actual; forzando `gameState.level = 3` y relanzando, la bola se mueve notoriamente más rápido.

### 4. Pantalla de transición "Nivel completado" y victoria final

**Archivos:** `game.js`

**Lógica:**

- Modificar `checkWin()`: cuando `bricksRemaining === 0`, si `gameState.level < LEVEL_COUNT`, poner `gameState.status = "levelcomplete"` y llamar `showOverlay("Nivel " + gameState.level + " completado", "Puntaje: " + gameState.score, "Presiona Espacio para continuar")`; si `gameState.level === LEVEL_COUNT`, poner `gameState.status = "gamecomplete"` y llamar `showOverlay("¡Completaste el juego!", "Puntaje final: " + gameState.score, "Presiona R para reiniciar")`.
- Modificar `showOverlay(title, message, hint)` para aceptar un tercer parámetro `hint` y escribirlo en el elemento de hint del overlay (ver paso 6 para el cambio de HTML). Si no se pasa `hint`, usar el texto por defecto actual ("Presiona R para reiniciar"), para no romper las llamadas existentes de pausa/game over.
- En `loop()`, agregar `"levelcomplete"` y `"gamecomplete"` a la lista de estados que detienen `updatePaddle()`/`updateBall()`/`updateExplosions()` (mismo tratamiento que `"gameover"` y `"win"`).

**Resultado verificable:** al destruir todos los ladrillos de los niveles 1 a 4 aparece "Nivel X completado"; al destruir todos los del nivel 5 aparece "¡Completaste el juego!" y el juego queda detenido.

### 5. Avanzar de nivel con Espacio

**Archivos:** `game.js`

**Lógica:**

- En el listener de `keydown` (`setupInput()`), en la rama que ya maneja `" "`/`"ArrowUp"` para `launchBall()`, agregar: si `gameState.status === "levelcomplete"`, en vez de lanzar la bola, ejecutar la transición de nivel: `gameState.level++`, `gameState.lives = INITIAL_LIVES`, `explosions = []`, `hideOverlay()`, `createBricks()`, `resetBall()`.

**Resultado verificable:** con el overlay de "Nivel 1 completado" visible, presionar Espacio limpia el overlay, muestra el patrón del nivel 2, resetea vidas a `INITIAL_LIVES`, mantiene el puntaje acumulado, y la bola queda lista para lanzar en la paleta.

### 6. Indicador de nivel en el panel de info

**Archivos:** `index.html`, `game.js`

**Lógica:**

- En `index.html`, agregar un `info-item` para nivel junto a Puntaje/Vidas: `<span class="info-label">Nivel</span><span id="level" class="info-value">1</span>`.
- Agregar un `id` al `<p class="overlay-hint">` existente (ej. `id="overlay-hint"`) para poder actualizarlo desde JS.
- En `game.js`, agregar `const levelEl = document.getElementById("level");` y `const overlayHint = document.getElementById("overlay-hint");` junto a las demás referencias al DOM.
- En `updateInfoPanel()`, agregar `levelEl.textContent = gameState.level;`.
- En `showOverlay()`, escribir `overlayHint.textContent = hint || "Presiona R para reiniciar";`.

**Resultado verificable:** el panel muestra "Nivel: 1" al iniciar, y se actualiza a "2", "3"... al avanzar de nivel con Espacio.

### 7. Reinicio total vuelve siempre al nivel 1

**Archivos:** `game.js`

**Lógica:**

- En `resetGame()`, agregar `gameState.level = 1;` antes de llamar a `createBricks()`.

**Resultado verificable:** estando en el nivel 3 o 4, presionar `R` vuelve al patrón completo del nivel 1, con vidas y puntaje reiniciados a sus valores por defecto.

---

## Criterios de Aceptación

- [x] El nivel 1 muestra la grilla completa de ladrillos (igual que el comportamiento actual).
- [x] El nivel 2 muestra un patrón con un hueco vacío en el centro de la grilla.
- [x] El nivel 3 muestra un patrón en forma de pirámide.
- [x] El nivel 4 muestra un patrón en forma de diamante.
- [x] El nivel 5 muestra un patrón de columnas verticales alternadas.
- [x] Al destruir todos los ladrillos de un nivel 1 a 4, aparece la pantalla "Nivel X completado" y el juego se detiene (bola, paleta y explosiones dejan de actualizarse).
- [x] Presionar Espacio con la pantalla de "Nivel completado" visible avanza al siguiente nivel: cambia el patrón de ladrillos, resetea la bola a la paleta, y el jugador puede volver a lanzarla.
- [x] Al avanzar de nivel, las vidas vuelven a `INITIAL_LIVES` y el puntaje NO se reinicia (sigue sumando desde el valor previo).
- [x] La velocidad de la bola (al lanzarla y al rebotar en la paleta) es visiblemente mayor en el nivel 3 que en el nivel 1.
- [x] Al destruir todos los ladrillos del nivel 5 (último), aparece la pantalla "¡Completaste el juego!" en vez de una pantalla de "Nivel completado", y el juego se detiene.
- [x] El panel de info muestra el nivel actual y se actualiza inmediatamente al avanzar de nivel.
- [x] Reiniciar el juego con `R` desde cualquier nivel vuelve siempre al nivel 1, con vidas, puntaje y patrón de ladrillos reiniciados a sus valores iniciales.
- [x] Perder todas las vidas en cualquier nivel (no solo el 1) sigue mostrando "Game Over" con el puntaje acumulado hasta ese momento.

---

## Decisiones Tomadas y Descartadas

### Tomadas

1. **5 niveles fijos con patrones geométricos, definidos a mano como matrices en `game.js`.**
   **Razón:** decisión explícita del usuario; suficiente variedad para demostrar progresión sin la complejidad de un generador procedural.
2. **Patrones: completo, hueco central, pirámide, diamante, columnas (final).**
   **Razón:** los primeros 4 fueron la recomendación aceptada por el usuario; el usuario pidió agregar un quinto patrón de columnas verticales alternadas como cierre.
3. **Incremento fijo de velocidad por nivel (no multiplicador).**
   **Razón:** decisión explícita del usuario — más predecible de tunear que un crecimiento porcentual, y consistente con el estilo de constantes existente en `game.js`.
4. **Vidas se reinician a `INITIAL_LIVES` en cada nivel nuevo; el puntaje NO se reinicia.**
   **Razón:** decisión explícita del usuario — las vidas son un colchón por nivel, mientras que el puntaje refleja el progreso de toda la partida.
5. **Pantalla de transición que espera tecla (Espacio) para continuar, en vez de avance automático.**
   **Razón:** decisión explícita del usuario; reutiliza la tecla que ya lanza la bola, sin introducir un control nuevo.
6. **Al completar el último nivel se muestra una pantalla de victoria final y el juego termina (sin loop infinito).**
   **Razón:** decisión explícita del usuario — cierra el ciclo de los 5 niveles definidos a mano sin necesidad de generar contenido adicional.
7. **Indicador de nivel actual en el panel de info, siguiendo el mismo patrón visual que Puntaje/Vidas.**
   **Razón:** consistencia con la UI existente — sin esto el jugador no tendría forma de saber en qué nivel está ni cuántos faltan.

### Descartadas

1. **Ladrillos irrompibles o de múltiples golpes.**
   Descartada — el usuario prefirió mantener el alcance en patrones geométricos únicamente para este spec, dejando la variedad de resistencia de ladrillos fuera.
2. **Generación procedural de niveles.**
   Descartada a favor de layouts fijos escritos a mano — más simple de especificar, probar y depurar con solo 5 niveles.
3. **Avance automático de nivel sin esperar tecla.**
   Descartada — el usuario prefirió una pantalla explícita de "Nivel completado" que espera confirmación, dando tiempo a leer el puntaje antes de continuar.
4. **Loop infinito de niveles tras completar el 5to (con o sin dificultad acumulada).**
   Descartada a favor de una pantalla de victoria final fija, ya que los niveles están definidos a mano y no hay contenido adicional que generar.

---

## Riesgos Identificados

### 1. Layouts con conteo de ladrillos distinto entre niveles

**Descripción:** cada patrón tiene una cantidad distinta de celdas en `1` (el diamante y la pirámide tienen muchas menos que el nivel completo), lo que hace que el puntaje máximo alcanzable por nivel varíe. Esto es intencional pero puede sorprender si se espera que todos los niveles otorguen el mismo puntaje.
**Mitigación:** ninguna necesaria — es el comportamiento esperado de patrones con distinta densidad de ladrillos; se documenta aquí para que no se interprete como un bug.
**Probabilidad:** Baja / **Acción:** Ninguna.

### 2. Incremento de velocidad sin techo máximo

**Descripción:** `BALL_SPEED_INCREMENT_PER_LEVEL` se aplica de forma lineal hasta el nivel 5; con solo 5 niveles definidos el rango de velocidad es acotado, pero si en el futuro se agregan más niveles sin revisar este valor, la bola podría volverse excesivamente rápida o difícil de seguir visualmente.
**Mitigación:** fuera de alcance de este spec — documentado como riesgo conocido para revisar si se agregan niveles adicionales.
**Probabilidad:** Baja / **Acción:** Ninguna en este spec; revisar el valor de `BALL_SPEED_INCREMENT_PER_LEVEL` si se extiende `LEVEL_COUNT` en el futuro.
