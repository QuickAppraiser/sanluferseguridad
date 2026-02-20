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

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('navbar--scrolled', window.pageYOffset > 80);
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
// EMERGENCY TOP BAR
// ==========================================
function initEmergencyBar() {
  const bar = document.getElementById('emergencyBar');
  const closeBtn = document.getElementById('emergencyBarClose');
  if (!bar) return;

  // Check if previously dismissed
  const dismissed = sessionStorage.getItem('sanlufer-emergency-dismissed');
  if (dismissed) {
    bar.classList.add('hidden');
    return;
  }

  document.body.classList.add('has-emergency-bar');

  closeBtn.addEventListener('click', () => {
    bar.classList.add('hidden');
    document.body.classList.remove('has-emergency-bar');
    sessionStorage.setItem('sanlufer-emergency-dismissed', '1');
  });
}

// ==========================================
// URGENCY CRIME COUNTER
// ==========================================
function initUrgencyCounter() {
  // Based on Colombian crime statistics: ~590,000 hurtos/year ≈ 67.35/hour ≈ 1.12/minute
  const counter = document.getElementById('crimeCounter');
  const counterEN = document.getElementById('crimeCounterEN');
  if (!counter) return;

  const rate = 1.12; // per minute
  let count = Math.floor(Math.random() * 3) + 1; // Start with small random number

  function updateCounters(value) {
    const formatted = value.toLocaleString('es-CO');
    if (counter) counter.textContent = formatted;
    if (counterEN) counterEN.textContent = formatted;
  }

  updateCounters(count);

  // Increment every ~54 seconds (1 per minute on average, with variation)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const interval = setInterval(() => {
          count++;
          updateCounters(count);
        }, Math.floor(45000 + Math.random() * 20000)); // 45-65s interval

        // Store interval to clear if needed
        entry.target._crimeInterval = interval;
      } else {
        if (entry.target._crimeInterval) {
          clearInterval(entry.target._crimeInterval);
        }
      }
    });
  }, { threshold: 0.3 });

  const section = counter.closest('.urgency-counter');
  if (section) observer.observe(section);
}

// ==========================================
// SECURITY ASSESSMENT QUIZ
// ==========================================
function initSecurityQuiz() {
  const quiz = document.getElementById('securityQuiz');
  if (!quiz) return;

  const steps = quiz.querySelectorAll('.quiz__step');
  const progressBar = document.getElementById('quizProgress');
  const progressText = document.getElementById('quizProgressText');
  const result = document.getElementById('quizResult');
  const restartBtn = document.getElementById('quizRestart');
  const totalSteps = steps.length;
  let currentStep = 1;
  let totalScore = 0;

  // Handle option clicks
  quiz.addEventListener('click', (e) => {
    const option = e.target.closest('.quiz__option');
    if (!option) return;

    const score = parseInt(option.dataset.score, 10) || 0;
    totalScore += score;

    // Hide current step
    const activeStep = quiz.querySelector('.quiz__step--active');
    if (activeStep) activeStep.classList.remove('quiz__step--active');

    currentStep++;

    if (currentStep <= totalSteps) {
      // Show next step
      const nextStep = quiz.querySelector(`[data-step="${currentStep}"]`);
      if (nextStep) nextStep.classList.add('quiz__step--active');

      // Update progress
      const pct = (currentStep / totalSteps) * 100;
      progressBar.style.width = pct + '%';
      progressText.textContent = currentStep + ' / ' + totalSteps;
    } else {
      // Show results
      showQuizResult();
    }
  });

  function showQuizResult() {
    // Hide progress
    quiz.querySelector('.quiz__progress').style.display = 'none';

    // Calculate score (0-100)
    // Max possible: 5 + 8 + 3 + 6 = 22, Min: 0 + 0 + 1 + 0 = 1
    const maxScore = 22;
    const normalizedScore = Math.min(Math.round((totalScore / maxScore) * 100), 100);

    result.classList.add('active');

    // Animate gauge
    const gaugeFill = quiz.querySelector('.quiz__gauge-fill');
    const totalLength = 326.7;
    const dashOffset = totalLength - (totalLength * normalizedScore / 100);
    setTimeout(() => {
      gaugeFill.style.strokeDashoffset = dashOffset;
    }, 100);

    // Animate number
    const scoreNum = document.getElementById('quizScoreNumber');
    animateScoreNumber(scoreNum, normalizedScore);

    // Set result text
    const lang = document.documentElement.getAttribute('data-lang') || 'es';
    const titleEl = document.getElementById('quizResultTitle');
    const descEl = document.getElementById('quizResultDesc');

    if (normalizedScore <= 25) {
      titleEl.textContent = lang === 'es' ? 'Nivel Crítico — Vulnerable' : 'Critical Level — Vulnerable';
      titleEl.style.color = '#EF4444';
      descEl.textContent = lang === 'es'
        ? 'Su propiedad tiene un nivel de riesgo muy alto. Necesita un sistema de seguridad profesional urgentemente. Le recomendamos una evaluación gratuita inmediata.'
        : 'Your property has a very high risk level. You urgently need a professional security system. We recommend an immediate free assessment.';
    } else if (normalizedScore <= 50) {
      titleEl.textContent = lang === 'es' ? 'Nivel Bajo — En Riesgo' : 'Low Level — At Risk';
      titleEl.style.color = '#F97316';
      descEl.textContent = lang === 'es'
        ? 'Su seguridad actual es insuficiente para las amenazas modernas. Hay brechas importantes que un sistema profesional puede cubrir. Solicite una evaluación gratuita.'
        : 'Your current security is insufficient for modern threats. There are significant gaps that a professional system can cover. Request a free assessment.';
    } else if (normalizedScore <= 75) {
      titleEl.textContent = lang === 'es' ? 'Nivel Medio — Mejorable' : 'Medium Level — Improvable';
      titleEl.style.color = '#FBBF24';
      descEl.textContent = lang === 'es'
        ? 'Tiene una base de seguridad, pero hay oportunidades de mejora con tecnología más avanzada como IA, control de acceso biométrico y monitoreo remoto.'
        : 'You have a security foundation, but there are improvement opportunities with more advanced technology like AI, biometric access control and remote monitoring.';
    } else {
      titleEl.textContent = lang === 'es' ? 'Nivel Alto — Bien Protegido' : 'High Level — Well Protected';
      titleEl.style.color = '#22D3EE';
      descEl.textContent = lang === 'es'
        ? 'Su propiedad tiene un buen nivel de seguridad. Aún así, podemos optimizar su sistema con las últimas tecnologías en IA y automatización. Consulte nuestras soluciones premium.'
        : 'Your property has a good security level. Even so, we can optimize your system with the latest AI and automation technologies. Check out our premium solutions.';
    }
  }

  function animateScoreNumber(el, target) {
    const duration = 1500;
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // Restart
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      totalScore = 0;
      currentStep = 1;
      result.classList.remove('active');

      // Reset gauge
      const gaugeFill = quiz.querySelector('.quiz__gauge-fill');
      gaugeFill.style.strokeDashoffset = '326.7';

      // Show progress and first step
      quiz.querySelector('.quiz__progress').style.display = '';
      progressBar.style.width = '25%';
      progressText.textContent = '1 / 4';

      steps.forEach((s) => s.classList.remove('quiz__step--active'));
      steps[0].classList.add('quiz__step--active');
    });
  }
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
  initEmergencyBar();
  initUrgencyCounter();
  initSecurityQuiz();
});
