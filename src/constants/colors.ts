/**
 * Cityspace Curated Color Palette
 * Editorial, minimalist, luxury architectural aesthetic.
 */

export const Colors = {
  // Brand Accents
  primary: '#0B0F19', // Obsidian deep black
  primaryLight: '#1E293B',
  accent: '#C59B27', // Warm Champagne Gold
  accentHover: '#B2881D',
  accentLight: '#FBF7ED',
  accentDark: '#8F6F15',

  // Canvas & Backgrounds
  background: '#FAFAFC', // Crisp linen off-white
  surface: '#FFFFFF', // Pure card white
  surfaceAlt: '#F1F3F7', // Subtle muted grey
  surfaceDark: '#121826',

  // Typography
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',
  textAccent: '#A17B1E',

  // UI Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0B0F19',

  // Status & Highlights
  statusBuy: '#0284C7', // Sky
  statusRent: '#0D9488', // Teal
  statusSold: '#64748B', // Slate
  statusFeatured: '#D97706', // Amber gold
  statusVerified: '#059669', // Emerald

  // Overlays & Shadows
  overlay: 'rgba(11, 15, 25, 0.65)',
  cardShadow: 'rgba(15, 23, 42, 0.08)',
  glow: 'rgba(197, 155, 39, 0.25)',
};

export type ColorTheme = typeof Colors;
