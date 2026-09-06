// Constantes
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BRICK_COLS = 8;
const BRICK_ROWS = 5;
const INITIAL_LIVES = 3;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 14;
const PADDLE_SPEED = 7;

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

// Estado de teclas presionadas
const keys = {
  ArrowLeft: false,
  ArrowRight: false
};

function init() {
  setupInput();
  requestAnimationFrame(loop);
}

function setupInput() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      keys[e.key] = true;
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

function loop(timestamp) {
  updatePaddle();
  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawPaddle();
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
