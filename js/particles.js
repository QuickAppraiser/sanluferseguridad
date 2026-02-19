/**
 * Particle Network Animation
 * Canvas-based interactive particle system with connecting lines
 */
class ParticleNetwork {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.animationId = null;

    this.config = {
      particleColor: options.particleColor || 'rgba(34, 211, 238, 0.6)',
      lineColor: options.lineColor || 'rgba(34, 211, 238, 0.12)',
      particleRadius: options.particleRadius || 1.5,
      lineMaxDistance: options.lineMaxDistance || 120,
      speed: options.speed || 0.4,
      interactive: options.interactive !== false,
    };

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.isSmallMobile = window.matchMedia('(max-width: 480px)').matches;

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();

    if (this.config.interactive && !this.isMobile) {
      this.canvas.addEventListener('mousemove', (e) => this.handleMouse(e));
      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }

    this._resizeHandler = this.debounce(() => {
      this.isMobile = window.matchMedia('(max-width: 768px)').matches;
      this.isSmallMobile = window.matchMedia('(max-width: 480px)').matches;
      this.resize();
      this.createParticles();
    }, 250);
    window.addEventListener('resize', this._resizeHandler);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(this.animationId);
      } else {
        this.animate();
      }
    });

    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  createParticles() {
    const area = this.width * this.height;
    const ppm = this.isSmallMobile ? 0 : this.isMobile ? 40 : 80;
    let count = Math.floor((area / 1000000) * ppm);
    count = Math.min(count, 250);
    count = Math.max(count, 0);

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        radius: this.config.particleRadius * (0.5 + Math.random() * 0.5),
      });
    }

    // Build spatial grid
    this.gridCellSize = this.config.lineMaxDistance;
    this.gridCols = Math.ceil(this.width / this.gridCellSize);
    this.gridRows = Math.ceil(this.height / this.gridCellSize);
  }

  handleMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  animate() {
    if (document.hidden) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.particles.length === 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
      return;
    }

    // Build spatial grid
    const grid = new Array(this.gridCols * this.gridRows);
    for (let i = 0; i < grid.length; i++) grid[i] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Boundary wrap
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse repulsion
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }
      }

      // Add to grid
      const col = Math.floor(p.x / this.gridCellSize);
      const row = Math.floor(p.y / this.gridCellSize);
      if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
        grid[row * this.gridCols + col].push(i);
      }
    }

    // Draw connections using spatial grid
    this.ctx.strokeStyle = this.config.lineColor;
    this.ctx.lineWidth = 0.5;
    const maxDist = this.config.lineMaxDistance;
    const maxDistSq = maxDist * maxDist;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const col = Math.floor(p.x / this.gridCellSize);
      const row = Math.floor(p.y / this.gridCellSize);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr < 0 || nr >= this.gridRows || nc < 0 || nc >= this.gridCols) continue;

          const cell = grid[nr * this.gridCols + nc];
          for (let k = 0; k < cell.length; k++) {
            const j = cell[k];
            if (j <= i) continue;

            const q = this.particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              const alpha = 1 - Math.sqrt(distSq) / maxDist;
              this.ctx.globalAlpha = alpha * 0.15;
              this.ctx.beginPath();
              this.ctx.moveTo(p.x, p.y);
              this.ctx.lineTo(q.x, q.y);
              this.ctx.stroke();
            }
          }
        }
      }
    }

    // Draw particles
    this.ctx.globalAlpha = 1;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.config.particleColor;
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ParticleNetwork('particleCanvas');
});
