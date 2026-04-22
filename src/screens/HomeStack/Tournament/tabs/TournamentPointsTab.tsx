import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import ThemeText from '../../../../components/ThemeText';
import { RootState } from '../../../../features/store/rootReducer';
import {
  PointsTableFormLetter,
  selectTournamentPointsTable,
} from '../../../../features/tournament/tournamentSelectors';
import { useThemeContext } from '../../../../theme/themeContext';
import { colors } from '../../../../utils/colors';
import { fontFamilies } from '../../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../../utils/constants';
import { cardShadowSm } from '../../../../utils/cardShadow';

const FORM_CELL = widthPixel(18);

type FormCellProps = {
  letter: PointsTableFormLetter | null;
  emphasize: boolean;
  winBg: string;
  lossBg: string;
  tieBg: string;
  nrBg: string;
  emptyBorder: string;
  symbolColor: string;
  ringColor: string;
};

const FormCell = ({
  letter,
  emphasize,
  winBg,
  lossBg,
  tieBg,
  nrBg,
  emptyBorder,
  symbolColor,
  ringColor,
}: FormCellProps) => {
  const inner = (() => {
    if (letter === 'W') {
      return (
        <View style={[styles.formInner, { backgroundColor: winBg }]}>
          <Text style={[styles.formSymbol, { color: symbolColor }]}>✓</Text>
        </View>
      );
    }
    if (letter === 'L') {
      return (
        <View style={[styles.formInner, { backgroundColor: lossBg }]}>
          <Text style={[styles.formSymbol, { color: symbolColor }]}>✕</Text>
        </View>
      );
    }
    if (letter === 'T') {
      return (
        <View style={[styles.formInner, { backgroundColor: tieBg }]}>
          <Text style={[styles.formSymbolSm, { color: symbolColor }]}>—</Text>
        </View>
      );
    }
    if (letter === 'NR') {
      return (
        <View style={[styles.formInner, { backgroundColor: nrBg }]}>
          <Text style={[styles.formSymbolSm, { color: symbolColor }]}>·</Text>
        </View>
      );
    }
    return <View style={[styles.formInner, styles.formEmpty, { borderColor: emptyBorder }]} />;
  })();

  if (emphasize) {
    return (
      <View style={[styles.formRing, { borderColor: ringColor }]}>{inner}</View>
    );
  }
  return <View style={styles.formPlain}>{inner}</View>;
};

