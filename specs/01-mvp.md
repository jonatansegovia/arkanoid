# MVP del Juego Arkanoid

**Estado:** Implementado  
**Depends on:** —  
**Date:** 2026-08-29  
**Objetivo:** Construir un MVP jugable de Arkanoid con paleta, bola, ladrillos, puntaje y vidas, usando formas simples de Canvas y sin sonido.

---

## Alcance

### Incluido en este MVP

- Paleta controlable: movimiento horizontal (flechas izquierda/derecha y ratón)
- Bola con física de movimiento, rebote contra paredes, techo y paleta
- Cuadrícula de 8 columnas × 5 filas de ladrillos destructibles
- Colisión bola-ladrillo: destrucción de ladrillo e incremento de puntaje
- Sistema de puntuación: +10 puntos por ladrillo destruido
- Sistema de vidas: 3 vidas iniciales; pérdida de vida al caer la bola bajo la paleta
- Pantalla de "Game Over" cuando llegan a 0 vidas (con puntaje final y opción de reiniciar)
- Pantalla de "Ganaste" al destruir todos los ladrillos (con puntaje final y opción de reiniciar)
- Pausa (`P`) y reanudación del juego
- Reinicio (`R`) completo del juego desde cero
- Renderizado con Canvas: rectángulos para paleta y ladrillos, círculo para bola
- Sin dependencias externas ni bundler

### Fuera de este MVP

- Niveles progresivos / dificultad creciente
- Power-ups especiales (multi-ball, expandir paleta, disparos, etc.)
- Animaciones de explosión o efectos visuales
- Efectos de sonido
- Tabla de puntuaciones persistente (leaderboard) / persistencia entre sesiones
- Uso del spritesheet existente (`assets/spritesheet-breakout.png`)

---

## Modelo de Datos

Todas las estructuras son en memoria, sin persistencia.

### Paleta (`paddle`)
```javascript
paddle: {
  x: number,           // posición horizontal (center-x)
  y: number,           // posición fija en la base del canvas
  width: number,       // ancho en píxeles
  height: number,      // alto en píxeles
  speed: number        // píxeles por frame de movimiento
}
```

### Bola (`ball`)
```javascript
ball: {
  x: number,           // center-x
  y: number,           // center-y
  radius: number,      // radio en píxeles
  vx: number,          // velocidad horizontal (píxeles/frame)
  vy: number,          // velocidad vertical (píxeles/frame)
  launched: boolean    // true si está en juego, false si espera sobre la paleta
}
```

### Ladrillos (`bricks`)
```javascript
bricks: [
  [
    { x: number, y: number, width: number, height: number, alive: boolean },
    // ... 8 columnas
  ],
  // ... 5 filas (matriz 5×8)
]
```

### Estado del Juego (`gameState`)
```javascript
gameState: {
  score: number,       // puntos acumulados
  lives: number,       // vidas restantes (0-3)
  status: string,      // uno de: "waiting", "playing", "paused", "gameover", "win"
  bricksRemaining: number  // contador de ladrillos aún vivos (para verificar victoria)
}
```

---

## Plan de Implementación

Cada paso deja el juego en estado funcional (jugable, si es posible).

### 1. Estructura base: HTML, CSS y loop de render
- **Archivos:** `index.html`, `style.css`, `game.js`
- **En `index.html`:**
  - `<canvas id="gameCanvas" width="800" height="600"></canvas>`
  - Panel de información: score, vidas, controles
  - Overlay para pantalla de pausa/game-over/victoria
- **En `style.css`:**
  - Flexbox layout: canvas + sidebar de info
  - Colores de tema oscuro, fuente clara
  - Estilos de overlay (display: none por defecto)
- **En `game.js`:**
  - Constantes: `CANVAS_WIDTH = 800`, `CANVAS_HEIGHT = 600`, `BRICK_COLS = 8`, `BRICK_ROWS = 5`, `INITIAL_LIVES = 3`
  - Funciones stub: `init()`, `loop()`, `draw()`
  - `requestAnimationFrame` loop básico (sin lógica de juego aún)
  - **Resultado verificable:** Canvas se renderiza, no hay errores en consola

### 2. Paleta: renderizado y control (teclado + ratón)
- **Archivos:** `game.js`
- **Lógica:**
  - Renderizar paleta como rectángulo gris en la base del canvas
  - Escuchar `keydown`/`keyup` para flechas izquierda/derecha → actualizar `paddle.x`
  - Escuchar `mousemove` → actualizar `paddle.x` según posición del ratón (relativa al canvas)
  - Limitar `paddle.x` para que no salga del canvas
  - Mantener `paddle.y` fija (p.ej., `CANVAS_HEIGHT - 20`)
- **Resultado verificable:** Paleta se mueve con flechas y ratón, responde sin lag

