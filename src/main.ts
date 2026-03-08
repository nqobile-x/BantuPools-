/**
 * Bantu Pools — Main TypeScript
 * Handles: scroll animations, nav, service tabs, stat counters, security & privacy.
 * All event listeners attached via addEventListener — zero inline handlers.
 */

'use strict';

/* ================================================
   1. TYPES & INTERFACES & GLOBALS
   ================================================ */

/** Global GSAP instance loaded via CDN/vendor script */
declare const gsap: any;

/** Shape of a form validation field. */
interface FormFieldConfig {
  readonly id: string;
  readonly validator: RegExp;
  readonly msg: string;
}

/** Sanitised form data ready for submission. */
interface SanitisedFormData {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

/** Validator patterns — frozen to prevent prototype pollution. */
interface ValidatorPatterns {
  readonly email: RegExp;
  readonly phone: RegExp;
  readonly name: RegExp;
  readonly message: RegExp;
}

/* ================================================
   2. SECURITY UTILITIES
   ================================================ */

/**
 * Sanitise user-provided strings to prevent XSS.
 * Creates a text node (auto-escapes HTML entities) and reads innerHTML.
 */
function sanitise(str: string): string {
  const div: HTMLDivElement = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/** Input validation patterns — frozen to prevent tampering. */
const VALIDATORS: ValidatorPatterns = Object.freeze({
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-+()]{7,20}$/,
  name: /^[a-zA-Z\s\-']{2,80}$/,
  message: /^.{10,2000}$/s,
});

/** Rate limiter to prevent form submission spam. */
const RateLimiter = (() => {
  let lastSubmission: number = 0;
  const MIN_INTERVAL_MS: number = 3000; // 3 seconds between submissions

  return {
    canSubmit(): boolean {
      const now: number = Date.now();
      if (now - lastSubmission < MIN_INTERVAL_MS) {
        return false;
      }
      lastSubmission = now;
      return true;
    },
  };
})();

/* ================================================
   3. SCROLL-TRIGGERED ANIMATIONS (IntersectionObserver)
   ================================================ */

function initScrollAnimations(): void {
  const elements: NodeListOf<Element> = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  const observer: IntersectionObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el: Element) => observer.observe(el));
}

/* ================================================
   4. NAVIGATION
   ================================================ */

