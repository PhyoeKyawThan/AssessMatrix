import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elevation, radius, useResponsive, useTheme } from '@/shared/theme';
import { Icon } from '@/shared/ui/icon';
import { Title } from '@/shared/ui/text';

interface SheetProps {
  title: string;
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  /** Forms get a focused full-screen workspace; filters and quick actions stay modal. */
  presentation?: 'modal' | 'form';
}

/** Modal utility sheet or a full-screen form workspace. */
export function Sheet({ title, visible, onDismiss, children, presentation = 'modal' }: SheetProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const insets = useSafeAreaInsets();
  const compact = layout.breakpoint === 'compact';
  const isForm = presentation === 'form';

  return (
    <Modal
      visible={visible}
      transparent={!isForm}
      animationType={isForm ? 'slide' : 'fade'}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={Platform.OS !== 'web'}
        style={styles.keyboard}
      >
        <Pressable
          accessibilityLabel="Dismiss"
          onPress={isForm ? undefined : onDismiss}
          style={[
            styles.backdrop,
            isForm ? styles.formBackdrop : { backgroundColor: colors.scrim },
          ]}
        >
          <Pressable
            role="dialog"
            accessibilityLabel={title}
            onPress={() => undefined}
            style={[
              styles.panel,
              isForm ? styles.panelForm : compact ? styles.panelPhone : styles.panelTablet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: isForm ? 0 : radius.card,
                paddingTop: layout.gap + (isForm ? insets.top : 0),
                paddingBottom: layout.gap + (isForm ? insets.bottom : 0),
                paddingHorizontal: layout.gap,
                gap: layout.gap,
                ...(isForm ? {} : elevation(colors, true)),
              },
            ]}
          >
            <View style={[styles.header, isForm && styles.formInner]}>
              <View style={styles.title}>
                <Title lines={2}>{title}</Title>
              </View>
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
              contentContainerStyle={styles.contentContainer}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.scroll}
            >
              <View style={[styles.content, { gap: layout.gap }, isForm && styles.formInner]}>
                {children}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  formBackdrop: { padding: 0, backgroundColor: 'transparent' },
  panel: { borderWidth: 1, width: '100%', maxHeight: '92%', flexShrink: 1, overflow: 'hidden' },
  panelForm: { borderWidth: 0, flex: 1, maxHeight: '100%' },
  panelPhone: { maxWidth: 520 },
  panelTablet: { maxWidth: 620 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 },
  title: { flex: 1, minWidth: 0 },
  scroll: { flexShrink: 1, minHeight: 0, width: '100%' },
  contentContainer: { flexGrow: 1 },
  content: { flexGrow: 0, paddingBottom: 2, width: '100%' },
  formInner: { alignSelf: 'center', maxWidth: 920, width: '100%' },
  close: { borderRadius: 999, borderWidth: 1, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
