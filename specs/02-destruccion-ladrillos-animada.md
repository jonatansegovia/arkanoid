# Destrucción Animada de Ladrillos

**Estado:** Aprobado
**Depends on:** SPEC 01
**Date:** 2026-09-10
**Objetivo:** Reemplazar la desaparición instantánea de los ladrillos por una animación de explosión de 4 frames tomada del spritesheet existente, sin agregar sonido.

---

## Alcance

### Incluido en este spec

- Nuevo campo `color` en cada ladrillo, asignado por fila (5 colores fijos, uno por fila, tomados de los 7 disponibles en el spritesheet).
- Corrección de la ruta del PNG en `loadSpritesheet()` (apunta a `assets/assets/spritesheet-breakout.png`) y adición del `<script>` de `assets/assets/spritesheet.js` en `index.html`.
- Carga bloqueante del spritesheet: `init()` espera el callback de `loadSpritesheet()` antes de arrancar `requestAnimationFrame(loop)`.
- Renderizado de ladrillos vivos usando `drawSprite('block_' + brick.color, ...)` en vez de `fillRect`.
- Al destruir un ladrillo, se agrega una entrada a un arreglo `explosions` con su posición, tamaño y color, en vez de solo ocultarlo.
- Nuevas funciones `updateExplosions(timestamp)` y `drawExplosions()` que avanzan y dibujan los 4 frames de `EXPLOSION_FRAMES[color]` según el tiempo transcurrido desde `startTime`, hasta completar `EXPLOSION_DURATION` (150ms).
- Nueva función auxiliar `drawExplosionFrame(ctx, color, frameIndex, x, y, w, h)` en `spritesheet.js`, reutilizando `drawFrame()`.
- Las explosiones activas se limpian del arreglo al terminar su duración.
- Las explosiones respetan la pausa: no avanzan mientras `gameState.status === "paused"`.
- Reiniciar el juego (tecla R) limpia el arreglo `explosions`.
- El puntaje y `bricksRemaining` se siguen actualizando de inmediato al golpear el ladrillo (no se espera a que termine la animación) — comportamiento ya existente, sin cambios.

### Fuera de este spec

- Sonido de destrucción (`break-sound.mp3`) — diferido explícitamente, "por lo pronto sin sonidos".
- Cualquier cambio al sonido de rebote (`ball-bounce.mp3`).
- Nuevas mecánicas de juego (power-ups, niveles adicionales, patrones de ladrillos distintos).
- Cambiar el render de la paleta o la bola a sprites — solo se tocan los ladrillos (vivos y explosión).
- Hacer el mapeo fila→color configurable o dependiente del nivel — es fijo para este spec.
- Manejo de errores de carga del spritesheet (red caída, archivo movido) — se documenta como riesgo, no se implementa mitigación.

---

## Modelo de Datos

### Ladrillos (bricks) — campo nuevo

```javascript
{
  x: number,
  y: number,
  width: number,
  height: number,
  alive: boolean,
  color: string   // NUEVO — uno de: "red","cyan","green","magenta","yellow","hotpink","gray"
}
```

Asignación por fila en `createBricks()` (constante nueva `ROW_COLORS`):

```javascript
const ROW_COLORS = ["red", "yellow", "green", "cyan", "magenta"]; // fila 0..4
```

### Explosiones activas (explosions) — arreglo nuevo

```javascript
let explosions = [];
// cada elemento:
{
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,      // igual a EXPLOSION_FRAMES key
  startTime: number    // timestamp (ms) en que se creó, viene de loop(timestamp)
}
```

---

## Plan de Implementación

### 1. Corregir ruta del spritesheet y agregar helper de dibujo

**Archivos:** `assets/assets/spritesheet.js`

**Lógica:**

- Corregir `rawImg.src` en `loadSpritesheet()` para que apunte correctamente al PNG real (`assets/assets/spritesheet-breakout.png` relativo a `index.html`).
- Agregar `function drawExplosionFrame(ctx, color, frameIndex, x, y, w, h)` que llama a `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, w, h)`.

**Resultado verificable:** al abrir `index.html` con la consola abierta (una vez cableado en el paso 2), no hay error 404 sobre el PNG.

### 2. Cablear el spritesheet en index.html y bloquear el inicio en game.js

**Archivos:** `index.html`, `game.js`

**Lógica:**

- Agregar `<script src="assets/assets/spritesheet.js"></script>` antes de `<script src="game.js"></script>`.
- En `init()`, envolver la llamada a `requestAnimationFrame(loop)` (o el punto donde arranca el loop) para que ocurra dentro del callback de `loadSpritesheet()`.

**Resultado verificable:** el juego sigue funcionando igual que en el MVP (ladrillos como rectángulos planos todavía), pero ahora `ssLoaded` es `true` antes de que arranque el loop.

### 3. Agregar campo `color` a los ladrillos

**Archivos:** `game.js`

**Lógica:**

- Definir `const ROW_COLORS = ["red", "yellow", "green", "cyan", "magenta"];`.
- En `createBricks()`, asignar `color: ROW_COLORS[row]` a cada ladrillo.

**Resultado verificable:** `console.log(bricks[0][0].color)` → `"red"`; el juego se ve idéntico (el campo aún no se usa para dibujar).

### 4. Renderizar ladrillos vivos con sprites

**Archivos:** `game.js`

**Lógica:**

- En `drawBricks()`, reemplazar el `fillRect` por `drawSprite(ctx, 'block_' + brick.color, brick.x, brick.y, brick.width, brick.height)`.

**Resultado verificable:** los ladrillos vivos se ven con el arte del spritesheet, con colores distintos por fila.

