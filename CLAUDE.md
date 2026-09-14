# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Project**: Vanilla JavaScript Arkanoid (brick breaker) game. No build, no dependencies—just HTML, CSS, and JavaScript.

**Running the game**:
- Option 1 (direct): Open `index.html` in a browser
- Option 2 (recommended): Serve locally:
  - `python3 -m http.server 8000` then visit `http://localhost:8000`
  - Or: `npx serve .`
  - Or: `php -S localhost:8000`

**Testing changes**: Save and refresh the browser—no build step needed.

## Architecture

### Three-File Structure

1. **index.html** — DOM markup
   - Single `<canvas>` element for rendering gameplay
   - Info panel: score, level, lives, and `#sound-status` span ("Sonido: ON"/"Sonido: OFF")
   - `.level-select` panel: heading + `#level-buttons` container (buttons are injected at runtime by
     `setupLevelButtons()` in game.js, not present as static markup)
   - Controls list documenting: mouse (move = paddle, click = launch/next level), up-arrow / Space
     (launch ball or advance to next level), P (pause), R (reset), M (mute)
   - Pause / level-complete / game-complete overlay, including a dynamic `#overlay-hint` paragraph
     (`.overlay-hint`) populated by `showOverlay(title, message, hint)`
   - No inline scripts; all logic is in `game.js`

2. **style.css** — Game styling
   - Flexbox layout for main container + info sidebar
   - CSS variables for spacing, colors, fonts
   - Canvas centered on screen
   - Overlay styling for pause/game-over screens

3. **game.js** — Core logic
   - Paddle control (keyboard/mouse)
   - Ball physics with collision detection
   - Brick grid management
   - Score, lives, and level tracking
   - Sound effects via HTML5 Audio API

### Game State Model

**Paddle**:
- Fixed at bottom of canvas
- Horizontally centered by default, controlled by arrow keys or mouse
- Rectangular collision shape for ball bouncing

**Ball**:
- Moves with constant velocity vector (vx, vy)
- Bounces off paddle, bricks, and canvas walls
- Collides with paddle (angle affects trajectory) and bricks (destroys them)
- Ball resets to paddle via `loseLife()` if it falls below screen

**Bricks**:
- 2D grid of rectangles (rows × cols)
- Each brick tracks existence (alive/dead) and color
- Destroyed when ball hits them
- Can be arranged in patterns per level

**Game State** (`gameState` object):
- `score`: points accumulated from destroying bricks
- `level`: current level number (1-based), affects ball speed and brick layout
- `lives`: remaining attempts (game over at 0)
- `status`: one of `"waiting"`, `"playing"`, `"paused"`, `"levelcomplete"`, `"gamecomplete"` — drives
  both `loop()` gating and which overlay (if any) is shown. `"waiting"` = ball parked on paddle before
  launch; `"levelcomplete"` = current level's bricks cleared but more levels remain (overlay shown,
  advance via Space/ArrowUp/click); `"gamecomplete"` = final level cleared.
- `ballX, ballY`: ball position
- `ballVx, ballVy`: ball velocity
- `paddleX`: paddle horizontal position
- `explosions`: array of in-flight brick-destruction animations, each with a start timestamp, position,
  and color, consumed by `updateExplosions()` / `drawExplosions()`

Note: `muted` is not part of `gameState` — see Sounds section below.

### Game Loop