function initNav(): void {
  const nav: HTMLElement | null = document.getElementById('mainNav');
  const toggle: HTMLElement | null = document.getElementById('navToggle');
  const links: HTMLElement | null = document.getElementById('navLinks');

  if (!nav || !toggle || !links) return;

  /* Scroll shadow */
  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    },
    { passive: true }
  );

  /* Mobile hamburger toggle */
  toggle.addEventListener('click', () => {
    const isOpen: boolean = links.classList.toggle('active');
    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Close mobile menu on link click */
  links.querySelectorAll('.nav__link').forEach((link: Element) => {
    link.addEventListener('click', () => {
      links.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* Close on outside click */
  document.addEventListener('click', (e: MouseEvent) => {
    if (!nav.contains(e.target as Node) && links.classList.contains('active')) {
      links.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ================================================
   5. STAT COUNTER ANIMATION
   ================================================ */

function initStatCounters(): void {
  const stats: NodeListOf<HTMLElement> = document.querySelectorAll('.stat__value[data-count]');
  if (!stats.length) return;

  const observer: IntersectionObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((stat: HTMLElement) => observer.observe(stat));
}

/**
 * Animate a single counter from 0 to its data-count value.
 * Uses ease-out cubic for a natural deceleration feel.
 */
function animateCounter(el: HTMLElement): void {
  const target: number = parseInt(el.dataset.count ?? '0', 10);
  const suffix: string = el.dataset.suffix ?? '';
  const originalText: string = el.textContent ?? '';
  const textSuffix: string = originalText.replace(/[\d,]+/, '').replace(suffix, '');
  const duration: number = 2000;
  const startTime: number = performance.now();

  function update(currentTime: number): void {
    const elapsed: number = currentTime - startTime;
    const progress: number = Math.min(elapsed / duration, 1);
    const eased: number = 1 - Math.pow(1 - progress, 3);
    const current: number = Math.round(eased * target);

    el.textContent = current.toLocaleString() + suffix + textSuffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ================================================
   6. SERVICE TABS (services.html)
   ================================================ */

function initServiceTabs(): void {
  const tabs: NodeListOf<HTMLElement> = document.querySelectorAll('.service-tab');
  const panels: NodeListOf<HTMLElement> = document.querySelectorAll('.service-detail');

  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab: HTMLElement) => {
    tab.addEventListener('click', () => {
      const targetId: string | undefined = tab.dataset.tab;

      /* Update active tab */
      tabs.forEach((t: HTMLElement) => t.classList.remove('service-tab--active'));
      tab.classList.add('service-tab--active');

      /* Show target panel */
      panels.forEach((panel: HTMLElement) => {
        panel.classList.remove('active');
        if (panel.id === targetId) {
          panel.classList.add('active');
          /* Re-trigger animations for newly visible content */
          panel.querySelectorAll('.animate-on-scroll').forEach((el: Element) => {
            el.classList.remove('visible');
            void (el as HTMLElement).offsetWidth; // force reflow
            el.classList.add('visible');
          });
        }
      });
    });
  });

  /* Handle hash-based deep linking (e.g. services.html#repairs) */
  const hash: string = window.location.hash.replace('#', '');
  if (hash) {
    const sanitisedHash: string = sanitise(hash);
    const targetTab: HTMLElement | null = document.querySelector(
      `.service-tab[data-tab="${sanitisedHash}"]`
    );
    if (targetTab) {
      targetTab.click();
      /* Scroll to services content area after a brief delay */
      setTimeout(() => {
        const contentSection: HTMLElement | null = document.getElementById('services-content');
        if (contentSection) {
          contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }
}

/* ================================================
   7. SMOOTH SCROLL FOR ANCHOR LINKS
   ================================================ */

function initSmoothScroll(): void {
  document.querySelectorAll('a[href^="#"]').forEach((anchor: Element) => {
    anchor.addEventListener('click', (e: Event) => {
      const targetId: string | null = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target: HTMLElement | null = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight: number = document.getElementById('mainNav')?.offsetHeight ?? 72;
        const top: number = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ================================================
   8. CONTACT FORM VALIDATION (if present)
   ================================================ */

function initContactForm(): void {
  const form: HTMLFormElement | null = document.getElementById('contactForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();

    /* Rate-limit submissions */
    if (!RateLimiter.canSubmit()) {
      return;
    }

    /* Check honeypot — if filled, it's a bot */
    const honeypot: HTMLInputElement | null = form.querySelector('.ohnohoney input');
    if (honeypot && honeypot.value) {
      return; // silently ignore bot submission
    }

    let isValid: boolean = true;

    /* Validate each field */
    const fields: readonly FormFieldConfig[] = [
      { id: 'name', validator: VALIDATORS.name, msg: 'Please enter a valid name (2–80 chars).' },
      { id: 'email', validator: VALIDATORS.email, msg: 'Please enter a valid email address.' },
      { id: 'message', validator: VALIDATORS.message, msg: 'Message must be 10–2000 characters.' },
    ] as const;

    fields.forEach(({ id, validator, msg }: FormFieldConfig) => {
      const input: HTMLInputElement | null = form.querySelector(`#${id}`);
      const error: HTMLElement | null = form.querySelector(`#${id}-error`);
      if (!input || !error) return;

      const value: string = input.value.trim();
      if (!validator.test(value)) {
        error.textContent = msg;
        error.style.display = 'block';
        input.style.borderColor = '#ef4444';
        isValid = false;
      } else {
        error.style.display = 'none';
        input.style.borderColor = '';
      }
    });

    if (isValid) {
      /* Sanitise values before any processing — never trust user input */
      const nameInput: HTMLInputElement | null = form.querySelector('#name');
      const emailInput: HTMLInputElement | null = form.querySelector('#email');
      const messageInput: HTMLTextAreaElement | null = form.querySelector('#message');

      if (!nameInput || !emailInput || !messageInput) return;

      const formData: SanitisedFormData = {
        name: sanitise(nameInput.value.trim()),
        email: sanitise(emailInput.value.trim()),
        message: sanitise(messageInput.value.trim()),
      };

      // In production, POST formData to a secure backend via HTTPS.
      // No console.log — never expose user data to devtools.
      void formData;

      /* Show success state */
      const submitBtn: HTMLButtonElement | null = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Message Sent ✓';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
      }

      form.reset();
    }
  });
}

/* ================================================
   9. SVG GSAP ANIMATION
   ================================================ */

function initSvgAnimation(): void {
  const redcircle = document.getElementById("redcircle");
  if (redcircle && typeof gsap !== 'undefined') {
    gsap.to(redcircle, {
      duration: 4,
      x: "-50px",
      y: "-40px",
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.2,
      ease: "sine.inOut"
    });
  }

  const bluecircle = document.getElementById("bluecircle");
  if (bluecircle && typeof gsap !== 'undefined') {
    gsap.to(bluecircle, {
      duration: 5,
      x: "30px",
      y: "20px",
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.5,
      ease: "sine.inOut"
    });
  }
}

/* ================================================
   10. PRIVACY GUARD
   ================================================ */

/**
 * Blocks common privacy leakage vectors at runtime.
 */
function initPrivacyGuard(): void {
  /* Disable Beacon API to prevent data exfiltration */
  if ('sendBeacon' in navigator) {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: () => false,
      writable: false,
      configurable: false,
    });
  }

  /* Prevent WebRTC IP leakage by overriding RTCPeerConnection */
  if ('RTCPeerConnection' in window) {
    (window as unknown as Record<string, unknown>).RTCPeerConnection = undefined;
  }
  if ('webkitRTCPeerConnection' in window) {
    (window as unknown as Record<string, unknown>).webkitRTCPeerConnection = undefined;
  }

  /* Block Battery API if exposed */
  if ('getBattery' in navigator) {
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.reject(new Error('Blocked for privacy')),
      writable: false,
      configurable: false,
    });
  }
}

/* ================================================
   11. INITIALISE EVERYTHING ON DOM READY
   ================================================ */

document.addEventListener('DOMContentLoaded', (): void => {
  initPrivacyGuard();
  initNav();
  initScrollAnimations();
  initStatCounters();
  initServiceTabs();
  initSmoothScroll();
  initContactForm();
  initSvgAnimation();
});
