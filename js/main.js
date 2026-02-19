/**
 * Main Application Logic
 * Navbar, Mobile Menu, Smooth Scroll, Contact Form
 */

// Navbar Scroll Effect
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

// Mobile Menu Toggle
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

// Smooth Scroll for Anchor Links
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

// Contact Form Handling
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;

    // Show success state
    btn.innerHTML = `
      <span>¡Mensaje Enviado!</span>
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

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initContactForm();
});
