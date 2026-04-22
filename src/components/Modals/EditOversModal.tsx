import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import type { Ball } from '../../types/Playertype';

type InningsKey = 'innings1' | 'innings2' | 'superOverInnings1' | 'superOverInnings2';

type Props = {
  visible: boolean;
  onClose: () => void;
  inningsKey: InningsKey;
  balls: Ball[];
  onEditBall: (ballIndex: number, patch: Partial<Pick<Ball, 'runs' | 'extra' | 'extraRuns' | 'runsOffBat'>>) => void;
  onDeleteBall: (ballIndex: number) => void;
};

const formatBall = (b: Ball) => {
  if (b.wicket) return 'W';
  if (b.extra === 'wide') return `Wd${b.runs > 1 ? b.runs : ''}`;
  if (b.extra === 'noball') return `Nb${b.runs > 1 ? b.runs : ''}`;
  if (b.extra === 'bye') return `B${b.runs || 1}`;
  if (b.extra === 'legbye') return `Lb${b.runs || 1}`;
  return b.runs === 0 ? '•' : String(b.runs);
};

export default function EditOversModal({
  visible,
  onClose,
  balls,
  onEditBall,
  onDeleteBall,
}: Props) {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const [selectedOver, setSelectedOver] = useState<number>(1);
  const [selectedBallIndex, setSelectedBallIndex] = useState<number | null>(null);

  const completedOvers = useMemo(() => {
    // "Completed over" = has 6 legal balls (wide/noball are NOT legal).
    const legalCountByOver = new Map<number, number>();
    for (const b of balls ?? []) {
      const over = b.over ?? 1;
      const isLegal = b.extra !== 'wide' && b.extra !== 'noball';
      if (!isLegal) continue;
      legalCountByOver.set(over, (legalCountByOver.get(over) ?? 0) + 1);
    }
    const overs = Array.from(legalCountByOver.entries())
      .filter(([, c]) => c >= 6)
      .map(([o]) => o)
      .sort((a, b) => a - b);
    return overs.length ? overs : [1];
  }, [balls]);

  const ballsInOver = useMemo(() => {
    return (balls ?? [])
      .map((b, idx) => ({ b, idx }))
      .filter(x => (x.b.over ?? 1) === selectedOver);
  }, [balls, selectedOver]);

  const selectedBall = useMemo(() => {
    if (selectedBallIndex == null) return null;
    if (selectedBallIndex < 0 || selectedBallIndex >= (balls?.length ?? 0)) return null;
    return balls[selectedBallIndex] ?? null;
  }, [balls, selectedBallIndex]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.header}>
            <ThemeText style={[styles.title, { color: theme.text }]} color="text">
              Edit overs
            </ThemeText>
            <Pressable onPress={onClose} hitSlop={10}>
              <ThemeText style={[styles.close, { color: theme.secondaryText }]} color="secondaryText">
                ✕
              </ThemeText>
            </Pressable>
          </View>

          <ThemeText style={[styles.note, { color: theme.secondaryText }]} color="secondaryText">
            You can edit runs/extras only. Wickets and striker/bowler won’t change.
          </ThemeText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overRow}>
            {completedOvers.map(o => {
              const on = o === selectedOver;
              return (
                <Pressable
                  key={o}
                  onPress={() => setSelectedOver(o)}
                  style={[
                    styles.overChip,
                    {
                      backgroundColor: on ? theme.primaryMuted : theme.surfaceElevated,
                      borderColor: on ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <ThemeText
                    color={on ? 'primary' : 'text'}
                    style={[styles.overChipText, { color: on ? theme.primary : theme.text }]}
                  >
                    Over {o}
                  </ThemeText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.body}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ballsRow}
            >
              {ballsInOver.map(({ b, idx }) => {
                const on = selectedBallIndex === idx;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => setSelectedBallIndex(idx)}
                    style={[
                      styles.ballChip,
                      {
                        backgroundColor: on ? theme.primaryMuted : theme.surfaceElevated,
                        borderColor: on ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemeText
                      color={on ? 'primary' : 'text'}
                      style={[styles.ballChipText, { color: on ? theme.primary : theme.text }]}
                    >
                      {formatBall(b)}
                    </ThemeText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedBallIndex == null || !selectedBall ? (
              <ThemeText style={[styles.helper, { color: theme.secondaryText }]} color="secondaryText">
                Tap a ball to change it.
              </ThemeText>
            ) : (
              <View style={[styles.editor, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}>
                <View style={styles.editorHeader}>
                  <ThemeText style={[styles.editorTitle, { color: theme.text }]} color="text">
                    {selectedBall.over}.{selectedBall.ballInOver === 0 ? '•' : selectedBall.ballInOver} — Edit
                  </ThemeText>
                  <Pressable onPress={() => onDeleteBall(selectedBallIndex)} hitSlop={10}>
                    <ThemeText style={[styles.iconAction, { color: theme.error ?? '#D92D20' }]} color="error">
                      Delete
                    </ThemeText>
                  </Pressable>
                </View>

                <View style={styles.picksRow}>
                  {([0, 1, 2, 3, 4, 5, 6] as const).map(v => {
                    const on = (selectedBall?.runs ?? 0) === v;
                    return (
                      <Pressable
                        key={v}
                        onPress={() =>
                          onEditBall(selectedBallIndex, {
                            runs: v,
                            extraRuns: selectedBall.extra ? v : undefined,
                            runsOffBat: selectedBall.extra === 'noball' ? (v as any) : selectedBall.runsOffBat,
                          })
                        }
                        style={[
                          styles.pick,
                          {
                            backgroundColor: on ? theme.primaryMuted : theme.background,
                            borderColor: on ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <ThemeText
                          color={on ? 'primary' : 'text'}
                          style={[styles.pickText, { color: on ? theme.primary : theme.text }]}
                        >
                          {v}
                        </ThemeText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    width: '92%',
    maxWidth: widthPixel(380),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(16),
    overflow: 'hidden',
    maxHeight: heightPixel(560),
  },
  header: {
    paddingHorizontal: widthPixel(14),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fontFamilies.bold, fontSize: fontPixel(14) },
  close: { fontFamily: fontFamilies.bold, fontSize: fontPixel(16) },
  note: {
    paddingHorizontal: widthPixel(14),
    paddingBottom: heightPixel(10),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },
  overRow: { gap: widthPixel(8), paddingHorizontal: widthPixel(14), paddingBottom: heightPixel(10) },
  overChip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
  },
  overChipText: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(11) },
  body: { paddingHorizontal: widthPixel(14), paddingBottom: heightPixel(14) },
  ballsRow: { gap: widthPixel(8), paddingBottom: heightPixel(10) },
  ballChip: {
    borderWidth: 1,
    borderRadius: widthPixel(12),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
    minWidth: widthPixel(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballChipText: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(12) },
  helper: { fontFamily: fontFamilies.medium, fontSize: fontPixel(12), paddingVertical: heightPixel(6) },
  editor: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    padding: widthPixel(10),
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: heightPixel(8),
  },
  editorTitle: { fontFamily: fontFamilies.bold, fontSize: fontPixel(12) },
  iconAction: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(12) },
  picksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: widthPixel(6) },
  pick: {
    borderWidth: 1,
    borderRadius: widthPixel(10),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(8),
  },
  pickText: { fontFamily: fontFamilies.semibold, fontSize: fontPixel(11) },
});

