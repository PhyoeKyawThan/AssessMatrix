import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { elevation, radius, useResponsive, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui/icon';
import { Title } from '@/shared/ui/text';

interface SheetProps {
  title: string;
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

/** Bottom sheet on a phone, centred dialog on a tablet or desktop window. */
export function Sheet({ title, visible, onDismiss, children }: SheetProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const compact = layout.breakpoint === 'compact';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable
        accessibilityLabel="Close form"
        onPress={onDismiss}
        style={[styles.backdrop, { backgroundColor: colors.scrim }]}
      >
        <Pressable
          role="dialog"
          accessibilityLabel={title}
          onPress={() => undefined}
          style={[
            styles.panel,
            compact ? styles.panelPhone : styles.panelTablet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.card,
              padding: layout.gap,
              gap: layout.gap,
              ...elevation(colors, true),
            },
          ]}
        >
          <View style={styles.header}>
            <Title>{title}</Title>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              hitSlop={12}
              onPress={onDismiss}
              style={[styles.close, { borderColor: colors.border }]}
            >
              <Icon name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={{ gap: layout.gap }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  panel: { borderWidth: 1, width: '100%', maxHeight: '92%' },
  panelPhone: { maxWidth: 520 },
  panelTablet: { maxWidth: 620 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  close: { borderRadius: 999, borderWidth: 1, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