```
init()
  ├─ loadSpritesheet(callback)
  ├─ createBricks()             // reads gameState.level, no params
  ├─ setupLevelButtons()        // builds #level-buttons
  ├─ setupInput()
  ├─ resetBall()
  └─ requestAnimationFrame(loop)
       ↓
  loop(timestamp)
    ├─ Gated on gameState.status — skips update logic when "paused",
    │   "levelcomplete", or "gamecomplete" (still draws current frame)
    ├─ updatePaddle()
    ├─ updateBall(timestamp)
    │    ├─ collideWithWalls()   → bounce sound (L/R/ceiling); loseLife() on floor
    │    ├─ collideWithPaddle()  → angle-based bounce, applies per-level speed increment
    │    └─ collideWithBricks(timestamp)
    │         ├─ mark brick destroyed, add score
    │         ├─ push explosion, play break sound
    │         └─ checkWin() → sets status to "levelcomplete" / "gamecomplete" + shows overlay
    ├─ updateExplosions(timestamp)
    ├─ updateInfoPanel()        // score/lives/level/sound-status text
    ├─ draw(timestamp) → drawPaddle(), drawBall(), drawBricks(), drawExplosions(timestamp)
    └─ requestAnimationFrame(loop)

  Mouse move (canvas)  → updatePaddlePosition(x) → clampPaddle()
  Mouse down (canvas)  → launch ball if "waiting", or goToLevel(level+1) if "levelcomplete"
  Arrow keys           → paddle movement
  Up-arrow / Space     → launch ball if "waiting", or advance level if "levelcomplete"
  P                    → togglePause()
  R                    → resetGame()   // full reset to level 1; does NOT touch `muted`
  M                    → toggle `muted`

  Level-select buttons (#level-buttons, click) → goToLevel(levelNumber)
    resets lives, ball, explosions, and rebuilds bricks for that level
```

### Assets

**Spritesheet** (`assets/spritesheet-breakout.png`):
- Defined in `assets/spritesheet.js`
- Sprite definitions: paddle, ball, blocks (7 colors)
- Explosion frames for destruction animation
- `drawSprite(ctx, name, x, y, w, h)` renders a sprite

**Sounds**:
- `assets/sounds/ball-bounce.mp3` and `assets/sounds/break-sound.mp3` are loaded as `new Audio(...)`
  objects (`SOUND_BALL_BOUNCE`, `SOUND_BREAK` in game.js), not plain filename strings.
- Playback goes through a single helper, `playSound(audio)`, which resets `currentTime` and calls
  `.play()` — this lets the same sound retrigger rapidly without waiting for the previous play to finish.
- Played on: brick break, paddle bounce, and wall bounce off the left/right/ceiling only (not on
  floor contact / losing a life).
- Mute is a module-level flag: `let muted = false`, declared outside `gameState` on purpose, so
  that `R` (reset) does not clear the user's mute preference. `playSound()` checks `muted` before
  playing. The `M` key toggles it.
- `updateInfoPanel()` writes "Sonido: ON" / "Sonido: OFF" into `#sound-status` each frame/update.

### Key Functions (Not Exhaustive)

| Function | Purpose |
|----------|---------|
| `init()` | Initialize game, load assets, build level buttons, set up input, start loop |
| `loadSpritesheet(callback)` | Asynchronously load spritesheet image (`assets/spritesheet.js`) |
| `playSound(audio)` | Play a sound `Audio` object if not muted; resets `currentTime` first |
| `createBricks()` | Build the brick grid for `gameState.level` from `LEVEL_LAYOUTS` (no parameter) |
| `setupLevelButtons()` | Dynamically create one button per level inside `#level-buttons` |
| `updateLevelButtons()` | Toggle `.active` class on the button matching the current level |
| `goToLevel(levelNumber)` | Jump directly to a level: resets lives, ball, explosions, and bricks |
| `resetBall()` | Return ball to paddle, set status to "waiting" |
| `launchBall()` | Send ball into play from paddle; applies `BALL_SPEED_INCREMENT_PER_LEVEL` for the current level |
| `loseLife()` | Ball fell below screen: decrement lives, reset ball, or end game |
| `checkWin()` | Called after brick destruction; if all bricks cleared, sets status to "levelcomplete" or "gamecomplete" and shows overlay |
| `togglePause()` | Switch between "playing" and "paused" |
| `resetGame()` | Full reset to level 1 (score, lives, level, bricks, ball); does not reset `muted` |
| `showOverlay(title, message, hint)` / `hideOverlay()` | Show/hide the pause/level-complete/game-complete overlay, including `#overlay-hint` text |
| `setupInput()` | Register keydown/keyup and canvas mousemove/mousedown handlers |
| `updatePaddlePosition(x)` / `clampPaddle()` | Set paddle position from mouse/keyboard input, clamped to canvas bounds |
| `updatePaddle()` | Apply per-frame paddle movement from keyboard state |
| `updateBall(timestamp)` | Update ball position; detect and handle collisions |
| `updateExplosions(timestamp)` | Advance/remove brick-destruction explosion animations |
| `collideWithPaddle()` | Check ball-paddle intersection; adjust velocity by hit location and level speed |
| `collideWithBricks(timestamp)` | Check ball-brick intersections; destroy bricks, add score, push explosion, play sound, call `checkWin()` |
| `collideWithWalls()` | Bounce ball off canvas edges; plays bounce sound on left/right/ceiling; calls `loseLife()` on floor |
| `updateInfoPanel()` | Update score/lives/level/sound-status DOM text |
| `draw(timestamp)` / `drawBricks()` / `drawExplosions(timestamp)` / `drawBall()` / `drawPaddle()` | Render current frame |
| `loop(timestamp)` | Main game loop; gates update logic on `gameState.status` |
| `drawSprite(ctx, name, x, y, w, h)` (assets/spritesheet.js) | Render a named sprite |
| `drawExplosionFrame(ctx, color, frameIndex, x, y, w, h)` (assets/spritesheet.js) | Render one frame of a brick explosion animation |

