import type { ColorScheme } from '@/shared/theme/palette';

/**
 * Paints the browser chrome areas RN never covers: the canvas behind an app that is
 * narrower than the window, overscroll, and native form controls such as autofill icons.
 */
export function applyDocumentTheme(scheme: ColorScheme, background: string): void {
  const root = document.documentElement;
  root.style.colorScheme = scheme;
  root.style.backgroundColor = background;
  document.body?.style.setProperty('background-color', background);
}
