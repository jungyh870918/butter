// ── 테마 정의 ──────────────────────────────────────────────────────────────
// 새 테마 추가 시 THEMES 배열에만 추가하면 됨

export interface Theme {
  id: string;
  label: string;
  labelKo: string;
  emoji: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  // ① THE ARCHIVIST — 현재 기본 (따뜻한 크림/버터)
  {
    id: 'archivist',
    label: 'The Archivist',
    labelKo: '아키비스트',
    emoji: '📜',
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
  // ② BOTANICAL — 아이보리 + 짙은 초록
  {
    id: 'botanical',
    label: 'Botanical',
    labelKo: '보태니컬',
    emoji: '🌿',
    vars: {
      '--color-butter-bg':      '#f7f5ef',
      '--color-butter-surface': '#eeeadf',
      '--color-butter-primary': '#2d5a3d',
      '--color-butter-text':    '#1a2e22',
      '--color-butter-muted':   '#5a6b5e',
      '--color-butter-faint':   '#e4e0d4',
      '--color-butter-accent':  '#c8d9c4',
      '--color-butter-rule':    'rgba(45,90,61,0.09)',
    },
  },
  // ③ OCEANIC — 짙은 네이비 + 청록
  {
    id: 'oceanic',
    label: 'Oceanic',
    labelKo: '오셔닉',
    emoji: '🌊',
    vars: {
      '--color-butter-bg':      '#0d1b2a',
      '--color-butter-surface': '#142235',
      '--color-butter-primary': '#4ab8c4',
      '--color-butter-text':    '#d6eaf0',
      '--color-butter-muted':   '#6d9aaa',
      '--color-butter-faint':   '#1a2d3e',
      '--color-butter-accent':  '#1e3448',
      '--color-butter-rule':    'rgba(74,184,196,0.12)',
    },
  },
  // ④ BRUTALIST — 흰 배경 + 강한 흑백
  {
    id: 'brutalist',
    label: 'Brutalist',
    labelKo: '브루탈리스트',
    emoji: '🏗️',
    vars: {
      '--color-butter-bg':      '#ffffff',
      '--color-butter-surface': '#f0f0f0',
      '--color-butter-primary': '#111111',
      '--color-butter-text':    '#0a0a0a',
      '--color-butter-muted':   '#555555',
      '--color-butter-faint':   '#e4e4e4',
      '--color-butter-accent':  '#d0d0d0',
      '--color-butter-rule':    'rgba(0,0,0,0.12)',
    },
  },
  // ⑤ BLUEPRINT — 밝은 회색 + 파랑
  {
    id: 'blueprint',
    label: 'Blueprint',
    labelKo: '블루프린트',
    emoji: '📐',
    vars: {
      '--color-butter-bg':      '#f2f4f7',
      '--color-butter-surface': '#e6eaf0',
      '--color-butter-primary': '#1a4fd6',
      '--color-butter-text':    '#0d1b3e',
      '--color-butter-muted':   '#4a6080',
      '--color-butter-faint':   '#dce2ec',
      '--color-butter-accent':  '#c4d0e8',
      '--color-butter-rule':    'rgba(26,79,214,0.1)',
    },
  },
  // ⑥ EMERALD — 다크 + 에메랄드 그린
  {
    id: 'emerald',
    label: 'Emerald',
    labelKo: '에메랄드',
    emoji: '💎',
    vars: {
      '--color-butter-bg':      '#0f1a14',
      '--color-butter-surface': '#172210',
      '--color-butter-primary': '#2ecc8a',
      '--color-butter-text':    '#d4ede0',
      '--color-butter-muted':   '#6aaa88',
      '--color-butter-faint':   '#1c2e1f',
      '--color-butter-accent':  '#1e3525',
      '--color-butter-rule':    'rgba(46,204,138,0.12)',
    },
  },
];

// 기본 테마 — 처음 설치한 사용자가 보는 화면.
// 아키비스트(크림 #faf8f4 + 올리브골드 #6b5200)는 색조가 누렇게 도는 편이라
// 색이 전혀 없는 브루탈리스트를 기본으로 둔다. 화면에서 색을 가진 건 책 표지뿐이 되어
// 표지가 더 잘 살고, 문학적인 톤은 세리프 타이포가 담당한다.
// ⚠️ 이미 테마를 고른 사용자는 localStorage 값이 우선이라 영향받지 않는다.
export const DEFAULT_THEME_ID = 'brutalist';

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
