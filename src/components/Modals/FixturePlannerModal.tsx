import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { cardShadowLg } from '../../utils/cardShadow';
import DateTimeField from '../DateTime/DateTimeField';
import { formatDateForUiYmd, formatTimeForUiHm, isoToDate } from '../../utils/datetime';

type FixtureMode = 'round_robin' | 'knockout';

type GeneratePayload = {
  mode: FixtureMode;
  overs: number;
  doubleRoundRobin: boolean;
  startAtIso: string;
  matchesPerDayMode: 'fixed' | 'random' | 'untimed_same_day';
  matchesPerDay: 1 | 2;
  randomMinPerDay: number;
  randomMaxPerDay: number;
  allowedWeekdays: number[]; // 0=Sun ... 6=Sat
  qualifiersPerGroup: number | null;
  scheduleVariant?: 'full' | 'legacy';
  knockoutEnabled?: boolean;
  openGroupQualifiers?: number | null;
};

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
  /** Open pool: top N qualify for knockout. */
  showOpenGroupQualifiers?: boolean;
  defaultQualifiersPerGroup?: number;
  maxQualifiersPerGroup?: number;
  /** When variant is full, used to validate knockout bracket size. */
  tournamentFormat?: 'open' | 'groupBased';
  groupCount?: number;
  /** full = league + knockout shell (default for tournament fixtures). */
  variant?: 'full' | 'legacy';
  onClose: () => void;
  onGenerate: (payload: GeneratePayload) => void;
};

