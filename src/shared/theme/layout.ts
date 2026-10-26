export type Breakpoint = 'compact' | 'medium' | 'wide';

export interface Layout {
  breakpoint: Breakpoint;
  gutter: number;
  gap: number;
  contentMaxWidth: number | '100%';
  formMaxWidth: number | '100%';
  detailColumns: 1 | 2;
  typeScale: number;
}

const LAYOUTS: Record<Breakpoint, Layout> = {
  compact: {
    breakpoint: 'compact',
    gutter: 20,
    gap: 16,
    contentMaxWidth: '100%',
    formMaxWidth: '100%',
    detailColumns: 1,
    typeScale: 1,
  },
  medium: {
    breakpoint: 'medium',
    gutter: 28,
    gap: 20,
    contentMaxWidth: 720,
    formMaxWidth: 560,
    detailColumns: 2,
    typeScale: 1.05,
  },
  wide: {
    breakpoint: 'wide',
    gutter: 32,
    gap: 24,
    contentMaxWidth: 960,
    formMaxWidth: 560,
    detailColumns: 2,
    typeScale: 1.1,
  },
};

/**
 * Widths are in dp/CSS px: <700 covers phones in both orientations, 700-1023 covers tablets,
 * >=1024 covers desktop browser windows and large tablet landscapes.
 */
export function layoutFor(width: number): Layout {
  if (width >= 1024) return LAYOUTS.wide;
  if (width >= 700) return LAYOUTS.medium;
  return LAYOUTS.compact;
}

/** Scales a design size without fighting the platform's own accessibility font scaling. */
export function scale(size: number, typeScale: number): number {
  return Math.round(size * typeScale);
}
