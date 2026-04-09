import { Injectable, PLATFORM_ID, inject, signal, computed, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = '300club_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _theme = signal<Theme>('system');
  readonly theme = this._theme.asReadonly();

  /**
   * Whether the system prefers dark mode
   */
  private readonly systemPrefersDark = signal(false);

  /**
   * Resolved dark mode state (accounts for system preference)
   */
  readonly isDark = computed(() => {
    const theme = this._theme();
    if (theme === 'system') {
      return this.systemPrefersDark();
    }
    return theme === 'dark';
  });

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    this.loadThemeFromStorage();
    this.setupSystemPreferenceListener();

    // Apply theme class to document when isDark changes
    effect(() => {
      const dark = this.isDark();
      if (this.isBrowser) {
        const html = document.documentElement;
        if (dark) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }
    });
  }

  /**
   * Set the theme and persist to localStorage
   */
  setTheme(theme: Theme): void {
    this._theme.set(theme);

    if (this.isBrowser) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore storage errors
      }
    }
  }

  /**
   * Cycle through themes: system -> light -> dark -> system
   */
  toggleTheme(): void {
    const current = this._theme();
    const next: Theme = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
    this.setTheme(next);
  }

  private loadThemeFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        this._theme.set(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }

  private setupSystemPreferenceListener(): void {
    if (!this.isBrowser) return;

    // Check initial system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      this.systemPrefersDark.set(e.matches);
    });
  }
}