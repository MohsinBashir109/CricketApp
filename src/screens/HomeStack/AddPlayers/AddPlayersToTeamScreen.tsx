import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';
import { useThemeContext } from '../../../theme/themeContext';
import { cardShadowLg } from '../../../utils/cardShadow';
import ThemeText from '../../../components/ThemeText';
import Button from '../../../components/themeButton';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';

export type TeamRoleLabel =
  | 'Batsman'
  | 'Bowler'
  | 'All-Rounder'
  | 'Wicketkeeper';

export type SquadPlayer = {
  id: string;
  name: string;
  role: TeamRoleLabel;
};

const ROLES: TeamRoleLabel[] = [
  'Batsman',
  'Bowler',
  'All-Rounder',
  'Wicketkeeper',
];

type Props = {
  /** Team display name, e.g. "Tg" → title becomes "Add Players to Team Tg" */
  teamDisplayName: string;
  /** Initial squad (optional) */
  initialPlayers?: SquadPlayer[];
  onBack: () => void;
  /** Called when user taps Save Team */
  onSaveTeam?: (players: SquadPlayer[]) => void;
};

const roleKey = (r: TeamRoleLabel) => r;

const initialsFromName = (name: string) => {
  const t = name.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
};

const AddPlayersToTeamScreen: React.FC<Props> = ({
  teamDisplayName,
  initialPlayers = [],
  onBack,
  onSaveTeam,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRoleLabel | null>(null);
  const [players, setPlayers] = useState<SquadPlayer[]>(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const title = useMemo(
    () => `Add Players to Team ${teamDisplayName}`,
    [teamDisplayName],
  );

  const canAdd = playerName.trim().length > 0 && selectedRole !== null;
  const isEditing = editingId !== null;
  const primaryCtaLabel = isEditing ? 'Update Player' : 'Add to Team';

  const clearForm = useCallback(() => {
    setPlayerName('');
    setSelectedRole(null);
    setEditingId(null);
    setInputError(null);
  }, []);

  const handleAddOrUpdate = useCallback(() => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setInputError('Enter a player name.');
      return;
    }
    if (!selectedRole) {
      setInputError('Select a role.');
      return;
    }

    const dup = players.some(
      p =>
        p.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        p.id !== editingId,
    );
    if (dup) {
      setInputError('A player with this name is already on the team.');
      return;
    }

    setInputError(null);

    if (editingId) {
      setPlayers(prev =>
        prev.map(p =>
          p.id === editingId
            ? { ...p, name: trimmed, role: selectedRole }
            : p,
        ),
      );
      clearForm();
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setPlayers(prev => [...prev, { id, name: trimmed, role: selectedRole }]);
    setPlayerName('');
    setSelectedRole(null);
  }, [playerName, selectedRole, players, editingId, clearForm]);

  const startEdit = useCallback(
    (p: SquadPlayer) => {
      setEditingId(p.id);
      setPlayerName(p.name);
      setSelectedRole(p.role);
      setInputError(null);
    },
    [],
  );

  const removePlayer = useCallback((id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setEditingId(cur => (cur === id ? null : cur));
  }, []);

  const handleSaveTeam = useCallback(() => {
    console.log('players', players);
    onSaveTeam?.(players);
  }, [players, onSaveTeam]);

  const addDisabled = !canAdd;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={[styles.backBtn, { backgroundColor: theme.primaryMuted }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ThemeText color="primary" style={styles.backArrow}>
              ‹
            </ThemeText>
          </Pressable>
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <ThemeText color="white" style={styles.badgeText}>
              {initialsFromName(teamDisplayName)}
            </ThemeText>
          </View>
          <View style={styles.headerTextBlock}>
            <ThemeText color="text" style={styles.title} numberOfLines={2}>
              {title}
            </ThemeText>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemeText color="secondaryText" style={styles.intro}>
            Enter player details to build your team lineup.
          </ThemeText>

          <View style={isDark ? styles.cardShadowWrapDark : styles.cardShadowWrapLight}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View
              style={[
                styles.inputShell,
                inputError ? styles.inputShellError : null,
                {
                  borderColor: inputError ? theme.error : theme.border,
                  backgroundColor: inputError ? theme.errorMuted : theme.surfaceElevated,
                },
              ]}
            >
              <ThemeText color="primary" style={styles.inputIcon}>
                ◎
              </ThemeText>
              <TextInput
                value={playerName}
                onChangeText={t => {
                  setPlayerName(t);
                  if (inputError) setInputError(null);
                }}
                placeholder="Player Name"
                placeholderTextColor={theme.secondaryText}
                style={[styles.input, { color: theme.text }]}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {inputError ? (
              <ThemeText color="error" style={styles.errorText}>
                {inputError}
              </ThemeText>
            ) : null}

            <ThemeText color="text" style={styles.sectionLabel}>
              Select Role
            </ThemeText>
            <View style={styles.roleWrap}>
              {ROLES.map(role => {
                const selected = selectedRole === role;
                return (
                  <Pressable
                    key={roleKey(role)}
                    onPress={() => {
                      setSelectedRole(role);
                      setInputError(null);
                    }}
                    style={({ pressed }) => [
                      styles.roleChip,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primaryMuted : theme.surface,
                      },
                      pressed && !selected && styles.roleChipPressed,
                    ]}
                  >
                    <ThemeText color={selected ? 'primary' : 'text'} style={styles.roleChipText}>
                      {role}
                    </ThemeText>
                  </Pressable>
                );
              })}
            </View>

            <Button title={primaryCtaLabel} onPress={handleAddOrUpdate} disabled={addDisabled} />
            </View>
          </View>

          <ThemeText color="secondaryText" style={styles.listHeading}>
            Squad
          </ThemeText>
          <View style={isDark ? styles.cardShadowWrapDark : styles.cardShadowWrapLight}>
            <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.listHeaderRow, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.border }]}>
              <ThemeText color="secondaryText" style={[styles.colIdx, styles.listHeaderText]}>#</ThemeText>
              <ThemeText color="secondaryText" style={[styles.colName, styles.listHeaderText]}>
                Player Name
              </ThemeText>
              <ThemeText color="secondaryText" style={[styles.colRole, styles.listHeaderText]}>Role</ThemeText>
              <ThemeText color="secondaryText" style={[styles.colAct, styles.listHeaderText]}> </ThemeText>
            </View>

            {players.length === 0 ? (
              <ThemeText color="secondaryText" style={styles.empty}>
                No players added yet. Start by entering a player name and
                selecting a role.
              </ThemeText>
            ) : (
              players.map((p, index) => (
                <View
                  key={p.id}
                  style={[
                    styles.row,
                    index === players.length - 1 && styles.rowLast,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <ThemeText color="secondaryText" style={[styles.colIdx, styles.rowText]}>
                    {index + 1}
                  </ThemeText>
                  <ThemeText color="text" style={[styles.colName, styles.rowTextBold]} numberOfLines={1}>
                    {p.name}
                  </ThemeText>
                  <ThemeText color="secondaryText" style={[styles.colRole, styles.rowTextMuted]} numberOfLines={1}>
                    {p.role}
                  </ThemeText>
                  <View style={styles.colAct}>
                    <Pressable
                      onPress={() => startEdit(p)}
                      style={[styles.iconBtn, { backgroundColor: theme.primaryMuted }]}
                      hitSlop={8}
                      accessibilityLabel={`Edit ${p.name}`}
                    >
                      <ThemeText color="primary" style={styles.iconBtnText}>
                        Edit
                      </ThemeText>
                    </Pressable>
                    <Pressable
                      onPress={() => removePlayer(p.id)}
                      style={[styles.iconBtnDanger, { backgroundColor: theme.errorMuted }]}
                      hitSlop={8}
                      accessibilityLabel={`Remove ${p.name}`}
                    >
                      <ThemeText color="error" style={styles.iconBtnDangerText}>
                        Del
                      </ThemeText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, heightPixel(12)) },
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <Button title="Save Team" onPress={handleSaveTeam} disabled={players.length === 0} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddPlayersToTeamScreen;

const styles = StyleSheet.create({
  cardShadowWrapLight: cardShadowLg(false),
  cardShadowWrapDark: cardShadowLg(true),
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: widthPixel(12),
  },
  backBtn: {
    width: widthPixel(40),
    height: widthPixel(40),
    borderRadius: widthPixel(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: fontPixel(28),
    marginTop: -heightPixel(4),
    fontFamily: fontFamilies.semibold,
  },
  badge: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.5,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontPixel(17),
    fontFamily: fontFamilies.bold,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(16),
    paddingBottom: heightPixel(24),
  },
  intro: {
    fontSize: fontPixel(14),
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(18),
  },
  card: {
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(14),
    borderWidth: 1,
    paddingHorizontal: widthPixel(14),
    minHeight: heightPixel(52),
  },
  inputShellError: {},
  inputIcon: {
    fontSize: fontPixel(18),
    marginRight: widthPixel(10),
  },
  input: {
    flex: 1,
    fontSize: fontPixel(16),
    paddingVertical: heightPixel(12),
  },
  errorText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.medium,
  },
  sectionLabel: {
    marginTop: heightPixel(20),
    marginBottom: heightPixel(10),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
    letterSpacing: 0.3,
  },
  roleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
  },
  roleChip: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(14),
    borderRadius: widthPixel(999),
    borderWidth: 1,
  },
  roleChipOff: {},
  roleChipOn: {},
  roleChipPressed: {
    opacity: 0.92,
  },
  roleChipText: {
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  listHeading: {
    marginTop: heightPixel(28),
    marginBottom: heightPixel(10),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listCard: {
    borderRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listHeaderText: {
    fontSize: fontPixel(11),
    fontFamily: fontFamilies.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  colIdx: {
    width: widthPixel(28),
  },
  colName: {
    flex: 1,
    paddingRight: widthPixel(8),
  },
  colRole: {
    width: widthPixel(100),
  },
  colAct: {
    width: widthPixel(88),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  empty: {
    padding: widthPixel(20),
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    fontSize: fontPixel(14),
  },
  rowTextBold: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  rowTextMuted: {
    fontSize: fontPixel(13),
  },
  iconBtn: {
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(8),
    borderRadius: widthPixel(8),
    marginRight: widthPixel(6),
  },
  iconBtnText: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.bold,
  },
  iconBtnDanger: {
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(8),
    borderRadius: widthPixel(8),
  },
  iconBtnDangerText: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.bold,
  },
  footer: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
