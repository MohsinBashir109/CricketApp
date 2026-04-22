import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowLg, cardShadowSm } from '../../utils/cardShadow';
import { selectActiveTeams } from '../../features/tournament/tournamentSelectors';
import { addTeam } from '../../features/teams/teamsSlice';
import { PlayerRole } from '../../types/Playertype';

type DraftPlayer = { id: string; name: string; role: PlayerRole };

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ');

const roleOptions: { label: string; value: PlayerRole }[] = [
  { label: 'Batsman', value: 'batsman' },
  { label: 'Bowler', value: 'bowler' },
  { label: 'All-Rounder', value: 'allrounder' },
  { label: 'Wicketkeeper', value: 'wicketkeeper' },
];

type Props = {
  visible: boolean;
  teamCount: number;
  selectedTeamIds: string[];
  onClose: () => void;
  onConfirm: (teamIds: string[]) => void;
  /** Opens full-screen picker; parent should close modal and navigate. */
  onOpenSavedTeams: (currentSelection: string[]) => void;
};

const ChooseTeamsModal: React.FC<Props> = ({
  visible,
  teamCount,
  selectedTeamIds,
  onClose,
  onConfirm,
  onOpenSavedTeams,
}) => {
  const dispatch = useDispatch();
  const teams = useSelector(selectActiveTeams);
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const [localSelected, setLocalSelected] = useState<string[]>(selectedTeamIds ?? []);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState<PlayerRole>('batsman');
  const [draftPlayers, setDraftPlayers] = useState<DraftPlayer[]>([]);

  useEffect(() => {
    if (!visible) return;
    setLocalSelected(Array.from(new Set([...(selectedTeamIds ?? [])])));
    setShowAddTeam(false);
    setNewTeamName('');
    setPlayerName('');
    setPlayerRole('batsman');
    setDraftPlayers([]);
  }, [visible, selectedTeamIds]);

  const isComplete = teamCount > 1 && localSelected.length === teamCount;

  const togglePick = (id: string) => {
    setLocalSelected(cur => {
      const exists = cur.includes(id);
      if (exists) return cur.filter(x => x !== id);
      if (teamCount > 0 && cur.length >= teamCount) return cur;
      return [...cur, id];
    });
  };

  const selectedTeams = useMemo(
    () => teams.filter(t => localSelected.includes(t.id)),
    [teams, localSelected],
  );

  const handleAddDraftPlayer = () => {
    const nm = normalizeName(playerName);
    if (!nm) {
      Alert.alert('Missing player', 'Enter a player name before adding.');
      return;
    }
    const dup = draftPlayers.some(p => p.name.toLowerCase() === nm.toLowerCase());
    if (dup) {
      Alert.alert('Duplicate player', 'This player is already added.');
      return;
    }
    setDraftPlayers(prev => [
      ...prev,
      { id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: nm, role: playerRole },
    ]);
    setPlayerName('');
    setPlayerRole('batsman');
  };

  const handleSaveTeam = () => {
    const teamName = normalizeName(newTeamName);
    if (!teamName) {
      Alert.alert('Missing team name', 'Enter a team name before saving.');
      return;
    }
    if (draftPlayers.length === 0) {
      Alert.alert('Add players', 'Create at least one player for the new team.');
      return;
    }
    const duplicateTeam = teams.some(t => t.name.trim().toLowerCase() === teamName.toLowerCase());
    if (duplicateTeam) {
      Alert.alert('Duplicate team', 'A saved team with this name already exists.');
      return;
    }

    const nextTeamId = `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    dispatch(
      addTeam({
        id: nextTeamId,
        name: teamName,
        players: draftPlayers.map(p => ({ name: p.name, role: p.role })),
      }),
    );

    setShowAddTeam(false);
    setNewTeamName('');
    setDraftPlayers([]);
    setPlayerName('');
    setPlayerRole('batsman');

    if (teamCount > 0 && localSelected.length < teamCount) {
      setLocalSelected(current => (current.includes(nextTeamId) ? current : [...current, nextTeamId]));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            isDark ? styles.sheetShadowDark : styles.sheetShadowLight,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemeText color="text" style={styles.title}>
                Choose teams
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.subtitle}>
                {teamCount > 1 ? `Selected ${localSelected.length} of ${teamCount}.` : 'Enter team count first.'}
              </ThemeText>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemeText color="secondaryText" style={styles.close}>
                Close
              </ThemeText>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {teams.length === 0 ? (
              <ThemeText color="secondaryText" style={styles.helperText}>
                No saved teams yet. Tap “+ Add new team” to create one.
              </ThemeText>
            ) : (
              <View style={styles.savedTeamsSection}>
                <ThemeText color="secondaryText" style={styles.fieldHint}>
                  Open your saved teams on a full screen, pick the right number, tap Save, and you will
                  return here with your selection.
                </ThemeText>
                <Button
                  title="Add from saved teams"
                  onPress={() => onOpenSavedTeams([...localSelected])}
                  disabled={teamCount <= 1}
                  buttonStyle={styles.savedTeamsButton}
                />
              </View>
            )}

            <Pressable onPress={() => setShowAddTeam(v => !v)} style={styles.addTeamLink}>
              <ThemeText color="primary" style={styles.addTeamText}>
                {showAddTeam ? 'Close team builder' : '+ Add new team'}
              </ThemeText>
            </Pressable>

            {showAddTeam ? (
              <View
                style={[
                  styles.innerCard,
                  isDark ? styles.innerShadowDark : styles.innerShadowLight,
                  { borderColor: theme.border, backgroundColor: theme.surfaceElevated },
                ]}
              >
                <ThemeText color="text" style={styles.innerTitle}>
                  New team
                </ThemeText>
                <ThemeText color="secondaryText" style={styles.innerOneLine}>
                  Name the team, add players, save — then use “Add from saved teams”.
                </ThemeText>
                <TextInput
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder="Team name"
                  placeholderTextColor={theme.secondaryText}
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                />

                <ThemeText color="text" style={styles.label}>
                  Add players
                </ThemeText>
                <TextInput
                  value={playerName}
                  onChangeText={setPlayerName}
                  placeholder="Player name"
                  placeholderTextColor={theme.secondaryText}
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                />
                <View style={styles.optionWrap}>
                  {roleOptions.map(opt => {
                    const selected = playerRole === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => setPlayerRole(opt.value)}
                        style={[
                          styles.choiceChip,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: selected ? theme.primaryMuted : theme.surface,
                          },
                        ]}
                      >
                        <ThemeText color={selected ? 'primary' : 'text'} style={styles.choiceText}>
                          {opt.label}
                        </ThemeText>
                      </Pressable>
                    );
                  })}
                </View>
                <Button title="Add player" onPress={handleAddDraftPlayer} />

                {draftPlayers.map(p => (
                  <View key={p.id} style={[styles.listRow, { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <ThemeText color="text" style={styles.listTitle}>
                        {p.name}
                      </ThemeText>
                      <ThemeText color="secondaryText" style={styles.listMeta}>
                        {p.role}
                      </ThemeText>
                    </View>
                    <Pressable onPress={() => setDraftPlayers(cur => cur.filter(x => x.id !== p.id))}>
                      <ThemeText color="error" style={styles.removeText}>
                        Remove
                      </ThemeText>
                    </Pressable>
                  </View>
                ))}

                <Button title="Save team" onPress={handleSaveTeam} />
              </View>
            ) : null}

            {selectedTeams.length > 0 ? (
              <View style={styles.selectedBlock}>
                <ThemeText color="text" style={styles.label}>
                  Selected teams
                </ThemeText>
                {selectedTeams.map(t => (
                  <Pressable
                    key={t.id}
                    onPress={() => togglePick(t.id)}
                    style={[
                      styles.selectedRow,
                      isDark ? styles.rowShadowDark : styles.rowShadowLight,
                      { borderColor: theme.border, backgroundColor: theme.surfaceElevated },
                    ]}
                  >
                    <ThemeText color="text" style={styles.selectedName} numberOfLines={1}>
                      {t.name}
                    </ThemeText>
                    <ThemeText color="secondaryText" style={styles.selectedRemove}>
                      Tap to remove
                    </ThemeText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footerRow}>
            <Button title="Confirm teams" onPress={() => onConfirm(localSelected)} disabled={!isComplete} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetShadowLight: cardShadowLg(false),
  sheetShadowDark: cardShadowLg(true),
  innerShadowLight: cardShadowSm(false),
  innerShadowDark: cardShadowSm(true),
  rowShadowLight: cardShadowSm(false),
  rowShadowDark: cardShadowSm(true),
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: widthPixel(22),
    borderTopRightRadius: widthPixel(22),
    borderWidth: 1,
    padding: widthPixel(16),
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(12),
    marginBottom: heightPixel(10),
  },
  title: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  subtitle: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  close: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  helperText: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(10),
  },
  addTeamLink: {
    marginTop: heightPixel(4),
    marginBottom: heightPixel(12),
    alignSelf: 'flex-start',
    paddingVertical: heightPixel(6),
  },
  addTeamText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  innerCard: {
    borderWidth: 1,
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
    marginBottom: heightPixel(12),
  },
  innerTitle: {
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
    marginBottom: heightPixel(6),
  },
  innerOneLine: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(12),
  },
  label: {
    marginTop: heightPixel(10),
    marginBottom: heightPixel(8),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  input: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(14),
    paddingVertical: heightPixel(12),
    fontSize: fontPixel(15),
    marginBottom: heightPixel(10),
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginBottom: heightPixel(10),
  },
  choiceChip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(14),
  },
  choiceText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: widthPixel(12),
    paddingVertical: heightPixel(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listTitle: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  listMeta: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  removeText: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.semibold,
  },
  selectedBlock: {
    marginBottom: heightPixel(12),
  },
  selectedRow: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(12),
    marginBottom: heightPixel(10),
  },
  selectedName: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.semibold,
  },
  selectedRemove: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
  },
  footerRow: {
    paddingTop: heightPixel(10),
  },
  savedTeamsSection: {
    marginBottom: heightPixel(8),
  },
  fieldHint: {
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    marginBottom: heightPixel(12),
  },
  savedTeamsButton: {
    marginBottom: heightPixel(10),
  },
});

export default ChooseTeamsModal;

