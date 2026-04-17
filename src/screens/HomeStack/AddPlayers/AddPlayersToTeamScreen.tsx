import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';

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

const PRIMARY = '#0F6B4E';
const PRIMARY_SOFT = '#E6F4EF';
const BG = '#F6F7F5';
const SURFACE = '#FFFFFF';
const TEXT = '#1A1F1C';
const TEXT_MUTED = '#6B7280';
const BORDER = '#E5E8E6';
const ERROR = '#DC2626';

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{initialsFromName(teamDisplayName)}</Text>
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Enter player details to build your team lineup.
          </Text>

          <View style={styles.card}>
            <View
              style={[
                styles.inputShell,
                inputError ? styles.inputShellError : null,
              ]}
            >
              <Text style={styles.inputIcon}>◎</Text>
              <TextInput
                value={playerName}
                onChangeText={t => {
                  setPlayerName(t);
                  if (inputError) setInputError(null);
                }}
                placeholder="Player Name"
                placeholderTextColor={TEXT_MUTED}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {inputError ? (
              <Text style={styles.errorText}>{inputError}</Text>
            ) : null}

            <Text style={styles.sectionLabel}>Select Role</Text>
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
                      selected ? styles.roleChipOn : styles.roleChipOff,
                      pressed && !selected && styles.roleChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selected && styles.roleChipTextOn,
                      ]}
                    >
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleAddOrUpdate}
              disabled={addDisabled}
              style={({ pressed }) => [
                styles.primaryBtn,
                addDisabled && styles.primaryBtnDisabled,
                pressed && !addDisabled && styles.primaryBtnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>{primaryCtaLabel}</Text>
            </Pressable>
          </View>

          <Text style={styles.listHeading}>Squad</Text>
          <View style={styles.listCard}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.colIdx, styles.listHeaderText]}>#</Text>
              <Text style={[styles.colName, styles.listHeaderText]}>
                Player Name
              </Text>
              <Text style={[styles.colRole, styles.listHeaderText]}>Role</Text>
              <Text style={[styles.colAct, styles.listHeaderText]}> </Text>
            </View>

            {players.length === 0 ? (
              <Text style={styles.empty}>
                No players added yet. Start by entering a player name and
                selecting a role.
              </Text>
            ) : (
              players.map((p, index) => (
                <View
                  key={p.id}
                  style={[
                    styles.row,
                    index === players.length - 1 && styles.rowLast,
                  ]}
                >
                  <Text style={[styles.colIdx, styles.rowText]}>{index + 1}</Text>
                  <Text
                    style={[styles.colName, styles.rowTextBold]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <Text
                    style={[styles.colRole, styles.rowTextMuted]}
                    numberOfLines={1}
                  >
                    {p.role}
                  </Text>
                  <View style={styles.colAct}>
                    <Pressable
                      onPress={() => startEdit(p)}
                      style={styles.iconBtn}
                      hitSlop={8}
                      accessibilityLabel={`Edit ${p.name}`}
                    >
                      <Text style={styles.iconBtnText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => removePlayer(p.id)}
                      style={styles.iconBtnDanger}
                      hitSlop={8}
                      accessibilityLabel={`Remove ${p.name}`}
                    >
                      <Text style={styles.iconBtnDangerText}>Del</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, heightPixel(12)) },
          ]}
        >
          <Pressable
            onPress={handleSaveTeam}
            disabled={players.length === 0}
            style={({ pressed }) => [
              styles.saveBtn,
              players.length === 0 && styles.saveBtnDisabled,
              pressed && players.length > 0 && styles.saveBtnPressed,
            ]}
          >
            <Text style={styles.saveBtnText}>Save Team</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddPlayersToTeamScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(16),
    paddingVertical: heightPixel(14),
    backgroundColor: SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    gap: widthPixel(12),
  },
  backBtn: {
    width: widthPixel(40),
    height: widthPixel(40),
    borderRadius: widthPixel(12),
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: fontPixel(28),
    color: PRIMARY,
    marginTop: -heightPixel(4),
    fontWeight: '600',
  },
  badge: {
    width: widthPixel(44),
    height: widthPixel(44),
    borderRadius: widthPixel(14),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: fontPixel(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontPixel(17),
    fontWeight: '700',
    color: TEXT,
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
    color: TEXT_MUTED,
    lineHeight: fontPixel(20),
    marginBottom: heightPixel(18),
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: widthPixel(18),
    padding: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: widthPixel(14),
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FAFBFA',
    paddingHorizontal: widthPixel(14),
    minHeight: heightPixel(52),
  },
  inputShellError: {
    borderColor: ERROR,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    fontSize: fontPixel(18),
    color: PRIMARY,
    marginRight: widthPixel(10),
  },
  input: {
    flex: 1,
    fontSize: fontPixel(16),
    color: TEXT,
    paddingVertical: heightPixel(12),
  },
  errorText: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    color: ERROR,
    fontWeight: '500',
  },
  sectionLabel: {
    marginTop: heightPixel(20),
    marginBottom: heightPixel(10),
    fontSize: fontPixel(13),
    fontWeight: '700',
    color: TEXT,
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
  roleChipOff: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
  },
  roleChipOn: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  roleChipPressed: {
    opacity: 0.92,
  },
  roleChipText: {
    fontSize: fontPixel(13),
    fontWeight: '600',
    color: TEXT,
  },
  roleChipTextOn: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    marginTop: heightPixel(22),
    backgroundColor: PRIMARY,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(16),
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#A8B5AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnPressed: {
    opacity: 0.92,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: fontPixel(16),
    fontWeight: '700',
  },
  listHeading: {
    marginTop: heightPixel(28),
    marginBottom: heightPixel(10),
    fontSize: fontPixel(13),
    fontWeight: '700',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listCard: {
    backgroundColor: SURFACE,
    borderRadius: widthPixel(18),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
    backgroundColor: '#F3F5F4',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  listHeaderText: {
    fontSize: fontPixel(11),
    fontWeight: '700',
    color: TEXT_MUTED,
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
    color: TEXT_MUTED,
    lineHeight: fontPixel(21),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    fontSize: fontPixel(14),
    color: TEXT_MUTED,
  },
  rowTextBold: {
    fontSize: fontPixel(15),
    fontWeight: '600',
    color: TEXT,
  },
  rowTextMuted: {
    fontSize: fontPixel(13),
    color: TEXT_MUTED,
  },
  iconBtn: {
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(8),
    borderRadius: widthPixel(8),
    backgroundColor: PRIMARY_SOFT,
    marginRight: widthPixel(6),
  },
  iconBtnText: {
    fontSize: fontPixel(12),
    fontWeight: '700',
    color: PRIMARY,
  },
  iconBtnDanger: {
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(8),
    borderRadius: widthPixel(8),
    backgroundColor: '#FEF2F2',
  },
  iconBtnDangerText: {
    fontSize: fontPixel(12),
    fontWeight: '700',
    color: ERROR,
  },
  footer: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(10),
    backgroundColor: SURFACE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(16),
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#C5CDC8',
  },
  saveBtnPressed: {
    opacity: 0.92,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: fontPixel(16),
    fontWeight: '700',
  },
});
