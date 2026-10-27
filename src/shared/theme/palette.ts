export type ColorScheme = 'light' | 'dark';

/** Semantic accents shared by stat tiles, badges and chart series. */
export type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

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
  /** Crest blues: `brand` carries headers, `brandBright` highlights, `brandDeep` the sidebar. */
  brand: string;
  brandBright: string;
  brandDeep: string;
  /** Banner yellow, used sparingly for the active marker and the second chart series. */
  accent: string;
  onAccent: string;
  sidebar: string;
  sidebarText: string;
  sidebarActive: string;
  sidebarActiveBackground: string;
  sidebarBorder: string;
  tones: Record<Tone, ToneSet>;
  /** Donut and bar fills, in order. */
  chart: string[];
  chartGrid: string;
}

/** Tones arrive from the API, so an unrecognised one falls back instead of blanking a screen. */
export function toneSet(colors: Palette, tone: Tone): ToneSet {
  return colors.tones[tone] ?? colors.tones.neutral;
}

export const lightPalette: Palette = {
  scheme: 'light',
  background: '#EEF4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F5FAFD',
  border: '#D5E3EC',
  text: '#0E2733',
  textSecondary: '#33556A',
  textMuted: '#4F7185',
  textFaint: '#93AEBD',
  primary: '#0B6FA8',
  onPrimary: '#FFFFFF',
  link: '#0A5D8C',
  spinner: '#1595E0',
  inputBackground: '#FFFFFF',
  inputBorder: '#BBD3E0',
  placeholder: '#93AEBD',
  dangerBackground: '#FCE8E6',
  dangerTitle: '#8C1D18',
  dangerText: '#B3261E',
  errorBorder: '#C1352B',
  errorText: '#B3261E',
  success: '#3E7A2E',
  scrim: '#0E273399',
  brand: '#1595E0',
  brandBright: '#3BC8F1',
  brandDeep: '#0A5D8C',
  accent: '#F5E51B',
  onAccent: '#3A3400',
  sidebar: '#0B4E75',
  sidebarText: '#DCEEF9',
  sidebarActive: '#FFFFFF',
  sidebarActiveBackground: '#0B6FA8',
  sidebarBorder: '#1B6E9E',
  tones: {
    primary: { background: '#E1F1FA', text: '#0A5D8C', bar: '#1595E0', border: '#A9D8F0' },
    accent: { background: '#FDF6C2', text: '#6B5900', bar: '#F5E51B', border: '#F0DE7A' },
    success: { background: '#E6F2DF', text: '#33641F', bar: '#6FA83C', border: '#BFDCA9' },
    warning: { background: '#FEF3D6', text: '#7A4E00', bar: '#F2A93B', border: '#F3D79A' },
    danger: { background: '#FCE8E6', text: '#A32020', bar: '#D9534F', border: '#F0BDB8' },
    neutral: { background: '#EDF3F7', text: '#4A6A7C', bar: '#93AEBD', border: '#D5E3EC' },
  },
  chart: ['#1595E0', '#F5E51B', '#6FA83C', '#F2A93B', '#D9534F', '#3BC8F1', '#8C6D1F'],
  chartGrid: '#D5E3EC',
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
  primary: '#3BC8F1',
  onPrimary: '#06222E',
  link: '#7DD9F7',
  spinner: '#3BC8F1',
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
  brand: '#1595E0',
  brandBright: '#3BC8F1',
  brandDeep: '#0A3550',
  accent: '#F5E51B',
  onAccent: '#2B2800',
  sidebar: '#0A2434',
  sidebarText: '#B9D6E6',
  sidebarActive: '#FFFFFF',
  sidebarActiveBackground: '#0B6FA8',
  sidebarBorder: '#1C3D52',
  tones: {
    primary: { background: '#103046', text: '#8FD8F5', bar: '#1595E0', border: '#1E5578' },
    accent: { background: '#3A3410', text: '#F7E98A', bar: '#F5E51B', border: '#6B5F1A' },
    success: { background: '#1D3317', text: '#B6E39A', bar: '#6FA83C', border: '#35602A' },
    warning: { background: '#3A2A0C', text: '#FBD18A', bar: '#F2A93B', border: '#6B4A16' },
    danger: { background: '#43110E', text: '#FFB4AC', bar: '#D9534F', border: '#6E1F1A' },
    neutral: { background: '#16303F', text: '#A8C6D6', bar: '#6B8FA5', border: '#24455A' },
  },
  chart: ['#3BC8F1', '#F5E51B', '#8CC152', '#F2A93B', '#E36E66', '#1595E0', '#C9A227'],
  chartGrid: '#24455A',
};
