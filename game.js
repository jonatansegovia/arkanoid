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

// Referencias al DOM
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Estado de la paleta
const paddle = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT - 30,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED
};

// Estado de la bola
const ball = {
  x: 0,
  y: 0,
  radius: BALL_RADIUS,
  vx: 0,
  vy: 0,
  launched: false
};

// Estado general del juego
const gameState = {
  score: 0,
  lives: INITIAL_LIVES,
  status: "waiting",
  bricksRemaining: 0
};

// Estado de teclas presionadas
const keys = {
  ArrowLeft: false,
  ArrowRight: false
};

function init() {
  setupInput();
  resetBall();
  requestAnimationFrame(loop);
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
  ball.vy = BALL_LAUNCH_VY;
  ball.vx = 0;
  gameState.status = "playing";
}

function setupInput() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      keys[e.key] = true;
    }
    if (e.key === "ArrowUp" || e.key === " ") {
      launchBall();
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

function updateBall() {
  if (!ball.launched) {
    ball.x = paddle.x;
    ball.y = paddle.y - paddle.height - ball.radius;
    return;
  }
  ball.x += ball.vx;
  ball.y += ball.vy;
  collideWithWalls();
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
    // Rutina de pérdida de vida: se implementa en el Paso 7 (loseLife)
  }
}

function loop(timestamp) {
  updatePaddle();
  updateBall();
  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawPaddle();
  drawBall();
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
    paddle.height
  );
}

init();
