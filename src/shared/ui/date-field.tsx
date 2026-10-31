import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, scale, useResponsive, useTheme } from '@/shared/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Sheet } from '@/shared/ui/sheet';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
type CalendarView = 'days' | 'months' | 'years';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  minimumDate?: string;
  maximumDate?: string;
  allowClear?: boolean;
  disabled?: boolean;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayDate(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function moveMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function moveYear(date: Date, amount: number): Date {
  return new Date(date.getFullYear() + amount, date.getMonth(), 1, 12);
}

export function DateField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  allowClear = true,
  disabled = false,
}: DateFieldProps) {
  const { colors } = useTheme();
  const layout = useResponsive();
  const [open, setOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('days');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDate(value);
    const today = new Date();
    return new Date(selected?.getFullYear() ?? today.getFullYear(), selected?.getMonth() ?? today.getMonth(), 1, 12);
  });
  const [yearPageStart, setYearPageStart] = useState(() => Math.floor(visibleMonth.getFullYear() / 12) * 12);

  const selectedValue = parseDate(value) ? value : '';
  const todayValue = toDateOnly(new Date());
  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
    return Array.from({ length: 42 }, (_, index) => (
      new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + index, 12)
    ));
  }, [visibleMonth]);

  const isDisabledDate = (dateOnly: string) => (
    (minimumDate !== undefined && dateOnly < minimumDate)
    || (maximumDate !== undefined && dateOnly > maximumDate)
  );

  const showCalendar = () => {
    const selected = parseDate(value);
    const fallback = parseDate(minimumDate) ?? new Date();
    const initial = new Date((selected ?? fallback).getFullYear(), (selected ?? fallback).getMonth(), 1, 12);
    setVisibleMonth(initial);
    setYearPageStart(Math.floor(initial.getFullYear() / 12) * 12);
    setCalendarView('days');
    setOpen(true);
  };

  const openYears = () => {
    setYearPageStart(Math.floor(visibleMonth.getFullYear() / 12) * 12);
    setCalendarView('years');
  };

  return (
    <View style={{ gap: layout.breakpoint === 'compact' ? 6 : 8 }}>
      <Text style={[styles.label, { color: colors.textSecondary, fontSize: scale(14, layout.typeScale) }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selectedValue ? displayDate(selectedValue) : 'No date selected'}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={showCalendar}
        style={({ pressed }) => [
          styles.input,
          {
            minHeight: layout.breakpoint === 'compact' ? 46 : 48,
            paddingHorizontal: layout.gap - 4,
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.errorBorder : colors.inputBorder,
            borderRadius: radius.input,
            opacity: disabled ? 0.55 : pressed ? 0.78 : 1,
          },
        ]}
      >
        <Text style={{ color: selectedValue ? colors.text : colors.placeholder, fontSize: scale(15, layout.typeScale), flex: 1 }}>
          {selectedValue ? displayDate(selectedValue) : placeholder}
        </Text>
        <Icon name="calendar" size={19} color={error ? colors.errorText : colors.primary} />
      </Pressable>
      {error ? <Text style={{ color: colors.errorText, fontSize: scale(13, layout.typeScale) }}>{error}</Text> : null}

      <Sheet title={label} visible={open} onDismiss={() => setOpen(false)}>
        <View style={[styles.calendar, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.monthToolbar}>
            <CalendarArrow
              label={calendarView === 'years' ? 'Previous years' : calendarView === 'months' ? 'Previous year' : 'Previous month'}
              symbol="‹"
              onPress={() => {
                if (calendarView === 'years') setYearPageStart((year) => year - 12);
                else if (calendarView === 'months') setVisibleMonth((month) => moveYear(month, -1));
                else setVisibleMonth((month) => moveMonth(month, -1));
              }}
            />
            {calendarView === 'years' ? (
              <Text style={[styles.monthTitle, { color: colors.text, fontSize: scale(17, layout.typeScale) }]}> 
                {yearPageStart}–{yearPageStart + 11}
              </Text>
            ) : calendarView === 'months' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select year. Current year ${visibleMonth.getFullYear()}`}
                onPress={openYears}
                style={({ pressed }) => [styles.headingButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.headingText, { color: colors.text, fontSize: scale(17, layout.typeScale) }]}>{visibleMonth.getFullYear()}</Text>
              </Pressable>
            ) : (
              <View style={styles.headingGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Select month. Current month ${MONTHS[visibleMonth.getMonth()]}`}
                  onPress={() => setCalendarView('months')}
                  style={({ pressed }) => [styles.headingButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.headingText, { color: colors.text, fontSize: scale(16, layout.typeScale) }]}>{MONTHS[visibleMonth.getMonth()]}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Select year. Current year ${visibleMonth.getFullYear()}`}
                  onPress={openYears}
                  style={({ pressed }) => [styles.headingButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.headingText, { color: colors.text, fontSize: scale(16, layout.typeScale) }]}>{visibleMonth.getFullYear()}</Text>
                </Pressable>
              </View>
            )}
            <CalendarArrow
              label={calendarView === 'years' ? 'Next years' : calendarView === 'months' ? 'Next year' : 'Next month'}
              symbol="›"
              onPress={() => {
                if (calendarView === 'years') setYearPageStart((year) => year + 12);
                else if (calendarView === 'months') setVisibleMonth((month) => moveYear(month, 1));
                else setVisibleMonth((month) => moveMonth(month, 1));
              }}
            />
          </View>

          {calendarView === 'days' ? <View style={styles.grid}>
            {WEEKDAYS.map((weekday) => (
              <View key={weekday} style={styles.cell}>
                <Text style={[styles.weekday, { color: colors.textMuted, fontSize: scale(11, layout.typeScale) }]}>{weekday}</Text>
              </View>
            ))}
            {days.map((date) => {
              const dateOnly = toDateOnly(date);
              const selected = dateOnly === selectedValue;
              const today = dateOnly === todayValue;
              const outside = date.getMonth() !== visibleMonth.getMonth();
              const dateDisabled = isDisabledDate(dateOnly);
              return (
                <View key={dateOnly} style={styles.cell}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={displayDate(dateOnly)}
                    accessibilityState={{ selected, disabled: dateDisabled }}
                    disabled={dateDisabled}
                    onPress={() => { onChange(dateOnly); setOpen(false); }}
                    style={({ pressed }) => [
                      styles.day,
                      today && { borderColor: colors.primary, borderWidth: 1 },
                      selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      pressed && !dateDisabled && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? colors.onPrimary : dateDisabled ? colors.textFaint : outside ? colors.textMuted : colors.text,
                        fontSize: scale(14, layout.typeScale),
                        fontWeight: selected || today ? '700' : '500',
                        opacity: dateDisabled ? 0.45 : 1,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View> : null}

          {calendarView === 'months' ? (
            <View style={styles.selectorGrid}>
              {MONTHS.map((month, index) => {
                const firstDay = toDateOnly(new Date(visibleMonth.getFullYear(), index, 1, 12));
                const lastDay = toDateOnly(new Date(visibleMonth.getFullYear(), index + 1, 0, 12));
                const unavailable = (minimumDate !== undefined && lastDay < minimumDate) || (maximumDate !== undefined && firstDay > maximumDate);
                const selected = index === visibleMonth.getMonth();
                return (
                  <Pressable
                    key={month}
                    accessibilityRole="button"
                    accessibilityLabel={`${month} ${visibleMonth.getFullYear()}`}
                    accessibilityState={{ selected, disabled: unavailable }}
                    disabled={unavailable}
                    onPress={() => { setVisibleMonth((date) => new Date(date.getFullYear(), index, 1, 12)); setCalendarView('days'); }}
                    style={({ pressed }) => [styles.selectorCell, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface }, pressed && { opacity: 0.7 }, unavailable && { opacity: 0.38 }]}
                  >
                    <Text style={{ color: selected ? colors.onPrimary : colors.text, fontSize: scale(14, layout.typeScale), fontWeight: '700' }}>{month.slice(0, 3)}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {calendarView === 'years' ? (
            <View style={styles.selectorGrid}>
              {Array.from({ length: 12 }, (_, index) => yearPageStart + index).map((year) => {
                const firstDay = `${year}-01-01`;
                const lastDay = `${year}-12-31`;
                const unavailable = (minimumDate !== undefined && lastDay < minimumDate) || (maximumDate !== undefined && firstDay > maximumDate);
                const selected = year === visibleMonth.getFullYear();
                return (
                  <Pressable
                    key={year}
                    accessibilityRole="button"
                    accessibilityLabel={`Year ${year}`}
                    accessibilityState={{ selected, disabled: unavailable }}
                    disabled={unavailable}
                    onPress={() => { setVisibleMonth((date) => new Date(year, date.getMonth(), 1, 12)); setCalendarView('months'); }}
                    style={({ pressed }) => [styles.selectorCell, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface }, pressed && { opacity: 0.7 }, unavailable && { opacity: 0.38 }]}
                  >
                    <Text style={{ color: selected ? colors.onPrimary : colors.text, fontSize: scale(14, layout.typeScale), fontWeight: '700' }}>{year}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
        <View style={styles.actions}>
          {allowClear && value ? <Button label="Clear date" variant="secondary" onPress={() => { onChange(''); setOpen(false); }} /> : null}
          {!isDisabledDate(todayValue) ? <Button label="Today" variant="secondary" onPress={() => { onChange(todayValue); setOpen(false); }} /> : null}
        </View>
      </Sheet>
    </View>
  );
}

function CalendarArrow({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.arrow, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && { opacity: 0.65 }]}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 20, fontWeight: '700' }}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600' },
  input: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', gap: 12 },
  calendar: { alignSelf: 'center', borderRadius: radius.card, borderWidth: 1, maxWidth: 440, padding: 12, width: '100%' },
  monthToolbar: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginBottom: 12 },
  monthTitle: { flex: 1, fontWeight: '700', textAlign: 'center' },
  headingGroup: { flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' },
  headingButton: { borderRadius: radius.input, borderWidth: 1, minHeight: 38, justifyContent: 'center', paddingHorizontal: 10 },
  headingText: { fontWeight: '700', textAlign: 'center' },
  arrow: { alignItems: 'center', borderRadius: radius.input, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', justifyContent: 'center', width: '14.285714%' },
  weekday: { fontWeight: '800', letterSpacing: 0.4, paddingVertical: 8, textTransform: 'uppercase' },
  day: { alignItems: 'center', aspectRatio: 1, borderColor: 'transparent', borderRadius: 999, justifyContent: 'center', marginVertical: 2, width: '82%' },
  selectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 250, paddingVertical: 8 },
  selectorCell: { alignItems: 'center', borderRadius: radius.input, borderWidth: 1, flexBasis: '29%', flexGrow: 1, justifyContent: 'center', minHeight: 54, maxWidth: '32%' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
});
