import Svg, { Path } from 'react-native-svg';

import type { Palette } from '@/shared/theme';

export type IconName =
  | 'chart'
  | 'checklist'
  | 'clipboard'
  | 'document'
  | 'grid'
  | 'layers'
  | 'logout'
  | 'person'
  | 'calendar'
  | 'users';

/** 24x24 stroked glyphs, so one colour works on both the light content and the dark sidebar. */
const GLYPHS: Record<IconName, string> = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  users:
    'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 5.5a3.5 3.5 0 0 1 0 6.5M17 15c2.5.4 4.5 2.3 4.5 5',
  calendar: 'M4 6.5h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  layers: 'M12 3.5 3.5 8 12 12.5 20.5 8zM3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5',
  clipboard: 'M7 5.5h10v15H7zM9.5 5.5V3.5h5v2M10 11h5M10 15h5',
  document: 'M6.5 3.5h7l4 4v13h-11zM13.5 3.5v4h4M9.5 12h5M9.5 16h5',
  checklist: 'M4 6.5l2 2 3-3.5M4 16.5l2 2 3-3.5M12.5 7h7M12.5 17h7',
  chart: 'M4 20h16M7.5 20v-7M12 20V6.5M16.5 20v-10',
  person:
    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 20.5c0-3.5 3.4-6 7.5-6s7.5 2.5 7.5 6',
  logout: 'M14.5 4.5h-9v15h9M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5',
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
