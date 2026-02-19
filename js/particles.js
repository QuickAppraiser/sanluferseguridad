/**
 * SecurityCanvas - Security-Themed Surveillance Canvas Animation
 * ===============================================================
 * A visually impactful canvas animation designed for a professional security
 * company website hero section, with clearly recognizable security imagery.
 *
 * Layers:
 *   1. Surveillance grid with pulsing crosshair marks
 *   2. Horizontal scanning line (security scanner effect)
 *   3. Floating security icons (cameras, locks, shields, eyes)
 *   4. Connection network between nearby icons
 *   5. Data particles traveling along connection lines
 *   6. Corner targeting brackets (camera viewfinder style)
 *
 * Mouse interaction (desktop): icons brighten near cursor, radial glow
 *
 * Performance:
 *   - 3 tiers: desktop (full), mobile (reduced), minimal (static-ish)
 *   - requestAnimationFrame with delta-time
 *   - Visibility API pause
 *   - prefers-reduced-motion: single static frame
 *   - DPR-aware (capped at 2)
 *   - Debounced resize
 */

class SecurityCanvas {

  // ─── Constants ────────────────────────────────────────────────────

  static CYAN     = '#22D3EE';
  static CYAN_RGB = '34, 211, 238';

  // ─── Tier Configurations ──────────────────────────────────────────

  static CONFIG = {
    desktop: {
      gridSpacing:      60,
      crosshairCount:   18,
      iconCount:        12,
      particleCount:    15,
      bracketCount:     4,
      mouseEnabled:     true,
      scanLineEnabled:  true,
    },
    mobile: {
      gridSpacing:      80,
      crosshairCount:   10,
      iconCount:        8,
      particleCount:    8,
      bracketCount:     3,
      mouseEnabled:     false,
      scanLineEnabled:  true,
    },
    minimal: {
      gridSpacing:      80,
      crosshairCount:   6,
      iconCount:        5,
      particleCount:    0,
      bracketCount:     2,
      mouseEnabled:     false,
      scanLineEnabled:  false,
    },
  };

  // Icon type enumeration
  static ICON_CAMERA = 0;
  static ICON_LOCK   = 1;
  static ICON_SHIELD = 2;
  static ICON_EYE    = 3;

  // ═══════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`SecurityCanvas: canvas "#${canvasId}" not found.`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');

    // Animation state
    this.animationId = null;
    this.isVisible   = true;
    this.lastTime    = 0;
    this.elapsed     = 0;

    // Mouse state
    this.mouse = { x: -9999, y: -9999, active: false };

    // DPR capped at 2
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Accessibility
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Detect tier
    this.tier   = this._detectTier();
    this.config = SecurityCanvas.CONFIG[this.tier];

    // Data structures
    this.crosshairs     = [];
    this.icons          = [];
    this.connections     = [];
    this.particles      = [];
    this.brackets       = [];
    this.scanLineY      = 0;

    // Setup and start
    this._setupCanvas();
    this._buildScene();
    this._bindEvents();

    if (this.prefersReducedMotion) {
      this._drawStaticFrame();
    } else {
      this._startLoop();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════════════

  _detectTier() {
    const w = window.innerWidth;
    if (w < 480)  return 'minimal';
    if (w < 768)  return 'mobile';
    return 'desktop';
  }

  _setupCanvas() {
    const parent = this.canvas.parentElement;
    const rect   = parent.getBoundingClientRect();

    this.width  = rect.width;
    this.height = rect.height;

    this.canvas.width  = this.width  * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width  = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCENE CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════

  _buildScene() {
    this._buildCrosshairs();
    this._buildIcons();
    this._buildConnections();
    this._buildParticles();
    this._buildBrackets();
    this.scanLineY = 0;
  }

  // ─── Crosshairs at grid intersections ─────────────────────────────

  _buildCrosshairs() {
    this.crosshairs = [];
    const spacing = this.config.gridSpacing;
    const cols    = Math.ceil(this.width  / spacing) + 1;
    const rows    = Math.ceil(this.height / spacing) + 1;

    // Collect all intersection positions
    const all = [];
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        all.push({ x: c * spacing, y: r * spacing });
      }
    }

    // Pick a random subset to display crosshair marks
    const count   = Math.min(this.config.crosshairCount, all.length);
    const indices = this._randomSample(all.length, count);
    for (const i of indices) {
      this.crosshairs.push({
        x:     all[i].x,
        y:     all[i].y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.8,
      });
    }
  }

