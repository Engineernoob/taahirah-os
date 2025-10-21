/**
 * 3D Pinball: Space Cadet - Web Player with Original Assets
 * Integrates original Windows 3D Pinball assets into a web-based implementation
 */

class PinballGame {
  constructor() {
    // Canvas setup
    this.canvas = null;
    this.ctx = null;
    this.width = 500;
    this.height = 700;

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.gameOver = false;
    this.loading = true;
    this.lastTime = 0;
    this.animationId = null;

    // Original assets integration
    this.originalSounds = {};
    this.tableImage = null;
    this.assetsLoaded = false;
    this.audioContext = null;

    // Ball physics
    this.balls = [];
    this.ballRadius = 8;
    this.gravity = 0.25;
    this.friction = 0.985;
    this.bounceDamping = 0.75;

    // Table geometry (based on original layout)
    this.tableElements = [];
    this.bumpers = [];
    this.targets = [];
    this.holes = [];
    
    // Flippers (original positioning)
    this.leftFlipper = {
      x: 140, y: 600, angle: 30, targetAngle: 30, 
      power: 0, active: false, length: 80
    };
    this.rightFlipper = {
      x: 360, y: 600, angle: -30, targetAngle: -30,
      power: 0, active: false, length: 80
    };

    // Launcher
    this.launcher = {
      x: 470, y: 400, power: 0, maxPower: 20,
      pulling: false, ballReady: false
    };

    // Scoring
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("pinballHighScore")) || 0;
    this.ballCount = 1;
    this.maxBalls = 3;
    this.multiplier = 1;
    this.scorePopups = [];

    // Effects
    this.particles = [];
    this.shakeX = 0;
    this.shakeY = 0;

    // Controls
    this.keys = {};
    this.touchControls = { left: false, right: false };

