/**
 * Scroll Reveal Animations, Animated Counters, Active Nav Tracking
 */

// Scroll Reveal System
function initScrollReveal() {
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || 0, 10);
          setTimeout(() => {
            el.classList.add('revealed');
          }, delay);
          observer.unobserve(el);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

// Animated Counter System
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

function animateCounter(element) {
  const target = parseInt(element.dataset.target, 10);
  const suffix = element.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);

    element.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Active Navigation Link Tracking
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar__link');
  if (!sections.length || !navLinks.length) return;

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${id}`);
          });
        }
      });
    },
    {
      rootMargin: '-20% 0px -80% 0px',
    }
  );

  sections.forEach((section) => navObserver.observe(section));
}

// Initialize all animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCounters();
  initActiveNav();
});