  // ─── Floating Security Icons ──────────────────────────────────────

  _buildIcons() {
    this.icons = [];
    const count  = this.config.iconCount;
    const margin = 40;

    for (let i = 0; i < count; i++) {
      this.icons.push({
        x:        margin + Math.random() * (this.width  - margin * 2),
        y:        margin + Math.random() * (this.height - margin * 2),
        vx:       (Math.random() - 0.5) * 0.4,   // -0.2 to 0.2 px/frame at 60fps
        vy:       (Math.random() - 0.5) * 0.4,
        type:     Math.floor(Math.random() * 4),
        size:     20 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        opacity:  0.08 + Math.random() * 0.07,    // base opacity 0.08 - 0.15
        scanBoost: 0,                               // extra opacity from scan line
      });
    }
  }

  // ─── Connection Network ───────────────────────────────────────────

  _buildConnections() {
    this.connections = [];
    const maxDist = 200;

    for (let i = 0; i < this.icons.length; i++) {
      for (let j = i + 1; j < this.icons.length; j++) {
        const d = this._dist(
          this.icons[i].x, this.icons[i].y,
          this.icons[j].x, this.icons[j].y
        );
        if (d < maxDist) {
          this.connections.push({ from: i, to: j });
        }
      }
    }
  }

  // ─── Data Particles ───────────────────────────────────────────────

  _buildParticles() {
    this.particles = [];
    if (this.connections.length === 0) return;

    const count = Math.min(this.config.particleCount, this.connections.length * 3);
    for (let i = 0; i < count; i++) {
      this.particles.push(this._newParticle());
    }
  }

  _newParticle() {
    return {
      connIndex: Math.floor(Math.random() * this.connections.length),
      progress:  Math.random(),
      speed:     0.003 + Math.random() * 0.005,  // normalized speed per frame
      direction: Math.random() < 0.5 ? 1 : -1,
      trail:     [],
      trailLen:  5 + Math.floor(Math.random() * 4),
    };
  }

  // ─── Corner Brackets ──────────────────────────────────────────────

  _buildBrackets() {
    this.brackets = [];
    const count  = this.config.bracketCount;
    const margin = 80;

    for (let i = 0; i < count; i++) {
      this.brackets.push(this._newBracket(margin));
    }
  }

  _newBracket(margin) {
    const bw = 50 + Math.random() * 40;
    const bh = 35 + Math.random() * 30;
    return {
      x:          margin + Math.random() * (this.width  - margin * 2),
      y:          margin + Math.random() * (this.height - margin * 2),
      w:          bw,
      h:          bh,
      opacity:    0,
      fadeDir:    1,               // 1 = fading in, -1 = fading out
      fadeSpeed:  0.12 + Math.random() * 0.1,
      holdTime:   0,               // seconds remaining at full opacity
      lifetime:   5 + Math.random() * 3,   // total cycle seconds
      age:        0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════════════════════════

  _bindEvents() {
    // Debounced resize
    this._resizeTimer = null;
    this._boundResize = () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._onResize(), 250);
    };
    window.addEventListener('resize', this._boundResize);

    // Visibility API
    this._boundVisibility = () => {
      if (document.hidden) {
        this.isVisible = false;
        this._stopLoop();
      } else {
        this.isVisible = true;
        if (!this.prefersReducedMotion) {
          this.lastTime = 0;
          this._startLoop();
        }
      }
    };
    document.addEventListener('visibilitychange', this._boundVisibility);

    // Mouse (desktop only)
    if (this.config.mouseEnabled) {
      this._boundMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.active = true;
      };
      this._boundMouseLeave = () => {
        this.mouse.active = false;
        this.mouse.x = -9999;
        this.mouse.y = -9999;
      };
      this.canvas.addEventListener('mousemove',  this._boundMouseMove);
      this.canvas.addEventListener('mouseleave', this._boundMouseLeave);
    }

