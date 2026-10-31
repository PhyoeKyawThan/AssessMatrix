import type { ViewStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

/** Semantic accents shared by stat tiles, badges and chart series. */
export type Tone = 'primary' | 'accent' | 'success' | 'violet' | 'warning' | 'danger' | 'neutral';

export interface ToneSet {
  /** Tile or pill fill. */
  background: string;
  /** Text that sits on `background`. */
  text: string;
  /** Chart series and progress fills. */
  bar: string;
  border: string;
}

export interface Palette {
  scheme: ColorScheme;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  onPrimary: string;
  link: string;
  spinner: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  dangerBackground: string;
  dangerTitle: string;
  dangerText: string;
  errorBorder: string;
  errorText: string;
  success: string;
  scrim: string;
  /** Crest blues: `brand` carries headers, `brandBright` highlights, `brandDeep` the hero band. */
  brand: string;
  brandBright: string;
  brandDeep: string;
  /** Banner yellow, used sparingly for the active marker and small highlights. */
  accent: string;
  onAccent: string;
  sidebar: string;
  sidebarText: string;
  sidebarActive: string;
  sidebarActiveBackground: string;
  sidebarBorder: string;
  /** The welcome band behind the dashboard heading, lightest at the reading edge. */
  heroFrom: string;
  heroTo: string;
  heroText: string;
  tones: Record<Tone, ToneSet>;
  /** Donut, bar and line fills, in order. */
  chart: string[];
  chartGrid: string;
}

/** Tones arrive from the API, so an unrecognised one falls back instead of blanking a screen. */
export function toneSet(colors: Palette, tone: Tone): ToneSet {
  return colors.tones[tone] ?? colors.tones.neutral;
}

export const radius = { tile: 10, card: 12, pill: 999, input: 8 } as const;

/**
 * Cards and the top bar float on the page background with a two-layer shadow. `boxShadow` is what
 * web reads, the `shadow*`/`elevation` keys what native reads; each platform ignores the other.
 */
export function elevation(colors: Palette, raised = false): ViewStyle {
  const ink = colors.scheme === 'light' ? '#17212B' : '#000000';
  const alpha = colors.scheme === 'light' ? 0.05 : 0.24;

  return {
    boxShadow: raised
      ? `0 2px 5px ${ink}12, 0 14px 30px ${ink}17`
      : `0 1px 2px ${ink}0D, 0 5px 14px ${ink}0A`,
    shadowColor: ink,
    shadowOpacity: alpha,
    shadowRadius: raised ? 20 : 12,
    shadowOffset: { width: 0, height: raised ? 10 : 4 },
    elevation: raised ? 6 : 2,
  };
}

export const lightPalette: Palette = {
  scheme: 'light',
  background: '#F3F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F8FA',
  border: '#DDE2E7',
  text: '#17212B',
  textSecondary: '#3E4C59',
  textMuted: '#667482',
  textFaint: '#929EAA',
  primary: '#2458A6',
  onPrimary: '#FFFFFF',
  link: '#204F96',
  spinner: '#2458A6',
  inputBackground: '#FFFFFF',
  inputBorder: '#C9D1D9',
  placeholder: '#929EAA',
  dangerBackground: '#FDECEA',
  dangerTitle: '#8C1D18',
  dangerText: '#B3261E',
  errorBorder: '#E1685F',
  errorText: '#B3261E',
  success: '#1E7A46',
  scrim: '#17212BA3',
  brand: '#2458A6',
  brandBright: '#4D78B9',
  brandDeep: '#153B6D',
  accent: '#D5A43A',
  onAccent: '#2F250E',
  sidebar: '#172534',
  sidebarText: '#AEBAC6',
  sidebarActive: '#FFFFFF',
  sidebarActiveBackground: '#2A3D51',
  sidebarBorder: '#2D3E50',
  heroFrom: '#E7EEF7',
  heroTo: '#F6F8FA',
  heroText: '#153B6D',
  tones: {
    primary: { background: '#EAF0F8', text: '#204F96', bar: '#3568B4', border: '#CFDBEA' },
    accent: { background: '#F8F1E2', text: '#775A19', bar: '#D5A43A', border: '#EADCB9' },
    success: { background: '#E7F6EC', text: '#1E7A46', bar: '#3FA36A', border: '#C6E8D2' },
    violet: { background: '#F0EEF7', text: '#5B4B88', bar: '#7663A5', border: '#DCD6EA' },
    warning: { background: '#FDF0E2', text: '#B4571B', bar: '#F0913E', border: '#F6DCBE' },
    danger: { background: '#FDECEA', text: '#B3261E', bar: '#E1685F', border: '#F6CFCB' },
    neutral: { background: '#EEF1F4', text: '#566574', bar: '#8996A3', border: '#DDE2E7' },
  },
  chart: ['#3568B4', '#7663A5', '#3F8A61', '#C47A37', '#C8524A', '#D5A43A', '#4D78B9'],
  chartGrid: '#DDE2E7',
};

export const darkPalette: Palette = {
  scheme: 'dark',
  background: '#071620',
  surface: '#0F2431',
  surfaceAlt: '#142C3A',
  border: '#24455A',
  text: '#E8F4FB',
  textSecondary: '#B9D6E6',
  textMuted: '#8FB2C6',
  textFaint: '#6B8FA5',
  primary: '#7FA6DA',
  onPrimary: '#04131F',
  link: '#7DD9F7',
  spinner: '#7FA6DA',
  inputBackground: '#0F2431',
  inputBorder: '#2C526A',
  placeholder: '#6B8FA5',
  dangerBackground: '#4A1512',
  dangerTitle: '#FFD7D2',
  dangerText: '#FFB4AC',
  errorBorder: '#E36E66',
  errorText: '#FF9C93',
  success: '#9BD67B',
  scrim: '#020A10B3',
  brand: '#5787C7',
  brandBright: '#7FA6DA',
  brandDeep: '#0A3550',
  accent: '#D5A43A',
  onAccent: '#2B2800',
  sidebar: '#061725',
  sidebarText: '#A9C3DC',
  sidebarActive: '#FFFFFF',
  sidebarActiveBackground: '#263C50',
  sidebarBorder: '#16324A',
  heroFrom: '#0E3D66',
  heroTo: '#0F2431',
  heroText: '#DCEEF9',
  tones: {
    primary: { background: '#0E2C46', text: '#8FD1F5', bar: '#2F7DD1', border: '#1E5578' },
    accent: { background: '#3A3410', text: '#F7E98A', bar: '#F5C518', border: '#6B5F1A' },
    success: { background: '#12331F', text: '#9BE0B4', bar: '#3FA36A', border: '#256240' },
    violet: { background: '#251F45', text: '#C4B2F5', bar: '#8B6FD8', border: '#3E3470' },
    warning: { background: '#3A2A0C', text: '#FBD18A', bar: '#F0913E', border: '#6B4A16' },
    danger: { background: '#43110E', text: '#FFB4AC', bar: '#E1685F', border: '#6E1F1A' },
    neutral: { background: '#16303F', text: '#A8C6D6', bar: '#6B8FA5', border: '#24455A' },
  },
  chart: ['#7FA6DA', '#A99AD1', '#69B184', '#DB9A5D', '#E07972', '#D5A43A', '#5787C7'],
  chartGrid: '#24455A',
};
