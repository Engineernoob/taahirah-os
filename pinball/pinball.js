/**
 * 3D Pinball: Space Cadet - Game Engine
 * Web-based recreation with physics, bumpers, flippers, targets, scoring
 * Vanilla JS + Canvas
 */

class PinballGame {
  constructor() {
    // Canvas and context
    this.canvas = null;
    this.ctx = null;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameOver = false;
    this.loading = true;

    // Ball properties
    this.balls = [];
    this.ballRadius = 8;
    this.gravity = 0.3;
    this.friction = 0.98;
    this.bounceDamping = 0.8;

    // Flippers
    this.leftFlipper = { angle: -30, targetAngle: -30, power: 0 };
    this.rightFlipper = { angle: 30, targetAngle: 30, power: 0 };
    this.flipperForce = 0.5;

    // Elements
    this.bumpers = [];
    this.ramps = [];
    this.targets = [];
    this.particles = [];
    this.scorePopups = [];

    // Scoring
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("pinballHighScore")) || 0;
    this.ballCount = 1;
    this.maxBalls = 3;
    this.multiballActive = false;
    this.comboMultiplier = 1;

    // Controls
    this.keys = {};
    this.touchLeft = false;
    this.touchRight = false;

    // Audio
    this.audioContext = null;
    this.sounds = {};

    // Anim
    this.lastTime = 0;
    this.animationId = null;

    // Start
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.createGameElements();
    this.loadAudio();
    this.showLoadingScreen();
    this.loadAssets();
  }

  setupCanvas() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.updateElementPositions();
  }

  updateElementPositions() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.leftFlipper.x = width * 0.15;
    this.leftFlipper.y = height - 40;
    this.rightFlipper.x = width * 0.85;
    this.rightFlipper.y = height - 40;
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"].includes(e.code))
        e.preventDefault();

      if (e.code === "Space" && !this.isRunning) this.startGame();
      if (e.code === "Space" && this.isRunning) this.togglePause();
    });
    document.addEventListener("keyup", (e) => (this.keys[e.code] = false));

    const launchBtn = document.getElementById("launch-button");
    if (launchBtn) {
      launchBtn.addEventListener("click", () => {
        if (!this.isRunning) this.startGame();
      });
    } else {
      console.warn("Launch button not found – auto-starting pinball...");
      setTimeout(() => this.startGame(), 1000);
    }
  }

  createGameElements() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.bumpers = [
      { x: width * 0.5, y: height * 0.35, radius: 22, points: 150, hit: false },
      { x: width * 0.25, y: height * 0.2, radius: 17, points: 100, hit: false },
      { x: width * 0.75, y: height * 0.2, radius: 17, points: 100, hit: false },
    ];
    this.targets = [
      {
        x: width * 0.25,
        y: height * 0.6,
        width: 20,
        height: 40,
        points: 300,
        hit: false,
      },
      {
        x: width * 0.75,
        y: height * 0.6,
        width: 20,
        height: 40,
        points: 300,
        hit: false,
      },
    ];
  }

  loadAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.sounds.bumper = this.createTone(220, 0.1, "square");
      this.sounds.flipper = this.createTone(150, 0.05, "sine");
      this.sounds.launch = this.createTone(300, 0.2, "sawtooth");
      this.sounds.target = this.createTone(400, 0.1, "triangle");
      this.sounds.gameOver = this.createTone(100, 0.5, "sawtooth");
    } catch (e) {
      console.log("Web Audio API not supported");
    }
  }

  createTone(freq, dur, type = "sine") {
    return () => {
      if (!this.audioContext) return;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      osc.type = type;
      gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + dur
      );
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + dur);
    };
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    const progressBar = document.getElementById("loading-progress");
    if (!loadingScreen || !progressBar) return;
    loadingScreen.style.display = "flex";
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => (loadingScreen.style.display = "none"), 500);
      }
      progressBar.style.width = progress + "%";
    }, 100);
  }

  loadAssets() {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => this.updateDisplay(), 1000);
  }

  startGame() {
    if (this.loading) return;
    this.isRunning = true;
    this.gameOver = false;
    this.score = 0;
    this.ballCount = 1;
    this.createBall();
    if (this.sounds.launch) this.sounds.launch();
    const launchBtn = document.getElementById("launch-button");
    if (launchBtn) launchBtn.style.display = "none";
    this.gameLoop();
  }

  createBall(
    x = this.canvas.width * 0.5,
    y = this.canvas.height * 0.2,
    vx = 0,
    vy = 0
  ) {
    this.balls.push({ x, y, vx, vy, radius: this.ballRadius, trail: [] });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseScreen = document.querySelector(".game-paused");
    if (pauseScreen)
      pauseScreen.style.display = this.isPaused ? "flex" : "none";
  }

  gameLoop(time = 0) {
    if (!this.isRunning) return;
    const delta = time - this.lastTime;
    this.lastTime = time;
    if (!this.isPaused) {
      this.update(delta);
      this.render();
    }
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(delta) {
    this.handleInput();
    this.updateBalls();
  }

  handleInput() {
    if (this.keys["ArrowLeft"] || this.keys["KeyA"])
      this.activateFlipper("left");
    else this.releaseFlipper("left");
    if (this.keys["ArrowRight"] || this.keys["KeyD"])
      this.activateFlipper("right");
    else this.releaseFlipper("right");
  }

  activateFlipper(side) {
    const f = side === "left" ? this.leftFlipper : this.rightFlipper;
    f.targetAngle = side === "left" ? -10 : 10;
    f.power = this.flipperForce;
    if (this.sounds.flipper) this.sounds.flipper();
  }

  releaseFlipper(side) {
    const f = side === "left" ? this.leftFlipper : this.rightFlipper;
    f.targetAngle = side === "left" ? -30 : 30;
    f.power = 0;
  }

  updateBalls() {
    this.balls.forEach((ball) => {
      ball.vy += this.gravity;
      ball.vx *= this.friction;
      ball.vy *= this.friction;
      ball.x += ball.vx;
      ball.y += ball.vy;
      if (ball.y > this.canvas.height) this.isRunning = false;
    });
  }

  // 🔥 FIXED updateDisplay method
  updateDisplay() {
    const scoreEl = document.getElementById("current-score");
    const ballEl = document.getElementById("ball-count");
    const highScoreEl = document.getElementById("high-score");
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (ballEl) ballEl.textContent = this.ballCount;
    if (highScoreEl) highScoreEl.textContent = this.highScore.toLocaleString();
  }

  render() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBalls();
  }

  drawBalls() {
    this.balls.forEach((ball) => {
      this.ctx.fillStyle = "#fff";
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  new PinballGame();
});
