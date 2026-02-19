/**
 * Main Application Logic
 * Navbar, Mobile Menu, Smooth Scroll, Contact Form,
 * Language Toggle, Theme Toggle, Preloader, Back to Top
 */

// ==========================================
// PRELOADER
// ==========================================
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const dismiss = () => {
    preloader.classList.add('hidden');
    setTimeout(() => {
      preloader.remove();
    }, 600);
  };

  // Dismiss after load + small delay
  if (document.readyState === 'complete') {
    setTimeout(dismiss, 800);
  } else {
    window.addEventListener('load', () => {
      setTimeout(dismiss, 800);
    });
  }
}

// Run preloader immediately (before DOMContentLoaded)
initPreloader();

// ==========================================
// LANGUAGE TOGGLE
// ==========================================
function initLanguageToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;

  const label = btn.querySelector('.toggle-btn__label');
  const html = document.documentElement;

  // Restore saved language
  const saved = localStorage.getItem('sanlufer-lang');
  if (saved && (saved === 'en' || saved === 'es')) {
    html.setAttribute('data-lang', saved);
    html.setAttribute('lang', saved);
    if (label) label.textContent = saved === 'es' ? 'EN' : 'ES';
  }

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-lang') || 'es';
    const next = current === 'es' ? 'en' : 'es';

    html.setAttribute('data-lang', next);
    html.setAttribute('lang', next);
    localStorage.setItem('sanlufer-lang', next);

    // Update button label to show the OTHER language option
    if (label) label.textContent = next === 'es' ? 'EN' : 'ES';
  });
}

// ==========================================
// THEME TOGGLE
// ==========================================
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const html = document.documentElement;

  // Restore saved theme or detect system preference
  const saved = localStorage.getItem('sanlufer-theme');
  if (saved && (saved === 'dark' || saved === 'light')) {
    html.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    html.setAttribute('data-theme', 'light');
  }

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', next);
    localStorage.setItem('sanlufer-theme', next);

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])') ||
                      document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', next === 'dark' ? '#0B1120' : '#F8FAFC');
    }
  });
}

// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset;

        navbar.classList.toggle('navbar--scrolled', currentScroll > 80);

        // Hide on scroll down (after 300px), show on scroll up
        if (currentScroll > lastScroll && currentScroll > 300) {
          navbar.classList.add('navbar--hidden');
        } else {
          navbar.classList.remove('navbar--hidden');
        }

        lastScroll = currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ==========================================
// MOBILE MENU TOGGLE
// ==========================================
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  const links = menu.querySelectorAll('.navbar__link');

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('navbar__nav--open');
    toggle.classList.toggle('navbar__toggle--active');
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('no-scroll', isOpen);
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('navbar__nav--open');
      toggle.classList.remove('navbar__toggle--active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    });
  });
}

// ==========================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ==========================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

// ==========================================
// CONTACT FORM HANDLING
// ==========================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;

    // Show success state
    btn.innerHTML = `
      <span class="lang-es">¡Mensaje Enviado!</span>
      <span class="lang-en">Message Sent!</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    `;
    btn.classList.add('btn--success');
    btn.disabled = true;

    // Reset after 3 seconds
    setTimeout(() => {
      form.reset();
      btn.innerHTML = originalHTML;
      btn.classList.remove('btn--success');
      btn.disabled = false;
    }, 3000);
  });
}

// ==========================================
// BACK TO TOP BUTTON
// ==========================================
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.pageYOffset > 500);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

// ==========================================
// INITIALIZE EVERYTHING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initLanguageToggle();
  initThemeToggle();
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initContactForm();
  initBackToTop();
});