### Ball Physics & Collision

**Basic collision detection**: Use axis-aligned bounding boxes (AABB) between ball and paddle/bricks.

**Ball-paddle interaction**:
- Horizontal impact: angle of hit (left/center/right edge of paddle) affects `ballVx`
- Vertical impact: always bounce upward (set `ballVy` to negative)

**Ball-brick collision**: 
- Determine which edge was hit (top, bottom, left, right)
- Flip appropriate velocity component (ballVx or ballVy)
- Mark brick as destroyed, increment score

**Paddle collision**: Detect which part of paddle was hit and adjust ball trajectory accordingly (center hit goes straight up, edge hits go at angles).

**Level-based speed scaling**:
- `BALL_SPEED_INCREMENT_PER_LEVEL = 0.5` is added to the ball's speed based on the current
  `gameState.level`, applied in both `launchBall()` (when (re)launching after a life loss or new level)
  and `collideWithPaddle()` (so speed keeps scaling correctly through paddle bounces within a level).
- There is no single `INITIAL_BALL_SPEED` constant — that name does not exist in the code. The
  actual launch velocity is `BALL_LAUNCH_VY = -5` (vertical component only; horizontal component
  comes from paddle-hit angle).

### Scoring & Levels

**Brick scores**: `BRICK_SCORE = 10` points per brick, flat rate — not per-color/per-level.

**Level layouts**: `LEVEL_COUNT = 5`. Each level's brick layout comes from a hardcoded entry in
`LEVEL_LAYOUTS` (game.js) — a 5-row x 8-column grid of 0/1 values, one grid per level. Layouts are
distinct hand-authored patterns (full grid, center hole, pyramid, diamond, alternating vertical
columns), not a procedurally-generated or increasingly dense sequence.

**Level progression**:
- Clearing a level's bricks triggers `checkWin()`, which sets `status` to `"levelcomplete"` (or
  `"gamecomplete"` on the last level) and shows an overlay.
- From `"levelcomplete"`, pressing up-arrow/Space or clicking the canvas calls `goToLevel(level + 1)`.
- `goToLevel(levelNumber)` can also be reached directly via the level-select buttons
  (`#level-buttons`), letting the player jump to any level at will — this resets lives, ball,
  explosions, and rebuilds the bricks for that level.
- Ball speed scales per level via `BALL_SPEED_INCREMENT_PER_LEVEL` (see Ball Physics above); lives are
  not automatically topped up when advancing except through `goToLevel()`'s reset.

## Feature Specs

