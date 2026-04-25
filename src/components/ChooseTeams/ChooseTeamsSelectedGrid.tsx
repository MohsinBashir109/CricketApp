import React, { useCallback, useState } from 'react';
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import ThemeText from '../ThemeText';
import { teamSlect } from '../../assets/images';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';
import type { colors } from '../../utils/colors';

type Theme = typeof colors.light;

export type GridTeam = { id: string; name: string };

type Props = {
  teams: GridTeam[];
  totalSlots: number;
  theme: Theme;
  isDark: boolean;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
};

const ChooseTeamsSelectedGrid: React.FC<Props> = ({
  teams,
  totalSlots,
  theme,
  isDark,
  onRemove,
  onEdit,
}) => {
  const [sectionWidth, setSectionWidth] = useState(0);
  const colGap = widthPixel(10);

  const onSectionLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSectionWidth(prev => (Math.abs(prev - w) < 1 ? prev : w));
  }, []);

  /** Half of row minus gap so two tiles always fit the measured content width. */
  const tileWidth =
    sectionWidth > 0 ? Math.floor((sectionWidth - colGap) / 2) : undefined;

  const gold = theme.accent;

  return (
    <View style={styles.section} onLayout={onSectionLayout}>
      <ThemeText color="secondaryText" style={styles.savedTeamsHint}>
        If you pick teams from saved teams, players can still be added during the fixture or
        during a match.
      </ThemeText>

      <View style={styles.sectionHead}>
        <View style={styles.sectionTitleRow}>
          <Image source={teamSlect} style={styles.shieldIcon} resizeMode="contain" tintColor={gold} />
          <ThemeText color="text" style={styles.sectionTitle}>
            Your selected teams
          </ThemeText>
        </View>
        <View style={[styles.countChip, { borderColor: gold, backgroundColor: theme.primaryMuted }]}>
          <Text style={[styles.countChipText, { color: theme.extras }]}>
            {teams.length}/{totalSlots}
          </Text>
        </View>
      </View>
      <View style={[styles.goldLine, { backgroundColor: gold }]} />

      {teams.length === 0 ? (
        <View style={styles.emptyBlock}>
          <ThemeText color="text" style={styles.emptyTitle}>
            No teams selected yet
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.emptyBody}>
            You need {totalSlots} teams for this tournament. Use{' '}
            <ThemeText color="text" style={styles.emptyEmph}>
              Add from saved teams
            </ThemeText>{' '}
            or{' '}
            <ThemeText color="text" style={styles.emptyEmph}>
              Add new team
            </ThemeText>{' '}
            above to start filling your lineup.
          </ThemeText>
        </View>
      ) : (
      <View style={styles.grid}>
        {teams.map(t => {
          return (
            <View
              key={t.id}
              style={[
                styles.tile,
                tileWidth != null ? { width: tileWidth } : styles.tileFlexHalf,
                isDark ? styles.tileShadowDark : styles.tileShadowLight,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.tileBody}>
                <View style={[styles.avatar, { backgroundColor: theme.primaryMuted }]}>
                  <ThemeText color="primary" style={styles.avatarLetter}>
                    {(t.name || '?').trim().slice(0, 1).toUpperCase()}
                  </ThemeText>
                </View>
                <View style={styles.tileTextCol}>
                  <ThemeText color="text" style={styles.teamName} numberOfLines={2}>
                    {t.name}
                  </ThemeText>
                </View>
                <View style={styles.tileActions}>
                  {onEdit ? (
                    <Pressable
                      onPress={() => onEdit(t.id)}
                      style={[styles.iconBtn, { backgroundColor: theme.primaryMuted }]}
                      hitSlop={6}
                    >
                      <Text style={[styles.editGlyph, { color: theme.extras }]}>✎</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => onRemove(t.id)}
                    style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(199,58,58,0.12)' }]}
                    hitSlop={6}
                  >
                    <Text style={[styles.removeGlyph, { color: theme.error }]}>✕</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tileShadowLight: cardShadowSm(false),
  tileShadowDark: cardShadowSm(true),
  section: {
    marginBottom: heightPixel(12),
  },
  savedTeamsHint: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(14),
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: heightPixel(6),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(8),
    flex: 1,
    minWidth: 0,
  },
  shieldIcon: {
    width: widthPixel(20),
    height: widthPixel(20),
  },
  sectionTitle: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.bold,
  },
  countChip: {
    borderWidth: 1,
    borderRadius: widthPixel(8),
    paddingVertical: heightPixel(4),
    paddingHorizontal: widthPixel(8),
  },
  countChipText: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.bold,
  },
  goldLine: {
    alignSelf: 'stretch',
    width: '100%',
    height: heightPixel(2),
    borderRadius: widthPixel(1),
    marginBottom: heightPixel(14),
  },
  emptyBlock: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(4),
    marginBottom: heightPixel(4),
  },
  emptyTitle: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
    marginBottom: heightPixel(8),
  },
  emptyBody: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(20),
    fontFamily: fontFamilies.regular,
  },
  emptyEmph: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    rowGap: heightPixel(12),
    columnGap: widthPixel(10),
    width: '100%',
  },
  tile: {
    borderRadius: widthPixel(16),
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 0,
  },
  tileFlexHalf: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '47%',
    minWidth: widthPixel(132),
    maxWidth: '100%',
  },
  tileBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(12),
    gap: widthPixel(10),
  },
  avatar: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  tileTextCol: {
    flex: 1,
    minWidth: 0,
  },
  teamName: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.bold,
    lineHeight: fontPixel(17),
  },
  tileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(6),
  },
  iconBtn: {
    width: widthPixel(32),
    height: widthPixel(32),
    borderRadius: widthPixel(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editGlyph: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
  },
  removeGlyph: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.bold,
  },
});

export default ChooseTeamsSelectedGrid;