    // Initialize
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.loadOriginalAssets();
    this.createTableElements();
  }

  setupCanvas() {
    this.canvas = document.getElementById("game-canvas");
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Configure rendering for original assets
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.font = 'bold 12px "Courier New", monospace';
  }

  setupEventListeners() {
    // Keyboard controls (original mapping)
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      
      if (["ArrowLeft", "ArrowRight", "KeyZ", "KeyX", "Space"].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === "Space" && !this.isRunning && !this.loading) {
        this.startGame();
      }
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Touch controls for mobile
    if ('ontouchstart' in window) {
      this.setupTouchControls();
    }

    // Launch button
    const launchBtn = document.getElementById("launch-button");
    if (launchBtn) {
      launchBtn.addEventListener("click", () => {
        if (!this.isRunning && !this.loading) {
          this.startGame();
        }
      });
    }
  }

  setupTouchControls() {
    this.canvas.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      
      if (x < this.width / 2) {
        this.touchControls.left = true;
      } else {
        this.touchControls.right = true;
      }
      e.preventDefault();
    });

    this.canvas.addEventListener("touchend", () => {
      this.touchControls.left = false;
      this.touchControls.right = false;
    });
  }

  async loadOriginalAssets() {
    try {
      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load original table background
      await this.loadTableImage();
      
      // Load original sounds
      await this.loadOriginalSounds();
      
      this.assetsLoaded = true;
      this.updateLoadingProgress(100);
      
      setTimeout(() => {
        this.loading = false;
        this.startGame();
      }, 1000);
      
    } catch (error) {
      console.log("Could not load original assets, using fallbacks", error);
      this.createFallbackAssets();
      this.loading = false;
      this.startGame();
    }
  }

  async loadTableImage() {
    // Load the original table background
    const response = await fetch('3DPinball/table.bmp');
    if (response.ok) {
      const blob = await response.blob();
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });
      this.tableImage = img;
    }
    this.updateLoadingProgress(50);
  }

  async loadOriginalSounds() {
    // Key original sound mappings
    const soundMappings = {
      bumper: 'SOUND3.WAV',
      flipper: 'SOUND12.WAV',
      target: 'SOUND13.WAV',
      hole: 'SOUND14.WAV',
      launch: 'SOUND20.WAV',
      gameOver: 'SOUND24.WAV',
      highScore: 'SOUND25.WAV',
      extraBall: 'SOUND26.WAV'
    };

    for (const [name, filename] of Object.entries(soundMappings)) {
      try {
        const response = await fetch(`3DPinball/${filename}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.originalSounds[name] = audioBuffer;
        }
      } catch (error) {
        console.log(`Could not load ${filename}, will use synthesized sound`);
      }
    }
    this.updateLoadingProgress(90);
  }

  createFallbackAssets() {
    // Create synthetic sounds if original audio files fail to load
    this.createSyntheticSounds();
  }

  createSyntheticSounds() {
    // Fallback synthesized sounds
    const soundTypes = ['bumper', 'flipper', 'target', 'hole', 'launch', 'gameOver'];
    soundTypes.forEach(type => {
      this.originalSounds[type] = this.createSynthSound(type);
    });
  }

  createSynthSound(type) {
    // Create synthetic sound as fallback
    const duration = type === 'gameOver' ? 0.5 : 0.1;
    const frequencies = {
      bumper: 200 + Math.random() * 100,
      flipper: 150,
      target: 400,
      hole: 100,
      launch: 300,
      gameOver: 80
    };
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.frequency.setValueAtTime(frequencies[type] || 300, 0);
    osc.type = type === 'gameOver' ? 'sawtooth' : 'square';
    gain.gain.setValueAtTime(0.1, 0);
    gain.gain.exponentialRampToValueAtTime(0.01, duration);
    
    osc.connect(gain);
    return osc;
  }

  updateLoadingProgress(percent) {
    const progressBar = document.getElementById("loading-progress");
    if (progressBar) {
      progressBar.style.width = percent + "%";
    }
  }

  playOriginalSound(type) {
    if (!this.audioContext) return;
    
    const sound = this.originalSounds[type];
    if (sound) {
      try {
        if (sound instanceof AudioBuffer) {
          // Play original sound
          const source = this.audioContext.createBufferSource();
          source.buffer = sound;
          source.connect(this.audioContext.destination);
          source.start(0);
        } else if (sound.start) {
          // Play synthetic sound
          const source = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          source.connect(gain);
          gain.connect(this.audioContext.destination);
          source.frequency.value = sound.frequency._value || 300;
          source.type = sound.type || 'square';
          gain.gain.value = 0.1;
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
          source.start(this.audioContext.currentTime);
          source.stop(this.audioContext.currentTime + 0.1);
        }
      } catch (error) {
        console.log("Sound playback failed:", error);
      }
    }
  }

  createTableElements() {
    // Original table layout based on the actual game
    this.bumpers = [
      { x: 250, y: 120, radius: 25, points: 100, color: "#ff6600", hit: 0 },
      { x: 180, y: 180, radius: 20, points: 75, color: "#0066ff", hit: 0 },
      { x: 320, y: 180, radius: 20, points: 75, color: "#0066ff", hit: 0 },
      { x: 80, y: 400, radius: 18, points: 150, color: "#ff0066", hit: 0 },
      { x: 420, y: 400, radius: 18, points: 150, color: "#ff0066", hit: 0 }
    ];

    // Original mission targets
    this.targets = [];
    
    // Left bank
    for (let i = 0; i < 3; i++) {
      this.targets.push({
        x: 100 + i * 25, y: 250, width: 20, height: 40,
        points: 50, color: "#00ff00", lit: false, bank: "left"
      });
    }
    
    // Right bank
    for (let i = 0; i < 3; i++) {
      this.targets.push({
        x: 375 + i * 25, y: 250, width: 20, height: 40,
        points: 50, color: "#00ff00", lit: false, bank: "right"
      });
    }

    // Original scoring holes
    this.holes = [
      { x: 250, y: 80, radius: 15, points: 500, type: "center" },
      { x: 150, y: 350, radius: 12, points: 250, type: "side" },
      { x: 350, y: 350, radius: 12, points: 250, type: "side" }
    ];
  }

  // Game control methods
  startGame() {
    if (this.loading) return;
    
    this.isRunning = true;
    this.gameOver = false;
    this.score = 0;
    this.ballCount = 1;
    this.multiplier = 1;
    this.balls = [];
    this.particles = [];
    this.scorePopups = [];
    
    // Reset targets
    this.targets.forEach(target => target.lit = false);
    this.bumpers.forEach(bumper => bumper.hit = 0);
    
    // Create initial ball
    this.createBallInLauncher();
    
    // Hide launch button
    const launchBtn = document.getElementById("launch-button");
    if (launchBtn) launchBtn.style.display = "none";
    
    this.updateDisplay();
    this.gameLoop();
  }

  createBall(x = this.width / 2, y = 200, vx = 0, vy = 0) {
    this.balls.push({
      x, y, vx, vy,
      trail: [],
      invincible: 0
    });
  }

  createBallInLauncher() {
    this.createBall(460, 400, 0, 0);
    this.launcher.ballReady = true;
  }

  gameLoop(time = 0) {
    if (!this.isRunning) return;
    
    const delta = Math.min(time - this.lastTime, 50);
    this.lastTime = time;
    
    if (!this.isPaused) {
      this.update(delta);
      this.render();
    }
    
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(delta) {
    this.handleInput();
    this.updateFlippers();
    this.updateLauncher();
    this.updateBalls(delta);
    this.updateParticles();
    this.updateScorePopups();
    this.updateScreenShake();
  }

  handleInput() {
    // Left flipper (Z or ArrowLeft)
    if (this.keys["KeyZ"] || this.keys["ArrowLeft"] || this.touchControls.left) {
      this.activateFlipper("left");
    } else {
      this.deactivateFlipper("left");
    }
    
    // Right flipper (X or ArrowRight)
    if (this.keys["KeyX"] || this.keys["ArrowRight"] || this.touchControls.right) {
      this.activateFlipper("right");
    } else {
      this.deactivateFlipper("right");
    }
    
    // Launcher (Space or ArrowDown)
    if (this.keys["Space"] || this.keys["ArrowDown"]) {
      this.pullLauncher();
    } else {
      this.releaseLauncher();
    }
  }

  activateFlipper(side) {
    const flipper = side === "left" ? this.leftFlipper : this.rightFlipper;
    
    if (!flipper.active) {
      flipper.active = true;
      flipper.power = 15;
      this.playOriginalSound("flipper");
    }
    
    flipper.targetAngle = side === "left" ? -20 : 20;
  }

  deactivateFlipper(side) {
    const flipper = side === "left" ? this.leftFlipper : this.rightFlipper;
    flipper.active = false;
    flipper.power = 0;
    flipper.targetAngle = side === "left" ? 30 : -30;
  }

  updateFlippers() {
    [this.leftFlipper, this.rightFlipper].forEach(flipper => {
      const diff = flipper.targetAngle - flipper.angle;
      flipper.angle += diff * 0.3;
    });
  }

  pullLauncher() {
    if (this.launcher.ballReady) {
      this.launcher.pulling = true;
      this.launcher.power = Math.min(this.launcher.power + 0.5, this.launcher.maxPower);
    }
  }

  releaseLauncher() {
    if (this.launcher.pulling && this.launcher.ballReady && this.balls.length > 0) {
      const ball = this.balls[this.balls.length - 1];
      if (Math.abs(ball.x - 460) < 20 && Math.abs(ball.y - 400) < 20) {
        ball.vy = -this.launcher.power;
        ball.vx = -2;
        this.launcher.ballReady = false;
        this.playOriginalSound("launch");
      }
    }
    this.launcher.pulling = false;
    this.launcher.power = 0;
  }

  updateLauncher() {
    if (this.launcher.pulling && this.launcher.ballReady && this.balls.length > 0) {
      const ball = this.balls[this.balls.length - 1];
      if (Math.abs(ball.x - 460) < 20) {
        ball.y = 400 + this.launcher.power;
      }
    }
  }

  updateBalls(delta) {
    const dt = delta / 16.67;
    
    this.balls = this.balls.filter(ball => {
      if (ball.invincible > 0) ball.invincible -= dt;
      
      ball.vy += this.gravity * dt;
      ball.vx *= Math.pow(this.friction, dt);
      ball.vy *= Math.pow(this.friction, dt);
      
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 10) ball.trail.shift();
      
      // Table boundaries (original layout)
      if (ball.x - ball.radius < 50) {
        ball.x = 50 + ball.radius;
        ball.vx = Math.abs(ball.vx) * this.bounceDamping;
      }
      
      if (ball.x + ball.radius > 450) {
        if (ball.y < 350 || ball.y > 450) {
          ball.x = 450 - ball.radius;
          ball.vx = -Math.abs(ball.vx) * this.bounceDamping;
        }
      }
      
      if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * this.bounceDamping;
      }
      
      this.checkBumperCollisions(ball);
      this.checkTargetCollisions(ball);
      this.checkHoleCollisions(ball);
      this.checkFlipperCollisions(ball);
      
      if (ball.y > this.height + ball.radius) {
        return this.handleBallDrain();
      }
      
      return true;
    });
  }

  checkBumperCollisions(ball) {
    this.bumpers.forEach(bumper => {
      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < ball.radius + bumper.radius) {
        const angle = Math.atan2(dy, dx);
        const force = 10 + Math.random() * 5;
        
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;
        
        this.addScore(bumper.points * this.multiplier);
        this.createParticles(bumper.x, bumper.y, bumper.color);
        this.playOriginalSound("bumper");
        
        bumper.hit = 10;
        
        this.shakeX = (Math.random() - 0.5) * 4;
        this.shakeY = (Math.random() - 0.5) * 2;
      }
    });
  }

  checkTargetCollisions(ball) {
    this.targets.forEach(target => {
      if (target.lit) return;
      
      if (this.checkRectCircleCollision(target, ball)) {
        target.lit = true;
        
        const centerX = target.x + target.width / 2;
        if (ball.x < centerX) {
          ball.vx = -Math.abs(ball.vx) * 0.8;
        } else {
          ball.vx = Math.abs(ball.vx) * 0.8;
        }
        ball.vy = -Math.abs(ball.vy) * 0.7;
        
        this.addScore(target.points * this.multiplier);
        this.playOriginalSound("target");
        
        if (this.checkBankComplete(target.bank)) {
          this.handleBankComplete(target.bank);
        }
      }
    });
  }

  checkHoleCollisions(ball) {
    if (ball.invincible > 0) return;
    
    this.holes.forEach(hole => {
      const dx = ball.x - hole.x;
      const dy = ball.y - hole.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < hole.radius * 1.5) {
        const force = 5;
        ball.vx -= (dx / distance) * force * 0.1;
        ball.vy -= (dy / distance) * force * 0.1;
        
        if (distance < hole.radius) {
          this.addScore(hole.points * this.multiplier);
          this.playOriginalSound("hole");
          this.createParticles(hole.x, hole.y, hole.type === "center" ? "#ffff00" : "#00ffff");
          
          ball.x = this.width / 2 + (Math.random() - 0.5) * 50;
          ball.y = 150;
          ball.vx = (Math.random() - 0.5) * 2;
          ball.vy = 2;
          ball.invincible = 60;
        }
      }
    });
  }

  checkFlipperCollisions(ball) {
    this.checkSingleFlipperCollision(ball, this.leftFlipper);
    this.checkSingleFlipperCollision(ball, this.rightFlipper);
  }

  checkSingleFlipperCollision(ball, flipper) {
    const flipperRect = {
      x: flipper.x - flipper.length/2,
      y: flipper.y - 7,
      width: flipper.length,
      height: 14
    };
    
    if (this.checkRectCircleCollision(flipperRect, ball)) {
      if (flipper.active) {
        const force = 15;
        const angle = (flipper.angle * Math.PI) / 180;
        ball.vx = Math.cos(angle - Math.PI/2) * force;
        ball.vy = -Math.abs(Math.sin(angle - Math.PI/2) * force) - 8;
      } else {
        ball.vy = -Math.abs(ball.vy) * 0.6;
      }
    }
  }

  checkRectCircleCollision(rect, circle) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
  }

  checkBankComplete(bank) {
    return this.targets
      .filter(target => target.bank === bank)
      .every(target => target.lit);
  }

  handleBankComplete(bank) {
    this.addScore(1000 * this.multiplier);
    this.multiplier = Math.min(this.multiplier + 1, 5);
    this.showMessage(`${bank.toUpperCase()} BANK COMPLETE! x${this.multiplier}`);
    
    setTimeout(() => {
      this.targets
        .filter(target => target.bank === bank)
        .forEach(target => target.lit = false);
    }, 3000);
  }

  handleBallDrain() {
    if (this.balls.length <= 1) {
      this.ballCount--;
      
      if (this.ballCount > 0) {
        this.createBallInLauncher();
        this.showMessage(`Ball ${this.ballCount} of ${this.maxBalls}`);
      } else {
        this.endGame();
      }
    }
    
    return false;
  }

  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
      particle.life -= 0.02;
      particle.vx *= 0.98;
      
      return particle.life > 0;
    });
  }

  updateScorePopups() {
    this.scorePopups = this.scorePopups.filter(popup => {
      popup.y -= 1;
      popup.alpha -= 0.02;
      return popup.alpha > 0;
    });
  }

  updateScreenShake() {
    this.shakeX *= 0.9;
    this.shakeY *= 0.9;
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = "#001020";
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Apply screen shake
    this.ctx.save();
    this.ctx.translate(this.shakeX, this.shakeY);
    
    // Draw original table background if loaded
    if (this.tableImage) {
      this.ctx.globalAlpha = 0.7;
      this.ctx.drawImage(this.tableImage, 0, 0, this.width, this.height);
      this.ctx.globalAlpha = 1.0;
    } else {
      this.drawTableBackground();
    }
    
    // Draw game elements
    this.drawHoles();
    this.drawTargets();
    this.drawBumpers();
    this.drawFlippers();
    this.drawBalls();
    this.drawParticles();
    this.drawScorePopups();
    this.drawLauncher();
    
    this.ctx.restore();
    
    // Draw UI overlay
    this.drawUI();
  }

  drawTableBackground() {
    // Fallback background if original image not loaded
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#001030");
    gradient.addColorStop(1, "#000410");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Table outline
    this.ctx.strokeStyle = "#00ffff";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(50, 0, 400, this.height);
    
    // Launch chute
    this.ctx.fillRect(450, 100, 20, 300);
    this.ctx.strokeRect(450, 100, 20, 300);
  }

  drawHoles() {
    this.holes.forEach(hole => {
      const glow = hole.type === "center" ? "#ffff00" : "#00ffff";
      this.ctx.fillStyle = glow + "33";
      this.ctx.beginPath();
      this.ctx.arc(hole.x, hole.y, hole.radius * 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = "#000";
      this.ctx.beginPath();
      this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = glow;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  drawTargets() {
    this.targets.forEach(target => {
      this.ctx.fillStyle = target.lit ? "#ffff00" : target.color;
      this.ctx.fillRect(target.x, target.y, target.width, target.height);
      
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(target.x, target.y, target.width, target.height);
      
      if (target.lit) {
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        this.ctx.fillRect(target.x + 2, target.y + 2, target.width - 4, 4);
      }
    });
  }

  drawBumpers() {
    this.bumpers.forEach(bumper => {
      const scale = 1 + (bumper.hit * 0.02);
      
      if (bumper.hit > 0) {
        bumper.hit--;
        this.ctx.fillStyle = bumper.color + "33";
        this.ctx.beginPath();
        this.ctx.arc(bumper.x, bumper.y, bumper.radius * scale * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.fillStyle = bumper.color;
      this.ctx.beginPath();
      this.ctx.arc(bumper.x, bumper.y, bumper.radius * scale, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.fillStyle = "#fff";
      this.ctx.beginPath();
      this.ctx.arc(bumper.x, bumper.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawFlippers() {
    [this.leftFlipper, this.rightFlipper].forEach(flipper => {
      this.ctx.save();
      this.ctx.translate(flipper.x, flipper.y);
      this.ctx.rotate((flipper.angle * Math.PI) / 180);
      
      this.ctx.fillStyle = "#silver";
      this.ctx.fillRect(-flipper.length/2, -7, flipper.length, 14);
      
      this.ctx.strokeStyle = flipper.active ? "#ffff00" : "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(-flipper.length/2, -7, flipper.length, 14);
      
      this.ctx.restore();
    });
  }

  drawBalls() {
    this.balls.forEach(ball => {
      // Trail effect
      ball.trail.forEach((point, index) => {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${index / ball.trail.length * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, ball.radius * (index / ball.trail.length), 0, Math.PI * 2);
        this.ctx.fill();
      });
      
      // Invincibility glow
      if (ball.invincible > 0) {
        this.ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius + 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Main ball
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Highlight
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.beginPath();
      this.ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
      this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
  }

  drawScorePopups() {
    this.scorePopups.forEach(popup => {
      this.ctx.save();
      this.ctx.globalAlpha = popup.alpha;
      this.ctx.fillStyle = popup.color;
      this.ctx.font = "bold 16px 'Courier New'";
      this.ctx.textAlign = "center";
      this.ctx.fillText(popup.text, popup.x, popup.y);
      this.ctx.restore();
    });
  }

  drawLauncher() {
    if (this.launcher.pulling) {
      const springHeight = this.launcher.power * 5;
      this.ctx.fillStyle = "#ff6600";
      this.ctx.fillRect(462, 400 + 300 - springHeight, 16, springHeight);
    }
  }

  drawUI() {
    this.ctx.fillStyle = "#00ffff";
    this.ctx.font = "bold 14px 'Courier New'";
    this.ctx.textAlign = "right";
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, this.width - 10, 20);
    this.ctx.fillText(`BALL: ${this.ballCount}/${this.maxBalls}`, this.width - 10, 40);
    
    if (this.multiplier > 1) {
      this.ctx.fillStyle = "#ffff00";
      this.ctx.fillText(`x${this.multiplier}`, this.width - 10, 60);
    }
    
    if (this.launcher.pulling) {
      this.ctx.fillStyle = "#ff6600";
      this.ctx.font = "bold 12px 'Courier New'";
      this.ctx.textAlign = "center";
      this.ctx.fillText("POWER", 460, 420);
      
      this.ctx.strokeStyle = "#ff6600";
      this.ctx.strokeRect(440, 430, 40, 100);
      
      const powerHeight = (this.launcher.power / this.launcher.maxPower) * 100;
      this.ctx.fillStyle = "#ff6600";
      this.ctx.fillRect(440, 530 - powerHeight, 40, powerHeight);
    }
  }

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
    this.scorePopups.push({
      x: this.width - 100 + Math.random() * 50,
      y: 50 + Math.random() * 50,
      text: `+${points}`,
      alpha: 1,
      color: points >= 500 ? "#ffff00" : points >= 250 ? "#00ffff" : "#ffffff"
    });
  }

  createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color
      });
    }
  }

  showMessage(text) {
    const messageDisplay = document.getElementById("message-display");
    if (messageDisplay) {
      messageDisplay.textContent = text;
      messageDisplay.style.display = "block";
      setTimeout(() => {
        messageDisplay.style.display = "none";
      }, 2000);
    }
  }

  updateDisplay() {
    const scoreEl = document.getElementById("current-score");
    const ballEl = document.getElementById("ball-count");
    const highScoreEl = document.getElementById("high-score");
    
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (ballEl) ballEl.textContent = this.ballCount;
    if (highScoreEl) highScoreEl.textContent = this.highScore.toLocaleString();
  }

  endGame() {
    this.isRunning = false;
    this.gameOver = true;
    
    const launchBtn = document.getElementById("launch-button");
    if (launchBtn) {
      launchBtn.style.display = "block";
      launchBtn.textContent = "GAME OVER - PLAY AGAIN";
    }
    
    this.playOriginalSound("gameOver");
    this.showMessage(`GAME OVER! Final Score: ${this.score.toLocaleString()}`);
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const game = new PinballGame();
  window.pinballGame = game;
});
