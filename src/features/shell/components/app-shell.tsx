import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SIGN_IN_HREF, useAuth } from '@/features/auth';
import { ROLE_LABELS, type Role } from '@/features/auth/types';
import { isSectionActive, NAV_BY_ROLE, targetOf, VISIBLE_TABS, type NavItem } from '@/features/shell/nav';
import { scale, useResponsive, useTheme } from '@/shared/theme';
import { useSubmit } from '@/shared/api/use-resource';
import { Button } from '@/shared/ui/button';
import { ErrorBanner } from '@/shared/ui/error-banner';
import { Icon, shellIconColor } from '@/shared/ui/icon';
import { Sheet } from '@/shared/ui/sheet';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { Body, Meta } from '@/shared/ui/text';

const CREST = require('@/assets/brand/crest-mark.png');

/**
 * Persistent navigation around a role's screens: a sidebar on desktop, an icon rail on a tablet
 * and a bottom tab bar on a phone. The screen column keeps its own header, so a page title and
 * its actions stay with the page.
 */
export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const layout = useResponsive();
  const { colors } = useTheme();
  const items = NAV_BY_ROLE[role];

  if (layout.breakpoint === 'compact') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <View style={styles.fill}>{children}</View>
        <TabBar items={items} />
      </View>
    );
  }

  return (
    <View style={[styles.fill, styles.row, { backgroundColor: colors.background }]}>
      {layout.breakpoint === 'medium' ? <Rail items={items} /> : <Sidebar items={items} />}
      <View style={styles.fill}>{children}</View>
    </View>
  );
}

function useNav(items: NavItem[]) {
  const pathname = usePathname();
  const router = useRouter();
  const select = (item: NavItem) => isSectionActive(pathname, items, item);
  const go = (item: NavItem) => router.push(item.href);
  return { select, go };
}

function useSignOut() {
  const router = useRouter();
  const { signOut } = useAuth();
  const submit = useSubmit();

  const leave = async () => {
    const ok = await submit.run(() => signOut(), 'Signed out.');
    if (ok) router.replace(SIGN_IN_HREF);
  };

  return { submit, leave };
}

function Brand({ compact }: { compact: boolean }) {
  const { colors } = useTheme();
  const layout = useResponsive();

  return (
    <View style={[styles.brand, compact && styles.brandRail]}>
      <Image source={CREST} style={compact ? styles.crestRail : styles.crest} contentFit="contain" />
      {compact ? null : (
        <View style={styles.brandText}>
          <Text style={{ color: colors.sidebarActive, fontWeight: '800', fontSize: scale(16, layout.typeScale) }}>
            AssessMatrix
          </Text>
          <Text style={{ color: colors.sidebarText, fontSize: scale(11, layout.typeScale) }} numberOfLines={2}>
            Student performance
          </Text>
        </View>
      )}
    </View>
  );
}

