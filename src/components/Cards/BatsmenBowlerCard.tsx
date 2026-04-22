import {
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
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
import {
  annotateLastDismissal,
} from '../../features/match/matchSlice';
import {
  addLivePlayerAndPersist,
  addMultipleLivePlayersAndPersist,
  updateLivePlayerRoleAndPersist,
} from '../../features/match/matchThunks';
import { PlayerRole } from '../../types/Playertype';
import { isDuplicateName } from '../../features/match/playerSelectors';
import Button from '../themeButton';

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

  /** For OPENERS: choose which internal step to show first. */
  openersStartStep?: 'BATTERS' | 'BOWLER';
};

type ListItem = BatsmanRow | BowlerRow;

const rowId = (x: ListItem | { id?: unknown }) => String((x as any)?.id ?? '');

type FilterKey = 'all' | 'batters' | 'bowlers' | 'fielders' | 'subs';

const normalizeName = (value: string) => (value ?? '').trim().replace(/\s+/g, ' ');

/** New names from bulk paste that are not already on the squad (deduped, case-insensitive). */
function parseBulkUniqueNewNames(bulkText: string, targetTeamPlayers: any[]): string[] {
  const names = (bulkText ?? '')
    .split(/[\n,]+/g)
    .map(s => normalizeName(s))
    .filter(Boolean);
  const existingLower = new Set(
    targetTeamPlayers.map((p: any) => normalizeName(String(p?.name ?? '')).toLowerCase()),
  );
  const uniqueNew: string[] = [];
  for (const nm of names) {
    const key = nm.toLowerCase();
    if (!nm || existingLower.has(key)) continue;
    if (uniqueNew.some(x => x.toLowerCase() === key)) continue;
    uniqueNew.push(nm);
    existingLower.add(key);
  }
  return uniqueNew;
}

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
  openersStartStep = 'BATTERS',
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
  const [searchText, setSearchText] = useState('');
  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [pendingAutoSelectName, setPendingAutoSelectName] = useState<string | null>(null);
  const [showAddPlayerSheet, setShowAddPlayerSheet] = useState(false);
  const [inlineAddName, setInlineAddName] = useState('');
  const [inlineAddRole, setInlineAddRole] = useState<PlayerRole>('batsman');
  const [addPane, setAddPane] = useState<'single' | 'bulk'>('single');
  const [bulkText, setBulkText] = useState('');

  const [roleEditPlayerId, setRoleEditPlayerId] = useState<number | null>(null);
  const [roleEditRole, setRoleEditRole] = useState<PlayerRole>('batsman');

  // Inline add uses the search text; keep state minimal.
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
            : `Pick 2 openers (${selectedIds.length}/2)`,
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
  const [invalidBowlerTapId, setInvalidBowlerTapId] = useState<string | null>(null);

  // Optional wicket details (NEXT_BATSMAN only; metadata stored on dismissed Player)
  const [showWicketDetails, setShowWicketDetails] = useState(false);
  const [wicketType, setWicketType] = useState<
    | 'bowled'
    | 'caught'
    | 'lbw'
    | 'runout'
    | 'stumped'
    | 'hitwicket'
    | 'retired'
    | ''
  >('');
  const [fielderId, setFielderId] = useState<string | null>(null);

  // Reset local state whenever modal opens, mode changes, or innings phase (e.g. Super Over)
  const inningsPhase = currentMatch?.currentInnings ?? 1;
  useEffect(() => {
    if (!visible) return;

    setSelectedIds([]);
    setStrikerId(null);
    setConfirmBowlerStep(isOpeners && openersStartStep === 'BOWLER');
    setSelectedBowlerId(null);

    setSelectedNextBatId(null);
    setSelectedNextBowlerId(null);
    setInvalidBowlerTapId(null);
    setSearchText('');
    setFilterKey('all');
    setPendingAutoSelectName(null);
    setShowAddPlayerSheet(false);
    setInlineAddName('');
    setInlineAddRole(isOpeners && openersStartStep === 'BOWLER' ? 'bowler' : 'batsman');
    setAddPane('single');
    setBulkText('');
    setRoleEditPlayerId(null);
    setShowWicketDetails(false);
    setWicketType('');
    setFielderId(null);
  }, [visible, mode, inningsPhase, isOpeners, openersStartStep]);

  const previousOverBowlerId = useMemo(() => {
    // UI rule: same bowler cannot bowl consecutive overs.
    // Note: on over-end, reducer sets `innings.bowlerId = null`, so we must
    // derive the previous over bowler from ball history.
    const balls = innings?.balls ?? [];
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b?.bowlerId != null) return String(b.bowlerId);
    }
    return null;
  }, [innings]);

  // Auto-select newly added player (by name) for OPENERS batsmen step.
  useEffect(() => {
    if (!pendingAutoSelectName) return;
    if (!isOpeners || confirmBowlerStep) return;
    if (selectedIds.length >= 2) {
      setPendingAutoSelectName(null);
      return;
    }
    const found = batsmen.find(
      b => normalizeName(String((b as any)?.name ?? '')).toLowerCase() === pendingAutoSelectName.toLowerCase(),
    );
    if (!found) return;
    const id = rowId(found as any);
    if (!selectedIds.includes(id)) {
      toggleSelectBat(id);
    }
    setPendingAutoSelectName(null);
  }, [pendingAutoSelectName, batsmen, isOpeners, confirmBowlerStep, selectedIds]);

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

  const filteredData: ListItem[] = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let items = data;
    if (q) {
      items = items.filter(it => String((it as any)?.name ?? '').toLowerCase().includes(q));
    }
    const allowByFlag = (it: any, flag: 'canBat' | 'canBowl' | 'canField') => {
      if (it == null) return false;
      if (it[flag] === false) return false;
      if (it.isSubstitute && it[flag] !== true && flag !== 'canField') return false;
      return true;
    };
    switch (filterKey) {
      case 'subs':
        return items.filter(it => (it as any)?.isSubstitute === true);
      case 'batters':
        return items.filter(it => allowByFlag(it as any, 'canBat'));
      case 'bowlers':
        return items.filter(it => allowByFlag(it as any, 'canBowl'));
      case 'fielders':
        return items.filter(it => allowByFlag(it as any, 'canField'));
      case 'all':
      default:
        return items;
    }
  }, [data, searchText, filterKey]);

  const targetTeamPlayers = useMemo(() => {
    if (!currentMatch || !targetTeamKey) return [];
    return currentMatch?.[targetTeamKey]?.players ?? [];
  }, [currentMatch, targetTeamKey]);

  /** From fixture / match setup (Fixture planner “Players per team”). When set, blocks adds past this count. */
  const squadPlayersPerTeamCap = useMemo(() => {
    const c = currentMatch?.playersPerTeam;
    if (typeof c !== 'number' || !Number.isFinite(c) || c <= 0) return null;
    return Math.floor(c);
  }, [currentMatch?.playersPerTeam]);

  const isSquadAtPlayersPerTeamCap =
    squadPlayersPerTeamCap != null && targetTeamPlayers.length >= squadPlayersPerTeamCap;

  const alertSquadFull = () => {
    const cap = squadPlayersPerTeamCap;
    if (cap == null) return;
    Alert.alert(
      'Squad full',
      `This fixture allows up to ${cap} player${cap === 1 ? '' : 's'} per team. Remove a player or edit the fixture to increase “Players per team” if you need more.`,
    );
  };

  const tryOpenAddPlayerSheet = () => {
    if (isSquadAtPlayersPerTeamCap) {
      alertSquadFull();
      return;
    }
    const defaultRole: PlayerRole = isOpeners && confirmBowlerStep ? 'bowler' : 'batsman';
    setInlineAddRole(defaultRole);
    setShowAddPlayerSheet(true);
  };

  const isMatchLive = (innings?.balls?.length ?? 0) > 0;
  const isInningsStartOpenersInfo =
    isOpeners &&
    !confirmBowlerStep &&
    (innings?.balls?.length ?? 0) === 0 &&
    (innings?.strikerId == null || innings?.nonStrikerId == null);

  const typedName = normalizeName(searchText);
  const hasAnyNameMatch = useMemo(() => {
    if (!typedName) return true;
    const key = typedName.toLowerCase();
    return targetTeamPlayers.some((p: any) => normalizeName(String(p?.name ?? '')).toLowerCase() === key);
  }, [typedName, targetTeamPlayers]);

  const canInlineAdd = !!typedName && !hasAnyNameMatch && !!targetTeamKey;

  const handleInlineAdd = () => {
    if (!targetTeamKey) return;
    if (isSquadAtPlayersPerTeamCap) {
      alertSquadFull();
      return;
    }
    const nm = typedName;
    if (!nm) return;
    if (isDuplicateName(targetTeamPlayers, nm)) return;
    const defaultRole: PlayerRole =
      isOpeners && confirmBowlerStep ? 'bowler' : 'batsman';
    dispatch(addLivePlayerAndPersist({ teamKey: targetTeamKey, name: nm, role: defaultRole, lateAdded: isMatchLive }) as any);
    setSearchText('');
    // try to auto-select for openers batsmen step
    if (isOpeners && !confirmBowlerStep && selectedIds.length < 2) {
      setPendingAutoSelectName(nm);
    }
  };

  const canAddFromInlineRow = useMemo(() => {
    const nm = normalizeName(inlineAddName);
    if (!nm) return false;
    if (!targetTeamKey) return false;
    if (isDuplicateName(targetTeamPlayers, nm)) return false;
    return true;
  }, [inlineAddName, targetTeamKey, targetTeamPlayers]);

  const hasAnyPlayers = (targetTeamPlayers?.length ?? 0) > 0;

  const bulkUniqueNewNames = useMemo(
    () => parseBulkUniqueNewNames(bulkText, targetTeamPlayers),
    [bulkText, targetTeamPlayers],
  );

  const bulkAddCapacityInfo = useMemo(() => {
    const cap = squadPlayersPerTeamCap;
    const currentLen = targetTeamPlayers.length;
    if (cap == null) {
      return {
        capped: false,
        cap: null as number | null,
        remaining: null as number | null,
        exceeds: false,
        atCap: false,
        uniqueCount: bulkUniqueNewNames.length,
      };
    }
    const remaining = Math.max(0, cap - currentLen);
    const atCap = currentLen >= cap;
    const uniqueCount = bulkUniqueNewNames.length;
    const exceeds = !atCap && uniqueCount > remaining;
    return { capped: true, cap, currentLen, remaining, exceeds, atCap, uniqueCount };
  }, [squadPlayersPerTeamCap, targetTeamPlayers, bulkUniqueNewNames]);

  const bulkPasteHasError = useMemo(() => {
    if (!bulkText.trim()) return false;
    if (!bulkAddCapacityInfo.capped) return false;
    if (bulkAddCapacityInfo.atCap) return true;
    return bulkAddCapacityInfo.exceeds;
  }, [bulkText, bulkAddCapacityInfo]);

  const canAddFromBulkRow = useMemo(() => {
    if (!bulkText.trim() || !targetTeamKey) return false;
    if (bulkUniqueNewNames.length === 0) return false;
    if (!bulkAddCapacityInfo.capped) return true;
    if (bulkAddCapacityInfo.atCap) return false;
    return !bulkAddCapacityInfo.exceeds;
  }, [bulkText, targetTeamKey, bulkUniqueNewNames, bulkAddCapacityInfo]);

  const handleAddFromInlineRow = () => {
    if (!targetTeamKey) return;
    if (isSquadAtPlayersPerTeamCap) {
      alertSquadFull();
      return;
    }
    const nm = normalizeName(inlineAddName);
    if (!nm) return;
    if (isDuplicateName(targetTeamPlayers, nm)) return;
    dispatch(addLivePlayerAndPersist({ teamKey: targetTeamKey, name: nm, role: inlineAddRole, lateAdded: isMatchLive }) as any);
    setInlineAddName('');
    setShowAddPlayerSheet(false);
    if (isOpeners && !confirmBowlerStep && selectedIds.length < 2) {
      setPendingAutoSelectName(nm);
    }
  };

  const handleAddFromBulk = () => {
    if (!targetTeamKey) return;
    const uniqueNew = parseBulkUniqueNewNames(bulkText, targetTeamPlayers);
    if (uniqueNew.length === 0) return;

    const cap = squadPlayersPerTeamCap;
    const currentLen = targetTeamPlayers.length;
    if (cap != null && currentLen >= cap) {
      alertSquadFull();
      return;
    }
    if (cap != null) {
      const remaining = cap - currentLen;
      if (uniqueNew.length > remaining) {
        return;
      }
    }

    dispatch(
      addMultipleLivePlayersAndPersist({
        teamKey: targetTeamKey,
        names: uniqueNew,
        role: inlineAddRole,
        lateAdded: isMatchLive,
      }) as any,
    );
    setBulkText('');
    setShowAddPlayerSheet(false);
  };

  const roleEditPlayer = useMemo(() => {
    if (!roleEditPlayerId) return null;
    return targetTeamPlayers.find((p: any) => Number(p?.id) === Number(roleEditPlayerId)) ?? null;
  }, [roleEditPlayerId, targetTeamPlayers]);

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
    // Disallow choosing same bowler for consecutive overs (UI guard).
    if (previousOverBowlerId && String(id) === String(previousOverBowlerId)) {
      setInvalidBowlerTapId(id);
      // clear if it was already selected so Confirm can't pass
      setSelectedNextBowlerId(prev => (prev === id ? null : prev));
      return;
    }
    setInvalidBowlerTapId(null);
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
  const isInvalidSelectedNextBowler =
    isNextBow &&
    selectedNextBowlerId != null &&
    previousOverBowlerId != null &&
    String(selectedNextBowlerId) === String(previousOverBowlerId);

  const primaryDisabled = isNextBat
    ? !selectedNextBatId
    : isNextBow
    ? !selectedNextBowlerId || isInvalidSelectedNextBowler
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

      // Optional: persist wicket metadata on dismissed Player (no scoring math changes).
      if (showWicketDetails && wicketType) {
        const bowlerId = innings?.bowlerId != null ? String(innings.bowlerId) : null;
        const needsFielder =
          wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped';
        dispatch(
          annotateLastDismissal({
            outType: wicketType,
            outByBowlerId: bowlerId,
            outByFielderId: needsFielder ? fielderId : null,
          }),
        );
      }

      onConfirmNextBatsman?.(picked);
      onClose();
      return;
    }

    if (isNextBow) {
      if (!selectedNextBowlerId) return;
      if (
        previousOverBowlerId != null &&
        String(selectedNextBowlerId) === String(previousOverBowlerId)
      )
        return;
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

    const isInvalidNextBowlerPick =
      isNextBow &&
      previousOverBowlerId != null &&
      String(idKey) === String(previousOverBowlerId) &&
      invalidBowlerTapId === idKey;

    const { label: roleLabel } = getRoleMeta((item as any)?.role);

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
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            backgroundColor: theme.background,
            paddingHorizontal: widthPixel(14),
            paddingVertical: heightPixel(12),
            alignItems: 'center',
          },
          isInvalidNextBowlerPick && {
            borderWidth: 1,
            borderColor: theme.error ?? '#D92D20',
            backgroundColor: `${theme.error ?? '#D92D20'}10`,
            borderRadius: widthPixel(12),
            marginBottom: heightPixel(8),
          },
          isSelected && {
            backgroundColor: theme.primaryMuted,
            borderLeftWidth: widthPixel(3),
            borderLeftColor: theme.primary,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <ThemeText color="text" style={[styles.name, { color: theme.text }]}>
            {item.name}
          </ThemeText>

          {isOpeners && !confirmBowlerStep && selectedIds.includes(idKey) && !isNextBat ? (
            <ThemeText
              color="secondaryText"
              style={[styles.roleText, { color: theme.secondaryText }]}
            >
              {strikerId === idKey ? 'Striker' : 'Non-striker'}
            </ThemeText>
          ) : null}
        </View>

        <View style={{ flex: 1 }} />

        {isSelected ? (
          <View
            style={[
              styles.selectedBadge,
              { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
            ]}
          >
            <ThemeText
              color="primary"
              style={[styles.selectedBadgeText, { color: theme.primary }]}
            >
              Selected
            </ThemeText>
          </View>
        ) : null}

        {!!roleLabel ? (
          <Pressable
            onPress={() => {
              if (!targetTeamKey) return;
              setRoleEditPlayerId(Number(idKey));
              setRoleEditRole(((item as any)?.role ?? 'batsman') as PlayerRole);
            }}
            style={[
              styles.rolePill,
              {
                backgroundColor: theme.surfaceElevated ?? theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemeText color="secondaryText" style={[styles.rolePillText, { color: theme.secondaryText }]}>
              {roleLabel === 'Wicketkeeper' ? 'WK' : roleLabel}
            </ThemeText>
          </Pressable>
        ) : null}
      </TouchableOpacity>
    );
  };

  const cardBody = (
    <View
      style={[
        styles.modalCard,
        isInline && styles.modalCardInline,
        // In bottom-sheet mode, the outer sheet provides the surface/shadow.
        !isInline && { backgroundColor: theme.background, flex: 1 },
        isInline && [
          isDark ? cardShadowSm(true) : cardShadowSm(false),
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: widthPixel(16),
          },
        ],
      ]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderBottomWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ThemeText color="text" style={[styles.text, { color: theme.text }]}>
            {headerContent?.teamName}
          </ThemeText>
          {!!headerContent?.actionText && (
            <ThemeText color="secondaryText" style={[styles.text1, { color: theme.secondaryText }]}>
              {headerContent?.actionText}
            </ThemeText>
          )}
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.inningsPill,
              {
                backgroundColor: theme.surfaceElevated ?? theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemeText color="text" style={[styles.inningsPillText, { color: theme.text }]}>
              {inningsText}
            </ThemeText>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            style={[
              styles.closeBtn,
              { borderColor: theme.border, backgroundColor: theme.surfaceElevated ?? theme.surface },
            ]}
            hitSlop={{
              top: heightPixel(10),
              bottom: heightPixel(10),
              left: widthPixel(10),
              right: widthPixel(10),
            }}
          >
            <ThemeText color="text" style={[styles.closeBtnText, { color: theme.text }]}>
              ✕
            </ThemeText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sheetBody}>
        <View style={styles.sectionPad}>
          {isInningsStartOpenersInfo ? (
            <View style={styles.infoBanner}>
              <ThemeText color="secondaryText" style={styles.infoText}>
                Innings has started. To begin scoring, add/select two batsmen: the striker and the non‑striker.
              </ThemeText>
            </View>
          ) : null}
          <View style={[styles.searchWrap, { borderColor: theme.border, backgroundColor: theme.surfaceElevated ?? theme.surface }]}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search or add player..."
              placeholderTextColor={theme.secondaryText}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          {roleEditPlayer ? (
            <View
              style={[
                styles.roleEditCard,
                { backgroundColor: theme.surfaceElevated ?? theme.surface, borderColor: theme.border },
              ]}
            >
              <ThemeText color="text" style={[styles.roleEditTitle, { color: theme.text }]}>
                Edit role: {roleEditPlayer?.name ?? 'Player'}
              </ThemeText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleChipsRow}>
                {(['batsman', 'bowler', 'allrounder', 'wicketkeeper'] as PlayerRole[]).map(r => {
                  const on = roleEditRole === r;
                  const label =
                    r === 'allrounder'
                      ? 'All-rounder'
                      : r === 'wicketkeeper'
                        ? 'WK'
                        : r === 'batsman'
                          ? 'Batter'
                          : 'Bowler';
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRoleEditRole(r)}
                      style={[
                        styles.roleChipSlim,
                        {
                          backgroundColor: on ? theme.primaryMuted : theme.background,
                          borderColor: on ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemeText color={on ? 'primary' : 'secondaryText'} style={styles.roleChipSlimText}>
                        {label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.roleEditActions}>
                <Pressable
                  onPress={() => setRoleEditPlayerId(null)}
                  style={[styles.roleEditBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
                >
                  <ThemeText color="secondaryText" style={[styles.roleEditBtnText, { color: theme.secondaryText }]}>
                    Cancel
                  </ThemeText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!targetTeamKey || !roleEditPlayerId) return;
                    dispatch(
                      updateLivePlayerRoleAndPersist({
                        teamKey: targetTeamKey,
                        playerId: roleEditPlayerId,
                        role: roleEditRole,
                        playerName: roleEditPlayer?.name,
                      }) as any,
                    );
                    setRoleEditPlayerId(null);
                  }}
                  style={[styles.roleEditBtn, { borderColor: theme.primary, backgroundColor: theme.primary }]}
                >
                  <ThemeText color="onPrimary" style={[styles.roleEditBtnText, { color: '#fff' }]}>
                    Save
                  </ThemeText>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Add panel is anchored under the list header to avoid layout shifts */}

          {/* Selected openers are shown on the list rows + header subtitle */}

          {data.length > 18 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRowSlim}>
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'batters', label: 'Batters' },
                  { key: 'bowlers', label: 'Bowlers' },
                  { key: 'fielders', label: 'Fielders' },
                  { key: 'subs', label: 'Subs' },
                ] as const
              ).map(opt => {
                const on = filterKey === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setFilterKey(opt.key)}
                    style={[
                      styles.filterChipSlim,
                      {
                        backgroundColor: on ? theme.primaryMuted : theme.background,
                        borderColor: on ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemeText color={on ? 'primary' : 'secondaryText'} style={styles.filterChipTextSlim}>
                      {opt.label}
                    </ThemeText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

      {isNextBat ? (
        <View style={[styles.wicketWrap, { borderColor: theme.border }]}>
          <Pressable
            onPress={() => setShowWicketDetails(v => !v)}
            style={[styles.wicketHeader, { backgroundColor: theme.surfaceElevated }]}
          >
            <ThemeText color="text" style={[styles.wicketHeaderTitle, { color: theme.text }]}>
              Wicket details (optional)
            </ThemeText>
            <ThemeText color="secondaryText" style={[styles.wicketHeaderMeta, { color: theme.secondaryText }]}>
              {showWicketDetails ? 'Hide' : 'Add'}
            </ThemeText>
          </Pressable>

          {showWicketDetails ? (
            <View style={styles.wicketBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wicketTypesRow}>
                {(
                  [
                    { key: 'bowled', label: 'Bowled' },
                    { key: 'caught', label: 'Caught' },
                    { key: 'runout', label: 'Run out' },
                    { key: 'stumped', label: 'Stumped' },
                    { key: 'lbw', label: 'LBW' },
                    { key: 'hitwicket', label: 'Hit wicket' },
                    { key: 'retired', label: 'Retired' },
                  ] as const
                ).map(t => {
                  const on = wicketType === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => {
                        setWicketType(t.key);
                        if (t.key !== 'caught' && t.key !== 'runout' && t.key !== 'stumped') {
                          setFielderId(null);
                        }
                      }}
                      style={[
                        styles.wicketChip,
                        {
                          backgroundColor: on ? theme.primaryMuted : theme.background,
                          borderColor: on ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemeText color={on ? 'primary' : 'secondaryText'} style={styles.wicketChipText}>
                        {t.label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped' ? (
                <View style={styles.fielderWrap}>
                  <ThemeText color="secondaryText" style={[styles.fielderLabel, { color: theme.secondaryText }]}>
                    Select fielder
                  </ThemeText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fielderRow}>
                    {bowler
                      .filter(p => (p as any)?.canField !== false)
                      .map(p => {
                        const id = rowId(p);
                        const on = fielderId === id;
                        return (
                          <Pressable
                            key={id}
                            onPress={() => setFielderId(on ? null : id)}
                            style={[
                              styles.fielderChip,
                              {
                                backgroundColor: on ? theme.primaryMuted : theme.background,
                                borderColor: on ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <ThemeText color={on ? 'primary' : 'secondaryText'} style={styles.fielderChipText}>
                              {(p as any)?.name ?? 'Player'}
                            </ThemeText>
                          </Pressable>
                        );
                      })}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[isInline ? styles.flatInlineOnly : styles.flat]}>
        <View style={styles.tableHeader}>
          <ThemeText
            color="text"
            style={[styles.thName, { color: theme.text }]}
          >
            {columnTitle}
          </ThemeText>
          <Pressable onPress={tryOpenAddPlayerSheet} hitSlop={10}>
            <ThemeText color="primary" style={[styles.addLinkText, { color: theme.primary }]}>
              + Add player
            </ThemeText>
          </Pressable>
        </View>

        {isNextBow && invalidBowlerTapId ? (
          <ThemeText
            color="error"
            style={[
              styles.inlineWarn,
              { color: theme.error ?? '#D92D20' },
            ]}
          >
            Same bowler can’t bowl consecutive overs. Please pick a different bowler.
          </ThemeText>
        ) : null}

        <View style={styles.listArea}>
          {filteredData.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemeText color="text" style={styles.emptyTitle}>
                No players yet
              </ThemeText>
              <ThemeText color="secondaryText" style={styles.emptySub}>
                Search a name above — or add player.
              </ThemeText>
              {!hasAnyPlayers ? (
                <>
                  <View style={styles.emptyAddRow}>
                    <Pressable onPress={tryOpenAddPlayerSheet} hitSlop={8}>
                      <ThemeText color="primary" style={[styles.addLinkText, { color: theme.primary }]}>
                        + Add player
                      </ThemeText>
                    </Pressable>
                  </View>

                </>
              ) : null}
            </View>
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={item => rowId(item)}
              renderItem={({ item }) => renderItem(item)}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEnabled
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: heightPixel(6) }}
            />
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <TouchableOpacity
            disabled={primaryDisabled}
            onPress={handlePrimaryPress}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: primaryDisabled ? theme.gray2 : theme.primary,
                opacity: primaryDisabled ? 0.7 : 1,
              },
            ]}
          >
            <ThemeText color="onPrimary" style={[styles.primaryBtnText, { color: primaryDisabled ? theme.secondaryText : '#fff' }]}>
              {primaryText}
            </ThemeText>
          </TouchableOpacity>

          <Pressable onPress={handleClose} style={styles.cancelLink} hitSlop={8}>
            <ThemeText color="secondaryText" style={[styles.cancelLinkText, { color: theme.secondaryText }]}>
              Cancel
            </ThemeText>
          </Pressable>
        </View>
      </View>
      </View>

      <Modal
        visible={showAddPlayerSheet}
        transparent
        presentationStyle="overFullScreen"
        animationType="fade"
        onRequestClose={() => setShowAddPlayerSheet(false)}
      >
        <View style={styles.addModalRoot}>
          <Pressable style={styles.addModalBackdrop} onPress={() => setShowAddPlayerSheet(false)} />
          <View
            style={[
              styles.addModalCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.addSheetHeader}>
              <ThemeText color="text" style={[styles.addSheetTitle, { color: theme.text }]}>
                Add players
              </ThemeText>
              <Pressable onPress={() => setShowAddPlayerSheet(false)} hitSlop={10}>
                <ThemeText color="secondaryText" style={[styles.addSheetClose, { color: theme.secondaryText }]}>
                  ✕
                </ThemeText>
              </Pressable>
            </View>

            <View style={styles.addSheetBody}>
              <View style={styles.addTabsRow}>
                {(['single', 'bulk'] as const).map(k => {
                  const on = addPane === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setAddPane(k)}
                      style={[
                        styles.addTab,
                        {
                          backgroundColor: on ? theme.primaryMuted : theme.surfaceElevated ?? theme.surface,
                          borderColor: on ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemeText color={on ? 'primary' : 'secondaryText'} style={styles.addTabText}>
                        {k === 'single' ? 'Single' : 'Bulk'}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>

              {addPane === 'single' ? (
                <TextInput
                  value={inlineAddName}
                  onChangeText={setInlineAddName}
                  placeholder="Player name"
                  placeholderTextColor={theme.secondaryText}
                  style={[
                    styles.addSheetInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated ?? theme.surface },
                  ]}
                />
              ) : (
                <>
                  {bulkAddCapacityInfo.capped ? (
                    <ThemeText
                      color="secondaryText"
                      style={[styles.addSheetBulkHint, { color: theme.secondaryText }]}
                    >
                      {bulkAddCapacityInfo.atCap
                        ? `This team already has the maximum (${bulkAddCapacityInfo.cap}) players for this fixture. You cannot add more.`
                        : `You can add up to ${bulkAddCapacityInfo.remaining} more new player name(s) here (max ${bulkAddCapacityInfo.cap} per team for this fixture). Duplicates and names already on the team do not count toward the limit.`}
                    </ThemeText>
                  ) : null}
                  <TextInput
                    value={bulkText}
                    onChangeText={setBulkText}
                    placeholder={'Paste names (one per line)\nAli\nAhmed\nHassan'}
                    placeholderTextColor={theme.secondaryText}
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.addSheetBulk,
                      {
                        color: theme.text,
                        borderColor: bulkPasteHasError ? (theme.error ?? '#D92D20') : theme.border,
                        borderWidth: bulkPasteHasError ? widthPixel(2) : StyleSheet.hairlineWidth,
                        backgroundColor: theme.surfaceElevated ?? theme.surface,
                      },
                    ]}
                  />
                  {bulkPasteHasError ? (
                    <ThemeText
                      color="error"
                      style={[styles.addSheetBulkError, { color: theme.error ?? '#D92D20' }]}
                    >
                      {bulkAddCapacityInfo.atCap
                        ? 'Squad is full — remove text or close and free a slot before adding players.'
                        : `Too many new names: you entered ${bulkAddCapacityInfo.uniqueCount} new player(s) but only ${bulkAddCapacityInfo.remaining} can be added. Remove names until you are at or under the limit.`}
                    </ThemeText>
                  ) : null}
                </>
              )}

              <ThemeText color="secondaryText" style={[styles.addSheetLabel, { color: theme.secondaryText }]}>
                Role
              </ThemeText>
              <View style={styles.roleChipsWrap}>
                {(['batsman', 'bowler', 'allrounder', 'wicketkeeper'] as PlayerRole[]).map(r => {
                  const on = inlineAddRole === r;
                  const label =
                    r === 'allrounder'
                      ? 'All-rounder'
                      : r === 'wicketkeeper'
                        ? 'WK'
                        : r === 'batsman'
                          ? 'Batter'
                          : 'Bowler';
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setInlineAddRole(r)}
                      style={[
                        styles.roleChipSlim,
                        {
                          backgroundColor: on ? theme.primaryMuted : theme.surfaceElevated ?? theme.surface,
                          borderColor: on ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemeText color={on ? 'primary' : 'secondaryText'} style={styles.roleChipSlimText}>
                        {label}
                      </ThemeText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.addSheetFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                onPress={addPane === 'single' ? handleAddFromInlineRow : handleAddFromBulk}
                disabled={addPane === 'single' ? !canAddFromInlineRow : !canAddFromBulkRow}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor:
                      addPane === 'single'
                        ? canAddFromInlineRow
                          ? theme.primary
                          : theme.gray2
                        : canAddFromBulkRow
                          ? theme.primary
                          : theme.gray2,
                    opacity:
                      addPane === 'single'
                        ? canAddFromInlineRow
                          ? 1
                          : 0.7
                        : canAddFromBulkRow
                          ? 1
                          : 0.7,
                  },
                ]}
              >
                <ThemeText
                  color="onPrimary"
                  style={[
                    styles.primaryBtnText,
                    {
                      color:
                        addPane === 'single'
                          ? canAddFromInlineRow
                            ? '#fff'
                            : theme.secondaryText
                          : canAddFromBulkRow
                            ? '#fff'
                            : theme.secondaryText,
                    },
                  ]}
                >
                  {addPane === 'single' ? 'Add player' : 'Add players'}
                </ThemeText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (isInline) {
    if (!visible) return null;
    return <View style={styles.inlineOuter}>{cardBody}</View>;
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetBackdrop} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              height: Math.min(screenHeight * 0.72, heightPixel(680)),
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          {cardBody}
        </View>
      </View>
    </Modal>
  );
};

export default BatsmenBowlerCard;

const styles = StyleSheet.create({
  sectionPad: {
    paddingHorizontal: widthPixel(15),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(8),
  },
  infoBanner: {
    marginBottom: heightPixel(10),
  },
  infoText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    opacity: 0.9,
  },
  addTabsRow: {
    flexDirection: 'row',
    gap: widthPixel(8),
    marginBottom: heightPixel(8),
  },
  addTab: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
  },
  addTabText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
  // inlineAdd* moved into Add Players sheet
  addSheetHeader: {
    paddingHorizontal: widthPixel(15),
    paddingBottom: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addSheetTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  addSheetClose: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  addSheetBody: {
    paddingHorizontal: widthPixel(15),
    paddingBottom: heightPixel(10),
  },
  addSheetInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(12),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.regular,
    marginBottom: heightPixel(12),
  },
  addSheetBulkHint: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    marginBottom: heightPixel(10),
  },
  addSheetBulk: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(12),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
    fontSize: fontPixel(14),
    fontFamily: fontFamilies.regular,
    minHeight: heightPixel(120),
    marginBottom: heightPixel(8),
  },
  addSheetBulkError: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
    marginBottom: heightPixel(10),
  },
  addSheetLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(8),
  },
  addSheetFooter: {
    paddingHorizontal: widthPixel(15),
    paddingTop: heightPixel(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: heightPixel(10),
  },
  addModalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  addModalCard: {
    width: '92%',
    maxWidth: widthPixel(360),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(16),
    overflow: 'hidden',
  },
  filterRowSlim: {
    gap: widthPixel(8),
    paddingTop: heightPixel(8),
    paddingBottom: heightPixel(2),
  },
  filterChipSlim: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
  },
  filterChipTextSlim: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
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
  searchWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
  },
  searchInput: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    padding: 0,
  },
  emptyState: {
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(6),
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    marginBottom: heightPixel(6),
  },
  emptySub: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(18),
    textAlign: 'center',
    marginBottom: heightPixel(12),
  },
  emptyAddRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: heightPixel(10),
  },
  wicketWrap: {
    marginHorizontal: widthPixel(15),
    marginTop: heightPixel(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    overflow: 'hidden',
  },
  wicketHeader: {
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wicketHeaderTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(13),
  },
  wicketHeaderMeta: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  wicketBody: {
    paddingHorizontal: widthPixel(12),
    paddingVertical: heightPixel(10),
  },
  wicketTypesRow: {
    gap: widthPixel(10),
    paddingBottom: heightPixel(6),
  },
  wicketChip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
  },
  wicketChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  fielderWrap: {
    marginTop: heightPixel(10),
  },
  fielderLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(8),
  },
  fielderRow: {
    gap: widthPixel(10),
    paddingBottom: heightPixel(2),
  },
  fielderChip: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
  },
  fielderChipText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  header: {
    paddingHorizontal: widthPixel(15),
    paddingTop: heightPixel(12),
    paddingBottom: heightPixel(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inningsPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
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
    width: '100%',
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
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 0,
  },
  sheet: {
    borderTopLeftRadius: widthPixel(18),
    borderTopRightRadius: widthPixel(18),
    overflow: 'hidden',
    paddingBottom: heightPixel(10),
    zIndex: 1,
    elevation: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: widthPixel(50),
    height: heightPixel(5),
    borderRadius: widthPixel(999),
    marginTop: heightPixel(8),
    marginBottom: heightPixel(8),
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheetBody: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: heightPixel(10),
    alignItems: 'center',
  },
  thName: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(16),
    opacity: 0.8,
  },
  addLinkText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  inlineWarn: {
    marginTop: heightPixel(8),
    paddingHorizontal: widthPixel(2),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
  },
  row: {
    flexDirection: 'row',
  },
  rowLeft: {
    flexShrink: 1,
  },
  name: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  roleText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },
  rolePill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
  },
  rolePillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
  selectedBadge: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
    marginRight: widthPixel(8),
  },
  selectedBadgeText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
  roleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: widthPixel(8),
    paddingBottom: heightPixel(2),
  },
  roleChipsRow: {
    paddingTop: heightPixel(10),
    paddingBottom: heightPixel(6),
    gap: widthPixel(8),
    paddingRight: widthPixel(8),
  },
  roleChipSlim: {
    borderWidth: 1,
    borderRadius: widthPixel(999),
    paddingVertical: heightPixel(6),
    paddingHorizontal: widthPixel(10),
  },
  roleChipSlimText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(11),
  },
  roleEditCard: {
    marginTop: heightPixel(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: widthPixel(14),
    padding: widthPixel(10),
  },
  roleEditTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
    marginBottom: heightPixel(8),
  },
  roleEditActions: {
    marginTop: heightPixel(10),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: widthPixel(10),
  },
  roleEditBtn: {
    borderWidth: 1,
    borderRadius: widthPixel(12),
    paddingVertical: heightPixel(8),
    paddingHorizontal: widthPixel(12),
  },
  roleEditBtnText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  flat: {
    marginTop: heightPixel(10),
    paddingHorizontal: widthPixel(15),
    flex: 1,
    minHeight: heightPixel(260),
  },
  listArea: {
    flex: 1,
    marginTop: heightPixel(10),
    marginBottom: heightPixel(10),
  },
  footer: {
    paddingTop: heightPixel(10),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    paddingVertical: heightPixel(12),
    borderRadius: widthPixel(12),
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(13),
  },
  cancelLink: {
    marginTop: heightPixel(10),
    alignItems: 'center',
  },
  cancelLinkText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
});
