/**
 * SecurityGrid - Security-Themed Canvas Animation
 * =================================================
 * A premium hexagonal grid animation with shield nodes, data flow particles,
 * radar sweep, and mouse interaction. Designed for a professional security
 * company website hero section.
 *
 * Layers:
 *   1. Hexagonal honeycomb grid with pulsing highlights
 *   2. Shield/badge nodes at grid intersections
 *   3. Data packets flowing along grid edges
 *   4. Radar sweep arc rotating from center
 *   5. Mouse proximity interaction (desktop only)
 *
 * Performance:
 *   - requestAnimationFrame loop with delta-time
 *   - Pauses when tab is hidden (Visibility API)
 *   - Spatial hash grid for mouse proximity lookups
 *   - Tiered complexity for desktop / mobile / minimal
 *   - Respects prefers-reduced-motion
 */

class SecurityGrid {

  // ─── Color Constants ───────────────────────────────────────────────

  static CYAN        = '#22D3EE';
  static TEAL        = '#06B6D4';
  static CYAN_RGB    = '34, 211, 238';
  static TEAL_RGB    = '6, 182, 212';

  // ─── Configuration per device tier ─────────────────────────────────

  static CONFIG = {
    desktop: {
      hexSize:          60,
      shieldCount:      22,
      packetCount:      13,
      radarEnabled:     true,
      mouseEnabled:     true,
      pulsingHexRatio:  0.08,
    },
    mobile: {
      hexSize:          40,
      shieldCount:      12,
      packetCount:      7,
      radarEnabled:     false,
      mouseEnabled:     false,
      pulsingHexRatio:  0.05,
    },
    minimal: {
      hexSize:          40,
      shieldCount:      5,
      packetCount:      0,
      radarEnabled:     false,
      mouseEnabled:     false,
      pulsingHexRatio:  0.03,
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════

  /**
   * @param {string} canvasId - The id attribute of the <canvas> element.
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`SecurityGrid: canvas "#${canvasId}" not found.`);
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

    // Device pixel ratio (capped at 2 for performance)
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Accessibility: reduced motion preference
    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Detect device tier and load matching config
    this.tier   = this._detectTier();
    this.config = SecurityGrid.CONFIG[this.tier];

    // Data structures (populated by _buildGrid / _populateEntities)
    this.hexCenters    = [];   // { x, y, col, row }
    this.hexEdges      = [];   // { x1, y1, x2, y2 }
    this.pulsingHexes  = [];   // { index, phase, speed }
    this.shieldNodes   = [];   // { x, y, phase, speed, rotation, rotationSpeed, size }
    this.dataPackets   = [];   // { edgeIndex, progress, speed, trail[], direction }
    this.radarAngle    = 0;

    // Spatial hash for mouse interaction
    this.spatialCellSize = 0;
    this.spatialGrid     = {};

    // Build everything and start
    this._setupCanvas();
    this._buildGrid();
    this._populateEntities();
    this._bindEvents();

    if (this.prefersReducedMotion) {
      this._drawStaticFrame();
    } else {
      this._startLoop();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SETUP HELPERS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Determine which complexity tier to use based on viewport width.
   * @returns {'desktop'|'mobile'|'minimal'}
   */
  _detectTier() {
    const w = window.innerWidth;
    if (w < 480)  return 'minimal';
    if (w < 768)  return 'mobile';
    return 'desktop';
  }

  /**
   * Size the canvas to fill its parent container, accounting for DPR.
   */
  _setupCanvas() {
    const parent = this.canvas.parentElement;
    const rect   = parent.getBoundingClientRect();

    this.width  = rect.width;
    this.height = rect.height;

    this.canvas.width  = this.width  * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width  = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Reset transform then apply DPR scaling so we draw in CSS-pixel coords
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════
  // HEXAGONAL GRID CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Compute all hex centers and edges for a flat-top honeycomb grid
   * covering the full canvas with some overflow padding.
   */
  _buildGrid() {
    const size = this.config.hexSize;

    // Flat-top hex geometry
    const hexW       = size * 2;
    const hexH       = Math.sqrt(3) * size;
    const colSpacing = hexW * 0.75;
    const rowSpacing = hexH;

    this.hexCenters = [];
    this.hexEdges   = [];
    const edgeSet   = new Set();

    // Extend beyond visible bounds so hexes aren't cut off
    const pad  = size * 2;
    const cols = Math.ceil((this.width  + pad * 2) / colSpacing) + 1;
    const rows = Math.ceil((this.height + pad * 2) / rowSpacing) + 1;
    const ox   = -pad;
    const oy   = -pad;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const cx = ox + col * colSpacing;
        const cy = oy + row * rowSpacing + (col % 2 === 1 ? hexH / 2 : 0);

        this.hexCenters.push({ x: cx, y: cy, col, row });

        // 6 vertices of a flat-top hex
        const verts = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i);
          verts.push({ x: cx + size * Math.cos(a), y: cy + size * Math.sin(a) });
        }

        // Register each edge (deduplicated by snapped endpoint key)
        for (let i = 0; i < 6; i++) {
          const a = verts[i];
          const b = verts[(i + 1) % 6];
          const key = this._edgeKey(a, b);
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            this.hexEdges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
          }
        }
      }
    }

    // Choose a subset of hexes whose outlines will gently pulse
    const pulseCount = Math.floor(this.hexCenters.length * this.config.pulsingHexRatio);
    this.pulsingHexes = this._randomSample(this.hexCenters.length, pulseCount).map(i => ({
      index: i,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
    }));

    // Build spatial hash for mouse proximity queries
    this._buildSpatialGrid();
  }

  /**
   * Create a canonical string key for an edge (order-independent)
   * so shared edges between adjacent hexes are stored only once.
   */
  _edgeKey(a, b) {
    const ax = Math.round(a.x);
    const ay = Math.round(a.y);
    const bx = Math.round(b.x);
    const by = Math.round(b.y);
    if (ax < bx || (ax === bx && ay < by)) return `${ax},${ay}-${bx},${by}`;
    return `${bx},${by}-${ax},${ay}`;
  }

  /**
   * Build a hash map of hex-center indices bucketed by spatial cell
   * for O(1) neighbourhood lookups during mouse interaction.
   */
  _buildSpatialGrid() {
    this.spatialCellSize = this.config.hexSize * 2.5;
    this.spatialGrid = {};
    this.hexCenters.forEach((hex, i) => {
      const key = this._spatialKey(hex.x, hex.y);
      if (!this.spatialGrid[key]) this.spatialGrid[key] = [];
      this.spatialGrid[key].push(i);
    });
  }

  /** Spatial hash key for a world-space coordinate. */
  _spatialKey(x, y) {
    const cs = this.spatialCellSize;
    return `${Math.floor(x / cs)},${Math.floor(y / cs)}`;
  }

  /**
   * Return all hex-center indices within a certain radius of (x, y),
   * using the spatial hash to avoid scanning every hex.
   */
  _getNearbyHexes(x, y, radius) {
    const cs = this.spatialCellSize;
    const cr = Math.ceil(radius / cs);
    const cx = Math.floor(x / cs);
    const cy = Math.floor(y / cs);
    const result = [];
    for (let dx = -cr; dx <= cr; dx++) {
      for (let dy = -cr; dy <= cr; dy++) {
        const bucket = this.spatialGrid[`${cx + dx},${cy + dy}`];
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) result.push(bucket[i]);
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ENTITY POPULATION (shields + data packets)
  // ═══════════════════════════════════════════════════════════════════

  _populateEntities() {
    this._createShieldNodes();
    this._createDataPackets();
  }

  /**
   * Place shield/badge nodes at randomly chosen hex centres
   * that fall within the visible canvas area.
   */
  _createShieldNodes() {
    this.shieldNodes = [];
    const count  = this.config.shieldCount;
    const margin = this.config.hexSize;

    // Collect indices of hex centres that are on-screen
    const visible = [];
    for (let i = 0; i < this.hexCenters.length; i++) {
      const h = this.hexCenters[i];
      if (h.x >= -margin && h.x <= this.width + margin &&
          h.y >= -margin && h.y <= this.height + margin) {
        visible.push(i);
      }
    }

    const chosen = this._randomSample(visible.length, Math.min(count, visible.length));
    for (const idx of chosen) {
      const hex = this.hexCenters[visible[idx]];
      this.shieldNodes.push({
        x:             hex.x,
        y:             hex.y,
        phase:         Math.random() * Math.PI * 2,
        speed:         0.4 + Math.random() * 0.6,
        rotationSpeed: (Math.random() - 0.5) * 0.15,   // some CW, some CCW
        rotation:      Math.random() * Math.PI * 2,
        size:          10 + Math.random() * 4,
      });
    }
  }

  /**
   * Create data-flow packets that travel along hex-grid edges.
   */
  _createDataPackets() {
    this.dataPackets = [];
    for (let i = 0; i < this.config.packetCount; i++) {
      this.dataPackets.push(this._newDataPacket());
    }
  }

  /** Spawn a single data packet on a random edge. */
  _newDataPacket() {
    return {
      edgeIndex:   Math.floor(Math.random() * this.hexEdges.length),
      progress:    Math.random(),
      speed:       0.15 + Math.random() * 0.25,
      trail:       [],
      trailLength: 6 + Math.floor(Math.random() * 6),
      direction:   Math.random() < 0.5 ? 1 : -1,
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
      this._resizeTimer = setTimeout(() => this._onResize(), 200);
    };
    window.addEventListener('resize', this._boundResize);

    // Visibility API: pause when hidden, resume when visible
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

    // Mouse interaction (desktop only)
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

    // Listen for changes to prefers-reduced-motion
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

  /**
   * Full rebuild on resize: re-detect tier, re-size canvas, rebuild geometry.
   */
  _onResize() {
    this.tier   = this._detectTier();
    this.config = SecurityGrid.CONFIG[this.tier];
    this.dpr    = Math.min(window.devicePixelRatio || 1, 2);

    this._setupCanvas();
    this._buildGrid();
    this._populateEntities();

    if (this.prefersReducedMotion) {
      this._drawStaticFrame();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════

  _startLoop() {
    if (this.animationId) return;           // already running
    this.lastTime = 0;

    const tick = (timestamp) => {
      if (!this.isVisible) return;

      // Delta time in seconds, capped at 100 ms to avoid huge jumps
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
  // UPDATE (per-frame state changes)
  // ═══════════════════════════════════════════════════════════════════

  _update(dt) {
    // --- Shield nodes: advance pulse phase and rotation ---
    for (const s of this.shieldNodes) {
      s.phase    += s.speed * dt;
      s.rotation += s.rotationSpeed * dt;
    }

    // --- Pulsing hex highlights ---
    for (const ph of this.pulsingHexes) {
      ph.phase += ph.speed * dt;
    }

    // --- Data packets: move along edges ---
    for (const pkt of this.dataPackets) {
      pkt.progress += pkt.speed * dt * pkt.direction;

      // Record position into trail buffer
      const edge = this.hexEdges[pkt.edgeIndex];
      if (edge) {
        const t  = Math.max(0, Math.min(1, pkt.progress));
        const px = edge.x1 + (edge.x2 - edge.x1) * t;
        const py = edge.y1 + (edge.y2 - edge.y1) * t;
        pkt.trail.push({ x: px, y: py });
        if (pkt.trail.length > pkt.trailLength) pkt.trail.shift();
      }

      // Redirect when an endpoint is reached
      if (pkt.progress >= 1 || pkt.progress <= 0) {
        this._redirectPacket(pkt);
      }
    }

    // --- Radar sweep angle (15 s per revolution) ---
    if (this.config.radarEnabled) {
      this.radarAngle += ((Math.PI * 2) / 15) * dt;
      if (this.radarAngle > Math.PI * 2) this.radarAngle -= Math.PI * 2;
    }
  }

  /**
   * Redirect a data packet onto a connected edge when it reaches
   * one end of its current edge.
   */
  _redirectPacket(pkt) {
    const edge = this.hexEdges[pkt.edgeIndex];
    if (!edge) {
      pkt.edgeIndex = Math.floor(Math.random() * this.hexEdges.length);
      pkt.progress  = 0;
      pkt.direction = 1;
      return;
    }

    // Which endpoint was reached?
    const endX = pkt.progress >= 1 ? edge.x2 : edge.x1;
    const endY = pkt.progress >= 1 ? edge.y2 : edge.y1;

    // Find edges sharing that endpoint (within rounding tolerance)
    const tol = 2;
    const candidates = [];
    for (let i = 0; i < this.hexEdges.length; i++) {
      if (i === pkt.edgeIndex) continue;
      const e = this.hexEdges[i];
      const matchA = Math.abs(e.x1 - endX) < tol && Math.abs(e.y1 - endY) < tol;
      const matchB = Math.abs(e.x2 - endX) < tol && Math.abs(e.y2 - endY) < tol;
      if (matchA || matchB) candidates.push({ index: i, startsAtA: matchA });
    }

    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      pkt.edgeIndex = pick.index;
      // Start from whichever end of the new edge is the shared point
      if (pick.startsAtA) {
        pkt.progress  = 0;
        pkt.direction = 1;
      } else {
        pkt.progress  = 1;
        pkt.direction = -1;
      }
    } else {
      // No neighbour found (shouldn't happen) -- respawn randomly
      pkt.edgeIndex = Math.floor(Math.random() * this.hexEdges.length);
      pkt.progress  = 0;
      pkt.direction = 1;
      pkt.trail     = [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // DRAW (composites all layers each frame)
  // ═══════════════════════════════════════════════════════════════════

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Layer 1 - hex grid
    this._drawHexGrid(ctx);

    // Layer 4 - radar sweep (behind nodes for depth)
    if (this.config.radarEnabled) {
      this._drawRadarSweep(ctx);
    }

    // Layer 5 - mouse interaction highlights
    if (this.config.mouseEnabled && this.mouse.active) {
      this._drawMouseInteraction(ctx);
    }

    // Layer 3 - data packets
    this._drawDataPackets(ctx);

    // Layer 2 - shield nodes (on top)
    this._drawShieldNodes(ctx);
  }

  /**
   * Draw a non-animated static frame for prefers-reduced-motion users.
   */
  _drawStaticFrame() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Static hex grid
    this._drawHexGrid(ctx, true);

    // Static shields at default opacity
    for (const s of this.shieldNodes) {
      this._drawShieldShape(ctx, s.x, s.y, s.size, 0, 0.12);
    }
  }

  // ─── Layer 1: Hexagonal Grid ───────────────────────────────────────

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} isStatic - true when drawing the reduced-motion frame
   */
  _drawHexGrid(ctx, isStatic = false) {
    const rgb = SecurityGrid.CYAN_RGB;

    // Batch-draw all edges in a single path for speed
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${rgb}, 0.04)`;
    ctx.lineWidth   = 0.5;
    for (const e of this.hexEdges) {
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
    }
    ctx.stroke();

    // Pulsing highlights on selected hexes
    if (!isStatic) {
      const size = this.config.hexSize;
      for (const ph of this.pulsingHexes) {
        const hex   = this.hexCenters[ph.index];
        const pulse = 0.03 + Math.sin(ph.phase) * 0.04;
        if (pulse > 0.02) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${rgb}, ${pulse.toFixed(3)})`;
          ctx.lineWidth   = 1;
          this._traceHexPath(ctx, hex.x, hex.y, size);
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Trace the outline of a single flat-top hexagon as a sub-path.
   */
  _traceHexPath(ctx, cx, cy, size) {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i);
      const x = cx + size * Math.cos(a);
      const y = cy + size * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else         ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // ─── Layer 2: Shield Nodes ─────────────────────────────────────────

  _drawShieldNodes(ctx) {
    for (const s of this.shieldNodes) {
      // Pulse opacity between 0.08 and 0.25
      const norm    = Math.sin(s.phase) * 0.5 + 0.5;   // 0..1
      let   opacity = 0.08 + norm * 0.17;

      // Mouse proximity glow boost
      if (this.config.mouseEnabled && this.mouse.active) {
        const d = this._dist(s.x, s.y, this.mouse.x, this.mouse.y);
        if (d < 150) opacity = Math.min(opacity + (1 - d / 150) * 0.35, 0.65);
      }

      this._drawShieldShape(ctx, s.x, s.y, s.size, s.rotation, opacity);
    }
  }

  /**
   * Draw a single shield/badge outline.
   * The shape is a pointed-bottom badge (see reference in header).
   */
  _drawShieldShape(ctx, x, y, size, rotation, opacity) {
    const rgb   = SecurityGrid.CYAN_RGB;
    const scale = size / 12;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // Shield path
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, -3);
    ctx.lineTo(5,  2);
    ctx.lineTo(0,  6);
    ctx.lineTo(-5, 2);
    ctx.lineTo(-5, -3);
    ctx.closePath();

    // Stroke
    ctx.strokeStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
    ctx.lineWidth   = 1.5 / scale;
    ctx.stroke();

    // Very subtle interior fill
    ctx.fillStyle = `rgba(${rgb}, ${(opacity * 0.15).toFixed(4)})`;
    ctx.fill();

    // Additional bloom when bright
    if (opacity > 0.2) {
      ctx.shadowColor = `rgba(${rgb}, ${(opacity * 0.4).toFixed(3)})`;
      ctx.shadowBlur  = 8 / scale;
      ctx.strokeStyle = `rgba(${rgb}, ${(opacity * 0.5).toFixed(3)})`;
      ctx.lineWidth   = 0.8 / scale;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // ─── Layer 3: Data Packets ─────────────────────────────────────────

  _drawDataPackets(ctx) {
    const rgb = SecurityGrid.CYAN_RGB;

    for (const pkt of this.dataPackets) {
      const edge = this.hexEdges[pkt.edgeIndex];
      if (!edge) continue;

      const t  = Math.max(0, Math.min(1, pkt.progress));
      const px = edge.x1 + (edge.x2 - edge.x1) * t;
      const py = edge.y1 + (edge.y2 - edge.y1) * t;

      // Luminous trail
      if (pkt.trail.length > 1) {
        for (let i = 0; i < pkt.trail.length - 1; i++) {
          const frac = i / pkt.trail.length;         // 0 = oldest, ~1 = newest
          const trailAlpha = frac * 0.3;
          const trailSize  = 0.6 + frac * 0.8;
          ctx.beginPath();
          ctx.arc(pkt.trail[i].x, pkt.trail[i].y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${trailAlpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      // Main dot with glow
      ctx.save();
      ctx.shadowColor = `rgba(${rgb}, 0.6)`;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, 0.5)`;
      ctx.fill();

      // Brighter inner core
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, 0.8)`;
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── Layer 4: Radar Sweep ──────────────────────────────────────────

  _drawRadarSweep(ctx) {
    const cx     = this.width  / 2;
    const cy     = this.height / 2;
    const radius = Math.max(this.width, this.height) * 0.6;
    const arc    = Math.PI / 4;       // 45-degree cone
    const rgb    = SecurityGrid.CYAN_RGB;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.radarAngle);

    // Render the cone as a fan of thin slices with fading opacity
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const frac  = i / steps;
      const a0    = -arc * frac;
      const a1    = -arc * (frac + 1 / steps);
      const alpha = 0.06 * (1 - frac);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, a0, a1, true);
      ctx.closePath();
      ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(4)})`;
      ctx.fill();
    }

    // Leading edge line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.strokeStyle = `rgba(${rgb}, 0.08)`;
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.restore();

    // Tiny center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb}, 0.1)`;
    ctx.fill();
  }

  // ─── Layer 5: Mouse Interaction ────────────────────────────────────

  _drawMouseInteraction(ctx) {
    const mx  = this.mouse.x;
    const my  = this.mouse.y;
    const R   = 160;                  // interaction radius
    const rgb = SecurityGrid.CYAN_RGB;
    const size = this.config.hexSize;

    // Highlight nearby hex cells
    const nearby = this._getNearbyHexes(mx, my, R);
    for (const idx of nearby) {
      const hex  = this.hexCenters[idx];
      const dist = this._dist(hex.x, hex.y, mx, my);
      if (dist > R) continue;

      const intensity = 1 - dist / R;
      const ease      = intensity * intensity;       // quadratic falloff

      // Bright hex outline
      ctx.beginPath();
      this._traceHexPath(ctx, hex.x, hex.y, size);
      ctx.strokeStyle = `rgba(${rgb}, ${(ease * 0.15).toFixed(4)})`;
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Subtle fill
      ctx.fillStyle = `rgba(${rgb}, ${(ease * 0.03).toFixed(4)})`;
      ctx.fill();
    }

    // Connection lines from cursor to nearby shield nodes
    for (const s of this.shieldNodes) {
      const d = this._dist(s.x, s.y, mx, my);
      if (d < 200) {
        const a = (1 - d / 200) * 0.08;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = `rgba(${rgb}, ${a.toFixed(4)})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
      }
    }

    // Soft radial glow under cursor
    const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
    glow.addColorStop(0, `rgba(${rgb}, 0.04)`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.beginPath();
    ctx.arc(mx, my, 80, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════

  /** Euclidean distance between two points. */
  _dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Return `count` unique random indices chosen from [0, total).
   * Uses a partial Fisher-Yates shuffle.
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
    this.hexCenters   = [];
    this.hexEdges     = [];
    this.shieldNodes  = [];
    this.dataPackets  = [];
    this.spatialGrid  = {};
  }
}

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  new SecurityGrid('particleCanvas');
});