### 3. Bola: renderizado, movimiento en reposo y lanzamiento
- **Archivos:** `game.js`
- **Lógica:**
  - Renderizar bola como círculo blanco
  - Estado inicial: `ball.launched = false`, bola posicionada sobre la paleta (centered horizontally, `y = paddle.y - paddle.height - ball.radius`)
  - Mientras `launched = false`: la bola sigue el movimiento horizontal de la paleta (para que el jugador elija punto de lanzamiento)
  - Tecla para lanzar: Flecha Arriba o Espacio → `ball.launched = true`, `ball.vy = -5` (velocidad inicial hacia arriba), `ball.vx = 0`
  - Cambiar `gameState.status` de `"waiting"` a `"playing"` al lanzar
- **Resultado verificable:** Bola sigue la paleta hasta lanzarse, luego se mueve hacia arriba

### 4. Movimiento y colisión de bola (paredes, techo, suelo)
- **Archivos:** `game.js`
- **Lógica:**
  - En cada frame: `ball.x += ball.vx`, `ball.y += ball.vy`
  - Colisión con paredes (izquierda/derecha): si `ball.x - radius < 0` o `ball.x + radius > CANVAS_WIDTH`, flipear `ball.vx`
  - Colisión con techo: si `ball.y - radius < 0`, flipear `ball.vy`
  - Colisión con suelo (pérdida de vida): si `ball.y > CANVAS_HEIGHT`, ejecutar rutina de pérdida de vida (ver paso 6)
- **Resultado verificable:** Bola rebota en paredes y techo, cae por el suelo (aún sin recuperación)

### 5. Colisión bola-paleta con ángulo de rebote
- **Archivos:** `game.js`
- **Lógica:**
  - Detectar si bola intersecta paleta usando AABB (axis-aligned bounding box)
  - Si colisiona, calcular en qué tercio de la paleta golpeó (izquierda, centro, derecha)
  - Ajustar `ball.vx` según el tercio:
    - Tercio izquierdo: `ball.vx = -3`
    - Centro: `ball.vx = 0`
    - Tercio derecho: `ball.vx = 3`
  - Siempre: `ball.vy = -5` (rebote hacia arriba, ángulo ascendente)
  - Asegurar que la bola no queda "atrapada" dentro de la paleta: ajustar `ball.y` si es necesario
- **Resultado verificable:** Bola rebota en la paleta, ángulo varía según punto de impacto

### 6. Cuadrícula de ladrillos y colisión bola-ladrillo
- **Archivos:** `game.js`
- **Lógica:**
  - Crear cuadrícula 5×8 en `init()` con `createBricks()`:
    - Espaciado: p.ej., `BRICK_WIDTH = 90`, `BRICK_HEIGHT = 15`, gap pequeño entre ladrillos
    - Color: todos los mismos (p.ej., azul claro)
  - En cada frame: iterar sobre ladrillos vivos, detectar colisión bola-ladrillo con AABB
  - Si colisiona:
    - `ladrillo.alive = false`
    - `gameState.score += 10`
    - `gameState.bricksRemaining--`
    - Flipear `ball.vx` o `ball.vy` según qué borde fue golpeado (arriba/abajo → flipear `vy`, izquierda/derecha → flipear `vx`)
  - Renderizar solo ladrillos con `alive = true`
- **Resultado verificable:** Ladrillos desaparecen al ser golpeados, puntaje aumenta

### 7. Pérdida de vida, game over y condición de victoria
- **Archivos:** `game.js`
- **Lógica:**
  - Función `loseLife()`: decrementar `gameState.lives`, resetear bola a estado de espera
    - Si `lives > 0`: `gameState.status = "waiting"`, reiniciar `ball.launched = false`, `ball.y = paddle.y - ...`
    - Si `lives === 0`: `gameState.status = "gameover"`, mostrar overlay de game-over
  - Función `checkWin()`: si `gameState.bricksRemaining === 0`, `gameState.status = "win"`, mostrar overlay de victoria
  - Overlays de game-over y victoria:
    - Mostrar puntaje final
    - Botón/indicación para reiniciar con `R`
- **Resultado verificable:** Pierde una vida al caer bola, game over a 0 vidas; victoria al destruir todos los ladrillos

### 8. Pausa, reinicio y controles finales
- **Archivos:** `game.js`, `index.html`, `style.css`
- **Lógica:**
  - Tecla `P`: toggle `gameState.status` entre `"playing"` ↔ `"paused"`
    - Mostrar overlay "Pausado" cuando `status = "paused"`
    - No actualizar lógica de juego mientras está pausado
  - Tecla `R`: llamar a `resetGame()` (reinicia todo a estado inicial)
    - `gameState.score = 0`, `gameState.lives = 3`, `gameState.status = "waiting"`
    - Recrear cuadrícula de ladrillos
    - Resetear bola a posición inicial
  - Actualizar panel de info en tiempo real: mostrar vidas y puntaje
