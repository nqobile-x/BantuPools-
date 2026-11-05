/**
 * Bantu Pools — Main TypeScript
 * Handles: nav, scroll reveals, stat counters, ARIA tabs, before/after slider,
 * scroll-scrubbed pool story, quick quote, footer year, theme toggle,
 * privacy guard and smooth scroll.
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
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
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
   6. SCROLL STORY — scroll-scrubbed video, motion-safe
   ================================================ */

const STORY_LABELS: readonly string[] = [
  '01 / A fresh start',
  '02 / Restore the finish',
  '03 / Bring back the blue',
  '04 / Enjoy the evening',
];

/** Slider range is 0 to STORY_STEPS. Keep in sync with the input's max in index.html. */
const STORY_STEPS = 120;

/**
 * Moves `current` toward `target`. Time-based, so the glide feels the same on
 * 60 Hz and high-refresh screens. Smooth scroll gets a tighter follow.
 */
function dampProgress(current: number, target: number, elapsedMs: number, smoothScroll: boolean): number {
  return current + (target - current) * (1 - Math.exp(-elapsedMs / (smoothScroll ? 45 : 110)));
}

/** Resolves once the first frame is decoded. Rejects if the file cannot be loaded. */
function loadStoryVideo(video: HTMLVideoElement, src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    video.addEventListener('loadeddata', () => resolve(), { once: true });
    video.addEventListener('error', () => reject(new Error('video failed')), { once: true });
    video.src = src;
    video.load();
    // iOS only decodes a first frame once playback has been attempted.
    video.play().then(() => video.pause()).catch(() => undefined);
  });
}

function initPoolStory(smoothScroll: boolean): void {
  const story = document.querySelector<HTMLElement>('.pool-story');
  const video = story?.querySelector<HTMLVideoElement>('video');
  const controls = story?.querySelector<HTMLElement>('.pool-story__controls');
  const slider = document.querySelector<HTMLInputElement>('#storyScrubber');
  const mode = document.querySelector<HTMLButtonElement>('#storyScrollMode');
  const stage = document.getElementById('storyStage');
  if (!story || !video || !controls || !slider || !mode || !stage) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shortScreen = window.matchMedia('(max-height: 640px)');
  let duration = 0;
  let progress = 0;
  let paused = false;
  let frame = 0;
  let lastTime = 0;

  /* Scroll drives the scene only when motion is welcome and the screen is tall enough */
  const scrollDriven = (): boolean => !reduced.matches && !shortScreen.matches;

  const syncMode = (): void => {
    mode.hidden = !scrollDriven();
    mode.textContent = paused ? 'Resume scroll animation' : 'Pause scroll animation';
    mode.setAttribute('aria-pressed', String(paused));
  };

  const draw = (): void => {
    if (!duration) return;
    const time = Math.min(duration - 0.04, progress * duration);
    if (Math.abs(video.currentTime - time) > 0.008) video.currentTime = time;
    const label = STORY_LABELS[Math.round(progress * (STORY_LABELS.length - 1))];
    stage.textContent = label;
    slider.value = String(Math.round(progress * STORY_STEPS));
    slider.setAttribute('aria-valuetext', `${Math.round(progress * 100)} percent — ${label.slice(5)}`);
    video.dataset.frame = slider.value;
  };

  const update = (now: number): void => {
    frame = 0;
    if (!duration) return;
    let settling = false;
    if (!paused && scrollDriven()) {
      const distance = Math.max(1, story.offsetHeight - video.clientHeight);
      const target = Math.min(1, Math.max(0, -story.getBoundingClientRect().top / distance));
      const elapsed = lastTime ? Math.min(64, now - lastTime) : 16.67;
      progress = dampProgress(progress, target, elapsed, smoothScroll);
      settling = Math.abs(target - progress) > 0.0001;
      if (!settling) progress = target;
    }
    draw();
    lastTime = settling ? now : 0;
    if (settling) frame = requestAnimationFrame(update);
  };

  const request = (): void => { if (!frame) frame = requestAnimationFrame(update); };

  slider.addEventListener('input', () => {
    paused = true;
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    progress = Number(slider.value) / STORY_STEPS;
    syncMode();
    draw();
  });

  mode.addEventListener('click', () => { paused = !paused; syncMode(); request(); });

  const load = async (): Promise<void> => {
    const size = window.innerWidth <= 680 ? 'mobile' : 'desktop';
    try {
      await loadStoryVideo(video, `assets/video/pool-story-${size}.mp4`);
      video.pause();
      duration = video.duration;
      video.hidden = false;
      controls.hidden = false;
      story.classList.add('pool-story--ready');
      if (!scrollDriven()) progress = 1;
      draw();
      request();
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request, { passive: true });
      reduced.addEventListener('change', () => { if (reduced.matches) progress = 1; syncMode(); request(); });
      shortScreen.addEventListener('change', () => { syncMode(); request(); });
      syncMode();
    } catch {
      // Keep the complete static image and copy when the video cannot load.
      duration = 0;
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); void load(); }
    }, { rootMargin: '800px' });
    observer.observe(story);
  } else { void load(); }
}

/* ================================================
   7. QUICK QUOTE — passes context into WhatsApp
   ================================================ */

/** Matches the input's maxlength in index.html. Keeps the wa.me URL short. */
const AREA_MAX_LENGTH = 60;

function initQuoteBuilder(): void {
  const form = document.getElementById('quoteBuilder') as HTMLFormElement | null;
  const areaInput = document.getElementById('quoteArea') as HTMLInputElement | null;
  if (!form || !areaInput) return;

  areaInput.addEventListener('input', () => areaInput.setCustomValidity(''));

  form.addEventListener('submit', (event: Event) => {
    event.preventDefault();
    const data = new FormData(form);
    const service = String(data.get('service') ?? 'pool help');
    // `required` accepts whitespace-only input, so check the cleaned value here.
    const area = String(data.get('area') ?? '').replace(/\s+/g, ' ').trim().slice(0, AREA_MAX_LENGTH).trim();
    if (!area) {
      areaInput.setCustomValidity('Enter your suburb or area.');
      form.reportValidity();
      return;
    }
    const message = `Hi Bantu Pools, I need help with ${service}. My area is ${area}. I can send a photo for a free quote.`;
    window.open(`https://wa.me/27836883238?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  });
}

/* ================================================
   8. FOOTER YEAR
   ================================================ */

function initYear(): void {
  const el: HTMLElement | null = document.getElementById('year');
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ================================================
   9. THEME TOGGLE (dark / light)
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
   10. PRIVACY GUARD
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
   SMOOTH SCROLL — Lenis (vendor/lenis.min.js)
   ================================================ */

interface LenisInstance { raf(time: number): void; }
declare const Lenis: (new (options: Record<string, unknown>) => LenisInstance) | undefined;

/** Returns true when Lenis is running, so other scroll code can tune itself to it. */
function initSmoothScroll(): boolean {
  if (typeof Lenis === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    anchors: true,
  });
  document.documentElement.classList.add('lenis-active');

  const raf = (time: number): void => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  return true;
}

/* ================================================
   INITIALISE ON DOM READY
   ================================================ */

document.addEventListener('DOMContentLoaded', (): void => {
  const smoothScroll: boolean = initSmoothScroll();
  initPrivacyGuard();
  initNav();
  initReveals();
  initStatCounters();
  initServiceTabs();
  initBeforeAfter();
  initPoolStory(smoothScroll);
  initQuoteBuilder();
  initYear();
  initThemeToggle();
});
