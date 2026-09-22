// Shared design tokens. Base surfaces follow a dark, technical/operational
// aesthetic; categorical source colors reuse the validated dark-mode steps
// from the dataviz skill's reference palette so the same hues read
// consistently across the map toggle, legends, and charts.

export type ModeId = 'hres' | 'ens' | 'aifs' | 'blended';

export const MODE_META: Record<ModeId, { label: string; full: string; color: string; description: string }> = {
  hres: { label: 'HRES', full: 'IFS-HRES (deterministic)', color: '#3987e5', description: 'High-resolution deterministic NWP' },
  ens: { label: 'ENS', full: 'IFS-ENS (ensemble mean)', color: '#9085e9', description: '51-member ensemble mean' },
  aifs: { label: 'AIFS', full: 'AIFS (ML model)', color: '#199e70', description: "ECMWF's AI/ML forecast model" },
  blended: { label: 'Blended', full: 'U-Net Adaptive Blend (ours)', color: '#e0a730', description: 'Spatially-varying learned blend of all sources' },
};

export const MODE_ORDER: ModeId[] = ['hres', 'ens', 'aifs', 'blended'];

export const COLORS = {
  bgPage: '#0a0f16',
  bgPanel: '#101722',
  bgPanelAlt: '#16202c',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  textPrimary: '#eef2f6',
  textSecondary: '#8fa0b3',
  textMuted: '#5c6b7c',
  // Reserved strictly for the "Blended (ours)" identity — the map mode, its
  // legend swatch, and the winning bars in the skill chart. Not a general
  // UI accent, so it doesn't compete with itself everywhere on the page.
  accent: '#e0a730',
  // General UI emphasis (live status, active controls, in-progress pipeline
  // step) uses a distinct cyan so "accent" isn't a single overloaded color.
  accentInfo: '#3fb6c9',
  good: '#3fae6f',
  watch: '#7a8ba0',
  warning: '#c07830',
  critical: '#c9524a',
};