The `specs/` folder contains design docs for individual features, written before/alongside
implementation:
- `specs/03-efectos-de-sonido.md` — sound effects (ball bounce, brick break, mute toggle)
- `specs/04-niveles-progresivos.md` — progressive levels and level-select UI
- `specs/.spec-config.yml` — spec tooling configuration

When adding a new feature of comparable size, consider adding a matching spec file here.

## Customization Points

Most tunable constants are at the top of `game.js` (lines ~2-19, with level layouts at ~21-62 and
sound objects at ~65-66). One exception: `EXPLOSION_DURATION` lives in `assets/spritesheet.js`, not
`game.js`.

| Constant | Location | Default | Notes |
|----------|----------|---------|-------|
| `CANVAS_WIDTH` | game.js | 800 | Canvas width in pixels |
| `CANVAS_HEIGHT` | game.js | 600 | Canvas height in pixels |
| `BRICK_COLS` | game.js | 8 | Number of brick columns |
| `BRICK_ROWS` | game.js | 5 | Number of brick rows |
| `INITIAL_LIVES` | game.js | 3 | Starting lives |
| `PADDLE_WIDTH` | game.js | 100 | Paddle width in pixels |
| `PADDLE_HEIGHT` | game.js | 14 | Paddle height in pixels |
| `PADDLE_SPEED` | game.js | 7 | Paddle movement speed (pixels/frame) via keyboard |
| `BALL_RADIUS` | game.js | 8 | Ball radius in pixels |
| `BALL_LAUNCH_VY` | game.js | -5 | Initial vertical velocity when launching the ball |
| `BRICK_WIDTH` | game.js | 90 | Brick width in pixels |
| `BRICK_HEIGHT` | game.js | 15 | Brick height in pixels |
| `BRICK_GAP` | game.js | 6 | Gap between bricks in pixels |
| `BRICK_OFFSET_TOP` | game.js | 60 | Vertical offset of brick grid from canvas top |
| `BRICK_SCORE` | game.js | 10 | Points per brick destroyed |
| `ROW_COLORS` | game.js | `["red","yellow","green","cyan","magenta"]` | Color per brick row, top to bottom |
| `LEVEL_COUNT` | game.js | 5 | Number of predefined levels (see `LEVEL_LAYOUTS`) |
| `BALL_SPEED_INCREMENT_PER_LEVEL` | game.js | 0.5 | Speed added to the ball per level |
| `EXPLOSION_DURATION` | assets/spritesheet.js | 150 | Duration (ms) of a brick's explosion animation |

## Common Tasks

**Test a logic change**: Save, refresh browser, play through several levels and brick patterns.

**Adjust difficulty**: Modify `BALL_SPEED_INCREMENT_PER_LEVEL`, `LEVEL_LAYOUTS` density, or `PADDLE_SPEED`.

**Change colors**: Update `ROW_COLORS` or sprite references.

**Add a new level pattern**: Add a new 5x8 grid to `LEVEL_LAYOUTS` and increment `LEVEL_COUNT`.

**Debug collision**: Add `console.log()` in collision functions to trace detection.

## Browser DevTools Tips

- **Console**: Add `console.log()` statements to trace ball position, collisions, or score updates
- **Elements**: Inspect `<canvas>` element to verify dimensions match constants
- **Performance**: Game uses `requestAnimationFrame`, which throttles to ~60 FPS

## Notes

- **No transpilation**: Uses ES6 (const/let, arrow functions, template literals, Array methods). Works in all modern browsers.
- **Canvas only**: All rendering is direct to canvas context; no DOM manipulation for gameplay.
- **Input handling**: Listens for `mousemove` (paddle control) and `keydown` (actions). Responsive feel prioritized over debouncing.
- **No persistence**: `localStorage` is not used anywhere in the codebase. Score, level, lives, and
  the currently-selected level are all held in in-memory `gameState` (plus the module-level `muted`
  flag) and are lost on page refresh — including any level reached via the level-select buttons.
- **Spritesheet loading**: Asynchronous; game waits for `loadSpritesheet()` callback before drawing sprites.