### 5. Infraestructura de animación de explosiones (sin disparar aún)

**Archivos:** `game.js`

**Lógica:**

- Declarar `let explosions = [];`.
- Agregar `function updateExplosions(timestamp)`: filtra/elimina del arreglo las explosiones cuyo `timestamp - startTime >= EXPLOSION_DURATION`.
- Agregar `function drawExplosions()`: para cada explosión activa, calcula `frameIndex = Math.floor(((timestamp - startTime) / EXPLOSION_DURATION) * 4)` (clamp a 3) y llama a `drawExplosionFrame(...)`.
- Llamar `updateExplosions(timestamp)` dentro del bloque guardado de `loop()` (junto a `updatePaddle()`/`updateBall()`), y `drawExplosions()` dentro de `draw()` (después de `drawBricks()`).

**Resultado verificable:** el juego corre igual que antes (el arreglo `explosions` siempre vacío porque nada lo llena todavía); no hay regresión.

### 6. Disparar la explosión al destruir un ladrillo

**Archivos:** `game.js`

**Lógica:**

- En `collideWithBricks()`, cuando se marca `brick.alive = false`, además hacer `explosions.push({ x: brick.x, y: brick.y, width: brick.width, height: brick.height, color: brick.color, startTime: timestamp })`.
- Pasar `timestamp` a `collideWithBricks()` (propagado desde `loop(timestamp)` → `updateBall(timestamp)` → `collideWithBricks(timestamp)`).

**Resultado verificable:** al golpear un ladrillo, el puntaje sube de inmediato, el ladrillo deja de dibujarse como bloque vivo, y en su lugar se reproduce la animación de 4 frames del color correspondiente durante ~150ms, luego desaparece por completo.

### 7. Limpiar explosiones al reiniciar

**Archivos:** `game.js`

**Lógica:**

- En la función de reinicio (tecla R / equivalente a `resetGame`), agregar `explosions = [];`.

**Resultado verificable:** si se reinicia el juego mientras una explosión está animándose, no queda ningún frame residual dibujado tras el reinicio.

---

## Criterios de Aceptación

- [x] Al iniciar el juego, el spritesheet carga sin errores 404 en la consola.
- [x] Los ladrillos vivos se renderizan con sprites del spritesheet, con color según su fila.
- [x] Al golpear un ladrillo, el puntaje y `bricksRemaining` se actualizan de inmediato.
- [x] Al destruir un ladrillo, se reproduce una animación de explosión de 4 frames en su posición, con el color de su fila.
- [x] La animación dura ~150ms y luego desaparece por completo, sin dejar rastro.
- [x] La animación de explosión no avanza mientras el juego está en estado `"paused"`.
- [x] Reiniciar el juego (tecla R) limpia cualquier animación de explosión activa.
- [x] No se reproduce ningún sonido al destruir un ladrillo.
- [x] Ganar la partida (todos los ladrillos destruidos) sigue funcionando igual que antes, incluso si la última explosión todavía se está animando.

---

## Decisiones Tomadas y Descartadas

### Tomadas

1. **Color por fila (5 colores fijos).**
   **Razón:** aprovecha las variantes ya definidas en el spritesheet y da variedad visual reconocible de Arkanoid clásico; decisión explícita del usuario.
2. **Animación basada en tiempo (timestamp), no en conteo de frames de juego.**
   **Razón:** consistente con `EXPLOSION_DURATION` (ya definido en ms) y no depende del framerate real del navegador.
3. **Carga del spritesheet bloqueante en `init()`.**
   **Razón:** la imagen es pequeña; evita repartir checks de "¿ya cargó?" por todo el código de dibujo.
4. **Ladrillos vivos también pasan a usar sprites, no solo la explosión.**
   **Razón:** unifica el estilo visual ahora que el spritesheet ya se carga; decisión explícita del usuario.
5. **Sin sonido en este spec.**
   **Razón:** pedido explícito del usuario; `break-sound.mp3` queda listo en assets para un spec futuro.

### Descartadas

1. **Degradación con gracia (arrancar el loop sin esperar la carga).**
   Descartada porque complica el dibujo con checks de `ssLoaded` repartidos, sin beneficio real dado el tamaño pequeño de la imagen.
2. **Un solo color de explosión fijo para todos los ladrillos.**
   Descartada porque desperdicia las variantes de color ya definidas en el spritesheet y reduce la fidelidad visual.
3. **Mantener `fillRect` para ladrillos vivos y usar el spritesheet solo para la explosión.**
   Descartada a favor de unificar todo el render de ladrillos con sprites (decisión explícita del usuario).

---

## Riesgos Identificados

### 1. Ruta de assets inconsistente

**Descripción:** el PNG real vive en `assets/assets/spritesheet-breakout.png`, una carpeta anidada no obvia; si la estructura cambia de nuevo esto puede romperse en silencio (`drawSprite` no hace nada si `!ssLoaded`, sin error visible en pantalla).
**Mitigación:** verificar manualmente en consola que no haya 404 tras el paso 1-2 de implementación; considerar aplanar `assets/assets/` en un spec de limpieza futuro.
**Probabilidad:** Media / **Acción:** Verificar manualmente antes de marcar el spec como implementado.

### 2. Bloqueo de carga inicial sin manejo de errores

**Descripción:** si `loadSpritesheet()` falla (red caída, archivo movido), `init()` nunca llama a `requestAnimationFrame` y el juego queda congelado sin ningún feedback al jugador.
**Mitigación:** fuera de alcance de este spec; se documenta como riesgo conocido de la decisión de carga bloqueante.
**Probabilidad:** Baja / **Acción:** Ninguna en este spec; posible mejora futura de manejo de errores de carga.
