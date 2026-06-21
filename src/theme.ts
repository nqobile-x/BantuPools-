/**
 * Bantu Pools — theme bootstrap.
 * Runs synchronously in <head> (before first paint) to apply the saved or
 * system-preferred colour theme, preventing a flash of the wrong theme.
 * Kept separate from main.ts because main.ts is deferred.
 */

'use strict';

(function applyInitialTheme(): void {
  try {
    const stored: string | null = localStorage.getItem('theme');
    const prefersDark: boolean = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme: 'light' | 'dark' =
      stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    /* localStorage unavailable (private mode / blocked) — leave default light theme */
  }
})();
