import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import type { TournamentFixtureManualOutcome } from '../../types/TournamentTypes';

type TeamLite = { id: string; name: string };

export type EditFixtureManualComplete = {
  manualOutcome: TournamentFixtureManualOutcome;
  resultSummary: string;
  winnerTeamId: string | null;
};

type Props = {
  visible: boolean;
  teams: TeamLite[];
  fixture: {
    id: string;
    teamAId: string;
    teamBId: string;
    scheduledAt: string | null;
    status: string;
    matchId: string | null;
    overs?: number | null;
    playersPerTeam?: number | null;
  } | null;
  onClose: () => void;
  onSave: (payload: {
    fixtureId: string;
    teamAId: string;
    teamBId: string;
    scheduledAtIso: string;
    overs: number | null;
    playersPerTeam: number | null;
    status: 'upcoming' | 'no_result' | 'abandoned';
    resultSummary: string | null;
    /** When set, marks the fixture completed without starting the scorer. */
    completeWithoutScoring?: EditFixtureManualComplete | null;
  }) => void;
};

const MATCH_SETTINGS_TABS = [
  { key: 'setup' as const, label: 'Fixture & schedule' },
  { key: 'result' as const, label: 'Enter result' },
] as const;

const EditFixtureModal = ({ visible, teams, fixture, onClose, onSave }: Props) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const canEdit = useMemo(() => {
    if (!fixture) return false;
    return fixture.status === 'upcoming' && !fixture.matchId;
  }, [fixture]);

  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [oversText, setOversText] = useState<string>('');
  const [playersText, setPlayersText] = useState<string>('');
  const [matchCondition, setMatchCondition] = useState<
    'scheduled' | 'delayed' | 'rain' | 'abandoned'
  >('scheduled');

  /** Mutually exclusive with innings shortcut: 'none' | 'teamA' | 'teamB' | 'tie' */
  const [directWinner, setDirectWinner] = useState<'none' | 'teamA' | 'teamB' | 'tie'>('none');
  const [batFirst, setBatFirst] = useState<'none' | 'teamA' | 'teamB'>('none');
  const [inningsWin, setInningsWin] = useState<'none' | 'batting' | 'bowling'>('none');
  const [scoreLineA, setScoreLineA] = useState('');
  const [scoreLineB, setScoreLineB] = useState('');
  const [resultNote, setResultNote] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'result'>('setup');

  useEffect(() => {
    if (!visible || !fixture) return;
    setActiveTab('setup');
    setTeamAId(fixture.teamAId);
    setTeamBId(fixture.teamBId);
    const baseIso = fixture.scheduledAt ?? new Date().toISOString();
    setScheduledAt(isoToDate(baseIso) ?? new Date());
    setOversText(fixture.overs != null ? String(fixture.overs) : '');
    setPlayersText(fixture.playersPerTeam != null ? String(fixture.playersPerTeam) : '');
    setMatchCondition('scheduled');
    setDirectWinner('none');
    setBatFirst('none');
    setInningsWin('none');
    setScoreLineA('');
    setScoreLineB('');
    setResultNote('');
  }, [visible, fixture]);

  const scheduledAtIso = useMemo(() => (scheduledAt ? scheduledAt.toISOString() : null), [
    scheduledAt,
  ]);
  const overs = useMemo(() => {
    const raw = oversText.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
  }, [oversText]);
  const playersPerTeam = useMemo(() => {
    const raw = playersText.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
  }, [playersText]);
  const valid =
    canEdit &&
    !!teamAId &&
    !!teamBId &&
    teamAId !== teamBId &&
    !!scheduledAtIso;

  const teamAName = teams.find(t => t.id === teamAId)?.name ?? 'Team A';
  const teamBName = teams.find(t => t.id === teamBId)?.name ?? 'Team B';

  const effectiveManualOutcome = useMemo((): TournamentFixtureManualOutcome | null => {
    if (directWinner !== 'none') {
      return directWinner;
    }
    if (batFirst !== 'none' && inningsWin === 'batting') {
      return batFirst;
    }
    if (batFirst !== 'none' && inningsWin === 'bowling') {
      return batFirst === 'teamA' ? 'teamB' : 'teamA';
    }
    return null;
  }, [directWinner, batFirst, inningsWin]);

  const buildManualResultSummary = (outcome: TournamentFixtureManualOutcome) => {
    const parts: string[] = [];
    if (matchCondition === 'delayed') parts.push('Delayed');
    const sa = scoreLineA.trim();
    const sb = scoreLineB.trim();
    if (sa || sb) {
      parts.push(`${teamAName} ${sa || '—'} vs ${teamBName} ${sb || '—'}`);
    }
    if (outcome === 'tie') {
      parts.push('Match tied');
    } else if (outcome === 'teamA') {
      parts.push(`${teamAName} won`);
    } else {
      parts.push(`${teamBName} won`);
    }
    const note = resultNote.trim();
    if (note) parts.push(`(${note})`);
    return parts.join(' · ');
  };

  const manualConflictsCondition =
    !!effectiveManualOutcome &&
    (matchCondition === 'rain' || matchCondition === 'abandoned');

  const scrollMaxHeight = Math.round(Dimensions.get('window').height * 0.46);

  if (!fixture) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
            Match settings
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            {activeTab === 'setup'
              ? 'Teams, time, overs, and match status — use before you open the scorer.'
              : 'Save the winner or tie here if you will not ball-by-ball score this fixture.'}
          </ThemeText>
        </View>

        <View
          style={[
            styles.tabBar,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          {MATCH_SETTINGS_TABS.map(tab => {
            const on = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabItem,
                  on && { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                  !on && { borderColor: theme.border },
                ]}
              >
                <ThemeText
                  color={on ? 'primary' : 'secondaryText'}
                  style={[styles.tabLabel, on && styles.tabLabelActive]}
                >
                  {tab.label}
                </ThemeText>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: scrollMaxHeight }}
          contentContainerStyle={styles.content}
        >
          {!canEdit ? (
            <View style={[styles.lockCard, { borderColor: theme.border }]}>
              <ThemeText color="text" style={styles.lockTitle}>
                Editing locked
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.lockText}>
                This match is live or already completed.
              </ThemeText>
            </View>
          ) : null}

          {activeTab === 'setup' ? (
            <>
              <ThemeText color="text" style={styles.sectionLabel}>
                Teams
              </ThemeText>
              <View style={styles.teamsRow}>
                <View style={styles.teamCol}>
                  <ThemeText color="secondaryText" style={styles.miniLabel}>
                    Team A
                  </ThemeText>
                  <View style={styles.chipsWrap}>
                    {teams.map(t => {
                      const active = teamAId === t.id;
                      return (
                        <Pressable
                          key={`a-${t.id}`}
                          onPress={() => setTeamAId(t.id)}
                          style={[
                            styles.teamChip,
                            {
                              backgroundColor: active ? theme.primaryMuted : theme.background,
                              borderColor: active ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <ThemeText color={active ? 'primary' : 'text'} style={styles.teamChipText}>
                            {t.name}
                          </ThemeText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.teamCol}>
                  <ThemeText color="secondaryText" style={styles.miniLabel}>
                    Team B
                  </ThemeText>
                  <View style={styles.chipsWrap}>
                    {teams.map(t => {
                      const active = teamBId === t.id;
                      return (
                        <Pressable
                          key={`b-${t.id}`}
                          onPress={() => setTeamBId(t.id)}
                          style={[
                            styles.teamChip,
                            {
                              backgroundColor: active ? theme.primaryMuted : theme.background,
                              borderColor: active ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <ThemeText color={active ? 'primary' : 'text'} style={styles.teamChipText}>
                            {t.name}
                          </ThemeText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {teamAId === teamBId ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Team A and Team B must be different.
                </ThemeText>
              ) : null}

              <ThemeText color="text" style={styles.sectionLabel}>
                Schedule
              </ThemeText>
              <DateTimeField
                title="Date"
                placeholder="YYYY-MM-DD"
                leftIcon={throphy}
                mode="date"
                value={scheduledAt}
                onChange={next => {
                  if (!next) return;
                  const current = scheduledAt ?? new Date();
                  const merged = new Date(
                    next.getFullYear(),
                    next.getMonth(),
                    next.getDate(),
                    current.getHours(),
                    current.getMinutes(),
                    0,
                    0,
                  );
                  setScheduledAt(merged);
                }}
                displayValue={formatDateForUiYmd(scheduledAt)}
                disabled={!canEdit}
              />
              <DateTimeField
                title="Time (optional)"
                placeholder="HH:MM"
                leftIcon={ball}
                mode="time"
                value={scheduledAt}
                onChange={next => {
                  if (!next) return;
                  const current = scheduledAt ?? new Date();
                  const merged = new Date(
                    current.getFullYear(),
                    current.getMonth(),
                    current.getDate(),
                    next.getHours(),
                    next.getMinutes(),
                    0,
                    0,
                  );
                  setScheduledAt(merged);
                }}
                displayValue={formatTimeForUiHm(scheduledAt)}
                disabled={!canEdit}
              />

              <ThemeInput
                title="Overs (optional)"
                placeholder="e.g. 10"
                leftIcon={ball}
                value={oversText}
                keyboardType="number-pad"
                onChangeText={setOversText}
                editable={canEdit}
              />
              {oversText.trim() && overs == null ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Enter a valid overs number.
                </ThemeText>
              ) : null}

              <ThemeInput
                title="Players per team (optional)"
                placeholder="e.g. 11"
                leftIcon={ball}
                value={playersText}
                keyboardType="number-pad"
                onChangeText={setPlayersText}
                editable={canEdit}
              />
              {playersText.trim() && playersPerTeam == null ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Enter a valid players number.
                </ThemeText>
              ) : null}

              <ThemeText color="text" style={styles.sectionLabel}>
                Match condition
              </ThemeText>
              <View style={styles.conditionRow}>
                {[
                  { id: 'scheduled', label: 'Scheduled' },
                  { id: 'delayed', label: 'Delayed' },
                  { id: 'rain', label: 'Rain (No result)' },
                  { id: 'abandoned', label: 'Abandoned' },
                ].map(opt => {
                  const active = matchCondition === (opt.id as any);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        if (opt.id === 'rain' || opt.id === 'abandoned') {
                          setDirectWinner('none');
                          setBatFirst('none');
                          setInningsWin('none');
                          setScoreLineA('');
                          setScoreLineB('');
                          setResultNote('');
                        }
                        setMatchCondition(opt.id as any);
                      }}
                      style={[
                        styles.conditionChip,
                        {
                          backgroundColor: active ? theme.primaryMuted : theme.background,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      disabled={!canEdit}
                    >
                      <ThemeText
                        color={active ? 'primary' : 'text'}
                        style={styles.conditionChipText}
                      >
                        {opt.label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>
              {!scheduledAtIso ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Select a valid date and time.
                </ThemeText>
              ) : null}
              {manualConflictsCondition ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Rain/abandoned conflicts with a result on the other tab — change one of them.
                </ThemeText>
              ) : null}
            </>
          ) : (
            <>
              <ThemeText color="secondaryText" style={styles.helpText}>
                Everything here is optional unless you want to close the fixture without using live
                scoring. Match status (rain, delayed, etc.) is on the first tab.
              </ThemeText>

              <ThemeText color="secondaryText" style={styles.miniLabel}>
                Winner
              </ThemeText>
              <View style={styles.conditionRow}>
                {(
                  [
                    { id: 'teamA' as const, label: `${teamAName} won` },
                    { id: 'teamB' as const, label: `${teamBName} won` },
                    { id: 'tie' as const, label: 'Tie' },
                  ] as const
                ).map(opt => {
                  const active = directWinner === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        setMatchCondition(prev =>
                          prev === 'rain' || prev === 'abandoned' ? 'scheduled' : prev,
                        );
                        setDirectWinner(prev => (prev === opt.id ? 'none' : opt.id));
                        setBatFirst('none');
                        setInningsWin('none');
                      }}
                      style={[
                        styles.conditionChip,
                        {
                          backgroundColor: active ? theme.primaryMuted : theme.background,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      disabled={!canEdit}
                    >
                      <ThemeText
                        color={active ? 'primary' : 'text'}
                        style={styles.conditionChipText}
                      >
                        {opt.label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemeText
                color="secondaryText"
                style={[styles.miniLabel, { marginTop: heightPixel(10) }]}
              >
                Or: who batted first, then who won
              </ThemeText>
              <View style={styles.conditionRow}>
                {(
                  [
                    { id: 'teamA' as const, label: `${teamAName} batted first` },
                    { id: 'teamB' as const, label: `${teamBName} batted first` },
                  ] as const
                ).map(opt => {
                  const active = batFirst === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        setMatchCondition(prev =>
                          prev === 'rain' || prev === 'abandoned' ? 'scheduled' : prev,
                        );
                        setBatFirst(prev => (prev === opt.id ? 'none' : opt.id));
                        setDirectWinner('none');
                      }}
                      style={[
                        styles.conditionChip,
                        {
                          backgroundColor: active ? theme.primaryMuted : theme.background,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      disabled={!canEdit}
                    >
                      <ThemeText
                        color={active ? 'primary' : 'text'}
                        style={styles.conditionChipText}
                      >
                        {opt.label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.conditionRow}>
                {(
                  [
                    { id: 'batting' as const, label: 'Batting team won' },
                    { id: 'bowling' as const, label: 'Bowling team won' },
                  ] as const
                ).map(opt => {
                  const active = inningsWin === opt.id;
                  const disabledShortcuts = !canEdit || batFirst === 'none';
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        if (batFirst === 'none') return;
                        setMatchCondition(prev =>
                          prev === 'rain' || prev === 'abandoned' ? 'scheduled' : prev,
                        );
                        setDirectWinner('none');
                        setInningsWin(prev => (prev === opt.id ? 'none' : opt.id));
                      }}
                      style={[
                        styles.conditionChip,
                        {
                          backgroundColor: active ? theme.primaryMuted : theme.background,
                          borderColor: active ? theme.primary : theme.border,
                          opacity: disabledShortcuts ? 0.45 : 1,
                        },
                      ]}
                      disabled={disabledShortcuts}
                    >
                      <ThemeText
                        color={active ? 'primary' : 'text'}
                        style={styles.conditionChipText}
                      >
                        {opt.label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>
              {batFirst === 'none' ? (
                <ThemeText color="secondaryText" style={styles.helpText}>
                  Choose who batted first to enable “Batting team won” / “Bowling team won”.
                </ThemeText>
              ) : null}

              <ThemeInput
                title={`${teamAName} score (optional)`}
                placeholder="e.g. 142/6"
                leftIcon={ball}
                value={scoreLineA}
                onChangeText={setScoreLineA}
                editable={canEdit}
              />
              <ThemeInput
                title={`${teamBName} score (optional)`}
                placeholder="e.g. 138/8"
                leftIcon={ball}
                value={scoreLineB}
                onChangeText={setScoreLineB}
                editable={canEdit}
              />
              <ThemeInput
                title="Extra note (optional)"
                placeholder="e.g. DLS, forfeit"
                leftIcon={throphy}
                value={resultNote}
                onChangeText={setResultNote}
                editable={canEdit}
              />

              {!scheduledAtIso ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Select date and time on the first tab.
                </ThemeText>
              ) : null}
              {manualConflictsCondition ? (
                <ThemeText color="error" style={styles.inlineError}>
                  Clear this result or change match condition away from rain/abandoned on the first
                  tab.
                </ThemeText>
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            title="Save changes"
            onPress={() => {
              if (!valid || manualConflictsCondition) return;
              const status =
                matchCondition === 'rain'
                  ? 'no_result'
                  : matchCondition === 'abandoned'
                    ? 'abandoned'
                    : 'upcoming';
              const resultSummary =
                matchCondition === 'delayed'
                  ? 'Delayed'
                  : matchCondition === 'rain'
                    ? 'No result (rain)'
                    : matchCondition === 'abandoned'
                      ? 'Abandoned'
                      : null;

              const manual = effectiveManualOutcome;
              const completeWithoutScoring =
                manual && matchCondition !== 'rain' && matchCondition !== 'abandoned'
                  ? {
                      manualOutcome: manual,
                      resultSummary: buildManualResultSummary(manual),
                      winnerTeamId:
                        manual === 'tie' ? null : manual === 'teamA' ? teamAId : teamBId,
                    }
                  : null;

              onSave({
                fixtureId: fixture.id,
                teamAId,
                teamBId,
                scheduledAtIso: scheduledAtIso!,
                overs,
                playersPerTeam,
                status: completeWithoutScoring ? 'upcoming' : status,
                resultSummary: completeWithoutScoring ? null : resultSummary,
                completeWithoutScoring,
              });
              onClose();
            }}
            disabled={!valid || manualConflictsCondition}
          />

          <Pressable onPress={onClose} style={styles.cancel}>
            <ThemeText color="primary" style={styles.cancelText}>
              Cancel
            </ThemeText>
          </Pressable>
        </View>
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
    paddingBottom: heightPixel(10),
    maxHeight: '88%',
    flexDirection: 'column',
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
    marginBottom: heightPixel(6),
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: widthPixel(16),
    marginBottom: heightPixel(8),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(4),
    gap: widthPixel(6),
  },
  tabItem: {
    flex: 1,
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(11),
    borderWidth: 1,
    alignItems: 'center',
  },
  tabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  tabLabelActive: {
    fontFamily: fontFamilies.bold,
  },
  footer: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(12),
    borderTopWidth: StyleSheet.hairlineWidth,
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
  teamsRow: {
    gap: widthPixel(12),
  },
  teamCol: {
    marginBottom: heightPixel(10),
  },
  miniLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(6),
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
  },
  teamChip: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
  },
  teamChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
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
    marginTop: heightPixel(4),
    paddingVertical: heightPixel(8),
  },
  cancelText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  lockCard: {
    borderWidth: 1,
    borderRadius: widthPixel(16),
    padding: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  lockTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  lockText: {
    marginTop: heightPixel(6),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.medium,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginBottom: heightPixel(8),
  },
  conditionChip: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
  },
  conditionChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  helpText: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    fontFamily: fontFamilies.medium,
    marginBottom: heightPixel(8),
  },
});

export default EditFixtureModal;

