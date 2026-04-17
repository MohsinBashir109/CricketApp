import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

type TeamLite = { id: string; name: string };

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
  } | null;
  onClose: () => void;
  onSave: (payload: {
    fixtureId: string;
    teamAId: string;
    teamBId: string;
    scheduledAtIso: string;
    overs: number | null;
    status: 'upcoming' | 'no_result' | 'abandoned';
    resultSummary: string | null;
  }) => void;
};

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
  const [matchCondition, setMatchCondition] = useState<
    'scheduled' | 'delayed' | 'rain' | 'abandoned'
  >('scheduled');

  useEffect(() => {
    if (!visible || !fixture) return;
    setTeamAId(fixture.teamAId);
    setTeamBId(fixture.teamBId);
    const baseIso = fixture.scheduledAt ?? new Date().toISOString();
    setScheduledAt(isoToDate(baseIso) ?? new Date());
    setOversText(fixture.overs != null ? String(fixture.overs) : '');
    setMatchCondition('scheduled');
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
  const valid =
    canEdit &&
    !!teamAId &&
    !!teamBId &&
    teamAId !== teamBId &&
    !!scheduledAtIso;

  if (!fixture) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <View style={styles.header}>
          <ThemeText color="text" style={styles.title}>
            Match settings
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.sub}>
            You can only edit before scoring starts.
          </ThemeText>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
              // Keep time portion stable when user changes date.
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
                  onPress={() => setMatchCondition(opt.id as any)}
                  style={[
                    styles.conditionChip,
                    {
                      backgroundColor: active ? theme.primaryMuted : theme.background,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  disabled={!canEdit}
                >
                  <ThemeText color={active ? 'primary' : 'text'} style={styles.conditionChipText}>
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

          <Button
            title="Save changes"
            onPress={() => {
              if (!valid) return;
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
              onSave({
                fixtureId: fixture.id,
                teamAId,
                teamBId,
                scheduledAtIso: scheduledAtIso!,
                overs,
                status,
                resultSummary,
              });
              onClose();
            }}
            disabled={!valid}
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
    maxHeight: '90%',
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
    marginTop: heightPixel(6),
    paddingVertical: heightPixel(10),
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
});

export default EditFixtureModal;

