import Svg, { Path } from 'react-native-svg';

import type { Palette } from '@/shared/theme';

export type IconName =
  | 'alert'
  | 'arrowRight'
  | 'bell'
  | 'bolt'
  | 'book'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'checklist'
  | 'chevron'
  | 'clipboard'
  | 'clock'
  | 'close'
  | 'document'
  | 'grid'
  | 'layers'
  | 'logout'
  | 'menu'
  | 'person'
  | 'refresh'
  | 'search'
  | 'trendUp'
  | 'userPlus'
  | 'users';

/** 24x24 stroked glyphs, so one colour works on both the light content and the dark sidebar. */
const GLYPHS: Record<IconName, string> = {
  alert: 'M12 3.5 22 20.5H2zM12 9.5v5M12 17.2v.3',
  arrowRight: 'M4 12h15M14 7l5 5-5 5',
  bell: 'M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M13.7 20a2 2 0 0 1-3.4 0',
  bolt: 'M13 2.5 4.5 13.5H11l-1 8 9.5-11.5H13z',
  book: 'M4 4.5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 4.5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z',
  calendar: 'M4 6.5h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  chart: 'M4 20h16M7.5 20v-7M12 20V6.5M16.5 20v-10',
  check: 'M4.5 12.5l4.5 4.5L19.5 6.5',
  checklist: 'M4 6.5l2 2 3-3.5M4 16.5l2 2 3-3.5M12.5 7h7M12.5 17h7',
  chevron: 'M9.5 5.5 16 12l-6.5 6.5',
  clipboard: 'M7 5.5h10v15H7zM9.5 5.5V3.5h5v2M10 11h5M10 15h5',
  clock: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 7.5V12l3.5 2',
  close: 'M6 6l12 12M18 6 6 18',
  document: 'M6.5 3.5h7l4 4v13h-11zM13.5 3.5v4h4M9.5 12h5M9.5 16h5',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  layers: 'M12 3.5 3.5 8 12 12.5 20.5 8zM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5',
  logout: 'M14.5 4.5h-9v15h9M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 20.5c0-3.5 3.4-6 7.5-6s7.5 2.5 7.5 6',
  refresh: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16.2 16.2 21 21',
  trendUp: 'M3.5 16.5 10 10l3.5 3.5L20.5 6M15.5 6h5v5',
  userPlus: 'M8.5 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5M2.5 20c0-3.2 2.7-5.5 6-5.5 1.1 0 2.2.2 3.1.6M18 13.5v6M15 16.5h6',
  users:
    'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 5.5a3.5 3.5 0 0 1 0 6.5M17 15c2.5.4 4.5 2.3 4.5 5',
};

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}

export function Icon({ name, size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={GLYPHS[name]}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Sidebar and tab colours come from the shell, not the content palette. */
export function shellIconColor(colors: Palette, selected: boolean, onSidebar: boolean): string {
  if (onSidebar) return selected ? colors.sidebarActive : colors.sidebarText;
  return selected ? colors.primary : colors.textMuted;
}
