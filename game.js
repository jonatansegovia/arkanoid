// Constantes
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BRICK_COLS = 8;
const BRICK_ROWS = 5;
const INITIAL_LIVES = 3;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 7;
const BALL_RADIUS = 8;
const BALL_LAUNCH_VY = -5;
const BRICK_WIDTH = 90;
const BRICK_HEIGHT = 15;
const BRICK_GAP = 6;
const BRICK_OFFSET_TOP = 60;
const BRICK_SCORE = 10;
const ROW_COLORS = ["red", "yellow", "green", "cyan", "magenta"];
const LEVEL_COUNT = 5;
const BALL_SPEED_INCREMENT_PER_LEVEL = 0.5;

const LEVEL_LAYOUTS = [
  // Nivel 1: completo
  [
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
  ],
  // Nivel 2: hueco central
  [
    [1,1,1,1,1,1,1,1],
    [1,1,1,0,0,1,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,1,0,0,1,1,1],
    [1,1,1,1,1,1,1,1],
  ],
  // Nivel 3: pirámide
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
  ],
  // Nivel 4: diamante
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
  ],
  // Nivel 5: columnas verticales alternadas (final)
  [
    [1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0],
    [1,0,1,0,1,0,1,0],
  ],
];

// Referencias al DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

// Estado de la paleta
const paddle = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT - 30,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED,
};

// Estado de la bola
const ball = {
  x: 0,
  y: 0,
  radius: BALL_RADIUS,
  vx: 0,
  vy: 0,
  launched: false,
};

// Estado general del juego
const gameState = {
  score: 0,
  lives: INITIAL_LIVES,
  status: "waiting",
  bricksRemaining: 0,
  level: 1,
};

// Cuadrícula de ladrillos (5 filas x 8 columnas)
let bricks = [];

// Explosiones activas
let explosions = [];

function createBricks() {
  bricks = [];
  const gridWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
  const offsetX = (CANVAS_WIDTH - gridWidth) / 2;

  const layout = LEVEL_LAYOUTS[gameState.level - 1];
  let brickCount = 0;

  for (let row = 0; row < BRICK_ROWS; row++) {
    const rowBricks = [];
    for (let col = 0; col < BRICK_COLS; col++) {
      if (layout[row][col] === 1) {
        rowBricks.push({
          x: offsetX + col * (BRICK_WIDTH + BRICK_GAP),
          y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: ROW_COLORS[row],
          alive: true,
        });
        brickCount++;
      } else {
        rowBricks.push(null);
      }
    }
    bricks.push(rowBricks);
  }

  gameState.bricksRemaining = brickCount;
}

// Estado de teclas presionadas
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

// Guarda el estado previo a pausar, para poder reanudarlo
let statusBeforePause = "waiting";

function init() {
  setupInput();
  createBricks();
  resetBall();
  loadSpritesheet(() => requestAnimationFrame(loop));
}

function resetBall() {
  ball.x = paddle.x;
  ball.y = paddle.y - paddle.height - ball.radius;
  ball.vx = 0;
  ball.vy = 0;
  ball.launched = false;
  gameState.status = "waiting";
}

function launchBall() {
  if (ball.launched) return;
  ball.launched = true;
  const speedIncrement = (gameState.level - 1) * BALL_SPEED_INCREMENT_PER_LEVEL;
  ball.vy = BALL_LAUNCH_VY - speedIncrement;
  ball.vx = 0;
  gameState.status = "playing";
}

function loseLife() {
  gameState.lives--;
  if (gameState.lives > 0) {
    resetBall();
  } else {
    gameState.status = "gameover";
    showOverlay("Game Over", `Puntaje final: ${gameState.score}`);
  }
}

function checkWin() {
  if (gameState.bricksRemaining === 0) {
    if (gameState.level < LEVEL_COUNT) {
      gameState.status = "levelcomplete";
      showOverlay("Nivel " + gameState.level + " completado", "Puntaje: " + gameState.score, "Presiona Espacio para continuar");
    } else {
      gameState.status = "gamecomplete";
      showOverlay("¡Completaste el juego!", "Puntaje final: " + gameState.score, "Presiona R para reiniciar");
    }
  }
}

function togglePause() {
  if (gameState.status === "gameover" || gameState.status === "win") return;

  if (gameState.status === "paused") {
    gameState.status = statusBeforePause;
    hideOverlay();
  } else {
    statusBeforePause = gameState.status;
    gameState.status = "paused";
    showOverlay("Pausado", "Presiona P para reanudar");
  }
}

function resetGame() {
  gameState.score = 0;
  gameState.lives = INITIAL_LIVES;
  gameState.status = "waiting";
  hideOverlay();
  explosions = [];
  createBricks();
  resetBall();
}

function showOverlay(title, message, hint) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  const overlayHintEl = document.getElementById("overlay-hint");
  if (overlayHintEl) {
    overlayHintEl.textContent = hint || "Presiona R para reiniciar";
  }
  overlay.style.display = "flex";
}

function hideOverlay() {
  overlay.style.display = "none";
}

function setupInput() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      keys[e.key] = true;
    }
    if (e.key === "ArrowUp" || e.key === " ") {
      if (gameState.status === "levelcomplete") {
        gameState.level++;
        gameState.lives = INITIAL_LIVES;
        explosions = [];
        hideOverlay();
        createBricks();
        resetBall();
      } else {
        launchBall();
      }
    }
    if (e.key === "p" || e.key === "P") {
      togglePause();
    }
    if (e.key === "r" || e.key === "R") {
      resetGame();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      keys[e.key] = false;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    updatePaddlePosition(mouseX);
  });
}

