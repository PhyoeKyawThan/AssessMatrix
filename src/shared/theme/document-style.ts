import type { ColorScheme } from '@/shared/theme/palette';

/** Native roots get their background from the layout; only the browser needs the document painted. */
export function applyDocumentTheme(_scheme: ColorScheme, _background: string): void {}