const FixturePlannerModal = ({
  visible,
  existingCount,
  defaultMode,
  defaultDoubleRoundRobin = false,
  defaultOvers,
  defaultStartAtIso,
  showQualifiersPerGroup = false,
  showOpenGroupQualifiers = false,
  defaultQualifiersPerGroup = 2,
  maxQualifiersPerGroup,
  tournamentFormat = 'open',
  groupCount = 1,
  variant = 'full',
  onClose,
  onGenerate,
}: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const [mode, setMode] = useState<FixtureMode>(defaultMode);
  const [knockoutEnabled, setKnockoutEnabled] = useState(true);
  const [oversText, setOversText] = useState(String(defaultOvers));
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [qualifiersText, setQualifiersText] = useState(String(defaultQualifiersPerGroup));
  const [allowedWeekdays, setAllowedWeekdays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [matchesPerDayMode, setMatchesPerDayMode] = useState<
    'fixed' | 'random' | 'untimed_same_day'
  >('fixed');
  const [matchesPerDay, setMatchesPerDay] = useState<1 | 2>(1);
  const [randomMinText, setRandomMinText] = useState('1');
  const [randomMaxText, setRandomMaxText] = useState('2');

  const overs = useMemo(() => Number(oversText), [oversText]);
  const oversValid = Number.isFinite(overs) && overs > 0;

  const weekdaysValid = allowedWeekdays.length > 0;

  const randomMinPerDay = useMemo(() => Number(randomMinText), [randomMinText]);
  const randomMaxPerDay = useMemo(() => Number(randomMaxText), [randomMaxText]);
  const randomRangeValid =
    Number.isFinite(randomMinPerDay) &&
    Number.isFinite(randomMaxPerDay) &&
    randomMinPerDay >= 1 &&
    randomMaxPerDay >= randomMinPerDay &&
    randomMaxPerDay <= 6;

  const scheduleNeedsStart = matchesPerDayMode !== 'untimed_same_day';

  const startWeekdayMatchesAllowed = useMemo(() => {
    if (!scheduleNeedsStart) return true;
    if (!startAt) return false;
    return allowedWeekdays.includes(dayjs(startAt).day());
  }, [allowedWeekdays, startAt, scheduleNeedsStart]);

  const qualifiersPerGroup = useMemo(() => {
    if (!showQualifiersPerGroup && !showOpenGroupQualifiers) return null;
    const n = Number(qualifiersText.trim());
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  }, [qualifiersText, showQualifiersPerGroup, showOpenGroupQualifiers]);

  const qualifiersValid = useMemo(() => {
    if (!showQualifiersPerGroup && !showOpenGroupQualifiers) return true;
    if (variant === 'full' && !knockoutEnabled) return true;
    if (qualifiersPerGroup == null) return false;
    if (typeof maxQualifiersPerGroup === 'number' && qualifiersPerGroup > maxQualifiersPerGroup)
      return false;
    return true;
  }, [
    maxQualifiersPerGroup,
    qualifiersPerGroup,
    showQualifiersPerGroup,
    showOpenGroupQualifiers,
    variant,
    knockoutEnabled,
  ]);

  const startAtIso = useMemo(() => (startAt ? startAt.toISOString() : null), [startAt]);

  const startValid = !!startAtIso;

  useEffect(() => {
    if (!visible) return;
    setMode(defaultMode);
    setOversText(String(defaultOvers));
    setStartAt(isoToDate(defaultStartAtIso) ?? new Date());
    setQualifiersText(String(defaultQualifiersPerGroup));
    setAllowedWeekdays([0, 1, 2, 3, 4, 5, 6]);
    setMatchesPerDayMode('fixed');
    setMatchesPerDay(1);
    setRandomMinText('1');
    setRandomMaxText('2');
    setKnockoutEnabled(true);
  }, [
    visible,
    defaultMode,
    defaultOvers,
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
      <View
        style={[
          styles.sheet,
          isDark ? styles.sheetShadowDark : styles.sheetShadowLight,
          { backgroundColor: theme.surface },
        ]}
      >
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
          {variant === 'legacy' ? (
            <>
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
            </>
          ) : (
            <>
              <ThemeText color="text" style={styles.sectionLabel}>
                Knockout stage
              </ThemeText>
              <View style={[styles.knockoutRow, { borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <ThemeText color="text" style={styles.knockoutTitle}>
                    Include knockout
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.knockoutSub}>
                    Generates group fixtures plus a knockout bracket (placeholders until the
                    group stage finishes).
                  </ThemeText>
                </View>
                <Switch value={knockoutEnabled} onValueChange={setKnockoutEnabled} />
              </View>
            </>
          )}

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
          {!startValid && scheduleNeedsStart ? (
            <ThemeText color="error" style={styles.inlineError}>
              Select a start date (and optional time).
            </ThemeText>
          ) : null}

          {(showQualifiersPerGroup || showOpenGroupQualifiers) &&
          (variant !== 'full' || knockoutEnabled) ? (
            <>
              <ThemeInput
                title={
                  showOpenGroupQualifiers
                    ? 'Teams qualifying for knockout'
                    : 'Teams qualifying from each group'
                }
                placeholder="e.g. 2"
                leftIcon={throphy}
                value={qualifiersText}
                keyboardType="number-pad"
                onChangeText={setQualifiersText}
              />
              {qualifiersValid && (variant !== 'full' || knockoutEnabled) ? (
                <ThemeText color="secondaryText" style={styles.helperAfterInput}>
                  {showOpenGroupQualifiers
                    ? `Top ${qualifiersPerGroup ?? '—'} team(s) from the open group will qualify for knockout.`
                    : `Top ${qualifiersPerGroup ?? '—'} team(s) from each group will qualify for knockout.`}
                </ThemeText>
              ) : null}
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

          <Pressable
            onPress={() => setMatchesPerDayMode('untimed_same_day')}
            style={[
              styles.chipFullWidth,
              {
                backgroundColor:
                  matchesPerDayMode === 'untimed_same_day'
                    ? theme.primaryMuted
                    : theme.background,
                borderColor:
                  matchesPerDayMode === 'untimed_same_day'
                    ? theme.primary
                    : theme.border,
              },
            ]}
          >
            <ThemeText
              color={matchesPerDayMode === 'untimed_same_day' ? 'primary' : 'text'}
              style={styles.chipText}
            >
              All matches in one day (no times)
            </ThemeText>
            <ThemeText color="secondaryText" style={styles.chipSubText}>
              Fixtures are created without a scheduled date or time; set times later
              if needed.
            </ThemeText>
          </Pressable>

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

          {!startWeekdayMatchesAllowed && scheduleNeedsStart && startValid ? (
            <ThemeText color="error" style={styles.inlineError}>
              Start date must fall on an allowed weekday so every match stays on a
              permitted day.
            </ThemeText>
          ) : null}

          <Button
            title="Generate fixtures"
            leftIcon={throphy}
            onPress={() => {
              if (!oversValid) return;
              if (scheduleNeedsStart && !startValid) return;
              if (!weekdaysValid) return;
              if (!qualifiersValid) return;
              if (scheduleNeedsStart && !startWeekdayMatchesAllowed) return;
              if (matchesPerDayMode === 'random' && !randomRangeValid) return;

              const run = () => {
                const q = qualifiersPerGroup;
                onGenerate({
                  mode: variant === 'full' ? 'round_robin' : mode,
                  overs,
                  doubleRoundRobin:
                    variant === 'full' || mode === 'round_robin' ? !!defaultDoubleRoundRobin : false,
                  startAtIso: startAtIso ?? new Date().toISOString(),
                  matchesPerDayMode,
                  matchesPerDay,
                  randomMinPerDay:
                    matchesPerDayMode === 'random' ? randomMinPerDay : matchesPerDay,
                  randomMaxPerDay:
                    matchesPerDayMode === 'random' ? randomMaxPerDay : matchesPerDay,
                  allowedWeekdays,
                  qualifiersPerGroup: q,
                  scheduleVariant: variant,
                  knockoutEnabled: variant === 'full' ? knockoutEnabled : mode === 'knockout',
                  openGroupQualifiers:
                    variant === 'full' && showOpenGroupQualifiers && typeof q === 'number'
                      ? q
                      : null,
                });
                onClose();
              };

              if (variant === 'full' && knockoutEnabled && typeof qualifiersPerGroup === 'number') {
                const slots =
                  tournamentFormat === 'open' ? qualifiersPerGroup : groupCount * qualifiersPerGroup;
                const isPow2 = slots > 0 && (slots & (slots - 1)) === 0;
                if (!isPow2) {
                  Alert.alert(
                    'Knockout bracket size',
                    `${slots} teams would enter knockout. For a balanced bracket, 2, 4, 8, 16, or 32 teams work best; otherwise byes are used automatically.`,
                    [
                      { text: 'Adjust', style: 'cancel' },
                      { text: 'Continue', onPress: run },
                    ],
                  );
                  return;
                }
              }

              run();
            }}
            disabled={
              !oversValid ||
              (scheduleNeedsStart && !startValid) ||
              !weekdaysValid ||
              !qualifiersValid ||
              (scheduleNeedsStart && !startWeekdayMatchesAllowed) ||
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
  sheetShadowLight: cardShadowLg(false),
  sheetShadowDark: cardShadowLg(true),
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
  chipFullWidth: {
    width: '100%',
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  chipSubText: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(11),
    lineHeight: fontPixel(16),
    fontFamily: fontFamilies.medium,
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
  inlineError: {
    marginTop: -heightPixel(2),
    marginBottom: heightPixel(8),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.medium,
  },
  helperAfterInput: {
    marginTop: heightPixel(6),
    marginBottom: heightPixel(8),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.medium,
  },
  knockoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    padding: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  knockoutTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  knockoutSub: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
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

