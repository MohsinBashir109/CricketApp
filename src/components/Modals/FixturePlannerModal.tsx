import dayjs from 'dayjs';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  playersPerTeam: number | null;
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

function PlannerSectionHeader(props: {
  title: string;
  body: string;
  onOpenInfo: (title: string, body: string) => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <ThemeText color="text" style={styles.sectionTitle}>
        {props.title}
      </ThemeText>
      <Pressable onPress={() => props.onOpenInfo(props.title, props.body)} hitSlop={10} style={styles.sectionInfoHit}>
        <ThemeText color="primary" style={styles.sectionInfoIcon}>
          ⓘ
        </ThemeText>
      </Pressable>
    </View>
  );
}

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
  const [oversText, setOversText] = useState(String(defaultOvers));
  const [playersText, setPlayersText] = useState('11');
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

  const playersPerTeam = useMemo(() => {
    const raw = playersText.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
  }, [playersText]);
  const playersValid = playersPerTeam != null;

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
  const disableWeekdays = matchesPerDayMode === 'untimed_same_day';
  const disableMatchesPerDayTop = matchesPerDayMode === 'untimed_same_day';

  const weekdayColumns = 4;
  const weekdayChipWidth = useMemo(() => {
    const winW = Dimensions.get('window').width;
    // Modal sheet is ~92% width with ~16px horizontal padding on each side inside ScrollView.
    const sheetW = Math.max(0, winW * 0.92 - widthPixel(32));
    const gap = widthPixel(10);
    const usable = Math.max(0, sheetW - gap * (weekdayColumns - 1));
    return Math.floor(usable / weekdayColumns);
  }, []);

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
    if (qualifiersPerGroup == null) return false;
    if (typeof maxQualifiersPerGroup === 'number' && qualifiersPerGroup > maxQualifiersPerGroup)
      return false;
    return true;
  }, [
    maxQualifiersPerGroup,
    qualifiersPerGroup,
    showQualifiersPerGroup,
    showOpenGroupQualifiers,
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

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoBody, setInfoBody] = useState('');

  const openInfo = (title: string, body: string) => {
    setInfoTitle(title);
    setInfoBody(body);
    setInfoOpen(true);
  };

  const closeInfo = () => setInfoOpen(false);

  return (
    <Fragment>
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
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {variant === 'legacy' ? (
            <>
              <PlannerSectionHeader
                onOpenInfo={openInfo}
                title="Format"
                body="Choose whether this tournament schedule should be generated as a league (round robin) or as a knockout bracket."
              />
              <View style={styles.chipsRow}>
                <Pressable
                  onPress={() => setMode('round_robin')}
                  style={[
                    styles.chip,
                    styles.chipGrow,
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
                    styles.chipGrow,
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
          ) : null}

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <ThemeInput
                title="Overs per match"
                titleInfoPress={() =>
                  openInfo(
                    'Overs per match',
                    'How many overs each fixture should be scheduled for. This is saved on each generated fixture and used when you start scoring.',
                  )
                }
                placeholder="e.g. 10"
                leftIcon={ball}
                value={oversText}
                keyboardType="number-pad"
                onChangeText={setOversText}
                containerStyleOuter={styles.formField}
              />
            </View>
            <View style={styles.formCol}>
              <ThemeInput
                title="Players per team"
                titleInfoPress={() =>
                  openInfo(
                    'Players per team',
                    'Maximum squad size allowed per team for this tournament’s fixtures. During scoring, adds are blocked once a team reaches this number (especially important for “add during match” squads).',
                  )
                }
                placeholder="e.g. 11"
                leftIcon={ball}
                value={playersText}
                keyboardType="number-pad"
                onChangeText={setPlayersText}
                containerStyleOuter={styles.formField}
              />
            </View>
          </View>
          {!playersValid ? (
            <ThemeText color="error" style={styles.inlineError}>
              Players per team is required.
            </ThemeText>
          ) : null}

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <DateTimeField
                title="Start date"
                titleInfoPress={() =>
                  openInfo(
                    'Start date',
                    'The first day the scheduler should begin placing fixtures. If you use weekday rules, this date should fall on an allowed day.',
                  )
                }
                placeholder="YYYY-MM-DD"
                leftIcon={throphy}
                mode="date"
                value={startAt}
                style={styles.formField}
                containerStyleOuter={styles.formField}
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
            </View>
            <View style={styles.formCol}>
              <DateTimeField
                title="Start time (optional)"
                titleInfoPress={() =>
                  openInfo(
                    'Start time (optional)',
                    'Optional default time used when the scheduler assigns a timed slot. You can still edit individual fixture times later.',
                  )
                }
                placeholder="HH:MM (e.g. 09:00)"
                leftIcon={ball}
                mode="time"
                value={startAt}
                style={styles.formField}
                containerStyleOuter={styles.formField}
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
            </View>
          </View>
          {!startValid && scheduleNeedsStart ? (
            <ThemeText color="error" style={styles.inlineError}>
              Select a start date (and optional time).
            </ThemeText>
          ) : null}

          {(showQualifiersPerGroup || showOpenGroupQualifiers) ? (
            <>
              <ThemeInput
                title={
                  showOpenGroupQualifiers
                    ? 'Teams qualifying for knockout'
                    : 'Teams qualifying from each group'
                }
                titleInfoPress={() =>
                  openInfo(
                    showOpenGroupQualifiers ? 'Teams qualifying for knockout' : 'Teams qualifying from each group',
                    showOpenGroupQualifiers
                      ? 'How many teams from the open pool advance into the knockout stage after the group/league fixtures.'
                      : 'How many teams from each group advance into the knockout stage after group fixtures finish.',
                  )
                }
                placeholder="e.g. 2"
                leftIcon={throphy}
                value={qualifiersText}
                keyboardType="number-pad"
                onChangeText={setQualifiersText}
              />
              {qualifiersValid ? (
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

          <PlannerSectionHeader
            onOpenInfo={openInfo}
            title="Allowed match days"
            body="Pick which weekdays matches are allowed to be scheduled on. If you choose “All matches in one day”, weekday rules don’t apply."
          />
          <View style={styles.weekdaysRow}>
            {weekdayOptions.map((opt, idx) => {
              const active = allowedWeekdays.includes(opt.id);
              const disabled = disableWeekdays;
              const col = idx % weekdayColumns;
              const isLastCol = col === weekdayColumns - 1;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    if (disabled) return;
                    toggleWeekday(opt.id);
                  }}
                  disabled={disabled}
                  style={[
                    styles.weekdayChip,
                    disabled && styles.weekdayChipDisabled,
                    !isLastCol && styles.weekdayChipSpacingRight,
                    styles.weekdayChipSpacingBottom,
                    {
                      width: weekdayChipWidth,
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
          {!disableWeekdays && !weekdaysValid ? (
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

          <PlannerSectionHeader
            onOpenInfo={openInfo}
            title="Matches per day"
            body="Controls how many fixtures are placed per calendar day (or uses a random range). “All matches in one day” creates fixtures without specific times so you can assign them later."
          />
          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Pressable
                onPress={() => {
                  setMatchesPerDayMode('fixed');
                  setMatchesPerDay(1);
                }}
                style={[
                  styles.chip,
                  styles.gridChip,
                  disableMatchesPerDayTop && styles.chipMuted,
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
            </View>
            <View style={styles.formCol}>
              <Pressable
                onPress={() => {
                  setMatchesPerDayMode('fixed');
                  setMatchesPerDay(2);
                }}
                style={[
                  styles.chip,
                  styles.gridChip,
                  disableMatchesPerDayTop && styles.chipMuted,
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
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formCol}>
              <Pressable
                onPress={() => {
                  setMatchesPerDayMode('random');
                }}
                style={[
                  styles.chip,
                  styles.gridChip,
                  disableMatchesPerDayTop && styles.chipMuted,
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
            <View style={styles.formCol}>
              <Pressable
                onPress={() => setMatchesPerDayMode('untimed_same_day')}
                style={[
                  styles.chip,
                  styles.gridChip,
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
                  All matches in one day
                </ThemeText>
              </Pressable>
            </View>
          </View>

          {matchesPerDayMode === 'random' ? (
            <>
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <ThemeInput
                    title="Min matches/day"
                    titleInfoPress={() =>
                      openInfo(
                        'Min matches/day',
                        'When “Random” is selected, this is the minimum number of fixtures the generator will try to place on a single day.',
                      )
                    }
                    placeholder="e.g. 1"
                    leftIcon={ball}
                    value={randomMinText}
                    keyboardType="number-pad"
                    onChangeText={setRandomMinText}
                    containerStyleOuter={styles.formField}
                  />
                </View>
                <View style={styles.formCol}>
                  <ThemeInput
                    title="Max matches/day"
                    titleInfoPress={() =>
                      openInfo(
                        'Max matches/day',
                        'When “Random” is selected, this is the maximum number of fixtures the generator will try to place on a single day.',
                      )
                    }
                    placeholder="e.g. 2"
                    leftIcon={ball}
                    value={randomMaxText}
                    keyboardType="number-pad"
                    onChangeText={setRandomMaxText}
                    containerStyleOuter={styles.formField}
                  />
                </View>
              </View>
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

          {variant === 'full' ? (
            <>
              <PlannerSectionHeader
                onOpenInfo={openInfo}
                title="Knockout"
                body="Knockout is included for this tournament type. Pairings are created as placeholders until qualifiers are decided."
              />
              <Pressable
                disabled
                onPress={() => {}}
                style={[
                  styles.chipFullWidth,
                  {
                    backgroundColor: theme.primaryMuted,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <ThemeText color="primary" style={styles.chipText}>
                  Include knockout
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.chipSubTextSm}>
                  Group fixtures plus a knockout bracket are generated (knockout placeholders until
                  the group stage finishes).
                </ThemeText>
              </Pressable>
            </>
          ) : null}

          <Button
            title="Generate fixtures"
            leftIcon={throphy}
            onPress={() => {
              if (!oversValid) return;
              if (!playersValid) return;
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
                  playersPerTeam,
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
                  knockoutEnabled: variant === 'full' ? true : mode === 'knockout',
                  openGroupQualifiers:
                    variant === 'full' && showOpenGroupQualifiers && typeof q === 'number'
                      ? q
                      : null,
                });
                onClose();
              };

              if (variant === 'full' && typeof qualifiersPerGroup === 'number') {
                const slots =
                  tournamentFormat === 'open' ? qualifiersPerGroup : groupCount * qualifiersPerGroup;
                // eslint-disable-next-line no-bitwise
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
              !playersValid ||
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

    <Modal visible={infoOpen} transparent animationType="fade" onRequestClose={closeInfo}>
      <Pressable style={styles.infoBackdrop} onPress={closeInfo} />
      <View style={styles.infoRoot} pointerEvents="box-none">
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoHeader}>
            <ThemeText color="text" style={styles.infoTitle}>
              {infoTitle}
            </ThemeText>
            <Pressable onPress={closeInfo} hitSlop={10}>
              <ThemeText color="secondaryText" style={styles.infoClose}>
                ✕
              </ThemeText>
            </Pressable>
          </View>
          <ThemeText color="secondaryText" style={styles.infoBody}>
            {infoBody}
          </ThemeText>
        </View>
      </View>
    </Modal>
    </Fragment>
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
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
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
  formRow: {
    flexDirection: 'row',
    gap: widthPixel(10),
    marginBottom: heightPixel(6),
  },
  formCol: {
    flex: 1,
    minWidth: 0,
  },
  formField: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeaderRow: {
    marginTop: heightPixel(10),
    marginBottom: heightPixel(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(8),
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionInfoHit: {
    paddingHorizontal: widthPixel(4),
    paddingVertical: heightPixel(2),
  },
  sectionInfoIcon: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
    lineHeight: fontPixel(18),
  },
  infoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  infoRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthPixel(18),
  },
  infoCard: {
    width: '100%',
    maxWidth: widthPixel(420),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: widthPixel(10),
    marginBottom: heightPixel(8),
  },
  infoTitle: {
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  infoClose: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    lineHeight: fontPixel(20),
  },
  infoBody: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
  },
  chipsRow: {
    flexDirection: 'row',
    gap: widthPixel(10),
    marginBottom: heightPixel(8),
  },
  chip: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrow: {
    flex: 1,
    minWidth: 0,
  },
  gridChip: {
    alignSelf: 'stretch',
    width: '100%',
    minHeight: heightPixel(46),
  },
  chipMuted: {
    opacity: 0.45,
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
  chipSubTextSm: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(10),
    lineHeight: fontPixel(14),
    fontFamily: fontFamilies.medium,
  },
  weekdaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: heightPixel(8),
  },
  weekdayChip: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipSpacingRight: {
    marginRight: widthPixel(10),
  },
  weekdayChipSpacingBottom: {
    marginBottom: heightPixel(10),
  },
  weekdayChipDisabled: {
    opacity: 0.45,
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

