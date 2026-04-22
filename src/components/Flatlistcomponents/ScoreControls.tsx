import { Pressable, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import React, { useMemo, useState } from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

type Run = 0 | 1 | 2 | 3 | 4 | 6;
type ExtraRun = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye';

type Props = {
  onRunPress?: (runs: Run) => void;
  onExtraPick?: (payload: { type: ExtraType; value: ExtraRun }) => void;
  onWicketPress?: () => void;
  onUndoPress?: () => void;
  onEndOverPress?: () => void;
  onEditOversPress?: () => void;
  /** Blocks runs and extras (e.g. match paused or openers not set). */
  ballEntryDisabled?: boolean;
  /** Disables undo when there is nothing to undo. */
  undoDisabled?: boolean;
};

const ScoreControls: React.FC<Props> = ({
  onRunPress,
  onExtraPick,
  onWicketPress,
  onUndoPress,
  onEndOverPress,
  onEditOversPress,
  ballEntryDisabled = false,
  undoDisabled = false,
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const lockEntry = ballEntryDisabled;
  const [extraPickerType, setExtraPickerType] = useState<ExtraType | null>(null);

  const extraPickerLabel = useMemo(() => {
    if (!extraPickerType) return '';
    if (extraPickerType === 'wide') return 'Wide runs';
    if (extraPickerType === 'noball') return 'No-ball runs (bat)';
    if (extraPickerType === 'bye') return 'Bye runs';
    return 'Leg-bye runs';
  }, [extraPickerType]);

  return (
    <View style={styles.container}>
      <View
        style={[lockEntry && { opacity: 0.45 }]}
        pointerEvents={lockEntry ? 'none' : 'auto'}
      >
      <View style={styles.runRows}>
        <View style={styles.runRow}>
          {([0, 1, 2] as const).map(r => (
            <Pressable
              key={r}
              onPress={() => onRunPress?.(r)}
              style={({ pressed }) => [
                styles.runBtn,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemeText style={styles.runText} color="text">
                {r}
              </ThemeText>
            </Pressable>
          ))}
        </View>
        <View style={styles.runRow}>
          {([3, 4, 6] as const).map(r => (
            <Pressable
              key={r}
              onPress={() => onRunPress?.(r)}
              style={({ pressed }) => [
                styles.runBtn,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemeText style={styles.runText} color="text">
                {r}
              </ThemeText>
            </Pressable>
          ))}
        </View>
      </View>

      <ThemeText style={styles.extrasLabel} color="secondaryText">
        Extras
      </ThemeText>

      {extraPickerType ? (
        <View style={[styles.extraPicker, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <ThemeText style={[styles.extraPickerTitle, { color: theme.secondaryText }]} color="secondaryText">
            {extraPickerLabel}
          </ThemeText>
          <View style={styles.extraPickerRow}>
            {([0, 1, 2, 3, 4, 5, 6] as const).map(v => (
              <Pressable
                key={v}
                onPress={() => {
                  onExtraPick?.({ type: extraPickerType, value: v });
                  setExtraPickerType(null);
                }}
                style={({ pressed }) => [
                  styles.extraPickBtn,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <ThemeText style={styles.extraPickText} color="text">
                  {v}
                </ThemeText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setExtraPickerType(null)}
              style={({ pressed }) => [
                styles.extraPickBtn,
                {
                  backgroundColor: theme.primaryMuted,
                  borderColor: theme.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <ThemeText style={styles.extraPickText} color="secondaryText">
                ✕
              </ThemeText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.extrasRow}>
        {(
          [
            ['wide', 'Wd'],
            ['noball', 'Nb'],
            ['bye', 'Bye'],
            ['legbye', 'Lb'],
          ] as const
        ).map(([type, label]) => (
          <Pressable
            key={type}
            onPress={() => setExtraPickerType(type)}
            style={({ pressed }) => [
              styles.extraChip,
              {
                backgroundColor: theme.primaryMuted,
                borderColor: theme.extras,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <ThemeText style={styles.extraText} color="extras">
              {label}
            </ThemeText>
          </Pressable>
        ))}
      </View>
      </View>

      <View style={styles.bottomRow}>
        <Pressable
          onPress={onWicketPress}
          disabled={lockEntry}
          style={({ pressed }) => [
            styles.wicketBtn,
            {
              borderColor: theme.wicket,
              backgroundColor: theme.surface,
              opacity: lockEntry ? 0.35 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemeText style={styles.wicketText} color="wicket">
            Wicket
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={onUndoPress}
          disabled={undoDisabled}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              borderColor: theme.border,
              backgroundColor: theme.surfaceElevated,
              opacity: undoDisabled ? 0.35 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemeText style={styles.secondaryText} color="text">
            Undo
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={onEndOverPress}
          disabled={lockEntry}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              borderColor: theme.border,
              backgroundColor: theme.surfaceElevated,
              opacity: lockEntry ? 0.35 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemeText style={styles.secondaryText} color="text">
            Next ov.
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={onEditOversPress}
          disabled={lockEntry}
          style={({ pressed }) => [
            styles.secondaryBtn,
            {
              borderColor: theme.border,
              backgroundColor: theme.surfaceElevated,
              opacity: lockEntry ? 0.35 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <ThemeText style={styles.secondaryText} color="text">
            Edit
          </ThemeText>
        </Pressable>
      </View>
    </View>
  );
};

export default ScoreControls;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: widthPixel(12),
    paddingTop: heightPixel(4),
  },
  runRows: {
    gap: heightPixel(10),
  },
  runRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: widthPixel(10),
  },
  runBtn: {
    flex: 1,
    minHeight: heightPixel(52),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(22),
  },
  extrasLabel: {
    marginTop: heightPixel(14),
    marginBottom: heightPixel(6),
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  extrasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(8),
  },
  extraPicker: {
    marginBottom: heightPixel(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    padding: widthPixel(10),
  },
  extraPickerTitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(8),
  },
  extraPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(8),
  },
  extraPickBtn: {
    minWidth: widthPixel(44),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    borderRadius: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraPickText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  extraChip: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(14),
    borderRadius: widthPixel(12),
    borderWidth: 1,
  },
  extraText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(13),
  },
  bottomRow: {
    flexDirection: 'row',
    gap: widthPixel(8),
    marginTop: heightPixel(14),
  },
  wicketBtn: {
    flex: 1.2,
    minHeight: heightPixel(48),
    borderRadius: widthPixel(14),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wicketText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  secondaryBtn: {
    flex: 1,
    minHeight: heightPixel(48),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});
