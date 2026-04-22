import {
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { allrounder, bat, bowlericon, wicket } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowLg, cardShadowSm } from '../../utils/cardShadow';

import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';
import { useDispatch } from 'react-redux';
import { addLivePlayerToTeam } from '../../features/match/matchSlice';
import { PlayerRole } from '../../types/Playertype';

export type BatsmanRow = {
  id: string;
  name: string;
  isStriker?: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut?: boolean | null; // optional (use if you want to hide out players)
  role?: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper' | string;
};

export type BowlerRow = {
  id: string;
  name: string;
  overs: string; // "3.2"
  maidens: number;
  runs: number;
  wickets: number;
  econ: number;
  role?: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper' | string;
};

export type Mode = 'OPENERS' | 'NEXT_BATSMAN' | 'NEXT_BOWLER';

type Props = {
  mode: Mode;

  batsmen: BatsmanRow[];
  bowler: BowlerRow[];

  visible: boolean;
  /** `inline` = part of the scroll view (no dimmed popup). `modal` = centered overlay. */
  presentation?: 'modal' | 'inline';
  onClose: () => void;
  innings?: any; // only needed for OPENERS mode to determine which players to show as availables
  currentMatch?: any; // only needed for OPENERS mode to determine which players to show as availables
  // OPENERS
  onConfirmOpeners?: (payload: {
    striker: BatsmanRow;
    nonStriker: BatsmanRow;
    bowlerSelected: BowlerRow;
  }) => void;

  // NEXT_BATSMAN
  onConfirmNextBatsman?: (batsman: BatsmanRow) => void;

  // NEXT_BOWLER
  onConfirmNextBowler?: (bowler: BowlerRow) => void;
};

type ListItem = BatsmanRow | BowlerRow;

const rowId = (x: ListItem | { id?: unknown }) => String((x as any)?.id ?? '');

