// ── 테마 정의 ──────────────────────────────────────────────────────────────
// 새 테마 추가 시 THEMES 배열에만 추가하면 됨

export interface Theme {
  id: string;
  label: string;
  emoji: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: 'solarized',
    label: 'Solarized',
    emoji: '☀️',
    vars: {
      '--color-butter-bg':      '#faf8f4',
      '--color-butter-surface': '#f5f2eb',
      '--color-butter-primary': '#6b5200',
      '--color-butter-text':    '#1c1a17',
      '--color-butter-muted':   '#5e574f',
      '--color-butter-faint':   '#ede9de',
      '--color-butter-accent':  '#e8e3d6',
      '--color-butter-rule':    'rgba(0,0,0,0.06)',
    },
  },
  {
    id: 'dracula',
    label: 'Dracula Night',
    emoji: '🌙',
    vars: {
      '--color-butter-bg':      '#1e1b2e',
      '--color-butter-surface': '#2a2640',
      '--color-butter-primary': '#c4a882',
      '--color-butter-text':    '#e8e4f0',
      '--color-butter-muted':   '#a09abc',
      '--color-butter-faint':   '#2f2b45',
      '--color-butter-accent':  '#3d3659',
      '--color-butter-rule':    'rgba(255,255,255,0.07)',
    },
  },
];

export const DEFAULT_THEME_ID = 'solarized';

// ── CSS 변수 적용 ───────────────────────────────────────────────────────────

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  root.setAttribute('data-theme', theme.id);
}

// ── localStorage 키 ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'butter-theme';

// ── 초기화 (앱 진입 시 즉시 적용 — flicker 방지) ───────────────────────────

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID;
  const theme = THEMES.find((t) => t.id === saved) ?? THEMES[0];
  applyTheme(theme);
}

// ── useTheme hook ───────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID;
  });

  const setTheme = useCallback((id: string) => {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme) return;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, id);
    setThemeId(id);
  }, []);

  return { themeId, setTheme, themes: THEMES };
}