function updatePaddlePosition(x) {
  paddle.x = x;
  clampPaddle();
}

function clampPaddle() {
  const halfWidth = paddle.width / 2;
  if (paddle.x - halfWidth < 0) {
    paddle.x = halfWidth;
  }
  if (paddle.x + halfWidth > CANVAS_WIDTH) {
    paddle.x = CANVAS_WIDTH - halfWidth;
  }
}

function updatePaddle() {
  if (keys.ArrowLeft) {
    updatePaddlePosition(paddle.x - paddle.speed);
  }
  if (keys.ArrowRight) {
    updatePaddlePosition(paddle.x + paddle.speed);
  }
}

function updateBall(timestamp) {
  if (!ball.launched) {
    ball.x = paddle.x;
    ball.y = paddle.y - paddle.height - ball.radius;
    return;
  }
  ball.x += ball.vx;
  ball.y += ball.vy;
  collideWithWalls();
  collideWithPaddle();
  collideWithBricks(timestamp);
}

function updateExplosions(timestamp) {
  explosions = explosions.filter(exp => timestamp - exp.startTime < EXPLOSION_DURATION);
}

function collideWithBricks(timestamp) {
  for (const row of bricks) {
    for (const brick of row) {
      if (!brick || !brick.alive) continue;

      const ballBottom = ball.y + ball.radius;
      const ballTop = ball.y - ball.radius;
      const ballLeft = ball.x - ball.radius;
      const ballRight = ball.x + ball.radius;

      const intersects =
        ballRight > brick.x &&
        ballLeft < brick.x + brick.width &&
        ballBottom > brick.y &&
        ballTop < brick.y + brick.height;

      if (!intersects) continue;

      brick.alive = false;
      explosions.push({
        x: brick.x,
        y: brick.y,
        width: brick.width,
        height: brick.height,
        color: brick.color,
        startTime: timestamp
      });
      gameState.score += BRICK_SCORE;
      gameState.bricksRemaining--;
      checkWin();

      const overlapLeft = ballRight - brick.x;
      const overlapRight = brick.x + brick.width - ballLeft;
      const overlapTop = ballBottom - brick.y;
      const overlapBottom = brick.y + brick.height - ballTop;
      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        ball.vx = -ball.vx;
      } else {
        ball.vy = -ball.vy;
      }

      return;
    }
  }
}

function collideWithPaddle() {
  const paddleLeft = paddle.x - paddle.width / 2;
  const paddleRight = paddle.x + paddle.width / 2;
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.height;

  const ballBottom = ball.y + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;

  const intersects =
    ballRight > paddleLeft &&
    ballLeft < paddleRight &&
    ballBottom > paddleTop &&
    ballTop < paddleBottom;

  if (!intersects || ball.vy < 0) return;

  const hitPosition = (ball.x - paddleLeft) / paddle.width; // 0..1
  const speedIncrement = (gameState.level - 1) * BALL_SPEED_INCREMENT_PER_LEVEL;

  if (hitPosition < 1 / 3) {
    ball.vx = -(3 + speedIncrement);
  } else if (hitPosition > 2 / 3) {
    ball.vx = 3 + speedIncrement;
  } else {
    ball.vx = 0;
  }
  ball.vy = -(5 + speedIncrement);

  ball.y = paddleTop - ball.radius;
}

function collideWithWalls() {
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx = -ball.vx;
  } else if (ball.x + ball.radius > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.radius;
    ball.vx = -ball.vx;
  }

  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy = -ball.vy;
  }

  if (ball.y > CANVAS_HEIGHT) {
    loseLife();
  }
}

function loop(timestamp) {
  if (
    gameState.status !== "gameover" &&
    gameState.status !== "win" &&
    gameState.status !== "paused" &&
    gameState.status !== "levelcomplete" &&
    gameState.status !== "gamecomplete"
  ) {
    updatePaddle();
    updateBall(timestamp);
    updateExplosions(timestamp);
  }
  draw(timestamp);
  updateInfoPanel();
  requestAnimationFrame(loop);
}

function updateInfoPanel() {
  scoreEl.textContent = gameState.score;
  livesEl.textContent = gameState.lives;
}

function draw(timestamp) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBricks();
  drawExplosions(timestamp);
  drawPaddle();
  drawBall();
}

function drawBricks() {
  for (const row of bricks) {
    for (const brick of row) {
      if (!brick || !brick.alive) continue;
      drawSprite(ctx, 'block_' + brick.color, brick.x, brick.y, brick.width, brick.height);
    }
  }
}

function drawExplosions(timestamp) {
  for (const exp of explosions) {
    const elapsed = timestamp - exp.startTime;
    const progress = Math.min(elapsed / EXPLOSION_DURATION, 1);
    const frameIndex = Math.floor(progress * 4);
    drawExplosionFrame(ctx, exp.color, frameIndex, exp.x, exp.y, exp.width, exp.height);
  }
}

function drawBall() {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaddle() {
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(
    paddle.x - paddle.width / 2,
    paddle.y,
    paddle.width,
    paddle.height,
  );
}

init();
