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
function initNav() {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav || !toggle || !links)
        return;
    /* Scrolled state — denser glass pill */
    window.addEventListener('scroll', () => {
        nav.classList.toggle('nav--scrolled', window.scrollY > 20);
    }, { passive: true });
    const closeMenu = () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
    };
    /* Full-screen mobile menu */
    toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('open')) {
            closeMenu();
            toggle.focus();
        }
    });
}
/* ================================================
   2. SCROLL REVEALS (IntersectionObserver)
   ================================================ */
function initReveals() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length)
        return;
    if (!('IntersectionObserver' in window)) {
        elements.forEach((el) => el.classList.add('in'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    elements.forEach((el) => observer.observe(el));
}
/* ================================================
   3. STAT COUNTERS
   ================================================ */
function initStatCounters() {
    const stats = document.querySelectorAll('.stat__num[data-count]');
    if (!stats.length)
        return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = (el, value) => {
        el.textContent = value.toLocaleString() + (el.dataset.suffix ?? '');
    };
    const animate = (el) => {
        const target = parseInt(el.dataset.count ?? '0', 10);
        if (reduceMotion) {
            render(el, target);
            return;
        }
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            render(el, Math.round(eased * target));
            if (progress < 1)
                requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animate(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    stats.forEach((stat) => observer.observe(stat));
}
/* ================================================
   4. SERVICE TABS (services.html) — ARIA tablist
   ================================================ */
function initServiceTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist)
        return;
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length || !panels.length)
        return;
    const select = (tab, focus = true) => {
        tabs.forEach((t) => {
            const active = t === tab;
            t.setAttribute('aria-selected', String(active));
            t.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => {
            panel.hidden = panel.id !== tab.getAttribute('aria-controls');
            if (!panel.hidden) {
                /* Re-run reveal animations inside the freshly shown panel */
                panel.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
            }
        });
        if (focus)
            tab.focus();
    };
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => select(tab, false));
        tab.addEventListener('keydown', (e) => {
            const i = tabs.indexOf(tab);
            let next = null;
            if (e.key === 'ArrowRight')
                next = (i + 1) % tabs.length;
            else if (e.key === 'ArrowLeft')
                next = (i - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home')
                next = 0;
            else if (e.key === 'End')
                next = tabs.length - 1;
            if (next !== null) {
                e.preventDefault();
                const target = tabs[next];
                if (target)
                    select(target);
            }
        });
    });
    /* Deep links: services.html#repairs activates the matching tab */
    const applyHash = () => {
        const hash = window.location.hash.replace('#', '');
        if (!hash)
            return;
        const tab = document.getElementById(`tab-${CSS.escape(hash)}`);
        if (tab) {
            select(tab, false);
            const content = document.getElementById('services-content');
            content?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
}
/* ================================================
   5. BEFORE / AFTER SLIDER
   ================================================ */
function initBeforeAfter() {
    document.querySelectorAll('.ba').forEach((container) => {
        const range = container.querySelector('.ba__range');
        if (!range)
            return;
        const update = () => {
            container.style.setProperty('--pos', `${range.value}%`);
        };
        range.addEventListener('input', update);
        update();
    });
}
/* ================================================
   7. SCROLL STORY — native scroll progress, motion-safe
   ================================================ */
function initPoolStory() {
    const story = document.querySelector('.pool-story');
    const canvas = story?.querySelector('canvas');
    const controls = story?.querySelector('.pool-story__controls');
    const slider = document.querySelector('#storyScrubber');
    const mode = document.querySelector('#storyScrollMode');
    const stage = document.getElementById('storyStage');
    const context = canvas?.getContext('2d', { alpha: false });
    if (!story || !canvas || !context || !controls || !slider || !mode || !stage)
        return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shortScreen = window.matchMedia('(max-height: 640px)');
    const labels = ['01 / A fresh start', '02 / Restore the finish', '03 / Bring back the blue', '04 / Enjoy the evening'];
    let frames = [];
    let progress = 0;
    let paused = false;
    let tick = 0;
    let lastTime = 0;
    const syncMode = () => {
        mode.hidden = reduced.matches || shortScreen.matches;
        mode.textContent = paused ? 'Resume scroll animation' : 'Pause scroll animation';
        mode.setAttribute('aria-pressed', String(paused));
    };
    const draw = () => {
        if (!frames.length)
            return;
        const position = progress * (frames.length - 1);
        const index = Math.min(frames.length - 1, Math.floor(position));
        const paint = (frame, opacity) => {
            const scale = Math.max(canvas.width / frame.naturalWidth, canvas.height / frame.naturalHeight);
            const width = frame.naturalWidth * scale;
            const height = frame.naturalHeight * scale;
            context.globalAlpha = opacity;
            context.drawImage(frame, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        };
        paint(frames[index], 1);
        const blend = position - index;
        // Ease into and out of each photographic stage without abrupt boundaries.
        if (index < frames.length - 1)
            paint(frames[index + 1], blend * blend * (3 - 2 * blend));
        context.globalAlpha = 1;
        const label = labels[Math.round(position)];
        stage.textContent = label;
        slider.value = String(Math.round(progress * 120));
        slider.setAttribute('aria-valuetext', `${Math.round(progress * 100)} percent — ${label.slice(5)}`);
        canvas.dataset.frame = slider.value;
    };
    const update = (now) => {
        tick = 0;
        if (!frames.length)
            return;
        let settling = false;
        if (!paused && !reduced.matches && !shortScreen.matches) {
            const distance = Math.max(1, story.offsetHeight - canvas.clientHeight);
            const target = Math.min(1, Math.max(0, -story.getBoundingClientRect().top / distance));
            const elapsed = lastTime ? Math.min(64, now - lastTime) : 16.67;
            // Time-based damping feels consistent on 60 Hz and high-refresh screens.
            progress += (target - progress) * (1 - Math.exp(-elapsed / 110));
            settling = Math.abs(target - progress) > .0001;
            if (!settling)
                progress = target;
        }
        draw();
        lastTime = settling ? now : 0;
        if (settling)
            tick = requestAnimationFrame(update);
    };
    const request = () => { if (!tick)
        tick = requestAnimationFrame(update); };
    const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(canvas.clientWidth * ratio);
        canvas.height = Math.round(canvas.clientHeight * ratio);
        syncMode();
        request();
    };
    slider.addEventListener('input', () => {
        paused = true;
        if (tick)
            cancelAnimationFrame(tick);
        tick = 0;
        lastTime = 0;
        progress = Number(slider.value) / 120;
        syncMode();
        draw();
    });
    mode.addEventListener('click', () => { paused = !paused; syncMode(); request(); });
    const load = async () => {
        const width = window.innerWidth <= 680 ? 960 : 1600;
        try {
            frames = await Promise.all(['before', 'restore', 'clear', 'dusk'].map(async (name) => {
                const frame = new Image();
                frame.src = `assets/img/sequence-${name}-${width}.webp`;
                await frame.decode();
                return frame;
            }));
            canvas.hidden = false;
            controls.hidden = false;
            story.classList.add('pool-story--ready');
            if (reduced.matches || shortScreen.matches)
                progress = 1;
            resize();
            window.addEventListener('scroll', request, { passive: true });
            window.addEventListener('resize', resize, { passive: true });
            reduced.addEventListener('change', () => { if (reduced.matches)
                progress = 1; resize(); });
            shortScreen.addEventListener('change', resize);
        }
        catch {
            // Keep the complete static image and copy when a frame cannot load.
            frames = [];
        }
    };
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                void load();
            }
        }, { rootMargin: '800px' });
        observer.observe(story);
    }
    else {
        void load();
    }
}
/* ================================================
   8. QUICK QUOTE — passes context into WhatsApp
   ================================================ */