function Sidebar({ items }: { items: NavItem[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { select, go } = useNav(items);

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.sidebar,
          borderRightColor: colors.sidebarBorder,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <Brand compact={false} />
      <Text style={[styles.navCaption, { color: colors.sidebarText }]}>WORKSPACE</Text>
      <ScrollView bounces={false} contentContainerStyle={styles.navList}>
        {items.map((item) => (
          <NavButton
            key={targetOf(item)}
            item={item}
            selected={select(item)}
            onPress={() => go(item)}
            variant="sidebar"
          />
        ))}
      </ScrollView>
      <ShellFooter />
    </View>
  );
}

function Rail({ items }: { items: NavItem[] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { select, go } = useNav(items);
  const [account, setAccount] = useState(false);

  return (
    <View
      style={[
        styles.rail,
        {
          backgroundColor: colors.sidebar,
          borderRightColor: colors.sidebarBorder,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <Brand compact />
      <ScrollView bounces={false} contentContainerStyle={styles.railList}>
        {items.map((item) => (
          <NavButton
            key={targetOf(item)}
            item={item}
            selected={select(item)}
            onPress={() => go(item)}
            variant="rail"
          />
        ))}
      </ScrollView>
      <View style={styles.railFooter}>
        <ThemeToggle variant="onDark" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={() => setAccount(true)}
          style={({ pressed }) => [styles.railItem, pressed && styles.pressed]}
        >
          <Icon name="person" size={22} color={colors.sidebarText} />
        </Pressable>
      </View>
      <AccountSheet visible={account} onDismiss={() => setAccount(false)} />
    </View>
  );
}

function TabBar({ items }: { items: NavItem[] }) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const insets = useSafeAreaInsets();
  const { select, go } = useNav(items);
  const [more, setMore] = useState(false);
  const [account, setAccount] = useState(false);
  // A phone fits five tabs; when the role has more sections than that, the account gets one of
  // the four slots so overflow and sign-out stay reachable.
  const overflow = items.length > VISIBLE_TABS;
  const shown = items.slice(0, overflow ? VISIBLE_TABS - 1 : VISIBLE_TABS);
  const rest = items.slice(shown.length);

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.sidebar,
          borderTopColor: colors.sidebarBorder,
          paddingBottom: insets.bottom + 6,
        },
      ]}
    >
      {shown.map((item) => {
        const selected = select(item);
        return (
          <Pressable
            key={targetOf(item)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => go(item)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Icon name={item.icon} size={22} color={shellIconColor(colors, selected, true)} />
            <Text
              style={{
                color: selected ? colors.sidebarActive : colors.sidebarText,
                fontSize: scale(11, layout.typeScale),
                fontWeight: selected ? '700' : '500',
              }}
            >
              {item.tabLabel}
            </Text>
            {selected ? <View style={[styles.tabMarker, { backgroundColor: colors.accent }]} /> : null}
          </Pressable>
        );
      })}
      {rest.length > 0 ? (
        <Pressable accessibilityRole="tab" onPress={() => setMore(true)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
          <Icon name="grid" size={22} color={colors.sidebarText} />
          <Text style={{ color: colors.sidebarText, fontSize: scale(11, layout.typeScale), fontWeight: '500' }}>
            More
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Account"
        onPress={() => setAccount(true)}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
      >
        <Icon name="person" size={22} color={colors.sidebarText} />
        <Text style={{ color: colors.sidebarText, fontSize: scale(11, layout.typeScale), fontWeight: '500' }}>
          Account
        </Text>
      </Pressable>
      <Sheet title="More sections" visible={more} onDismiss={() => setMore(false)}>
        {rest.map((item) => (
          <NavButton
            key={targetOf(item)}
            item={item}
            selected={select(item)}
            onPress={() => {
              setMore(false);
              go(item);
            }}
            variant="row"
          />
        ))}
      </Sheet>
      <AccountSheet visible={account} onDismiss={() => setAccount(false)} />
    </View>
  );
}

function AccountSheet({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  return (
    <Sheet title="Account" visible={visible} onDismiss={onDismiss}>
      <AccountDetails />
    </Sheet>
  );
}

function NavButton({
  item,
  selected,
  onPress,
  variant,
}: {
  item: NavItem;
  selected: boolean;
  onPress: () => void;
  variant: 'sidebar' | 'rail' | 'row';
}) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const onSidebar = variant !== 'row';
  const tint = shellIconColor(colors, selected, onSidebar);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={item.label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'sidebar' && styles.sidebarItem,
        variant === 'rail' && styles.railItem,
        variant === 'row' && styles.rowItem,
        selected && onSidebar && { backgroundColor: colors.sidebarActiveBackground },
        selected && variant === 'row' && { borderColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={item.icon} size={variant === 'rail' ? 22 : 18} color={tint} />
      {variant === 'rail' ? null : (
        <Text
          numberOfLines={1}
          style={{
            color: tint,
            flexShrink: 1,
            fontWeight: selected ? '700' : '500',
            fontSize: scale(14, layout.typeScale),
          }}
        >
          {item.label}
        </Text>
      )}
    </Pressable>
  );
}

function ShellFooter() {
  const { colors } = useTheme();
  const layout = useResponsive();
  const { user } = useAuth();
  const { submit, leave } = useSignOut();

  const initials = (user?.full_name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <View style={styles.footer}>
      {submit.error !== null ? <ErrorBanner title="Sign out failed" messages={submit.error} /> : null}
      <View style={styles.userRow}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={{ color: colors.onAccent, fontWeight: '800', fontSize: scale(13, layout.typeScale) }}>
            {initials}
          </Text>
        </View>
        <View style={styles.userText}>
          <Text numberOfLines={1} style={{ color: colors.sidebarActive, fontWeight: '700', fontSize: scale(14, layout.typeScale) }}>
            {user?.full_name ?? 'Signed out'}
          </Text>
          <Text numberOfLines={1} style={{ color: colors.sidebarText, fontSize: scale(11, layout.typeScale) }}>
            {user?.role ?? ''}
          </Text>
        </View>
        <ThemeToggle variant="onDark" />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={leave}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed, { borderColor: colors.sidebarBorder }]}
      >
        <Icon name="logout" size={18} color={colors.sidebarText} />
        <Text style={{ color: colors.sidebarText, fontSize: scale(13, layout.typeScale), fontWeight: '600' }}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

/** The same identity and sign-out control, rendered inside a light sheet instead of the sidebar. */
function AccountDetails() {
  const layout = useResponsive();
  const { user } = useAuth();
  const { submit, leave } = useSignOut();

  return (
    <View style={{ gap: layout.gap - 6 }}>
      <Meta>{user?.full_name ?? 'Signed out'}</Meta>
      {submit.error !== null ? <ErrorBanner title="Sign out failed" messages={submit.error} /> : null}
      {user !== null ? (
        <>
          <Body tone="secondary">{ROLE_LABELS[user.role]}</Body>
          <Body tone="muted">{user.email}</Body>
        </>
      ) : null}
      <Button label="Sign out" variant="secondary" loading={submit.pending} onPress={leave} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row' },
  sidebar: { width: 252, gap: 14, borderRightWidth: StyleSheet.hairlineWidth },
  rail: { width: 76, gap: 12, alignItems: 'center', borderRightWidth: StyleSheet.hairlineWidth },
  railList: { gap: 6, alignItems: 'center' },
  railFooter: { alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 10 },
  brandRail: { justifyContent: 'center' },
  brandText: { flexShrink: 1, gap: 1 },
  crest: { width: 38, height: 38 },
  crestRail: { width: 34, height: 34 },
  navCaption: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 22, paddingTop: 4 },
  navList: { gap: 3, paddingHorizontal: 12 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 10 },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 46,
    width: 46,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6 },
  tab: { alignItems: 'center', flex: 1, gap: 3, paddingVertical: 4 },
  tabMarker: { borderRadius: 999, height: 3, marginTop: 2, width: 18 },
  footer: { gap: 10, paddingHorizontal: 14 },
  userRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  userText: { flex: 1, flexShrink: 1, gap: 1 },
  avatar: { alignItems: 'center', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  signOut: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  pressed: { opacity: 0.72 },
});
