import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { selectActiveTeams } from '../../../features/tournament/tournamentSelectors';
import {
  clearPickFromSavedTeamsResult,
  submitConfirmChooseTeamsResult,
} from '../../../features/tournament/tournamentSlice';
import type { RootState } from '../../../features/store/rootReducer';
import { routes } from '../../../utils/routes';
import {
  ChooseTeamsActionCards,
  ChooseTeamsConfirmBar,
  ChooseTeamsSelectedGrid,
} from '../../../components/ChooseTeams';

const ChooseTeamsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const pickFromSavedResult = useSelector(
    (s: RootState) => s.tournament.pickFromSavedTeamsResult ?? null,
  );
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const teamCount = Number(route.params?.teamCount ?? 0) || 0;
  const paramIds: string[] = route.params?.selectedTeamIds ?? [];
  const tournamentName = String(route.params?.tournamentName ?? '').trim();

  const [localSelected, setLocalSelected] = useState<string[]>(() => [...paramIds]);

  const paramIdsKey = JSON.stringify(paramIds ?? []);

  useEffect(() => {
    setLocalSelected(Array.from(new Set([...(paramIds ?? [])])));
  }, [paramIdsKey, teamCount]);

  useEffect(() => {
    if (pickFromSavedResult == null) return;
    setLocalSelected(Array.from(new Set([...pickFromSavedResult])));
    dispatch(clearPickFromSavedTeamsResult());
  }, [pickFromSavedResult, dispatch]);

  const isComplete = teamCount > 1 && localSelected.length === teamCount;

  const togglePick = (id: string) => {
    setLocalSelected(cur => {
      const exists = cur.includes(id);
      if (exists) return cur.filter(x => x !== id);
      if (teamCount > 0 && cur.length >= teamCount) return cur;
      return [...cur, id];
    });
  };

  const gridTeams = useMemo(
    () =>
      localSelected
        .map(id => teams.find(t => t.id === id))
        .filter((t): t is (typeof teams)[number] => t != null)
        .map(t => ({ id: t.id, name: t.name })),
    [localSelected, teams],
  );

  const handleConfirm = () => {
    dispatch(submitConfirmChooseTeamsResult([...localSelected]));
    // Push structure so the stack is … → choose teams → structure → review; Back walks backward.
    navigation.navigate(routes.tournamentStructure, {
      teamCount,
      selectedTeamIds: [...localSelected],
      tournamentName,
    });
  };

  const openSavedTeams = () => {
    navigation.navigate(routes.addFromSavedTeams, {
      teamCount,
      selectedTeamIds: [...localSelected],
      tournamentName,
    });
  };

  const openAddNewTeam = () => {
    navigation.navigate(routes.addNewTeamForTournament, {
      teamCount,
      selectedTeamIds: [...localSelected],
      tournamentName,
    });
  };

  const handleEditTeam = useCallback(() => {
    Alert.alert(
      'Edit team',
      'To change a saved team’s name or players, open it from your teams list in Profile.',
    );
  }, []);

  if (teamCount < 3) {
    return (
      <HomeWrapper headerShown>
        <View style={styles.invalidWrap}>
          <ThemeText color="text" style={styles.invalidTitle}>
            Something went wrong
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.invalidSub}>
            Team count must be at least three. Go back and complete the previous step.
          </ThemeText>
          <Button title="Go back" onPress={() => navigation.goBack()} />
        </View>
      </HomeWrapper>
    );
  }

  return (
    <HomeWrapper headerShown>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <ThemeText color="text" style={styles.cardTitle}>
                Choose teams
              </ThemeText>
              <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
                <ThemeText color="primary" style={styles.cancelLink}>
                  Cancel
                </ThemeText>
              </Pressable>
            </View>

            <ChooseTeamsActionCards
              onSavedPress={openSavedTeams}
              onNewPress={openAddNewTeam}
              savedDisabled={teams.length === 0 || teamCount <= 1}
              theme={theme}
              isDark={isDark}
              newTeamActive={false}
            />

            {teams.length === 0 ? (
              <ThemeText color="secondaryText" style={styles.emptyHint}>
                No saved teams yet. Use “Add new team” to create one, then pick it here.
              </ThemeText>
            ) : null}

            <ChooseTeamsSelectedGrid
              teams={gridTeams}
              totalSlots={teamCount}
              theme={theme}
              isDark={isDark}
              onRemove={togglePick}
              onEdit={handleEditTeam}
            />

            <View style={styles.confirmSpacer} />
            <ChooseTeamsConfirmBar onPress={handleConfirm} disabled={!isComplete} theme={theme} />
          </View>
        </ScrollView>
      </View>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    marginTop: heightPixel(6),
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: heightPixel(28),
  },
  mainCard: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(14),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: heightPixel(10),
  },
  cardTitle: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
    flex: 1,
    paddingRight: widthPixel(12),
  },
  cancelLink: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  emptyHint: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(12),
    marginTop: -heightPixel(6),
  },
  confirmSpacer: {
    height: heightPixel(8),
  },
  invalidWrap: {
    flex: 1,
    marginTop: heightPixel(24),
    gap: heightPixel(12),
  },
  invalidTitle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  invalidSub: {
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(8),
  },
});

export default ChooseTeamsScreen;
