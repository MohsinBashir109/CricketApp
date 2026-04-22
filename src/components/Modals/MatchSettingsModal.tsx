import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { applyMatchSettingsDecision } from '../../features/match/matchSlice';
import type { MatchSettingsReasonChip } from '../../types/Playertype';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

type ResultChoice = 'interruption' | 'no_result' | 'manual_winner' | 'tie';

const REASON_CHIPS: { id: MatchSettingsReasonChip; label: string }[] = [
  { id: 'RAIN', label: 'Rain' },
  { id: 'BAD_LIGHT', label: 'Bad light' },
  { id: 'TEAM_LEFT', label: 'Team left' },
  { id: 'TECHNICAL', label: 'Technical' },
  { id: 'OTHER', label: 'Other' },
];

const reasonLabel = (r: MatchSettingsReasonChip) =>
  REASON_CHIPS.find(c => c.id === r)?.label ?? r;

type Props = {
  visible: boolean;
  onClose: () => void;
  teamAName: string;
  teamBName: string;
};

const MatchSettingsModal = ({ visible, onClose, teamAName, teamBName }: Props) => {
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const { height: screenH } = useWindowDimensions();

  const [reason, setReason] = useState<MatchSettingsReasonChip>('OTHER');
  const [resultChoice, setResultChoice] = useState<ResultChoice | null>(null);
  const [manualWinner, setManualWinner] = useState<'teamA' | 'teamB' | null>(null);
  const [note, setNote] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason('OTHER');
    setResultChoice(null);
    setManualWinner(null);
    setNote('');
    setConfirmStep(false);
  }, [visible]);

  const noteTrim = note.trim();
  const otherNeedsNote =
    resultChoice != null &&
    resultChoice !== 'interruption' &&
    reason === 'OTHER' &&
    !noteTrim;

  const primaryDisabled = useMemo(() => {
    if (confirmStep) return false;
    if (!resultChoice) return true;
    if (resultChoice === 'manual_winner' && !manualWinner) return true;
    if (otherNeedsNote) return true;
    return false;
  }, [confirmStep, resultChoice, manualWinner, otherNeedsNote]);

  const primaryLabel = useMemo(() => {
    if (!resultChoice) return 'Save';
    if (resultChoice === 'interruption') return 'Save Interruption';
    if (resultChoice === 'no_result') return 'End as No Result';
    if (resultChoice === 'manual_winner') return 'Save Winner';
    return 'Mark as Tie';
  }, [resultChoice]);

  const summaryLines = useMemo(() => {
    if (!resultChoice || resultChoice === 'interruption') return null;
    const lines: string[] = [];
    if (resultChoice === 'no_result') lines.push('Result: No result');
    else if (resultChoice === 'tie') lines.push('Result: Match tied');
    else if (resultChoice === 'manual_winner' && manualWinner) {
      const name = manualWinner === 'teamA' ? teamAName : teamBName;
      lines.push(`Result: ${name} wins`);
    }
    lines.push(`Reason: ${reasonLabel(reason)}`);
    if (noteTrim) lines.push(`Note: ${noteTrim}`);
    return lines;
  }, [resultChoice, manualWinner, teamAName, teamBName, reason, noteTrim]);

  const runSave = () => {
    if (!resultChoice || primaryDisabled) return;
    if (resultChoice === 'interruption') {
      dispatch(
        applyMatchSettingsDecision({
          kind: 'interruption',
          reason,
          note: noteTrim || undefined,
        }),
      );
      onClose();
      return;
    }
    if (resultChoice === 'no_result') {
      dispatch(applyMatchSettingsDecision({ kind: 'no_result', reason, note: noteTrim || undefined }));
      onClose();
      return;
    }
    if (resultChoice === 'tie') {
      dispatch(applyMatchSettingsDecision({ kind: 'tie', reason, note: noteTrim || undefined }));
      onClose();
      return;
    }
    if (resultChoice === 'manual_winner' && manualWinner) {
      dispatch(
        applyMatchSettingsDecision({
          kind: 'manual_winner',
          winner: manualWinner,
          reason,
          note: noteTrim || undefined,
        }),
      );
      onClose();
    }
  };

  const onPressPrimary = () => {
    if (!resultChoice || primaryDisabled) return;
    if (resultChoice === 'interruption') {
      runSave();
      return;
    }
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }
    runSave();
  };

  const sheetMaxH = Math.min(screenH * 0.78, heightPixel(640));

  const choiceRow = (
    value: ResultChoice,
    title: string,
    subtitle?: string,
  ) => {
    const selected = resultChoice === value;
    return (
      <Pressable
        onPress={() => {
          setResultChoice(value);
          if (value !== 'manual_winner') setManualWinner(null);
          setConfirmStep(false);
        }}
        style={[
          styles.choiceCard,
          {
            backgroundColor: theme.surface,
            borderColor: selected ? theme.primary : theme.border,
          },
        ]}
      >
        <View style={[styles.radioOuter, { borderColor: selected ? theme.primary : theme.border }]}>
          {selected ? <View style={[styles.radioInner, { backgroundColor: theme.primary }]} /> : null}
        </View>
        <View style={styles.choiceTextCol}>
          <ThemeText style={styles.choiceTitle} color="text">
            {title}
          </ThemeText>
          {subtitle ? (
            <ThemeText style={styles.choiceSub} color="secondaryText">
              {subtitle}
            </ThemeText>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View
            style={[
              styles.sheet,
              isDark ? styles.sheetShadowDark : styles.sheetShadowLight,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                maxHeight: sheetMaxH,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <View style={styles.headerRow}>
              <View style={styles.headerTitles}>
                <ThemeText style={styles.title} color="text">
                  Match Settings
                </ThemeText>
                <ThemeText style={styles.subtitle} color="secondaryText">
                  Handle rain, interruption, or manual result.
                </ThemeText>
              </View>
              <Pressable hitSlop={12} onPress={onClose} style={styles.closeHit}>
                <ThemeText style={styles.closeX} color="secondaryText">
                  ✕
                </ThemeText>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollPad}
            >
              {confirmStep ? (
                <View style={[styles.confirmCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <ThemeText style={styles.sectionLabel} color="text">
                    Are you sure?
                  </ThemeText>
                  <ThemeText style={styles.confirmBody} color="secondaryText">
                    This will complete the match and stop scoring.
                  </ThemeText>
                  {summaryLines?.map((line, i) => (
                    <ThemeText key={i} style={styles.confirmLine} color="text">
                      {line}
                    </ThemeText>
                  ))}
                </View>
              ) : (
                <>
                  <ThemeText style={styles.sectionLabel} color="text">
                    What happened?
                  </ThemeText>
                  <View style={styles.chipWrap}>
                    {REASON_CHIPS.map(c => {
                      const on = reason === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setReason(c.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: on ? theme.primaryMuted : theme.surface,
                              borderColor: on ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <ThemeText
                            style={styles.chipText}
                            color={on ? 'primary' : 'secondaryText'}
                          >
                            {c.label}
                          </ThemeText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <ThemeText style={[styles.sectionLabel, styles.mt]} color="text">
                    Result action
                  </ThemeText>
                  {choiceRow('interruption', 'Continue / pause match', 'Log interruption only — match stays open.')}
                  {choiceRow('no_result', 'End match as No Result')}
                  {choiceRow('manual_winner', 'Decide winner manually')}
                  {choiceRow('tie', 'Mark as Tie')}

                  {resultChoice === 'manual_winner' ? (
                    <View style={styles.mt}>
                      <ThemeText style={styles.sectionLabel} color="text">
                        Winner
                      </ThemeText>
                      {(['teamA', 'teamB'] as const).map(key => {
                        const name = key === 'teamA' ? teamAName : teamBName;
                        const sel = manualWinner === key;
                        return (
                          <Pressable
                            key={key}
                            onPress={() => setManualWinner(key)}
                            style={[
                              styles.teamPick,
                              {
                                backgroundColor: theme.surface,
                                borderColor: sel ? theme.primary : theme.border,
                              },
                              sel && { backgroundColor: theme.primaryMuted },
                            ]}
                          >
                            <ThemeText style={styles.teamPickText} color="text">
                              {name}
                            </ThemeText>
                            {sel ? (
                              <ThemeText style={styles.check} color="primary">
                                ✓
                              </ThemeText>
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  <ThemeText style={[styles.sectionLabel, styles.mt]} color="text">
                    Optional note
                  </ThemeText>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add short reason…"
                    placeholderTextColor={theme.desText}
                    multiline
                    style={[
                      styles.noteInput,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                  />
                </>
              )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Button
                title={confirmStep ? 'Confirm result' : primaryLabel}
                onPress={onPressPrimary}
                disabled={primaryDisabled}
              />
              <Pressable
                onPress={() => {
                  if (confirmStep) {
                    setConfirmStep(false);
                    return;
                  }
                  onClose();
                }}
                style={styles.cancelWrap}
              >
                <ThemeText style={styles.cancelText} color="secondaryText">
                  {confirmStep ? 'Back' : 'Cancel'}
                </ThemeText>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: widthPixel(18),
    borderTopRightRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: heightPixel(10),
  },
  sheetShadowLight: cardShadowSm(false),
  sheetShadowDark: cardShadowSm(true),
  handle: {
    alignSelf: 'center',
    width: widthPixel(36),
    height: heightPixel(4),
    borderRadius: widthPixel(2),
    marginTop: heightPixel(8),
    marginBottom: heightPixel(4),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(8),
  },
  headerTitles: { flex: 1, paddingRight: widthPixel(8) },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(17),
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginTop: heightPixel(4),
    lineHeight: fontPixel(18),
  },
  closeHit: { padding: widthPixel(4) },
  closeX: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(18),
  },
  scrollPad: {
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(12),
  },
  sectionLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(8),
  },
  mt: { marginTop: heightPixel(14) },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(8),
  },
  chip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(7),
    paddingHorizontal: widthPixel(12),
  },
  chipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(12),
    borderWidth: 1,
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    marginBottom: heightPixel(8),
  },
  radioOuter: {
    width: widthPixel(18),
    height: widthPixel(18),
    borderRadius: widthPixel(9),
    borderWidth: 2,
    marginRight: widthPixel(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: widthPixel(8),
    height: widthPixel(8),
    borderRadius: widthPixel(4),
  },
  choiceTextCol: { flex: 1 },
  choiceTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  choiceSub: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    marginTop: heightPixel(2),
    lineHeight: fontPixel(16),
  },
  teamPick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: widthPixel(12),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(8),
  },
  teamPickText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  check: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(12),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.regular,
    minHeight: heightPixel(72),
    textAlignVertical: 'top',
  },
  confirmCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(12),
    padding: widthPixel(14),
  },
  confirmBody: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(10),
  },
  confirmLine: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
  },
  footer: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelWrap: {
    alignSelf: 'center',
    paddingVertical: heightPixel(12),
  },
  cancelText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});

export default MatchSettingsModal;
