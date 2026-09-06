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
   - Info panel: score, level, lives
   - Pause/game-over screens
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
- Ball resets to paddle if it falls below screen

**Bricks**:
- 2D grid of rectangles (rows × cols)
- Each brick tracks existence (alive/dead) and color
- Destroyed when ball hits them
- Can be arranged in patterns per level

**Game State**:
- `score`: points accumulated from destroying bricks
- `level`: affects ball speed and brick layout
- `lives`: remaining attempts (game over at 0)
- `gameOver`, `paused`: state flags
- `ballX, ballY`: ball position
- `ballVx, ballVy`: ball velocity
- `paddleX`: paddle horizontal position

### Game Loop

```
init()
  ├─ loadSpritesheet() or setup graphics
  ├─ createBrickGrid()
  ├─ resetBall()
  └─ requestAnimationFrame(loop)
       ↓
  loop(timestamp)
    ├─ Update ball position (ballX += ballVx, ballY += ballVy)
    ├─ Check collisions: paddle, bricks, walls, floor
    ├─ Handle brick destruction and scoring
    ├─ Check win condition (all bricks destroyed)
    ├─ draw() → render paddle, ball, bricks, score/lives/level
    └─ requestAnimationFrame(loop)

  Mouse move → update paddleX
  Keyboard (arrow keys) → update paddleX
  Spacebar → launch ball (if waiting) or pause
  R key → restart
```

### Assets

**Spritesheet** (`assets/spritesheet-breakout.png`):
- Defined in `assets/spritesheet.js`
- Sprite definitions: paddle, ball, blocks (7 colors)
- Explosion frames for destruction animation
- `drawSprite(ctx, name, x, y, w, h)` renders a sprite

**Sounds**:
- `ball-bounce.mp3` — played on ball collision with paddle/walls
- `break-sound.mp3` — played on brick destruction

### Key Functions (Not Exhaustive)

| Function | Purpose |
|----------|---------|
| `init()` | Initialize game, load assets, set up event listeners |
| `loadSpritesheet(callback)` | Asynchronously load spritesheet image |
| `createBrickGrid(level)` | Create 2D array of bricks for given level |
| `resetBall()` | Return ball to paddle, set initial velocity to zero |
| `launchBall()` | Send ball into play from paddle |
| `updateBall(dt)` | Update ball position; detect and handle collisions |
| `collideWithPaddle()` | Check ball-paddle intersection; adjust ball velocity based on hit location |
| `collideWithBricks()` | Check ball-brick intersections; mark bricks destroyed and update score |
| `collideWithWalls()` | Bounce ball off canvas edges |
| `resetBallIfFallen()` | Check if ball fell below screen; decrement lives or end game |
| `checkWinCondition()` | Return true if all bricks destroyed |
| `draw()` | Render paddle, ball, bricks, score, lives, level |
| `loop(timestamp)` | Main game loop |

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

### Scoring & Levels

**Brick scores**: Typically 10–100 points per brick (can vary by color/level).

**Level progression**:
- Level affects initial brick layout (density, arrangement)
- Ball speed increases slightly with level
- Lives reset or increase when advancing levels

**Difficulty**:
- `ballSpeed` increases with level
- Brick patterns become denser

## Customization Points

All tunable constants are at the top of `game.js`:

| Constant | Default | Notes |
|----------|---------|-------|
| `CANVAS_WIDTH` | 800 | Canvas width in pixels |
| `CANVAS_HEIGHT` | 600 | Canvas height in pixels |
| `PADDLE_WIDTH` | 100 | Paddle width in pixels |
| `PADDLE_HEIGHT` | 14 | Paddle height in pixels |
| `BALL_RADIUS` | 8 | Ball radius in pixels |
| `BRICK_COLS` | 10 | Number of brick columns |
| `BRICK_ROWS` | 6 | Number of brick rows |
| `BRICK_WIDTH` | 75 | Brick width in pixels |
| `BRICK_HEIGHT` | 15 | Brick height in pixels |
| `INITIAL_BALL_SPEED` | 4 | Ball speed in pixels per frame |
| `INITIAL_LIVES` | 3 | Starting lives |
| `BRICK_SCORE` | 10 | Points per brick destroyed |

## Common Tasks

**Test a logic change**: Save, refresh browser, play through several levels and brick patterns.

**Adjust difficulty**: Modify `INITIAL_BALL_SPEED`, `BRICK_ROWS`, or increase speed-per-level multiplier.

**Change colors**: Update sprite references or modify brick color selection in `createBrickGrid()`.

**Add a new level pattern**: Create level-specific brick layouts in `createBrickGrid(level)`.

**Debug collision**: Add `console.log()` in collision functions to trace detection.

## Browser DevTools Tips

- **Console**: Add `console.log()` statements to trace ball position, collisions, or score updates
- **Elements**: Inspect `<canvas>` element to verify dimensions match constants
- **Performance**: Game uses `requestAnimationFrame`, which throttles to ~60 FPS

## Notes

- **No transpilation**: Uses ES6 (const/let, arrow functions, template literals, Array methods). Works in all modern browsers.
- **Canvas only**: All rendering is direct to canvas context; no DOM manipulation for gameplay.
- **Input handling**: Listens for `mousemove` (paddle control) and `keydown` (actions). Responsive feel prioritized over debouncing.
- **No persistence**: Score/level are lost on refresh; no localStorage usage.
- **Spritesheet loading**: Asynchronous; game waits for `loadSpritesheet()` callback before drawing sprites.