    // Reduced motion changes
    this._motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._boundMotion = (e) => {
      this.prefersReducedMotion = e.matches;
      if (e.matches) {
        this._stopLoop();
        this._drawStaticFrame();
      } else {
        this._startLoop();
      }
    };
    this._motionMQ.addEventListener('change', this._boundMotion);
  }

  _onResize() {
    this.tier   = this._detectTier();
    this.config = SecurityCanvas.CONFIG[this.tier];
    this.dpr    = Math.min(window.devicePixelRatio || 1, 2);

    this._setupCanvas();
    this._buildScene();

    if (this.prefersReducedMotion) {
      this._drawStaticFrame();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════

  _startLoop() {
    if (this.animationId) return;
    this.lastTime = 0;

    const tick = (timestamp) => {
      if (!this.isVisible) return;

      const dt = this.lastTime
        ? Math.min((timestamp - this.lastTime) / 1000, 0.1)
        : 0.016;
      this.lastTime = timestamp;
      this.elapsed += dt;

      this._update(dt);
      this._draw();

      this.animationId = requestAnimationFrame(tick);
    };

    this.animationId = requestAnimationFrame(tick);
  }

  _stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════

  _update(dt) {
    // --- Scanning line ---
    if (this.config.scanLineEnabled) {
      // ~8 seconds to traverse full height
      const scanSpeed = this.height / 8;
      this.scanLineY += scanSpeed * dt;
      if (this.scanLineY > this.height + 60) {
        this.scanLineY = -60;
      }
    }

    // --- Crosshair pulse phases ---
    for (const ch of this.crosshairs) {
      ch.phase += ch.speed * dt;
    }

    // --- Floating icons: drift and rotate ---
    for (const icon of this.icons) {
      icon.x += icon.vx * dt * 60;
      icon.y += icon.vy * dt * 60;
      icon.rotation += icon.rotSpeed * dt;

      // Wrap around edges with margin
      const m = 40;
      if (icon.x < -m)              icon.x = this.width + m;
      if (icon.x > this.width + m)  icon.x = -m;
      if (icon.y < -m)              icon.y = this.height + m;
      if (icon.y > this.height + m) icon.y = -m;

      // Scan line proximity boost: brighten when scan line is near
      if (this.config.scanLineEnabled) {
        const distToScan = Math.abs(icon.y - this.scanLineY);
        if (distToScan < 40) {
          icon.scanBoost = Math.min(icon.scanBoost + dt * 3, 0.2);
        } else {
          icon.scanBoost = Math.max(icon.scanBoost - dt * 1.5, 0);
        }
      }
    }

    // --- Rebuild connections dynamically (icons move) ---
    this._buildConnections();

    // --- Data particles ---
    for (const p of this.particles) {
      // If the connection no longer exists, reassign
      if (p.connIndex >= this.connections.length) {
        if (this.connections.length > 0) {
          p.connIndex = Math.floor(Math.random() * this.connections.length);
          p.progress  = Math.random();
        }
        continue;
      }

      p.progress += p.speed * p.direction * dt * 60;

      // Record trail position
      const conn = this.connections[p.connIndex];
      if (conn) {
        const a = this.icons[conn.from];
        const b = this.icons[conn.to];
        const t = Math.max(0, Math.min(1, p.progress));
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        p.trail.push({ x: px, y: py });
        if (p.trail.length > p.trailLen) p.trail.shift();
      }

      // Bounce or reassign at endpoints
      if (p.progress >= 1 || p.progress <= 0) {
        p.progress = Math.max(0, Math.min(1, p.progress));
        // Pick a new random connection
        if (this.connections.length > 0) {
          p.connIndex = Math.floor(Math.random() * this.connections.length);
          p.progress  = p.direction > 0 ? 0 : 1;
          p.trail     = [];
        }
      }
    }

    // --- Corner brackets lifecycle ---
    for (let i = 0; i < this.brackets.length; i++) {
      const br = this.brackets[i];
      br.age += dt;

      if (br.fadeDir === 1) {
        // Fading in
        br.opacity += br.fadeSpeed * dt;
        if (br.opacity >= 0.2) {
          br.opacity = 0.2;
          br.holdTime += dt;
          // Hold for 2-3 seconds then start fading out
          if (br.holdTime > 2.5) {
            br.fadeDir = -1;
          }
        }
      } else {
        // Fading out
        br.opacity -= br.fadeSpeed * dt;
        if (br.opacity <= 0) {
          br.opacity = 0;
          // If the bracket has lived its full lifetime, respawn at new position
          if (br.age >= br.lifetime) {
            this.brackets[i] = this._newBracket(80);
          } else {
            // Reset to fade in again at same position
            br.fadeDir  = 1;
            br.holdTime = 0;
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DRAW (composites all layers)
  // ═══════════════════════════════════════════════════════════════════

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this._drawGrid(ctx);
    this._drawCrosshairs(ctx);

    if (this.config.scanLineEnabled) {
      this._drawScanLine(ctx);
    }

    this._drawConnectionNetwork(ctx);
    this._drawDataParticles(ctx);
    this._drawIcons(ctx);
    this._drawBrackets(ctx);

    if (this.config.mouseEnabled && this.mouse.active) {
      this._drawMouseInteraction(ctx);
    }
  }

  /**
   * Static frame for prefers-reduced-motion users.
   */
  _drawStaticFrame() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this._drawGrid(ctx);

    // Draw a few crosshairs statically
    for (const ch of this.crosshairs) {
      this._drawCrosshairMark(ctx, ch.x, ch.y, 0.05);
    }

    // Draw icons at base opacity
    for (const icon of this.icons) {
      this._drawIconShape(ctx, icon, icon.opacity);
    }

    // Draw brackets at fixed opacity
    for (const br of this.brackets) {
      this._drawBracketShape(ctx, br.x, br.y, br.w, br.h, 0.1);
    }
  }

  // ─── Layer 1: Surveillance Grid ───────────────────────────────────

  _drawGrid(ctx) {
    const rgb     = SecurityCanvas.CYAN_RGB;
    const spacing = this.config.gridSpacing;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${rgb}, 0.04)`;
    ctx.lineWidth   = 0.5;

    // Vertical lines
    const cols = Math.ceil(this.width / spacing) + 1;
    for (let c = 0; c <= cols; c++) {
      const x = c * spacing;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }

    // Horizontal lines
    const rows = Math.ceil(this.height / spacing) + 1;
    for (let r = 0; r <= rows; r++) {
      const y = r * spacing;
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }

    ctx.stroke();
  }

  // ─── Layer 1b: Crosshair Marks at Grid Intersections ──────────────

  _drawCrosshairs(ctx) {
    for (const ch of this.crosshairs) {
      const pulse   = Math.sin(ch.phase) * 0.5 + 0.5;  // 0..1
      const opacity = 0.04 + pulse * 0.06;              // 0.04 - 0.10
      this._drawCrosshairMark(ctx, ch.x, ch.y, opacity);
    }
  }

  _drawCrosshairMark(ctx, x, y, opacity) {
    const rgb  = SecurityCanvas.CYAN_RGB;
    const size = 6;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${rgb}, ${opacity.toFixed(4)})`;
    ctx.lineWidth   = 1;

    // Horizontal stroke
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);

    // Vertical stroke
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);

    ctx.stroke();

    // Tiny center dot
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb}, ${(opacity * 0.8).toFixed(4)})`;
    ctx.fill();
  }

  // ─── Layer 2: Scanning Line ───────────────────────────────────────

  _drawScanLine(ctx) {
    const rgb = SecurityCanvas.CYAN_RGB;
    const y   = this.scanLineY;

    // Main scan line: horizontal gradient (transparent -> cyan -> transparent)
    const grad = ctx.createLinearGradient(0, y, this.width, y);
    grad.addColorStop(0,    `rgba(${rgb}, 0)`);
    grad.addColorStop(0.15, `rgba(${rgb}, 0.12)`);
    grad.addColorStop(0.5,  `rgba(${rgb}, 0.18)`);
    grad.addColorStop(0.85, `rgba(${rgb}, 0.12)`);
    grad.addColorStop(1,    `rgba(${rgb}, 0)`);

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Glow region above and below the line (vertical gradient)
    const glowH = 30;
    const vGrad = ctx.createLinearGradient(0, y - glowH, 0, y + glowH);
    vGrad.addColorStop(0,   `rgba(${rgb}, 0)`);
    vGrad.addColorStop(0.4, `rgba(${rgb}, 0.03)`);
    vGrad.addColorStop(0.5, `rgba(${rgb}, 0.06)`);
    vGrad.addColorStop(0.6, `rgba(${rgb}, 0.03)`);
    vGrad.addColorStop(1,   `rgba(${rgb}, 0)`);

    ctx.fillStyle = vGrad;
    ctx.fillRect(0, y - glowH, this.width, glowH * 2);

    // Brighten grid lines near the scan line
    const spacing = this.config.gridSpacing;
    const range   = 50;
    const rgb2    = SecurityCanvas.CYAN_RGB;

    // Find horizontal grid lines within range
    const rows = Math.ceil(this.height / spacing) + 1;
    for (let r = 0; r <= rows; r++) {
      const gy   = r * spacing;
      const dist = Math.abs(gy - y);
      if (dist < range) {
        const intensity = 1 - dist / range;
        const alpha     = intensity * 0.12;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(this.width, gy);
        ctx.strokeStyle = `rgba(${rgb2}, ${alpha.toFixed(4)})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }

    // Find vertical grid lines within range (brighten a narrow band)
    const cols = Math.ceil(this.width / spacing) + 1;
    for (let c = 0; c <= cols; c++) {
      const gx = c * spacing;
      // Only draw a short brightened segment near the scan line
      const segTop = Math.max(0, y - range);
      const segBot = Math.min(this.height, y + range);
      const alpha  = 0.06;
      ctx.beginPath();
      ctx.moveTo(gx, segTop);
      ctx.lineTo(gx, segBot);
      ctx.strokeStyle = `rgba(${rgb2}, ${alpha.toFixed(4)})`;
      ctx.lineWidth   = 0.5;
      ctx.stroke();
    }
  }

  // ─── Layer 3: Floating Security Icons ─────────────────────────────

  _drawIcons(ctx) {
    for (const icon of this.icons) {
      let opacity = icon.opacity + icon.scanBoost;

      // Mouse proximity boost
      if (this.config.mouseEnabled && this.mouse.active) {
        const d = this._dist(icon.x, icon.y, this.mouse.x, this.mouse.y);
        if (d < 120) {
          opacity += (1 - d / 120) * 0.15;
        }
      }

      opacity = Math.min(opacity, 0.4);
      this._drawIconShape(ctx, icon, opacity);
    }
  }

  _drawIconShape(ctx, icon, opacity) {
    ctx.save();
    ctx.translate(icon.x, icon.y);
    ctx.rotate(icon.rotation);

    const rgb = SecurityCanvas.CYAN_RGB;
    ctx.strokeStyle = `rgba(${rgb}, ${opacity.toFixed(4)})`;
    ctx.lineWidth   = 1.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const s = icon.size * 0.5;  // half-size for drawing

    switch (icon.type) {
      case SecurityCanvas.ICON_CAMERA:
        this._drawCameraIcon(ctx, s);
        break;
      case SecurityCanvas.ICON_LOCK:
        this._drawLockIcon(ctx, s);
        break;
      case SecurityCanvas.ICON_SHIELD:
        this._drawShieldIcon(ctx, s, opacity);
        break;
      case SecurityCanvas.ICON_EYE:
        this._drawEyeIcon(ctx, s);
        break;
    }

    ctx.restore();
  }

  /**
   * Camera icon: rectangular body with a triangular lens protrusion on the right.
   */
  _drawCameraIcon(ctx, s) {
    // Camera body (rectangle)
    const bw = s * 1.4;
    const bh = s * 0.9;
    ctx.beginPath();
    ctx.rect(-bw * 0.5, -bh * 0.5, bw, bh);
    ctx.stroke();

    // Lens circle
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.stroke();

    // Small indicator light (top-left)
    ctx.beginPath();
    ctx.arc(-bw * 0.3, -bh * 0.3, s * 0.07, 0, Math.PI * 2);
    ctx.stroke();

    // Mounting bracket on top
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -bh * 0.5);
    ctx.lineTo(-s * 0.15, -bh * 0.5 - s * 0.25);
    ctx.lineTo(s * 0.15, -bh * 0.5 - s * 0.25);
    ctx.lineTo(s * 0.15, -bh * 0.5);
    ctx.stroke();
  }

  /**
   * Lock/padlock icon: rectangular body with an arch on top.
   */
  _drawLockIcon(ctx, s) {
    // Lock body
    const bw = s * 0.9;
    const bh = s * 0.7;
    const by = s * 0.1;
    ctx.beginPath();
    ctx.rect(-bw * 0.5, by, bw, bh);
    ctx.stroke();

    // Shackle (arch)
    ctx.beginPath();
    ctx.arc(0, by, bw * 0.38, Math.PI, 0, false);
    ctx.stroke();

    // Keyhole
    ctx.beginPath();
    ctx.arc(0, by + bh * 0.35, s * 0.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, by + bh * 0.45);
    ctx.lineTo(0, by + bh * 0.7);
    ctx.stroke();
  }

  /**
   * Shield icon: pointed-bottom shield outline with a checkmark inside.
   */
  _drawShieldIcon(ctx, s, opacity) {
    const rgb = SecurityCanvas.CYAN_RGB;

    // Shield outline
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(s * 0.7, -s * 0.45);
    ctx.lineTo(s * 0.7, s * 0.15);
    ctx.lineTo(0, s * 0.8);
    ctx.lineTo(-s * 0.7, s * 0.15);
    ctx.lineTo(-s * 0.7, -s * 0.45);
    ctx.closePath();
    ctx.stroke();

    // Very subtle fill
    ctx.fillStyle = `rgba(${rgb}, ${(opacity * 0.1).toFixed(4)})`;
    ctx.fill();

    // Checkmark inside
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, s * 0.0);
    ctx.lineTo(-s * 0.05, s * 0.25);
    ctx.lineTo(s * 0.3, -s * 0.2);
    ctx.stroke();
  }

  /**
   * Eye/monitoring icon: almond-shaped eye with a circle iris.
   */
  _drawEyeIcon(ctx, s) {
    // Outer eye shape (two arcs forming an almond)
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.quadraticCurveTo(0, -s * 0.6, s * 0.8, 0);
    ctx.quadraticCurveTo(0, s * 0.6, -s * 0.8, 0);
    ctx.closePath();
    ctx.stroke();

    // Iris circle
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Pupil dot
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  // ─── Layer 4: Connection Network ──────────────────────────────────

  _drawConnectionNetwork(ctx) {
    const rgb = SecurityCanvas.CYAN_RGB;

    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 0.5;

    for (const conn of this.connections) {
      const a = this.icons[conn.from];
      const b = this.icons[conn.to];
      const d = this._dist(a.x, a.y, b.x, b.y);

      // Opacity falls off with distance
      const distFactor = 1 - d / 200;
      const alpha      = 0.03 + distFactor * 0.02;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(4)})`;
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  // ─── Layer 5: Data Particles ──────────────────────────────────────

  _drawDataParticles(ctx) {
    const rgb = SecurityCanvas.CYAN_RGB;

    for (const p of this.particles) {
      if (p.connIndex >= this.connections.length) continue;

      const conn = this.connections[p.connIndex];
      if (!conn) continue;

      const a = this.icons[conn.from];
      const b = this.icons[conn.to];
      const t = Math.max(0, Math.min(1, p.progress));

      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;

      // Trail
      if (p.trail.length > 1) {
        for (let i = 0; i < p.trail.length - 1; i++) {
          const frac      = i / p.trail.length;
          const trailAlpha = frac * 0.25;
          const trailSize  = 0.5 + frac * 0.8;

          ctx.beginPath();
          ctx.arc(p.trail[i].x, p.trail[i].y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${trailAlpha.toFixed(4)})`;
          ctx.fill();
        }
      }

      // Main particle dot
      ctx.save();
      ctx.shadowColor = `rgba(${rgb}, 0.5)`;
      ctx.shadowBlur  = 8;

      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, 0.45)`;
      ctx.fill();

      // Bright core
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, 0.7)`;
      ctx.fill();

      ctx.restore();
    }
  }

  // ─── Layer 6: Corner Brackets ─────────────────────────────────────

  _drawBrackets(ctx) {
    for (const br of this.brackets) {
      if (br.opacity <= 0.005) continue;
      this._drawBracketShape(ctx, br.x, br.y, br.w, br.h, br.opacity);
    }
  }

  _drawBracketShape(ctx, cx, cy, w, h, opacity) {
    const rgb = SecurityCanvas.CYAN_RGB;
    const hw  = w * 0.5;
    const hh  = h * 0.5;
    const arm = Math.min(w, h) * 0.3;   // length of each L-arm

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${rgb}, ${opacity.toFixed(4)})`;
    ctx.lineWidth   = 1.2;

    // Top-left corner
    ctx.moveTo(cx - hw + arm, cy - hh);
    ctx.lineTo(cx - hw, cy - hh);
    ctx.lineTo(cx - hw, cy - hh + arm);

    // Top-right corner
    ctx.moveTo(cx + hw - arm, cy - hh);
    ctx.lineTo(cx + hw, cy - hh);
    ctx.lineTo(cx + hw, cy - hh + arm);

    // Bottom-right corner
    ctx.moveTo(cx + hw, cy + hh - arm);
    ctx.lineTo(cx + hw, cy + hh);
    ctx.lineTo(cx + hw - arm, cy + hh);

    // Bottom-left corner
    ctx.moveTo(cx - hw + arm, cy + hh);
    ctx.lineTo(cx - hw, cy + hh);
    ctx.lineTo(cx - hw, cy + hh - arm);

    ctx.stroke();

    // Small crosshair in center of bracket
    const chSize = 3;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${rgb}, ${(opacity * 0.6).toFixed(4)})`;
    ctx.lineWidth   = 0.8;
    ctx.moveTo(cx - chSize, cy);
    ctx.lineTo(cx + chSize, cy);
    ctx.moveTo(cx, cy - chSize);
    ctx.lineTo(cx, cy + chSize);
    ctx.stroke();
  }

  // ─── Mouse Interaction ────────────────────────────────────────────

  _drawMouseInteraction(ctx) {
    const mx  = this.mouse.x;
    const my  = this.mouse.y;
    const rgb = SecurityCanvas.CYAN_RGB;

    // Subtle radial glow under cursor
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
    glow.addColorStop(0, `rgba(${rgb}, 0.04)`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.beginPath();
    ctx.arc(mx, my, 100, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Faint connection lines from cursor to nearby icons
    for (const icon of this.icons) {
      const d = this._dist(icon.x, icon.y, mx, my);
      if (d < 120) {
        const alpha = (1 - d / 120) * 0.06;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(icon.x, icon.y);
        ctx.strokeStyle = `rgba(${rgb}, ${alpha.toFixed(4)})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════

  _dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Return `count` unique random indices from [0, total).
   */
  _randomSample(total, count) {
    if (count >= total) return Array.from({ length: total }, (_, i) => i);
    const arr = Array.from({ length: total }, (_, i) => i);
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(Math.random() * (total - i));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
  }

  /**
   * Tear down the animation and release resources.
   */
  destroy() {
    this._stopLoop();
    window.removeEventListener('resize', this._boundResize);
    document.removeEventListener('visibilitychange', this._boundVisibility);
    if (this._motionMQ) {
      this._motionMQ.removeEventListener('change', this._boundMotion);
    }
    if (this._boundMouseMove) {
      this.canvas.removeEventListener('mousemove',  this._boundMouseMove);
      this.canvas.removeEventListener('mouseleave', this._boundMouseLeave);
    }
    this.crosshairs  = [];
    this.icons       = [];
    this.connections = [];
    this.particles   = [];
    this.brackets    = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  new SecurityCanvas('particleCanvas');
});