const BatsmenBowlerCard: React.FC<Props> = ({
  batsmen,
  bowler,
  visible,
  presentation = 'modal',
  onClose,
  mode,
  onConfirmOpeners,
  onConfirmNextBatsman,
  onConfirmNextBowler,
  innings,
  currentMatch,
}) => {
  const dispatch = useDispatch();
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const isInline = presentation === 'inline';
  const { height: screenHeight } = useWindowDimensions();

  const isOpeners = mode === 'OPENERS';
  const isNextBat = mode === 'NEXT_BATSMAN';
  const isNextBow = mode === 'NEXT_BOWLER';

  // OPENERS state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [confirmBowlerStep, setConfirmBowlerStep] = useState(false);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);
  const [showAddLivePlayer, setShowAddLivePlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('batsman');
  const inningsLabel = () => {
    const ci = currentMatch?.currentInnings ?? 1;
    if (ci === 1) return 'Innings 1';
    if (ci === 2) return 'Innings 2';
    if (ci === 3) return 'Super Over (1st)';
    if (ci === 4) return 'Super Over (2nd)';
    return 'Innings 2';
  };

  const getHeaderContent = () => {
    const inningsText = inningsLabel();

    const battingTeamName =
      currentMatch?.[innings?.battingTeam ?? 'teamA']?.name ?? 'Batting Team';

    const bowlingTeamName =
      currentMatch?.[innings?.bowlingTeam ?? 'teamA']?.name ?? 'Bowling Team';

    switch (mode) {
      case 'OPENERS':
        // OPENERS has 2 internal steps:
        // 1) pick batsmen
        // 2) pick opening bowler
        return {
          teamName: confirmBowlerStep ? bowlingTeamName : battingTeamName,
          actionText: confirmBowlerStep
            ? 'Pick Opening Bowler'
            : 'Pick Openers',
          inningsText,
        };

      case 'NEXT_BATSMAN':
        return {
          teamName: battingTeamName,
          actionText: 'Pick Next Batsman',
          inningsText,
        };

      case 'NEXT_BOWLER':
        return {
          teamName: bowlingTeamName,
          actionText: 'Pick Next Bowler',
          inningsText,
        };

      default:
        return {
          teamName: battingTeamName,
          actionText: '',
          inningsText,
        };
    }
  };
  const headerContent = getHeaderContent();
  const inningsText = inningsLabel();
  const battingTeamName =
    currentMatch?.[innings?.battingTeam ?? 'teamA']?.name ?? 'Batting Team';
  const bowlingTeamName =
    currentMatch?.[innings?.bowlingTeam ?? 'teamA']?.name ?? 'Bowling Team';
  // NEXT_BATSMAN statea
  const [selectedNextBatId, setSelectedNextBatId] = useState<string | null>(
    null,
  );

  // NEXT_BOWLER state
  const [selectedNextBowlerId, setSelectedNextBowlerId] = useState<
    string | null
  >(null);

  // Reset local state whenever modal opens, mode changes, or innings phase (e.g. Super Over)
  const inningsPhase = currentMatch?.currentInnings ?? 1;
  useEffect(() => {
    if (!visible) return;

    setSelectedIds([]);
    setStrikerId(null);
    setConfirmBowlerStep(false);
    setSelectedBowlerId(null);

    setSelectedNextBatId(null);
    setSelectedNextBowlerId(null);
    setShowAddLivePlayer(false);
    setNewPlayerName('');
    setNewPlayerRole('batsman');
  }, [visible, mode, inningsPhase]);

  const targetTeamKey: 'teamA' | 'teamB' | null = useMemo(() => {
    const inn = innings;
    if (!inn) return null;
    if (isNextBat) return inn.battingTeam ?? null;
    if (isNextBow) return inn.bowlingTeam ?? null;
    return confirmBowlerStep ? inn.bowlingTeam ?? null : inn.battingTeam ?? null;
  }, [innings, isNextBat, isNextBow, confirmBowlerStep]);

  const getRoleMeta = (
    role?: string,
  ): { label: string; icon?: ImageSourcePropType } => {
    switch (role) {
      case 'batsman':
        return { label: 'Batsman', icon: bat };
      case 'bowler':
        return { label: 'Bowler', icon: bowlericon };
      case 'allrounder':
        return { label: 'All-rounder', icon: allrounder };
      case 'wicketkeeper':
        return { label: 'Wicketkeeper', icon: wicket };
      default:
        return { label: 'Unknown' };
    }
  };
  const strikerIdOnCrease = innings?.strikerId;
  const nonStrikerIdOnCrease = innings?.nonStrikerId;
  const allowDismissedBatters =
    inningsPhase === 3 || inningsPhase === 4;

  const availableBatsmen = batsmen.filter(b => {
    if (!allowDismissedBatters && b?.isOut === true) return false;

    if (mode === 'NEXT_BATSMAN') {
      if (
        strikerIdOnCrease != null &&
        rowId(b) === String(strikerIdOnCrease)
      )
        return false;
      if (
        nonStrikerIdOnCrease != null &&
        rowId(b) === String(nonStrikerIdOnCrease)
      )
        return false;
    }

    return true;
  });

  const data: ListItem[] = useMemo(() => {
    if (isNextBow) return bowler;

    if (isNextBat) return availableBatsmen;

    // OPENERS
    return confirmBowlerStep ? bowler : availableBatsmen;
  }, [isNextBow, isNextBat, confirmBowlerStep, bowler, availableBatsmen]);

  // OPENERS select batsmen (max 2)
  const toggleSelectBat = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        if (strikerId === id) setStrikerId(null);
        return next;
      }
      if (prev.length >= 2) return prev;

      const next = [...prev, id];
      if (next.length === 1) setStrikerId(id);
      return next;
    });
  };

  // OPENERS select bowler in bowler step
  const toggleSelectBowlerForOpeners = (id: string) => {
    setSelectedBowlerId(prev => (prev === id ? null : id));
  };

  // NEXT_BOWLER select
  const toggleSelectNextBowler = (id: string) => {
    setSelectedNextBowlerId(prev => (prev === id ? null : id));
  };

  // Titles / headers
  const titleText = isNextBat
    ? 'Pick Next Batsman'
    : isNextBow
    ? 'Pick Next Bowler'
    : confirmBowlerStep
    ? 'Pick Opening Bowler'
    : 'Pick Batsmen to Open';

  const columnTitle = isNextBow
    ? 'Bowler Name'
    : isNextBat
    ? 'Batsman Name'
    : confirmBowlerStep
    ? 'Bowler Name'
    : 'Batsmen Name';

  // Primary button enable
  const canConfirmOpeners = selectedIds.length === 2 && !!strikerId;
  const canStartInnings = canConfirmOpeners && !!selectedBowlerId;

  const primaryDisabled = isNextBat
    ? !selectedNextBatId
    : isNextBow
    ? !selectedNextBowlerId
    : confirmBowlerStep
    ? !canStartInnings
    : !canConfirmOpeners;

  const primaryText = isNextBat
    ? 'Confirm Batsman'
    : isNextBow
    ? 'Confirm Bowler'
    : confirmBowlerStep
    ? 'Start Innings'
    : 'Confirm Openers';

  const handlePrimaryPress = () => {
    if (isNextBat) {
      if (!selectedNextBatId) return;
      const picked = batsmen.find(b => rowId(b) === selectedNextBatId);
      if (!picked) return;

      onConfirmNextBatsman?.(picked);
      onClose();
      return;
    }

    if (isNextBow) {
      if (!selectedNextBowlerId) return;
      const picked = bowler.find(b => rowId(b) === selectedNextBowlerId);
      if (!picked) return;

      onConfirmNextBowler?.(picked);
      onClose();
      return;
    }

    // OPENERS flow
    if (!confirmBowlerStep) {
      // go to bowler step
      if (!canConfirmOpeners) return;
      setConfirmBowlerStep(true);
      return;
    }

    // final confirm openers + bowler
    if (!strikerId || selectedIds.length !== 2 || !selectedBowlerId) return;

    const striker = batsmen.find(b => rowId(b) === strikerId);
    const nonStrikerIdVal = selectedIds.find(id => id !== strikerId);
    const nonStriker = batsmen.find(b => rowId(b) === nonStrikerIdVal);
    const bowlerSelected = bowler.find(b => rowId(b) === selectedBowlerId);

    if (!striker || !nonStriker || !bowlerSelected) return;

    onConfirmOpeners?.({ striker, nonStriker, bowlerSelected });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const renderItem = (item: ListItem) => {
    // Determine selection state for each mode
    const idKey = rowId(item);
    const isSelected = isNextBat
      ? selectedNextBatId === idKey
      : isNextBow
      ? selectedNextBowlerId === idKey
      : confirmBowlerStep
      ? selectedBowlerId === idKey
      : selectedIds.includes(idKey);

    const { icon, label: roleLabel } = getRoleMeta((item as any)?.role);

    return (
      <TouchableOpacity
        onPress={() => {
          if (isNextBat) {
            setSelectedNextBatId(idKey);
            return;
          }

          if (isNextBow) {
            toggleSelectNextBowler(idKey);
            return;
          }

          // OPENERS
          if (confirmBowlerStep) {
            toggleSelectBowlerForOpeners(idKey);
          } else {
            toggleSelectBat(idKey);
          }
        }}
        style={[
          styles.row,
          {
            borderWidth: 1,
            borderColor: isSelected ? theme.green : theme.gray4,
            backgroundColor: isSelected ? `${theme.primary}20` : 'transparent',
            paddingHorizontal: widthPixel(14),
            paddingVertical: heightPixel(12),
            marginBottom: heightPixel(10),
            borderRadius: widthPixel(12),
            alignItems: 'center',
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <ThemeText color="text" style={[styles.name, { color: theme.text }]}>
            {item.name}
          </ThemeText>

          <View style={styles.rowMeta}>
            {!!roleLabel && (
              <ThemeText
                color="secondaryText"
                style={[styles.roleText, { color: theme.text, opacity: 0.7 }]}
              >
                {roleLabel}
              </ThemeText>
            )}

            {/* OPENERS only: show striker/non-striker labels */}
            {isOpeners &&
              !confirmBowlerStep &&
              selectedIds.includes(idKey) &&
              !isNextBat && (
                <ThemeText
                  color="secondaryText"
                  style={[
                    styles.roleText,
                    { color: theme.text, opacity: 0.85 },
                  ]}
                >
                  {strikerId === idKey ? '• Striker' : '• Non-striker'}
                </ThemeText>
              )}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View
          style={[
            styles.selectPill,
            {
              backgroundColor: isSelected ? theme.primary : 'transparent',
              borderColor: isSelected ? theme.primary : theme.border,
            },
          ]}
        >
          <ThemeText
            color={isSelected ? 'white' : 'text'}
            style={[styles.selectPillText, { color: isSelected ? '#fff' : theme.text }]}
          >
            {isSelected ? 'Selected' : 'Select'}
          </ThemeText>
        </View>

        {icon && (
          <Image
            source={icon}
            style={styles.roleIcon}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };

  const cardBody = (
    <View
      style={[
        styles.modalCard,
        isInline && styles.modalCardInline,
        isInline
          ? isDark
            ? cardShadowSm(true)
            : cardShadowSm(false)
          : isDark
            ? cardShadowLg(true)
            : cardShadowLg(false),
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: widthPixel(16),
        },
      ]}
    >
      <View style={styles.addLiveWrap}>
        <ThemeText color="secondaryText" style={[styles.addLiveHint, { color: theme.text, opacity: 0.75 }]}>
          Need to add a late player? Add them to this live match.
        </ThemeText>
        <TouchableOpacity onPress={() => setShowAddLivePlayer(v => !v)} style={styles.addLiveToggle}>
          <ThemeText color="primary" style={[styles.addLiveToggleText, { color: theme.primary }]}>
            {showAddLivePlayer ? 'Hide' : '+ Add player'}
          </ThemeText>
        </TouchableOpacity>
      </View>

      {showAddLivePlayer ? (
        <View
          style={[
            styles.addLiveCard,
            isDark ? cardShadowSm(true) : cardShadowSm(false),
            { borderColor: theme.border, backgroundColor: theme.surfaceElevated },
          ]}
        >
          <TextInput
            value={newPlayerName}
            onChangeText={setNewPlayerName}
            placeholder="Player name"
            placeholderTextColor={theme.secondaryText}
            style={[
              styles.addLiveInput,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
            ]}
          />
          <View style={styles.roleRow}>
            {(['batsman', 'bowler', 'allrounder', 'wicketkeeper'] as PlayerRole[]).map(r => {
              const selected = newPlayerRole === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNewPlayerRole(r)}
                  style={[
                    styles.roleChip,
                    {
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.primaryMuted : 'transparent',
                    },
                  ]}
                >
                  <ThemeText
                    color={selected ? 'primary' : 'secondaryText'}
                    style={[styles.roleChipText, { color: selected ? theme.primary : theme.text }]}
                  >
                    {r === 'allrounder'
                      ? 'All-Rounder'
                      : r === 'wicketkeeper'
                      ? 'Wicketkeeper'
                      : r.charAt(0).toUpperCase() + r.slice(1)}
                  </ThemeText>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button
            title="Add to match"
            onPress={() => {
              const nm = newPlayerName.trim();
              if (!nm || !targetTeamKey) return;
              dispatch(addLivePlayerToTeam({ teamKey: targetTeamKey, name: nm, role: newPlayerRole }));
              setNewPlayerName('');
            }}
            disabled={!newPlayerName.trim() || !targetTeamKey}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.header,
          { backgroundColor: theme.primary, borderColor: theme.gray4 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ThemeText color="white" style={styles.text}>
            {headerContent?.teamName}
          </ThemeText>
          {!!headerContent?.actionText && (
            <ThemeText color="white" style={styles.text1}>
              {headerContent?.actionText}
            </ThemeText>
          )}
        </View>

        <View style={styles.headerRight}>
          <ThemeText color="white" style={styles.inningsPillText}>
            {inningsText}
          </ThemeText>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            style={styles.closeBtn}
            hitSlop={{
              top: heightPixel(10),
              bottom: heightPixel(10),
              left: widthPixel(10),
              right: widthPixel(10),
            }}
          >
            <ThemeText color="white" style={styles.closeBtnText}>
              X
            </ThemeText>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          isInline ? styles.flatInlineOnly : styles.flat,
          // Give the modal more height so the list isn't cramped.
          isInline && {
            maxHeight: Math.max(
              heightPixel(320),
              Math.min(screenHeight * 0.68, heightPixel(620)),
            ),
          },
          !isInline && {
            height: Math.max(
              heightPixel(420),
              Math.min(screenHeight * 0.7, heightPixel(680)),
            ),
          },
        ]}
      >
        <View style={styles.tableHeader}>
          <ThemeText
            color="text"
            style={[styles.thName, { color: theme.text }]}
          >
            {columnTitle}
          </ThemeText>
        </View>

        <View
          style={{
            flex: 1,
            marginTop: heightPixel(10),
            marginBottom: heightPixel(10),
          }}
        >
          {data.length === 0 ? (
            <ThemeText
              color="secondaryText"
              style={{
                fontFamily: fontFamilies.medium,
                fontSize: fontPixel(13),
                paddingVertical: heightPixel(16),
                textAlign: 'center',
              }}
            >
              {isNextBow || (isOpeners && confirmBowlerStep)
                ? `No players found for ${bowlingTeamName}. Add players to that team before starting the match.`
                : isNextBat
                ? `No available batsmen for ${battingTeamName}.`
                : `No players found for ${battingTeamName}. Add players to that team before starting the match.`}
            </ThemeText>
          ) : (
            <FlatList
              data={data}
              keyExtractor={item => rowId(item)}
              renderItem={({ item }) => renderItem(item)}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: heightPixel(6) }}
            />
          )}

          <View style={{ paddingVertical: heightPixel(10), width: '100%' }}>
            <TouchableOpacity
              disabled={primaryDisabled}
              onPress={handlePrimaryPress}
              style={{
                opacity: primaryDisabled ? 0.5 : 1,
                backgroundColor: theme.primary,
                paddingVertical: heightPixel(12),
                borderRadius: widthPixel(12),
                alignItems: 'center',
              }}
            >
              <ThemeText
                color="onPrimary"
                style={{ fontFamily: fontFamilies.bold }}
              >
                {primaryText}
              </ThemeText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              style={{
                marginTop: heightPixel(8),
                paddingVertical: heightPixel(10),
                borderRadius: widthPixel(12),
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <ThemeText
                color="text"
                style={{ fontFamily: fontFamilies.medium }}
              >
                Cancel
              </ThemeText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (isInline) {
    if (!visible) return null;
    return <View style={styles.inlineOuter}>{cardBody}</View>;
  }

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Modal visible={visible} transparent presentationStyle="overFullScreen">
        <View style={styles.containermodal}>
          {cardBody}
        </View>
      </Modal>
    </View>
  );
};

export default BatsmenBowlerCard;

const styles = StyleSheet.create({
  addLiveWrap: {
    paddingHorizontal: widthPixel(15),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(6),
  },
  addLiveHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
  },
  addLiveToggle: {
    marginTop: heightPixel(6),
    alignSelf: 'flex-start',
    paddingVertical: heightPixel(6),
  },
  addLiveToggleText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  addLiveCard: {
    marginHorizontal: widthPixel(15),
    marginTop: heightPixel(8),
    marginBottom: heightPixel(6),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    padding: widthPixel(12),
  },
  addLiveInput: {
    borderWidth: 1,
    borderRadius: widthPixel(12),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
    fontSize: fontPixel(14),
    marginBottom: heightPixel(10),
    fontFamily: fontFamilies.regular,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(10),
    marginBottom: heightPixel(10),
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
  },
  roleChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  header: {
    paddingHorizontal: widthPixel(15),
    paddingVertical: heightPixel(15),
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  closeBtn: {
    width: widthPixel(30),
    height: widthPixel(30),
    borderRadius: widthPixel(15),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(12),
  },
  inningsPillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    opacity: 0.95,
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  text1: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    opacity: 0.95,
  },
  modalCard: {
    width: '90%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  modalCardInline: {
    width: '100%',
  },
  inlineOuter: {
    width: '100%',
    marginBottom: heightPixel(12),
  },
  flatInlineOnly: {
    marginTop: heightPixel(10),
    maxHeight: heightPixel(520),
    minHeight: heightPixel(240),
    paddingHorizontal: widthPixel(15),
  },
  containermodal: {
    flex: 1,
    borderTopLeftRadius: widthPixel(10),
    borderTopRightRadius: widthPixel(10),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthPixel(8),
  },
  container: {
    width: '100%',
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(10),
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: heightPixel(10),
  },
  thName: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(16),
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
  },
  rowLeft: {
    flexShrink: 1,
  },
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(6),
    marginTop: heightPixel(2),
  },
  name: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  roleText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  selectPill: {
    borderWidth: 1,
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(999),
    marginRight: widthPixel(10),
  },
  selectPillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  roleIcon: {
    width: widthPixel(18),
    height: heightPixel(18),
  },
  flat: {
    marginTop: heightPixel(10),
    height: heightPixel(520),
    paddingHorizontal: widthPixel(15),
  },
});
