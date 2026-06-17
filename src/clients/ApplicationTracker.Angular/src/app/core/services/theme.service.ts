import { Injectable, computed, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<'light' | 'dark'>(this._readPreference());

  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this._theme();
      document.documentElement.style.colorScheme = theme;
      document.body.style.colorScheme = theme;
      try {
        localStorage.setItem('theme', theme);
      } catch {
        // Private browsing — storage unavailable, silently ignore
      }
    });
  }

  public toggle(): void {
    this._theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  private _readPreference(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Private browsing
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
