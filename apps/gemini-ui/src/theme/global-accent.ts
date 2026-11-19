/**
 * Global Accent Theming — propagates the selected accent color
 * throughout the entire application via CSS custom properties.
 */

import { loadSettingsProfile, type SettingsAccent } from '../settings/profile';

const ACCENT_COLORS: Record<SettingsAccent, string> = {
  neon_cyan: '#22d3ee',
  obsidian: '#94a3b8',
  cyber_purple: '#c084fc',
  emerald_shield: '#34d399',
};

const ACCENT_GLOW: Record<SettingsAccent, string> = {
  neon_cyan: 'rgba(34, 211, 238, 0.3)',
  obsidian: 'rgba(148, 163, 184, 0.3)',
  cyber_purple: 'rgba(192, 132, 252, 0.3)',
  emerald_shield: 'rgba(52, 211, 153, 0.3)',
};

export function applyGlobalAccent(accent: SettingsAccent): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--knoux-accent', ACCENT_COLORS[accent]);
  root.style.setProperty('--knoux-accent-glow', ACCENT_GLOW[accent]);
  root.setAttribute('data-accent', accent);
}

export function loadAndApplyGlobalAccent(): SettingsAccent {
  const profile = loadSettingsProfile();
  applyGlobalAccent(profile.accent);
  return profile.accent;
}

export function getAccentColor(accent: SettingsAccent): string {
  return ACCENT_COLORS[accent];
}

export function getAccentGlow(accent: SettingsAccent): string {
  return ACCENT_GLOW[accent];
}