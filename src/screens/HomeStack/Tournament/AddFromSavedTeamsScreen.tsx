import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { selectActiveTeams } from '../../../features/tournament/tournamentSelectors';
import { submitPickFromSavedTeamsResult } from '../../../features/tournament/tournamentSlice';
import { teamSlect } from '../../../assets/images';

const playerLabel = (n: number) => (n === 1 ? '1 player' : `${n} players`);

const AddFromSavedTeamsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const teamCount = Number(route.params?.teamCount ?? 0) || 0;
  const initialIds: string[] = route.params?.selectedTeamIds ?? [];

  const [filterText, setFilterText] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(() => [...initialIds]);

  const normalized = filterText.trim().toLowerCase();
  const nameMatches = (name: string) =>
    !normalized || name.toLowerCase().includes(normalized);

  const { selectedRows, availableRows } = useMemo(() => {
    const selected = localSelected
      .map(id => teams.find(t => t.id === id))
      .filter((t): t is NonNullable<typeof t> => t != null && nameMatches(t.name));
    const available = teams.filter(
      t => !localSelected.includes(t.id) && nameMatches(t.name),
    );
    return { selectedRows: selected, availableRows: available };
  }, [teams, localSelected, normalized]);

  const isComplete = localSelected.length > 0;
  const atCapacity = teamCount > 0 && localSelected.length >= teamCount;

  const addTeam = (id: string) => {
    if (localSelected.includes(id)) return;
    if (teamCount > 0 && localSelected.length >= teamCount) {
      Alert.alert(
        'Maximum reached',
        `You can select up to ${teamCount} teams for this tournament.`,
      );
      return;
    }
    setLocalSelected(cur => [...cur, id]);
  };

  const removeTeam = (id: string) => {
    setLocalSelected(cur => cur.filter(x => x !== id));
  };

  const handleSave = () => {
    dispatch(submitPickFromSavedTeamsResult(localSelected));
    navigation.goBack();
  };

  const saveTitle =
    localSelected.length === 1
      ? 'Save (1 team)'
      : `Save (${localSelected.length} teams)`;

  return (
    <HomeWrapper headerShown>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <>
            <Text style={[styles.screenTitle, { color: theme.primary }]}>Add from saved teams</Text>
            <ThemeText color="secondaryText" style={styles.intro}>
              Pick teams from your saved list, then tap Save. You can add more later on the
              choose-teams screen.
            </ThemeText>

            <View style={[styles.selectedChip, { backgroundColor: theme.primaryMuted }]}>
              <Text style={[styles.selectedChipText, { color: theme.primary }]}>
                Selected {localSelected.length}
              </Text>
            </View>

            <View
              style={[
                styles.searchWrap,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <ThemeText color="secondaryText" style={styles.searchGlyph}>
                ⌕
              </ThemeText>
              <TextInput
                value={filterText}
                onChangeText={setFilterText}
                placeholder="Type part of a team name…"
                placeholderTextColor={theme.secondaryText}
                style={[styles.searchInput, { color: theme.text }]}
                autoCapitalize="words"
              />
            </View>

            {teams.length === 0 ? (
              <ThemeText color="secondaryText" style={styles.empty}>
                No saved teams yet. Go back and use “Add new team” in the previous screen.
              </ThemeText>
            ) : (
              <>
                <ThemeText color="secondaryText" style={styles.sectionLabel}>
                  Selected teams ({selectedRows.length})
                </ThemeText>
                {selectedRows.length === 0 ? (
                  <ThemeText color="desText" style={styles.sectionHint}>
                    None match this search. Clear the search or pick teams below.
                  </ThemeText>
                ) : (
                  selectedRows.map(t => (
                    <Pressable
                      key={t.id}
                      onPress={() => removeTeam(t.id)}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                          borderLeftWidth: widthPixel(4),
                          borderLeftColor: theme.primary,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.teamIconCircle,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Image
                          source={teamSlect}
                          style={styles.teamIconImg}
                          resizeMode="contain"
                          tintColor={theme.onPrimary}
                        />
                      </View>
                      <View style={styles.rowText}>
                        <ThemeText color="text" style={styles.rowName} numberOfLines={1}>
                          {t.name}
                        </ThemeText>
                        <ThemeText color="secondaryText" style={styles.rowMeta}>
                          {playerLabel(t.players.length)}
                        </ThemeText>
                      </View>
                      <View
                        style={[
                          styles.checkCircle,
                          { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                      >
                        <Text style={[styles.checkMark, { color: theme.onPrimary }]}>✓</Text>
                      </View>
                    </Pressable>
                  ))
                )}

                <ThemeText color="secondaryText" style={[styles.sectionLabel, styles.sectionGap]}>
                  Available teams
                </ThemeText>
                {availableRows.length === 0 ? (
                  <ThemeText color="desText" style={styles.sectionHint}>
                    {normalized
                      ? 'No teams match this search.'
                      : 'All saved teams are already selected.'}
                  </ThemeText>
                ) : (
                  availableRows.map(t => (
                    <Pressable
                      key={t.id}
                      onPress={() => addTeam(t.id)}
                      disabled={atCapacity}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                          opacity: pressed && !atCapacity ? 0.92 : atCapacity ? 0.55 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.teamIconCircle,
                          { backgroundColor: isDark ? theme.surfaceElevated : theme.gray3 },
                        ]}
                      >
                        <Image
                          source={teamSlect}
                          style={styles.teamIconImg}
                          resizeMode="contain"
                          tintColor={theme.icon}
                        />
                      </View>
                      <View style={styles.rowText}>
                        <ThemeText color="text" style={styles.rowName} numberOfLines={1}>
                          {t.name}
                        </ThemeText>
                        <ThemeText color="secondaryText" style={styles.rowMeta}>
                          {playerLabel(t.players.length)}
                        </ThemeText>
                      </View>
                      <View style={[styles.addPill, { borderColor: theme.primary }]}>
                        <Text style={[styles.addPillText, { color: theme.primary }]}>Add</Text>
                      </View>
                    </Pressable>
                  ))
                )}
              </>
            )}
          </>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, heightPixel(14)),
              backgroundColor: theme.transparent,
            },
          ]}
        >
          <Button
            title={saveTitle}
            onPress={handleSave}
            disabled={!isComplete || teams.length === 0}
          />
          <Pressable onPress={() => navigation.goBack()} style={styles.cancelWrap} hitSlop={12}>
            <ThemeText color="secondaryText" style={styles.cancel}>
              Cancel
            </ThemeText>
          </Pressable>
        </View>
      </View>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(14),
    paddingBottom: heightPixel(24),
  },
  screenTitle: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
  },
  intro: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  selectedChip: {
    alignSelf: 'flex-start',
    marginTop: heightPixel(12),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(20),
  },
  selectedChipText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: widthPixel(14),
    marginTop: heightPixel(14),
    paddingHorizontal: widthPixel(12),
    minHeight: heightPixel(48),
  },
  searchGlyph: {
    fontSize: fontPixel(18),
    marginRight: widthPixel(8),
    lineHeight: fontPixel(22),
  },
  searchInput: {
    flex: 1,
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.regular,
    paddingVertical: heightPixel(10),
  },
  empty: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    marginTop: heightPixel(16),
  },
  sectionLabel: {
    marginTop: heightPixel(18),
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionGap: {
    marginTop: heightPixel(22),
  },
  sectionHint: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: widthPixel(14),
    marginTop: heightPixel(10),
    paddingVertical: heightPixel(12),
    paddingLeft: widthPixel(12),
    paddingRight: widthPixel(12),
    overflow: 'hidden',
  },
  teamIconCircle: {
    width: widthPixel(40),
    height: widthPixel(40),
    borderRadius: widthPixel(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: widthPixel(10),
  },
  teamIconImg: {
    width: widthPixel(20),
    height: widthPixel(20),
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  rowMeta: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(12),
  },
  checkCircle: {
    width: widthPixel(30),
    height: widthPixel(30),
    borderRadius: widthPixel(15),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
    marginTop: -1,
  },
  addPill: {
    borderWidth: 1.5,
    borderRadius: widthPixel(20),
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(8),
  },
  addPillText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  footer: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(8),
  },
  cancelWrap: {
    alignSelf: 'center',
    marginTop: heightPixel(10),
    paddingVertical: heightPixel(6),
  },
  cancel: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
});

export default AddFromSavedTeamsScreen;