- **Resultado verificable:** `P` pausa/reanuda, `R` reinicia completamente; info se actualiza; sin errores

---

## Criterios de Aceptación

- [x] La paleta se mueve suavemente con flechas izquierda/derecha
- [x] La paleta se mueve con el ratón (horizontal)
- [x] La bola aparece sobre la paleta y sigue su movimiento horizontal antes de lanzarse
- [x] La bola se lanza hacia arriba al presionar Flecha Arriba o Espacio
- [x] La bola rebota en las paredes izquierda/derecha del canvas
- [x] La bola rebota en el techo del canvas
- [x] La bola rebota en la paleta; el ángulo de rebote varía según el punto de impacto (izquierda ≠ centro ≠ derecha)
- [x] Se muestran todos los ladrillos (8×5) en la pantalla inicialmente
- [x] Al golpear un ladrillo con la bola, el ladrillo desaparece
- [x] El puntaje aumenta en 10 puntos cada vez que se destruye un ladrillo
- [x] Al caer la bola por debajo de la paleta, se pierde una vida
- [x] Después de perder una vida, la bola se reinicia sobre la paleta (estado de espera)
- [x] Cuando las vidas llegan a 0, aparece pantalla de "Game Over" con el puntaje final
- [x] Cuando todos los ladrillos son destruidos, aparece pantalla de "Ganaste" con el puntaje final
- [x] Presionar `P` pausa el juego (overlay visible, movimiento detenido)
- [x] Presionar `P` nuevamente reanuda el juego
- [x] Presionar `R` reinicia el juego completamente (score a 0, vidas a 3, ladrillos regenerados)
- [x] El panel de info muestra score y vidas actualizados en tiempo real
- [x] El canvas es de 800×600 píxeles
- [x] No hay dependencias externas (vanilla JS, sin librerías)
- [x] No hay errores en la consola del navegador
- [x] No hay sonidos reproducidos

---

## Decisiones Tomadas y Descartadas

### Tomadas

1. **Formas simples en Canvas (rectángulos, círculos)** en lugar del spritesheet existente
   - **Razón:** Acelera la implementación del MVP y permite enfoque en mecánica de juego. El spritesheet se puede integrar en un spec futuro ("gráficos y sonido").

2. **Ángulo de rebote determinístico** (basado en punto de impacto en la paleta) en lugar de aleatorio
   - **Razón:** Permite jugabilidad predecible y contratable por el jugador. El juego es más justo y menos frustrante.

3. **Controles duales: teclado + ratón**
   - **Razón:** Maximiza accesibilidad. El último input (teclado o ratón) prevalece si ambos se usan simultáneamente.

4. **Sin progresión de niveles**
   - **Razón:** Mantiene el MVP simple. Una sola partida con un set de ladrillos. Niveles quedan para un spec futuro.

5. **Puntaje fijo (10 puntos por ladrillo)**
   - **Razón:** Simplicidad. Scoring variable (por color, fila, etc.) queda para futuro.

### Descartadas

1. **Usar el spritesheet** → Decidió formas simples para velocidad.
2. **Sonidos en el MVP** → Bloqueado explícitamente; será un spec futuro.
3. **Física realista (gravedad, fricción)** → Física arcade simple es suficiente y más predecible.
4. **Power-ups iniciales** → Fuera de scope para MVP; se evalúa en specs posteriores.

---

## Riesgos Identificados

### 1. Tunneling (bola atravesando ladrillos a alta velocidad)
- **Descripción:** Si la bola se mueve muy rápido, podría "atravesar" ladrillos sin detectar colisión en ciertos frames.
- **Mitigación:** Limitar velocidad máxima de la bola (p.ej., `|vx| ≤ 5` y `|vy| ≤ 5`). Si es necesario, implementar swept AABB collision detection.
- **Probabilidad:** Media. **Acción:** Testear con velocidades altas antes de marcar como done.

### 2. Conflicto teclado + ratón
- **Descripción:** Si el jugador mueve la paleta simultáneamente con teclado y ratón, comportamiento puede ser confuso.
- **Mitigación:** El último input (teclado o ratón) "gana" — su posición se usa sin prioridad fija. Comportamiento simple, sin arbitraje complejo.
- **Probabilidad:** Baja (poco probable que el jugador haga esto). **Acción:** Documentar en overlay de controles si es necesario.

### 3. Pausa en estado de espera
- **Descripción:** Pausar antes de lanzar la bola podría causar confusión si la paleta se congela.
- **Mitigación:** Permitir pausa en cualquier estado (`waiting`, `playing`), el overlay deja clara la situación. Simplicidad prevalece.
- **Probabilidad:** Baja. **Acción:** Testear experiencia UX en pausa inicial.
