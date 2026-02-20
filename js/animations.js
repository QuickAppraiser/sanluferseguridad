/**
 * Scroll Reveal Animations, Animated Counters, Active Nav Tracking,
 * Typing Text Effect
 */

// ==========================================
// SCROLL REVEAL SYSTEM
// ==========================================
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

// ==========================================
// ANIMATED COUNTER SYSTEM
// ==========================================
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

// ==========================================
// ACTIVE NAVIGATION LINK TRACKING
// ==========================================
function initActiveNav() {
  const navLinks = document.querySelectorAll('.navbar__link');
  if (!navLinks.length) return;

  // Only track sections that have a corresponding nav link
  const navIds = new Set();
  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href && href.startsWith('#')) navIds.add(href.slice(1));
  });

  const sections = [];
  navIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) sections.push(el);
  });

  if (!sections.length) return;

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

  sections.forEach(function(section) { navObserver.observe(section); });
}

// ==========================================
// TYPING TEXT EFFECT
// ==========================================
function initTypingEffect() {
  const el = document.getElementById('typingText');
  if (!el) return;

  const lang = document.documentElement.getAttribute('data-lang') || 'es';

  const wordsES = [
    'para su Empresa',
    'con Videovigilancia IA',
    'en toda Colombia',
    'en Bogotá y Medellín',
    'en Cali y Armenia',
    'en Barranquilla y Cartagena',
    'Automatización Total',
    'Cableado Certificado',
    '24/7 Soporte Técnico',
    'en Bucaramanga y Pasto',
    'en Pereira y el Eje Cafetero',
  ];

  const wordsEN = [
    'for your Business',
    'with AI Surveillance',
    'across all Colombia',
    'in Bogotá & Medellín',
    'in Cali & Armenia',
    'in Barranquilla & Cartagena',
    'Total Automation',
    'Certified Cabling',
    '24/7 Tech Support',
    'in Bucaramanga & Pasto',
    'in Pereira & the Coffee Region',
  ];

  let words = lang === 'en' ? wordsEN : wordsES;
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeout = null;

  // Update words when language changes
  const langObserver = new MutationObserver(() => {
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';
    words = currentLang === 'en' ? wordsEN : wordsES;
    // Reset typing
    if (timeout) clearTimeout(timeout);
    wordIndex = 0;
    charIndex = 0;
    isDeleting = false;
    el.textContent = '';
    type();
  });

  langObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-lang'],
  });

  function type() {
    const currentWord = words[wordIndex];

    if (isDeleting) {
      el.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentWord.length) {
      delay = 2000; // Pause at end
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 400; // Pause before next word
    }

    timeout = setTimeout(type, delay);
  }

  // Small delay before starting
  timeout = setTimeout(type, 1000);
}

// ==========================================
// INITIALIZE ALL ANIMATIONS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCounters();
  initActiveNav();
  initTypingEffect();
});