const TournamentPointsTab = ({ tournamentId }: any) => {
  const table = useSelector((s: RootState) => selectTournamentPointsTable(s, tournamentId));
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const formPalette = useMemo(
    () => ({
      winBg: theme.green,
      lossBg: theme.error,
      tieBg: isDark ? '#2A3532' : theme.gray4,
      nrBg: isDark ? '#252A30' : theme.gray3,
      emptyBorder: theme.border,
      symbolColor: theme.white,
      ringColor: theme.text,
    }),
    [theme, isDark],
  );

  const formatNrr = (n: number) => {
    const v = Number.isFinite(n) ? n.toFixed(3) : '0.000';
    return (n >= 0 ? `+${v}` : v) as string;
  };

  const rightmostFormIndex = (lastFive: (PointsTableFormLetter | null)[]) => {
    for (let i = lastFive.length - 1; i >= 0; i -= 1) {
      if (lastFive[i] !== null) return i;
    }
    return -1;
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={[
            styles.tableWrap,
            isDark ? styles.cardShadowDark : styles.cardShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ThemeText color="text" style={styles.screenTitle}>
            Points table
          </ThemeText>

          {table.length === 0 ? (
            <ThemeText color="secondaryText" style={styles.empty}>
              No completed matches yet. Standings update when results are saved.
            </ThemeText>
          ) : (
            <>
              <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headCell, styles.headRank, { color: theme.secondaryText }]}>
                  #
                </Text>
                <Text style={[styles.headCell, styles.headTeam, { color: theme.secondaryText }]}>
                  TEAM
                </Text>
                <Text style={[styles.headCell, styles.headNum, { color: theme.secondaryText }]}>
                  M
                </Text>
                <Text style={[styles.headCell, styles.headNum, { color: theme.secondaryText }]}>
                  W
                </Text>
                <Text style={[styles.headCell, styles.headNum, { color: theme.secondaryText }]}>
                  L
                </Text>
                <Text style={[styles.headCell, styles.headNrr, { color: theme.secondaryText }]}>
                  NRR
                </Text>
                <Text style={[styles.headCell, styles.headPts, { color: theme.secondaryText }]}>
                  PTS
                </Text>
                <Text style={[styles.headCell, styles.headForm, { color: theme.secondaryText }]}>
                  LAST 5
                </Text>
              </View>

              {table.map((row, idx) => {
                const hi = rightmostFormIndex(row.lastFive);
                const selected = selectedTeamId === row.teamId;
                return (
                  <Pressable
                    key={row.teamId}
                    onPress={() =>
                      setSelectedTeamId(prev => (prev === row.teamId ? null : row.teamId))
                    }
                    style={({ pressed }) => [
                      styles.dataRow,
                      { borderBottomColor: theme.border },
                      (selected || pressed) && {
                        backgroundColor: isDark ? theme.surfaceElevated : theme.primaryMuted,
                      },
                    ]}
                  >
                    <Text style={[styles.bodyCell, styles.headRank, { color: theme.secondaryText }]}>
                      {idx + 1}
                    </Text>
                    <Text
                      style={[styles.bodyCell, styles.headTeam, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {row.teamLabel}
                    </Text>
                    <Text style={[styles.bodyCell, styles.headNum, { color: theme.text }]}>
                      {row.played}
                    </Text>
                    <Text style={[styles.bodyCell, styles.headNum, { color: theme.text }]}>
                      {row.won}
                    </Text>
                    <Text style={[styles.bodyCell, styles.headNum, { color: theme.text }]}>
                      {row.lost}
                    </Text>
                    <Text style={[styles.bodyCell, styles.headNrr, { color: theme.text }]}>
                      {formatNrr(row.nrr)}
                    </Text>
                    <Text
                      style={[
                        styles.bodyCell,
                        styles.headPts,
                        { color: theme.text, fontFamily: fontFamilies.bold },
                      ]}
                    >
                      {row.points}
                    </Text>
                    <View style={[styles.bodyCell, styles.headForm, styles.formRow]}>
                      {row.lastFive.map((letter, fi) => (
                        <FormCell
                          key={`${row.teamId}-f-${fi}`}
                          letter={letter}
                          emphasize={fi === hi && hi >= 0}
                          {...formPalette}
                        />
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  content: {
    paddingTop: heightPixel(20),
    paddingBottom: heightPixel(32),
    paddingHorizontal: widthPixel(12),
  },
  tableWrap: {
    minWidth: widthPixel(360),
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(10),
  },
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
    marginBottom: heightPixel(10),
    paddingHorizontal: widthPixel(4),
  },
  empty: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    paddingHorizontal: widthPixel(4),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: heightPixel(44),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headCell: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.6,
  },
  bodyCell: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  headRank: {
    width: widthPixel(26),
    textAlign: 'center',
  },
  headTeam: {
    width: widthPixel(72),
    textAlign: 'left',
    paddingRight: widthPixel(4),
  },
  headNum: {
    width: widthPixel(28),
    textAlign: 'right',
  },
  headNrr: {
    width: widthPixel(62),
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  headPts: {
    width: widthPixel(34),
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  headForm: {
    width: widthPixel(112),
    textAlign: 'right',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: widthPixel(4),
    paddingLeft: widthPixel(2),
  },
  formPlain: {
    width: FORM_CELL,
    height: FORM_CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formRing: {
    width: FORM_CELL + widthPixel(4),
    height: FORM_CELL + widthPixel(4),
    borderRadius: widthPixel(999),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formInner: {
    width: FORM_CELL - 2,
    height: FORM_CELL - 2,
    borderRadius: widthPixel(999),
    alignItems: 'center',
    justifyContent: 'center',
  },
  formEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  formSymbol: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.bold,
    lineHeight: fontPixel(13),
  },
  formSymbolSm: {
    fontSize: fontPixel(10),
    fontFamily: fontFamilies.bold,
    lineHeight: fontPixel(12),
  },
});

export default TournamentPointsTab;
