import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import ThemeText from '../ThemeText';
import ThemeInput from '../ThemeInput';
import Button from '../themeButton';
import { ball, throphy } from '../../assets/images';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import DateTimeField from '../DateTime/DateTimeField';
import { formatDateForUiYmd, formatTimeForUiHm, isoToDate } from '../../utils/datetime';

type FixtureMode = 'round_robin' | 'knockout';

type Props = {
  visible: boolean;
  existingCount: number;
  defaultMode: FixtureMode;
  defaultDoubleRoundRobin?: boolean;
  defaultOvers: number;
  /** ISO date-time for default start date. */
  defaultStartAtIso: string;
  /** For group-based tournaments, ask how many qualify from each group. */
  showQualifiersPerGroup?: boolean;
  defaultQualifiersPerGroup?: number;
  maxQualifiersPerGroup?: number;
  onClose: () => void;
  onGenerate: (payload: {
    mode: FixtureMode;
    overs: number;
    doubleRoundRobin: boolean;
    startAtIso: string;
    matchesPerDayMode: 'fixed' | 'random';
    matchesPerDay: 1 | 2;
    randomMinPerDay: number;
    randomMaxPerDay: number;
    allowedWeekdays: number[]; // 0=Sun ... 6=Sat
    qualifiersPerGroup: number | null;
  }) => void;
};

