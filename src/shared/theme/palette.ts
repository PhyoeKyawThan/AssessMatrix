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
  // Native dark interfaces communicate elevation with tonal surfaces and dividers, not shadows.
  if (colors.scheme === 'dark') {
    return {
      boxShadow: 'none',
      shadowOpacity: 0,
      elevation: 0,
    };
  }

  const ink = colors.scheme === 'light' ? '#17212B' : '#000000';
  const alpha = 0.05;

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
  sidebar: '#073B4C',
  sidebarText: '#B9D8DF',
  sidebarActive: '#FFFFFF',
  sidebarActiveBackground: '#0E566B',
  sidebarBorder: '#1B6071',
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
  background: '#0B0C0F',
  surface: '#17191E',
  surfaceAlt: '#202329',
  border: '#30343B',
  text: '#F2F3F5',
  textSecondary: '#C7CAD0',
  textMuted: '#989DA6',
  textFaint: '#747A84',
  primary: '#8AB4F8',
  onPrimary: '#102A4C',
  link: '#A8C7FA',
  spinner: '#8AB4F8',
  inputBackground: '#202329',
  inputBorder: '#41464F',
  placeholder: '#747A84',
  dangerBackground: '#3B1719',
  dangerTitle: '#FFDAD6',
  dangerText: '#FFB4AB',
  errorBorder: '#A94A4A',
  errorText: '#FFB4AB',
  success: '#81C995',
  scrim: '#000000B8',
  brand: '#8AB4F8',
  brandBright: '#A8C7FA',
  brandDeep: '#1A2330',
  accent: '#E2B955',
  onAccent: '#302600',
  sidebar: '#0D242C',
  sidebarText: '#AAC9D0',
  sidebarActive: '#F2FBFC',
  sidebarActiveBackground: '#164653',
  sidebarBorder: '#24505B',
  heroFrom: '#1C2633',
  heroTo: '#17191E',
  heroText: '#E8EAED',
  tones: {
    primary: { background: '#1E2A3A', text: '#A8C7FA', bar: '#8AB4F8', border: '#34465E' },
    accent: { background: '#332D1B', text: '#F1D58A', bar: '#E2B955', border: '#554A29' },
    success: { background: '#173022', text: '#A8DAB5', bar: '#67B17C', border: '#2D5639' },
    violet: { background: '#29233A', text: '#D0BCFF', bar: '#AE94DF', border: '#49405F' },
    warning: { background: '#38291C', text: '#FFCE9D', bar: '#E49A55', border: '#61472D' },
    danger: { background: '#3B1F21', text: '#FFB4AB', bar: '#E06B65', border: '#66383A' },
    neutral: { background: '#25282E', text: '#C4C7CE', bar: '#8B9099', border: '#3A3E46' },
  },
  chart: ['#8AB4F8', '#C4A7E7', '#81C995', '#F2B879', '#F28B82', '#E2B955', '#7FC8D6'],
  chartGrid: '#30343B',
};
