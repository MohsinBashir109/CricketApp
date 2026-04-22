import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import DateTimePicker, {
  AndroidEvent,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import ThemeInput from '../ThemeInput';

type Props = {
  title: string;
  /** Optional info button shown next to the title. */
  titleInfoPress?: () => void;
  placeholder?: string;
  leftIcon: any;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (next: Date | null) => void;
  /** Optional bounds (primarily for date mode). */
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  /** iOS only: can keep consistent with your design. */
  iosDisplay?: 'default' | 'spinner' | 'compact' | 'inline';
  /** Android only. */
  androidDisplay?: 'default' | 'spinner' | 'calendar' | 'clock';
  /** Pre-formatted string to display inside the field (keeps UI stable). */
  displayValue: string;
  /** Applied to the outer wrapper (e.g. `flex: 1` in a two-column row). */
  style?: ViewStyle;
  /** Forwarded to `ThemeInput` outer container. */
  containerStyleOuter?: ViewStyle;
};

const DateTimeField = ({
  title,
  titleInfoPress,
  placeholder,
  leftIcon,
  mode,
  value,
  onChange,
  minimumDate,
  maximumDate,
  disabled,
  iosDisplay = 'spinner',
  androidDisplay = 'default',
  displayValue,
  style,
  containerStyleOuter,
}: Props) => {
  const [open, setOpen] = useState(false);

  const pickerValue = useMemo(() => value ?? new Date(), [value]);

  const close = useCallback(() => setOpen(false), []);
  const openPicker = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  const handleChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (Platform.OS === 'android') {
        const e = event as AndroidEvent;
        if (e.type === 'dismissed') {
          close();
          return;
        }
        if (e.type === 'set') {
          onChange(selected ?? value ?? new Date());
          close();
          return;
        }
        close();
        return;
      }

      // iOS: keep open until user closes the sheet/modal in your UI.
      // With spinner display, onChange fires continuously; we commit immediately.
      if (selected) onChange(selected);
    },
    [close, onChange, value],
  );

  return (
    <View style={[styles.root, style]}>
      <ThemeInput
        title={title}
        titleInfoPress={titleInfoPress}
        placeholder={placeholder}
        leftIcon={leftIcon}
        value={displayValue}
        editable={false}
        containerStyleOuter={containerStyleOuter}
      />
      <Pressable style={styles.overlay} onPress={openPicker} disabled={disabled} />

      {open ? (
        <DateTimePicker
          value={pickerValue}
          mode={mode}
          display={Platform.OS === 'ios' ? iosDisplay : androidDisplay}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default React.memo(DateTimeField);

