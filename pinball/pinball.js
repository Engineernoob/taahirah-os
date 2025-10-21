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
    this.balls = this.balls.filter((ball) => {
      ball.vy += this.gravity;
      ball.vx *= this.friction;
      ball.vy *= this.friction;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx) * this.bounceDamping;
      }
      if (ball.x + ball.radius > this.canvas.width) {
        ball.x = this.canvas.width - ball.radius;
        ball.vx = -Math.abs(ball.vx) * this.bounceDamping;
      }
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * this.bounceDamping;
      }

      // Check collisions with bumpers
      this.bumpers.forEach((bumper) => {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < ball.radius + bumper.radius) {
          // Collision response
          const angle = Math.atan2(dy, dx);
          const force = 8;
          ball.vx = Math.cos(angle) * force;
          ball.vy = Math.sin(angle) * force;
          this.addScore(bumper.points);
          this.createParticles(bumper.x, bumper.y);
          if (this.sounds.bumper) this.sounds.bumper();
        }
      });

      // Check collisions with targets
      this.targets.forEach((target) => {
        if (this.checkRectCollision(ball, target)) {
          const bounceAngle = ball.x < target.x + target.width / 2 ? -1 : 1;
          ball.vx = bounceAngle * 4;
          ball.vy = -Math.abs(ball.vy) * 0.8;
          this.addScore(target.points);
          target.hit = true;
          setTimeout(() => (target.hit = false), 100);
          if (this.sounds.target) this.sounds.target();
        }
      });

      // Check flipper collisions
      this.checkFlipperCollisions(ball);

      // Ball drain - respawn instead of game over
      if (ball.y > this.canvas.height) {
        if (this.balls.length <= 1) {
          this.ballCount--;
          if (this.ballCount > 0) {
            this.createBall(this.canvas.width * 0.85, this.canvas.height * 0.7, -2, -8);
            return false; // Remove drained ball
          } else {
            this.endGame();
            return false;
          }
        }
        return false; // Remove ball
      }
      return true; // Keep ball
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
    
    // Draw game elements
    this.drawBumpers();
    this.drawTargets();
    this.drawFlippers();
    this.drawBalls();
    this.drawParticles();
    this.drawScorePopups();
  }

  drawBalls() {
    this.balls.forEach((ball) => {
      // Ball shadow/glow
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      this.ctx.beginPath();
      this.ctx.arc(ball.x + 2, ball.y + 2, ball.radius + 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Main ball
      this.ctx.fillStyle = "#fff";
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Ball highlight
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.beginPath();
      this.ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawBumpers() {
    this.bumpers.forEach((bumper) => {
      const bounceScale = bumper.hit ? 1.2 : 1;
      
      // Bumper glow
      if (bumper.hit) {
        this.ctx.fillStyle = "rgba(255, 100, 100, 0.3)";
        this.ctx.beginPath();
        this.ctx.arc(bumper.x, bumper.y, bumper.radius * bounceScale * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Main bumper
      this.ctx.fillStyle = bumper.hit ? "#ff6666" : "#cc0000";
      this.ctx.beginPath();
      this.ctx.arc(bumper.x, bumper.y, bumper.radius * bounceScale, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bumper border
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Center highlight
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.beginPath();
      this.ctx.arc(bumper.x, bumper.y, bumper.radius * bounceScale / 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      bumper.hit = false;
    });
  }

  drawTargets() {
    this.targets.forEach((target) => {
      this.ctx.fillStyle = target.hit ? "#ffff00" : "#00cc00";
      this.ctx.fillRect(target.x, target.y, target.width, target.height);
      
      // Target border
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(target.x, target.y, target.width, target.height);
      
      // Target highlight
      if (target.hit) {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.fillRect(target.x + 2, target.y + 2, target.width - 4, 4);
      }
    });
  }

  drawFlippers() {
    // Update flipper animation
    this.leftFlipper.angle += (this.leftFlipper.targetAngle - this.leftFlipper.angle) * 0.3;
    this.rightFlipper.angle += (this.rightFlipper.targetAngle - this.rightFlipper.angle) * 0.3;
    
    // Draw left flipper
    this.ctx.save();
    this.ctx.translate(this.leftFlipper.x, this.leftFlipper.y);
    this.ctx.rotate((this.leftFlipper.angle * Math.PI) / 180);
    this.ctx.fillStyle = "#silver";
    this.ctx.fillRect(-40, -7, 80, 14);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-40, -7, 80, 14);
    this.ctx.restore();
    
    // Draw right flipper
    this.ctx.save();
    this.ctx.translate(this.rightFlipper.x, this.rightFlipper.y);
    this.ctx.rotate((this.rightFlipper.angle * Math.PI) / 180);
    this.ctx.fillStyle = "#silver";
    this.ctx.fillRect(-40, -7, 80, 14);
    this.ctx.strokeStyle = "#fff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-40, -7, 80, 14);
    this.ctx.restore();
  }

  // Helper methods
  addScore(points) {
    this.score += points;
    this.updateDisplay();
    this.createScorePopup(points);
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("pinballHighScore", this.highScore.toString());
    }
  }

  createScorePopup(points) {
    const popup = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      text: `+${points}`,
      vy: -2,
      alpha: 1,
      color: points >= 300 ? "#ffff00" : points >= 150 ? "#ff9900" : "#ffffff"
    };
    this.scorePopups.push(popup);
  }

  drawScorePopups() {
    this.scorePopups = this.scorePopups.filter(popup => {
      popup.y += popup.vy;
      popup.alpha -= 0.02;
      
      if (popup.alpha > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = popup.alpha;
        this.ctx.fillStyle = popup.color;
        this.ctx.font = "bold 16px Orbitron";
        this.ctx.textAlign = "center";
        this.ctx.fillText(popup.text, popup.x, popup.y);
        this.ctx.restore();
        return true;
      }
      return false;
    });
  }

  createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 1,
        color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`
      });
    }
  }

  drawParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.05;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      
      if (particle.life > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        this.ctx.restore();
        return true;
      }
      return false;
    });
  }

  checkRectCollision(ball, rect) {
    return ball.x + ball.radius > rect.x &&
           ball.x - ball.radius < rect.x + rect.width &&
           ball.y + ball.radius > rect.y &&
           ball.y - ball.radius < rect.y + rect.height;
  }

  checkFlipperCollisions(ball) {
    // Left flipper collision
    const leftDist = this.distanceToLine(ball, 
      { x: this.leftFlipper.x - 40, y: this.leftFlipper.y },
      { x: this.leftFlipper.x + 40, y: this.leftFlipper.y }
    );
    
    if (leftDist < ball.radius + 7 && ball.y > this.leftFlipper.y - 20) {
      const force = this.leftFlipper.power > 0 ? 12 : 6;
      const angle = (this.leftFlipper.angle * Math.PI) / 180;
      ball.vx = Math.cos(angle - Math.PI/2) * force;
      ball.vy = -Math.abs(Math.sin(angle - Math.PI/2) * force) - 5;
    }
    
    // Right flipper collision
    const rightDist = this.distanceToLine(ball,
      { x: this.rightFlipper.x - 40, y: this.rightFlipper.y },
      { x: this.rightFlipper.x + 40, y: this.rightFlipper.y }
    );
    
    if (rightDist < ball.radius + 7 && ball.y > this.rightFlipper.y - 20) {
      const force = this.rightFlipper.power > 0 ? 12 : 6;
      const angle = (this.rightFlipper.angle * Math.PI) / 180;
      ball.vx = -Math.cos(angle - Math.PI/2) * force;
      ball.vy = -Math.abs(Math.sin(angle - Math.PI/2) * force) - 5;
    }
  }

  distanceToLine(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  endGame() {
    this.isRunning = false;
    this.gameOver = true;
    if (this.sounds.gameOver) this.sounds.gameOver();
    
    const launchBtn = document.getElementById("launch-button");
    if (launchBtn) {
      launchBtn.style.display = "block";
      launchBtn.textContent = "PLAY AGAIN";
    }
    
    // Show game over message
    this.showMessage(`Game Over! Final Score: ${this.score.toLocaleString()}`);
  }

  showMessage(text) {
    const messageDisplay = document.getElementById("message-display");
    if (messageDisplay) {
      messageDisplay.textContent = text;
      messageDisplay.style.display = "block";
      setTimeout(() => {
        messageDisplay.style.display = "none";
      }, 3000);
    }
  }
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  new PinballGame();
});
