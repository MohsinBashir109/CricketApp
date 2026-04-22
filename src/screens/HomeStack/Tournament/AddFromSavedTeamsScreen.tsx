import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import { useThemeContext } from '../../../theme/themeContext';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { selectActiveTeams } from '../../../features/tournament/tournamentSelectors';
import { submitPickFromSavedTeamsResult } from '../../../features/tournament/tournamentSlice';

type RouteParams = {
  teamCount: number;
  selectedTeamIds: string[];
};

const AddFromSavedTeamsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const teamCount = Number(route.params?.teamCount ?? 0) || 0;
  const initialIds: string[] = route.params?.selectedTeamIds ?? [];

  const [filterText, setFilterText] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(() => [...initialIds]);

  const normalized = filterText.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return teams;
    return teams.filter(t => t.name.toLowerCase().includes(normalized));
  }, [teams, normalized]);

  const isComplete = localSelected.length > 0;

  const toggle = (id: string) => {
    setLocalSelected(cur => {
      if (cur.includes(id)) return cur.filter(x => x !== id);
      return [...cur, id];
    });
  };

  const handleSave = () => {
    dispatch(submitPickFromSavedTeamsResult(localSelected));
    navigation.goBack();
  };

  return (
    <HomeWrapper headerShown>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemeText color="text" style={styles.title}>
          Add from saved teams
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.subtitle}>
          Pick any teams from your saved list, then tap Save. You can add more teams later in the
          previous modal. Selected {localSelected.length}.
        </ThemeText>

        <ThemeText color="text" style={styles.label}>
          Find a team (optional)
        </ThemeText>
        <TextInput
          value={filterText}
          onChangeText={setFilterText}
          placeholder="Type part of a team name…"
          placeholderTextColor={theme.secondaryText}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
          ]}
          autoCapitalize="words"
        />

        {teams.length === 0 ? (
          <ThemeText color="secondaryText" style={styles.empty}>
            No saved teams yet. Go back and use “Add new team” in the previous screen.
          </ThemeText>
        ) : (
          filtered.map(t => {
            const selected = localSelected.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() => toggle(t.id)}
                style={[
                  styles.row,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primaryMuted : theme.surface,
                  },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemeText color="text" style={styles.rowName} numberOfLines={1}>
                    {t.name}
                  </ThemeText>
                  <ThemeText color="secondaryText" style={styles.rowMeta}>
                    {t.players.length} players
                  </ThemeText>
                </View>
                <ThemeText color={selected ? 'primary' : 'secondaryText'} style={styles.badge}>
                  {selected ? 'Selected' : 'Add'}
                </ThemeText>
              </Pressable>
            );
          })
        )}

        <View style={styles.footer}>
          <Button title="Save" onPress={handleSave} disabled={!isComplete || teams.length === 0} />
          <Pressable onPress={() => navigation.goBack()} style={styles.cancelWrap} hitSlop={12}>
            <ThemeText color="secondaryText" style={styles.cancel}>
              Cancel
            </ThemeText>
          </Pressable>
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(18),
    paddingBottom: heightPixel(36),
  },
  title: {
    fontSize: fontPixel(20),
    fontFamily: fontFamilies.bold,
  },
  subtitle: {
    marginTop: heightPixel(8),
    marginBottom: heightPixel(16),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  label: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
    marginBottom: heightPixel(8),
  },
  input: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(12),
    fontSize: fontPixel(15),
    marginBottom: heightPixel(16),
  },
  empty: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
    marginBottom: heightPixel(16),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    marginBottom: heightPixel(10),
  },
  rowName: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  rowMeta: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(12),
  },
  badge: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.semibold,
    marginLeft: widthPixel(8),
  },
  footer: {
    marginTop: heightPixel(20),
  },
  cancelWrap: {
    alignSelf: 'center',
    marginTop: heightPixel(14),
    paddingVertical: heightPixel(8),
  },
  cancel: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
});

export default AddFromSavedTeamsScreen;