const FixturePlannerModal = ({
  visible,
  existingCount,
  defaultMode,
  defaultDoubleRoundRobin = false,
  defaultOvers,
  defaultStartAtIso,
  showQualifiersPerGroup = false,
  defaultQualifiersPerGroup = 2,
  maxQualifiersPerGroup,
  onClose,
  onGenerate,
}: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const [mode, setMode] = useState<FixtureMode>(defaultMode);
  const [oversText, setOversText] = useState(String(defaultOvers));
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(defaultDoubleRoundRobin);
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [qualifiersText, setQualifiersText] = useState(String(defaultQualifiersPerGroup));
  const [matchesPerDayMode, setMatchesPerDayMode] = useState<'fixed' | 'random'>(
    'fixed',
  );
  const [matchesPerDay, setMatchesPerDay] = useState<1 | 2>(1);
  const [randomMinText, setRandomMinText] = useState('1');
  const [randomMaxText, setRandomMaxText] = useState('2');
  const [allowedWeekdays, setAllowedWeekdays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);

  const overs = useMemo(() => Number(oversText), [oversText]);
  const oversValid = Number.isFinite(overs) && overs > 0;

  const canDouble = mode === 'round_robin';

  const randomMinPerDay = useMemo(() => Number(randomMinText), [randomMinText]);
  const randomMaxPerDay = useMemo(() => Number(randomMaxText), [randomMaxText]);
  const randomRangeValid =
    Number.isFinite(randomMinPerDay) &&
    Number.isFinite(randomMaxPerDay) &&
    randomMinPerDay >= 1 &&
    randomMaxPerDay >= randomMinPerDay &&
    randomMaxPerDay <= 6;

  const weekdaysValid = allowedWeekdays.length > 0;

  const qualifiersPerGroup = useMemo(() => {
    if (!showQualifiersPerGroup) return null;
    const n = Number(qualifiersText.trim());
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  }, [qualifiersText, showQualifiersPerGroup]);

  const qualifiersValid = useMemo(() => {
    if (!showQualifiersPerGroup) return true;
    if (qualifiersPerGroup == null) return false;
    if (typeof maxQualifiersPerGroup === 'number' && qualifiersPerGroup > maxQualifiersPerGroup)
      return false;
    return true;
  }, [maxQualifiersPerGroup, qualifiersPerGroup, showQualifiersPerGroup]);

  const startAtIso = useMemo(() => (startAt ? startAt.toISOString() : null), [startAt]);

  const startValid = !!startAtIso;

  useEffect(() => {
    if (!visible) return;
    setMode(defaultMode);
    setOversText(String(defaultOvers));
    setDoubleRoundRobin(defaultDoubleRoundRobin);
    setStartAt(isoToDate(defaultStartAtIso) ?? new Date());
    setQualifiersText(String(defaultQualifiersPerGroup));
    setMatchesPerDayMode('fixed');
    setMatchesPerDay(1);
    setRandomMinText('1');
    setRandomMaxText('2');
    setAllowedWeekdays([0, 1, 2, 3, 4, 5, 6]);
  }, [
    visible,
    defaultMode,
    defaultOvers,
    defaultDoubleRoundRobin,
    existingCount,
    defaultStartAtIso,
    defaultQualifiersPerGroup,
  ]);

  const weekdayOptions = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 0, label: 'Sun' },
  ];

  const toggleWeekday = (day: number) => {
    setAllowedWeekdays(current =>
      current.includes(day) ? current.filter(d => d !== day) : [...current, day],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <View style={styles.header}>
          <ThemeText color="text" style={styles.title}>
            Fixture planner
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            Generate a clean match list for this tournament.
          </ThemeText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <ThemeText color="text" style={styles.sectionLabel}>
            Format
          </ThemeText>
          <View style={styles.chipsRow}>
            <Pressable
              onPress={() => setMode('round_robin')}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    mode === 'round_robin' ? theme.primaryMuted : theme.background,
                  borderColor: mode === 'round_robin' ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemeText
                color={mode === 'round_robin' ? 'primary' : 'text'}
                style={styles.chipText}
              >
                Round robin
              </ThemeText>
            </Pressable>
            <Pressable
              onPress={() => setMode('knockout')}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    mode === 'knockout' ? theme.primaryMuted : theme.background,
                  borderColor: mode === 'knockout' ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemeText
                color={mode === 'knockout' ? 'primary' : 'text'}
                style={styles.chipText}
              >
                Knockout
              </ThemeText>
            </Pressable>
          </View>

          <ThemeInput
            title="Overs per match"
            placeholder="e.g. 10"
            leftIcon={ball}
            value={oversText}
            keyboardType="number-pad"
            onChangeText={setOversText}
          />

          <DateTimeField
            title="Start date"
            placeholder="YYYY-MM-DD"
            leftIcon={throphy}
            mode="date"
            value={startAt}
            onChange={next => {
              if (!next) return;
              const current = startAt ?? new Date();
              const merged = new Date(
                next.getFullYear(),
                next.getMonth(),
                next.getDate(),
                current.getHours(),
                current.getMinutes(),
                0,
                0,
              );
              setStartAt(merged);
            }}
            displayValue={formatDateForUiYmd(startAt)}
          />
          <DateTimeField
            title="Start time (optional)"
            placeholder="HH:MM (e.g. 09:00)"
            leftIcon={ball}
            mode="time"
            value={startAt}
            onChange={next => {
              if (!next) return;
              const current = startAt ?? new Date();
              const merged = new Date(
                current.getFullYear(),
                current.getMonth(),
                current.getDate(),
                next.getHours(),
                next.getMinutes(),
                0,
                0,
              );
              setStartAt(merged);
            }}
            displayValue={formatTimeForUiHm(startAt)}
          />
          {!startValid ? (
            <ThemeText color="error" style={styles.inlineError}>
              Select a start date (and optional time).
            </ThemeText>
          ) : null}

          {showQualifiersPerGroup ? (
            <>
              <ThemeInput
                title="Qualified teams per group"
                placeholder="e.g. 2"
                leftIcon={throphy}
                value={qualifiersText}
                keyboardType="number-pad"
                onChangeText={setQualifiersText}
              />
              {!qualifiersValid ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Enter a valid number{typeof maxQualifiersPerGroup === 'number'
                    ? ` (1 to ${maxQualifiersPerGroup}).`
                    : '.'}
                </ThemeText>
              ) : null}
            </>
          ) : null}

          <ThemeText color="text" style={styles.sectionLabel}>
            Allowed match days
          </ThemeText>
          <View style={styles.weekdaysRow}>
            {weekdayOptions.map(opt => {
              const active = allowedWeekdays.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => toggleWeekday(opt.id)}
                  style={[
                    styles.weekdayChip,
                    {
                      backgroundColor: active ? theme.primaryMuted : theme.background,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemeText
                    color={active ? 'primary' : 'text'}
                    style={styles.weekdayChipText}
                  >
                    {opt.label}
                  </ThemeText>
                </Pressable>
              );
            })}
          </View>
          {!weekdaysValid ? (
            <ThemeText color="error" style={styles.inlineError}>
              Select at least one weekday.
            </ThemeText>
          ) : null}

          {existingCount > 0 ? (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: theme.primaryMuted, borderColor: theme.border },
              ]}
            >
              <ThemeText color="text" style={styles.warningTitle}>
                Regenerating will override
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.warningText}>
                Existing fixtures and results can be lost. Continue only if you want to
                recreate the tournament fixtures from scratch.
              </ThemeText>
            </View>
          ) : null}

          <ThemeText color="text" style={styles.sectionLabel}>
            Matches per day
          </ThemeText>
          <View style={styles.chipsRow}>
            <Pressable
              onPress={() => {
                setMatchesPerDayMode('fixed');
                setMatchesPerDay(1);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    matchesPerDayMode === 'fixed' && matchesPerDay === 1
                      ? theme.primaryMuted
                      : theme.background,
                  borderColor:
                    matchesPerDayMode === 'fixed' && matchesPerDay === 1
                      ? theme.primary
                      : theme.border,
                },
              ]}
            >
              <ThemeText
                color={
                  matchesPerDayMode === 'fixed' && matchesPerDay === 1
                    ? 'primary'
                    : 'text'
                }
                style={styles.chipText}
              >
                1 match / day
              </ThemeText>
            </Pressable>
            <Pressable
              onPress={() => {
                setMatchesPerDayMode('fixed');
                setMatchesPerDay(2);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    matchesPerDayMode === 'fixed' && matchesPerDay === 2
                      ? theme.primaryMuted
                      : theme.background,
                  borderColor:
                    matchesPerDayMode === 'fixed' && matchesPerDay === 2
                      ? theme.primary
                      : theme.border,
                },
              ]}
            >
              <ThemeText
                color={
                  matchesPerDayMode === 'fixed' && matchesPerDay === 2
                    ? 'primary'
                    : 'text'
                }
                style={styles.chipText}
              >
                2 matches / day
              </ThemeText>
            </Pressable>
            <Pressable
              onPress={() => setMatchesPerDayMode('random')}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    matchesPerDayMode === 'random'
                      ? theme.primaryMuted
                      : theme.background,
                  borderColor:
                    matchesPerDayMode === 'random' ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemeText
                color={matchesPerDayMode === 'random' ? 'primary' : 'text'}
                style={styles.chipText}
              >
                Random
              </ThemeText>
            </Pressable>
          </View>

          {matchesPerDayMode === 'random' ? (
            <>
              <ThemeInput
                title="Random min matches/day"
                placeholder="e.g. 1"
                leftIcon={ball}
                value={randomMinText}
                keyboardType="number-pad"
                onChangeText={setRandomMinText}
              />
              <ThemeInput
                title="Random max matches/day"
                placeholder="e.g. 2"
                leftIcon={ball}
                value={randomMaxText}
                keyboardType="number-pad"
                onChangeText={setRandomMaxText}
              />
              {!randomRangeValid ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Enter a valid range (min ≥ 1, max ≥ min, max ≤ 6).
                </ThemeText>
              ) : null}
            </>
          ) : null}

          <ThemeText color="text" style={styles.sectionLabel}>
            Options
          </ThemeText>

          <Pressable
            disabled={!canDouble}
            onPress={() => canDouble && setDoubleRoundRobin(v => !v)}
            style={[
              styles.optionRow,
              styles.optionRowEnabled,
              !canDouble && styles.optionRowDisabled,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}
          >
            <View style={styles.optionText}>
              <ThemeText color="text" style={styles.optionTitle}>
                Double round robin
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.optionSub}>
                Each team plays twice (home/away style).
              </ThemeText>
            </View>
            <ThemeText color="secondaryText" style={styles.optionValue}>
              {doubleRoundRobin ? 'On' : 'Off'}
            </ThemeText>
          </Pressable>

          <Button
            title="Generate fixtures"
            leftIcon={throphy}
            onPress={() => {
              if (!oversValid) return;
              if (!startValid) return;
              if (!weekdaysValid) return;
              if (!qualifiersValid) return;
              if (matchesPerDayMode === 'random' && !randomRangeValid) return;
              onGenerate({
                mode,
                overs,
                doubleRoundRobin: canDouble ? doubleRoundRobin : false,
                startAtIso: startAtIso!,
                matchesPerDayMode,
                matchesPerDay,
                randomMinPerDay:
                  matchesPerDayMode === 'random' ? randomMinPerDay : matchesPerDay,
                randomMaxPerDay:
                  matchesPerDayMode === 'random' ? randomMaxPerDay : matchesPerDay,
                allowedWeekdays,
                qualifiersPerGroup,
              });
              onClose();
            }}
            disabled={
              !oversValid ||
              !startValid ||
              !weekdaysValid ||
              !qualifiersValid ||
              (matchesPerDayMode === 'random' && !randomRangeValid)
            }
          />

          <Pressable onPress={onClose} style={styles.cancel}>
            <ThemeText color="primary" style={styles.cancelText}>
              Cancel
            </ThemeText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: widthPixel(20),
    borderTopRightRadius: widthPixel(20),
    paddingBottom: heightPixel(18),
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: widthPixel(46),
    height: heightPixel(5),
    borderRadius: widthPixel(999),
    marginTop: heightPixel(10),
    marginBottom: heightPixel(10),
  },
  header: {
    paddingHorizontal: widthPixel(16),
    marginBottom: heightPixel(8),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  sub: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
  },
  content: {
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(18),
  },
  sectionLabel: {
    marginTop: heightPixel(10),
    marginBottom: heightPixel(8),
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: widthPixel(10),
    marginBottom: heightPixel(8),
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    alignItems: 'center',
  },
  chipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  weekdaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginBottom: heightPixel(8),
  },
  weekdayChip: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
  },
  weekdayChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  warningCard: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  warningTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  warningText: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.medium,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: heightPixel(10),
  },
  optionText: {
    flex: 1,
    paddingRight: widthPixel(12),
  },
  optionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  optionSub: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
  },
  optionValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(12),
  },
  optionRowEnabled: {},
  optionRowDisabled: {
    opacity: 0.5,
  },
  inlineError: {
    marginTop: -heightPixel(2),
    marginBottom: heightPixel(8),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.medium,
  },
  cancel: {
    alignSelf: 'center',
    marginTop: heightPixel(6),
    paddingVertical: heightPixel(10),
  },
  cancelText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});

export default FixturePlannerModal;

