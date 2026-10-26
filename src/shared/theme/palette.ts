export type ColorScheme = 'light' | 'dark';

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
}

export const lightPalette: Palette = {
  scheme: 'light',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  link: '#1D4ED8',
  spinner: '#2563EB',
  inputBackground: '#FFFFFF',
  inputBorder: '#CBD5E1',
  placeholder: '#94A3B8',
  dangerBackground: '#FEE2E2',
  dangerTitle: '#991B1B',
  dangerText: '#B91C1C',
  errorBorder: '#DC2626',
  errorText: '#B91C1C',
  success: '#15803D',
};

export const darkPalette: Palette = {
  scheme: 'dark',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#172033',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  link: '#93C5FD',
  spinner: '#2563EB',
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  placeholder: '#64748B',
  dangerBackground: '#7F1D1D',
  dangerTitle: '#FECACA',
  dangerText: '#FEE2E2',
  errorBorder: '#DC2626',
  errorText: '#F87171',
  success: '#86EFAC',
};
