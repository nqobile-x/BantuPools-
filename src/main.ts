/**
 * Bantu Pools — Main TypeScript
 * Handles: nav, scroll reveals, stat counters, ARIA tabs,
 * before/after slider, gallery controls, privacy hardening.
 * All listeners attached via addEventListener — zero inline handlers.
 */

'use strict';

/* ================================================
   1. NAVIGATION
   ================================================ */

function initNav(): void {
  const nav: HTMLElement | null = document.getElementById('mainNav');
  const toggle: HTMLElement | null = document.getElementById('navToggle');
  const links: HTMLElement | null = document.getElementById('navLinks');

  if (!nav || !toggle || !links) return;

  /* Scrolled state — denser glass pill */
  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    },
    { passive: true }
  );

  const closeMenu = (): void => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  };

  /* Full-screen mobile menu */
  toggle.addEventListener('click', () => {
    const isOpen: boolean = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach((link: Element) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      closeMenu();
      (toggle as HTMLButtonElement).focus();
    }
  });
}

/* ================================================
   2. SCROLL REVEALS (IntersectionObserver)
   ================================================ */

function initReveals(): void {
  const elements: NodeListOf<Element> = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach((el: Element) => el.classList.add('in'));
    return;
  }

  const observer: IntersectionObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el: Element) => observer.observe(el));
}

/* ================================================
   3. STAT COUNTERS
   ================================================ */

function initStatCounters(): void {
  const stats: NodeListOf<HTMLElement> = document.querySelectorAll('.stat__num[data-count]');
  if (!stats.length) return;

  const reduceMotion: boolean = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const render = (el: HTMLElement, value: number): void => {
    el.textContent = value.toLocaleString() + (el.dataset.suffix ?? '');
  };

  const animate = (el: HTMLElement): void => {
    const target: number = parseInt(el.dataset.count ?? '0', 10);
    if (reduceMotion) {
      render(el, target);
      return;
    }

    const duration: number = 1800;
    const start: number = performance.now();

    const tick = (now: number): void => {
      const progress: number = Math.min((now - start) / duration, 1);
      const eased: number = 1 - Math.pow(1 - progress, 3);
      render(el, Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const observer: IntersectionObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting) {
          animate(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  stats.forEach((stat: HTMLElement) => observer.observe(stat));
}

/* ================================================
   4. SERVICE TABS (services.html) — ARIA tablist
   ================================================ */

function initServiceTabs(): void {
  const tablist: HTMLElement | null = document.querySelector('[role="tablist"]');
  if (!tablist) return;

  const tabs: HTMLElement[] = Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
  const panels: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  if (!tabs.length || !panels.length) return;

  const select = (tab: HTMLElement, focus: boolean = true): void => {
    tabs.forEach((t: HTMLElement) => {
      const active: boolean = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel: HTMLElement) => {
      panel.hidden = panel.id !== tab.getAttribute('aria-controls');
      if (!panel.hidden) {
        /* Re-run reveal animations inside the freshly shown panel */
        panel.querySelectorAll('.reveal').forEach((el: Element) => el.classList.add('in'));
      }
    });

    if (focus) tab.focus();
  };

  tabs.forEach((tab: HTMLElement) => {
    tab.addEventListener('click', () => select(tab, false));

    tab.addEventListener('keydown', (e: KeyboardEvent) => {
      const i: number = tabs.indexOf(tab);
      let next: number | null = null;

      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;

      if (next !== null) {
        e.preventDefault();
        const target: HTMLElement | undefined = tabs[next];
        if (target) select(target);
      }
    });
  });

  /* Deep links: services.html#repairs activates the matching tab */
  const applyHash = (): void => {
    const hash: string = window.location.hash.replace('#', '');
    if (!hash) return;
    const tab: HTMLElement | null = document.getElementById(`tab-${CSS.escape(hash)}`);
    if (tab) {
      select(tab, false);
      const content: HTMLElement | null = document.getElementById('services-content');
      content?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  applyHash();
  window.addEventListener('hashchange', applyHash);
}

/* ================================================
   5. BEFORE / AFTER SLIDER
   ================================================ */

function initBeforeAfter(): void {
  document.querySelectorAll<HTMLElement>('.ba').forEach((container) => {
    const range: HTMLInputElement | null = container.querySelector('.ba__range');
    if (!range) return;

    const update = (): void => {
      container.style.setProperty('--pos', `${range.value}%`);
    };

    range.addEventListener('input', update);
    update();
  });
}

/* ================================================
   6. GALLERY SCROLL CONTROLS
   ================================================ */

function initGallery(): void {
  const track: HTMLElement | null = document.getElementById('galleryTrack');
  const prev: HTMLElement | null = document.getElementById('galleryPrev');
  const next: HTMLElement | null = document.getElementById('galleryNext');
  if (!track || !prev || !next) return;

  const step = (): number => {
    const card: HTMLElement | null = track.querySelector('.gallery__card');
    return card ? card.offsetWidth + 24 : 360;
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
}

/* ================================================
   7. FOOTER YEAR
   ================================================ */

function initYear(): void {
  const el: HTMLElement | null = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ================================================
   8. THEME TOGGLE (dark / light)
   ================================================ */

/**
 * Wires the navbar theme button. The initial theme is already applied by
 * theme.js (in <head>) before paint; this just handles clicks and keeps the
 * button's accessible state + the address-bar theme colour in sync.
 */
function initThemeToggle(): void {
  const btn: HTMLElement | null = document.getElementById('themeToggle');
  if (!btn) return;

  const root: HTMLElement = document.documentElement;
  const themeColor: HTMLMetaElement | null = document.querySelector('meta[name="theme-color"]');

  const sync = (): void => {
    const isDark: boolean = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeColor) themeColor.setAttribute('content', isDark ? '#0d141d' : '#eaf3f6');
  };

  sync();

  btn.addEventListener('click', () => {
    const next: 'light' | 'dark' = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage blocked — theme still applies for this session */
    }
    sync();
  });
}

/* ================================================
   9. PRIVACY GUARD
   ================================================ */

/** Blocks common privacy-leakage vectors at runtime. */
function initPrivacyGuard(): void {
  if ('sendBeacon' in navigator) {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: () => false,
      writable: false,
      configurable: false,
    });
  }

  if ('RTCPeerConnection' in window) {
    (window as unknown as Record<string, unknown>).RTCPeerConnection = undefined;
  }
  if ('webkitRTCPeerConnection' in window) {
    (window as unknown as Record<string, unknown>).webkitRTCPeerConnection = undefined;
  }

  if ('getBattery' in navigator) {
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.reject(new Error('Blocked for privacy')),
      writable: false,
      configurable: false,
    });
  }
}

/* ================================================
   INITIALISE ON DOM READY
   ================================================ */

document.addEventListener('DOMContentLoaded', (): void => {
  initPrivacyGuard();
  initNav();
  initReveals();
  initStatCounters();
  initServiceTabs();
  initBeforeAfter();
  initGallery();
  initYear();
  initThemeToggle();
});
