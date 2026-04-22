import { MatchSetup, Team } from '../../types/Playertype';
import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

import Toss from './Toss';
import Button from '../themeButton';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { routes } from '../../utils/routes';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../theme/themeContext';

interface AddPlayersProps {
  teamsSelected: MatchSetup;
  /** When true, hides the lineup builder (players will be added during match). */
  addDuringMatchMode?: boolean;
  showTossPanel?: boolean;
  onOpenToss?: () => void;
  onCloseToss?: () => void;
  onSelectToss?: (tossWinner: 'teamA' | 'teamB', electedTo: 'bat' | 'bowl') => void;
}

type TeamKey = 'teamA' | 'teamB';

const initialsFromName = (name: string) => {
  const t = (name ?? '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
};

const AddPlayers = ({
  teamsSelected,
  addDuringMatchMode = false,
  showTossPanel = false,
  onOpenToss,
  onCloseToss,
  onSelectToss,
}: AddPlayersProps) => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const teamA: Team | null = useMemo(() => teamsSelected?.teamA ?? null, [teamsSelected]);
  const teamB: Team | null = useMemo(() => teamsSelected?.teamB ?? null, [teamsSelected]);

  const teamAName = teamA?.name || 'Team A';
  const teamBName = teamB?.name || 'Team B';
  const teamACount = teamA?.players?.length ?? 0;
  const teamBCount = teamB?.players?.length ?? 0;
  const canOpenToss = addDuringMatchMode ? true : teamACount > 0 && teamBCount > 0;

  const openForTeam = (key: TeamKey) => {
    const team: Team | null =
      key === 'teamA' ? teamsSelected?.teamA ?? null : teamsSelected?.teamB ?? null;
    navigation.navigate(routes.addPlayersToTeam, {
      teamKey: key,
      teamDisplayName:
        team?.name || (key === 'teamA' ? 'Team A' : 'Team B'),
      initialPlayers: team?.players ?? [],
    });
  };

  const openQuickAdd = () => {
    // For "during match" mode, offer a single CTA that opens whichever team needs players first.
    if (teamACount === 0) return openForTeam('teamA');
    if (teamBCount === 0) return openForTeam('teamB');
    return openForTeam('teamA');
  };

  return (
    <View style={{ flex: 1, width: '100%', marginTop: heightPixel(20) }}>
      {!addDuringMatchMode ? (
        <View style={styles.headerBlock}>
          <ThemeText color="text" style={styles.title}>
            Build team lineups
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            Add players for both teams to continue.
          </ThemeText>
        </View>
      ) : (
        <View style={styles.headerBlock}>
          <ThemeText color="text" style={styles.title}>
            Players during match
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            This tournament uses “add players during the match”. You can continue to toss.
          </ThemeText>
        </View>
      )}

      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          { backgroundColor: 'transparent', borderColor: theme.border },
        ]}
      >
        {!addDuringMatchMode ? (
          <>
            <ThemeText color="secondaryText" style={styles.cardLabel}>
              Teams
            </ThemeText>

            <TouchableOpacity
              style={[styles.teamCard, { backgroundColor: theme.surfaceElevated ?? theme.background, borderColor: theme.border }]}
              activeOpacity={0.9}
              onPress={() => openForTeam('teamA')}
            >
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemeText color="white" style={styles.badgeText}>
                  {initialsFromName(teamAName)}
                </ThemeText>
              </View>

              <View style={styles.teamMeta}>
                <ThemeText color="text" style={styles.teamName} numberOfLines={1}>
                  {teamAName}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.teamHint}>
                  {teamACount > 0 ? `${teamACount} players added` : 'No players yet'}
                </ThemeText>
              </View>

              <View style={styles.teamRight}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        teamACount > 0 ? theme.primaryMuted : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ThemeText
                    color={teamACount > 0 ? 'primary' : 'secondaryText'}
                    style={styles.pillText}
                  >
                    {teamACount > 0 ? 'Edit' : 'Add'}
                  </ThemeText>
                </View>
                <ThemeText color="secondaryText" style={styles.chev}>
                  ›
                </ThemeText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.teamCard, { backgroundColor: theme.surfaceElevated ?? theme.background, borderColor: theme.border }]}
              activeOpacity={0.9}
              onPress={() => openForTeam('teamB')}
            >
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemeText color="white" style={styles.badgeText}>
                  {initialsFromName(teamBName)}
                </ThemeText>
              </View>

              <View style={styles.teamMeta}>
                <ThemeText color="text" style={styles.teamName} numberOfLines={1}>
                  {teamBName}
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.teamHint}>
                  {teamBCount > 0 ? `${teamBCount} players added` : 'No players yet'}
                </ThemeText>
              </View>

              <View style={styles.teamRight}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        teamBCount > 0 ? theme.primaryMuted : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <ThemeText
                    color={teamBCount > 0 ? 'primary' : 'secondaryText'}
                    style={styles.pillText}
                  >
                    {teamBCount > 0 ? 'Edit' : 'Add'}
                  </ThemeText>
                </View>
                <ThemeText color="secondaryText" style={styles.chev}>
                  ›
                </ThemeText>
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        {!addDuringMatchMode ? (
          <TouchableOpacity
            style={[
              styles.tossButton,
              {
                backgroundColor: canOpenToss ? theme.primary : theme.gray1,
              },
            ]}
            activeOpacity={canOpenToss ? 0.9 : 1}
            disabled={!canOpenToss}
            onPress={onOpenToss}
          >
            <ThemeText color="white" style={styles.tossButtonText}>
              Continue to Toss
            </ThemeText>
          </TouchableOpacity>
        ) : (
          <View style={styles.duringMatchCtas}>
            <View
              style={[
                styles.duringMatchCard,
                isDark ? styles.panelShadowDark : styles.panelShadowLight,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <ThemeText color="secondaryText" style={styles.duringMatchText}>
                Add players anytime while scoring. You can also add them now.
              </ThemeText>

              <Button title="Open toss" onPress={onOpenToss ?? (() => {})} />

              <Pressable
                onPress={openQuickAdd}
                hitSlop={12}
                style={[
                  styles.addPlayerSecondary,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <ThemeText color="text" style={styles.addPlayerSecondaryText}>
                  Add player here
                </ThemeText>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Modal
        visible={!!showTossPanel}
        transparent
        animationType="slide"
        onRequestClose={onCloseToss}
      >
        <Pressable style={styles.tossBackdrop} onPress={onCloseToss} />
        <View
          style={[
            styles.tossSheet,
            isDark ? styles.panelShadowDark : styles.panelShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Toss
            compact
            match={teamsSelected}
            onSelect={onSelectToss}
            onClose={onCloseToss}
          />
        </View>
      </Modal>
    </View>
  );
};

export default AddPlayers;

const styles = StyleSheet.create({
  cardShadowLight: cardShadowSm(false),
  cardShadowDark: cardShadowSm(true),
  panelShadowLight: cardShadowSm(false),
  panelShadowDark: cardShadowSm(true),
  headerBlock: {
    paddingHorizontal: widthPixel(10),
    marginBottom: heightPixel(14),
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(22),
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    marginTop: heightPixel(6),
    lineHeight: fontPixel(20),
  },
  card: {
    width: '100%',
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: heightPixel(10),
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(16),
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  badge: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
    letterSpacing: 0.6,
  },
  teamMeta: {
    flex: 1,
    marginLeft: widthPixel(12),
    minWidth: 0,
  },
  teamName: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  teamHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    marginTop: heightPixel(4),
  },
  teamRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: widthPixel(10),
  },
  pillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  chev: {
    fontSize: fontPixel(20),
    marginTop: -heightPixel(2),
  },
  tossButton: {
    marginTop: heightPixel(6),
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(16),
    alignItems: 'center',
  },
  tossButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  duringMatchCtas: {
    marginTop: heightPixel(8),
  },
  duringMatchCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
  },
  duringMatchText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(12),
    textAlign: 'center',
  },
  addPlayerSecondary: {
    marginTop: heightPixel(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    alignItems: 'center',
  },
  addPlayerSecondaryText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
  tossPanel: {
    marginTop: heightPixel(16),
    borderRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(14),
  },
  tossBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tossSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: widthPixel(22),
    borderTopRightRadius: widthPixel(22),
    borderWidth: 1,
    padding: widthPixel(14),
    paddingBottom: heightPixel(16),
    maxHeight: '85%',
  },
});
