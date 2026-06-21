/**
 * Bantu Pools — theme bootstrap.
 * Runs synchronously in <head> (before first paint) to apply the saved or
 * system-preferred colour theme, preventing a flash of the wrong theme.
 * Kept separate from main.ts because main.ts is deferred.
 */
'use strict';
(function applyInitialTheme() {
    try {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }
    catch {
        /* localStorage unavailable (private mode / blocked) — leave default light theme */
    }
})();
