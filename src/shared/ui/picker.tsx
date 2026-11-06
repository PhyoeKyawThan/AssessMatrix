import { View } from 'react-native';

import type { Option } from '@/shared/ui/option-chips';
import { AnimatedLoader } from '@/shared/ui/animated-loader';
import { OptionChips } from '@/shared/ui/option-chips';
import { Body } from '@/shared/ui/text';

interface PickerProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  loading?: boolean;
}

/** Option chips with a message when the list is still empty, and the first choice preselected. */
export function Picker<T extends string>({ label, options, value, onChange, loading = false }: PickerProps<T>) {
  if (options.length === 0) {
    return loading ? (
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }} accessibilityRole="progressbar">
        <AnimatedLoader size={20} />
        <Body tone="faint">{label}: loading…</Body>
      </View>
    ) : <Body tone="faint">{label}: nothing to choose yet.</Body>;
  }

  const current = value ?? options[0].value;

  return <OptionChips label={label} options={options} value={current} onChange={onChange} />;
}
