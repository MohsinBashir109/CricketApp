import {
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { allrounder, bat, bowlericon, wicket } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

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
  onClose: () => void;

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

const BatsmenBowlerCard: React.FC<Props> = ({
  batsmen,
  bowler,
  visible,
  onClose,
  mode,
  onConfirmOpeners,
  onConfirmNextBatsman,
  onConfirmNextBowler,
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const isOpeners = mode === 'OPENERS';
  const isNextBat = mode === 'NEXT_BATSMAN';
  const isNextBow = mode === 'NEXT_BOWLER';

  // OPENERS state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [confirmBowlerStep, setConfirmBowlerStep] = useState(false);
  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);

  // NEXT_BATSMAN state
  const [selectedNextBatId, setSelectedNextBatId] = useState<string | null>(
    null,
  );

  // NEXT_BOWLER state
  const [selectedNextBowlerId, setSelectedNextBowlerId] = useState<
    string | null
  >(null);

  // Reset local state whenever modal opens or mode changes
  useEffect(() => {
    if (!visible) return;

    setSelectedIds([]);
    setStrikerId(null);
    setConfirmBowlerStep(false);
    setSelectedBowlerId(null);

    setSelectedNextBatId(null);
    setSelectedNextBowlerId(null);
  }, [visible, mode]);

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

  // Data list based on mode
  const data: ListItem[] = useMemo(() => {
    if (isNextBow) return bowler;

    if (isNextBat) {
      // optional: hide players who are already out
      return batsmen.filter(b => b?.isOut !== true);
    }

    // OPENERS
    return confirmBowlerStep ? bowler : batsmen;
  }, [isNextBow, isNextBat, confirmBowlerStep, bowler, batsmen]);

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
      const picked = batsmen.find(b => b.id === selectedNextBatId);
      if (!picked) return;

      onConfirmNextBatsman?.(picked);
      onClose();
      return;
    }

    if (isNextBow) {
      if (!selectedNextBowlerId) return;
      const picked = bowler.find(b => b.id === selectedNextBowlerId);
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

    const striker = batsmen.find(b => b.id === strikerId);
    const nonStrikerId = selectedIds.find(id => id !== strikerId);
    const nonStriker = batsmen.find(b => b.id === nonStrikerId);
    const bowlerSelected = bowler.find(b => b.id === selectedBowlerId);

    if (!striker || !nonStriker || !bowlerSelected) return;

    onConfirmOpeners?.({ striker, nonStriker, bowlerSelected });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const renderItem = (item: ListItem) => {
    // Determine selection state for each mode
    const isSelected = isNextBat
      ? selectedNextBatId === item.id
      : isNextBow
      ? selectedNextBowlerId === item.id
      : confirmBowlerStep
      ? selectedBowlerId === item.id
      : selectedIds.includes(item.id);

    const { icon } = getRoleMeta((item as any)?.role);

    return (
      <TouchableOpacity
        onPress={() => {
          if (isNextBat) {
            setSelectedNextBatId(item.id);
            return;
          }

          if (isNextBow) {
            toggleSelectNextBowler(item.id);
            return;
          }

          // OPENERS
          if (confirmBowlerStep) {
            toggleSelectBowlerForOpeners(item.id);
          } else {
            toggleSelectBat(item.id);
          }
        }}
        style={[
          styles.row,
          {
            borderWidth: 1,
            borderColor: isSelected ? theme.green : theme.gray4,
            backgroundColor: isSelected ? `${theme.primary}20` : 'transparent',
            paddingHorizontal: widthPixel(20),
            paddingVertical: heightPixel(14),
            marginBottom: heightPixel(10),
            borderRadius: widthPixel(10),
            alignItems: 'center',
          },
        ]}
      >
        <ThemeText color="text" style={[styles.name, { color: theme.text }]}>
          {item.name}
        </ThemeText>

        {/* OPENERS only: show striker/non-striker labels */}
        {isOpeners &&
          !confirmBowlerStep &&
          selectedIds.includes(item.id) &&
          !isNextBat && (
            <ThemeText
              color="text"
              style={{
                marginLeft: widthPixel(8),
                fontSize: fontPixel(11),
                opacity: 0.8,
              }}
            >
              {strikerId === item.id ? '(Striker)' : '(Non-striker)'}
            </ThemeText>
          )}

        <View style={{ flex: 1 }} />

        <ThemeText color="text" style={{ marginRight: widthPixel(8) }}>
          {isSelected ? 'Selected' : 'Select'}
        </ThemeText>

        {icon && (
          <Image
            source={icon}
            style={{ width: widthPixel(20), height: heightPixel(20) }}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Modal visible={visible} transparent presentationStyle="overFullScreen">
        <View style={styles.containermodal}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.background,
                borderColor: theme.gray4,
                borderWidth: 1,
                borderRadius: widthPixel(12),
              },
            ]}
          >
            <View
              style={[
                styles.header,
                { backgroundColor: theme.primary, borderColor: theme.gray4 },
              ]}
            >
              <ThemeText color="text" style={styles.text}>
                {titleText}
              </ThemeText>
            </View>

            <View style={styles.flat}>
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
                <FlatList
                  data={data}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => renderItem(item)}
                  showsVerticalScrollIndicator={false}
                />

                <View
                  style={{ paddingVertical: heightPixel(10), width: '100%' }}
                >
                  <TouchableOpacity
                    disabled={primaryDisabled}
                    onPress={handlePrimaryPress}
                    style={{
                      opacity: primaryDisabled ? 0.5 : 1,
                      backgroundColor: theme.primary,
                      paddingVertical: heightPixel(12),
                      borderRadius: widthPixel(10),
                      alignItems: 'center',
                    }}
                  >
                    <ThemeText
                      color="text"
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
                      borderRadius: widthPixel(10),
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: theme.gray4,
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
        </View>
      </Modal>
    </View>
  );
};

export default BatsmenBowlerCard;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: widthPixel(15),
    paddingVertical: heightPixel(15),
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(14),
  },
  modalCard: {
    width: '90%',
    overflow: 'hidden',
    justifyContent: 'center',
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
  name: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  flat: {
    marginTop: heightPixel(10),
    height: heightPixel(360),
    paddingHorizontal: widthPixel(15),
  },
});