function initQuoteBuilder() {
    const form = document.getElementById('quoteBuilder');
    if (!form)
        return;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const service = String(data.get('service') ?? 'pool help');
        const area = String(data.get('area') ?? '').trim();
        const message = `Hi Bantu Pools, I need help with ${service}. My area is ${area}. I can send a photo for a free quote.`;
        window.open(`https://wa.me/27836883238?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
}
/* ================================================
   7. FOOTER YEAR
   ================================================ */
function initYear() {
    const el = document.getElementById('year');
    if (el)
        el.textContent = String(new Date().getFullYear());
}
/* ================================================
   8. THEME TOGGLE (dark / light)
   ================================================ */
/**
 * Wires the navbar theme button. The initial theme is already applied by
 * theme.js (in <head>) before paint; this just handles clicks and keeps the
 * button's accessible state + the address-bar theme colour in sync.
 */
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn)
        return;
    const root = document.documentElement;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const sync = () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        btn.setAttribute('aria-pressed', String(isDark));
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        if (themeColor)
            themeColor.setAttribute('content', isDark ? '#0d141d' : '#eaf3f6');
    };
    sync();
    btn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme', next);
        }
        catch {
            /* storage blocked — theme still applies for this session */
        }
        sync();
    });
}
/* ================================================
   9. PRIVACY GUARD
   ================================================ */
/** Blocks common privacy-leakage vectors at runtime. */
function initPrivacyGuard() {
    if ('sendBeacon' in navigator) {
        Object.defineProperty(navigator, 'sendBeacon', {
            value: () => false,
            writable: false,
            configurable: false,
        });
    }
    if ('RTCPeerConnection' in window) {
        window.RTCPeerConnection = undefined;
    }
    if ('webkitRTCPeerConnection' in window) {
        window.webkitRTCPeerConnection = undefined;
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
document.addEventListener('DOMContentLoaded', () => {
    initPrivacyGuard();
    initNav();
    initReveals();
    initStatCounters();
    initServiceTabs();
    initBeforeAfter();
    initPoolStory();
    initQuoteBuilder();
    initYear();
    initThemeToggle();
});
