import {
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { allrounder, bat, bowlericon, wicket } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import React, { useState } from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';
import { useDispatch } from 'react-redux';

export type BatsmanRow = {
  id: string;
  name: string;
  isStriker?: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
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

type Props = {
  batsmen: BatsmanRow[];
  bowler: BowlerRow[];
  onConfirmOpeners: (payload: {
    striker: BatsmanRow;
    nonStriker: BatsmanRow;
    bowlerSelected: BowlerRow;
  }) => void;
  visible: boolean;
  onClose: () => void;
};

type ListItem = BatsmanRow | BowlerRow;

const BatsmenBowlerCard: React.FC<Props> = ({
  batsmen,
  bowler,
  onConfirmOpeners,
  visible,
  onClose,
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  const [selectedBowlerId, setSelectedBowlerId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const data: ListItem[] = confirm ? bowler : batsmen;

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

  // Your original opener confirm logic kept
  const handleConfirm = () => {
    if (selectedIds.length !== 2 || !strikerId) {
      return;
    }
    setConfirm(true);
  };

  // Your original final confirm logic kept
  const handleFinalConfirm = () => {
    if (!strikerId || selectedIds.length !== 2 || !selectedBowlerId) return;

    const striker = batsmen.find(b => b.id === strikerId)!;
    const nonStrikerId = selectedIds.find(id => id !== strikerId)!;
    const nonStriker = batsmen.find(b => b.id === nonStrikerId)!;
    const bowlerSelected = bowler.find(b => b.id === selectedBowlerId)!;

    onConfirmOpeners({ striker, nonStriker, bowlerSelected });

    // RESET
    setConfirm(false);
    setSelectedIds([]);
    setStrikerId(null);
    setSelectedBowlerId(null);

    onClose();
  };

  // Your original batsman selection logic kept
  const toggleSelectBat = (id: string) => {
    setSelectedIds(prev => {
      // remove if already selected
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        // if removed striker, reset striker
        if (strikerId === id) setStrikerId(null);
        return next;
      }

      // limit to 2
      if (prev.length >= 2) return prev;

      const next = [...prev, id];
      // auto-set striker when first selected
      if (next.length === 1) setStrikerId(id);
      return next;
    });
  };

  // Bowler single select
  const toggleSelectBow = (id: string) => {
    setSelectedBowlerId(prev => (prev === id ? null : id));
    // If you want strict replace behavior, use:
    // setSelectedBowlerId(id);
  };

  const canConfirmOpeners = selectedIds.length === 2 && !!strikerId;
  const canStartInnings = canConfirmOpeners && !!selectedBowlerId;

  const handleClose = () => {
    setConfirm(false);
    setSelectedIds([]);
    setStrikerId(null);
    setSelectedBowlerId(null);
    onClose();
  };

  const renderItem = (item: ListItem) => {
    const isSelected = confirm
      ? selectedBowlerId === item.id
      : selectedIds.includes(item.id);

    const { icon } = getRoleMeta((item as any)?.role);

    return (
      <TouchableOpacity
        onPress={() => {
          // IMPORTANT FIX: don't run batsman toggle in bowler step
          if (confirm) {
            toggleSelectBow(item.id);
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

        {!confirm && selectedIds.includes(item.id) && (
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
                {
                  backgroundColor: theme.primary,
                  borderColor: theme.gray4,
                },
              ]}
            >
              <ThemeText color="text" style={styles.text}>
                {confirm ? 'Pick Opening Bowler' : 'Pick Batsmen to Open'}
              </ThemeText>
            </View>

            <View style={styles.flat}>
              <View style={styles.tableHeader}>
                <ThemeText
                  color="text"
                  style={[styles.thName, { color: theme.text }]}
                >
                  {confirm ? 'Bowler Name' : 'Batsmen Name'}
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
                    disabled={confirm ? !canStartInnings : !canConfirmOpeners}
                    onPress={confirm ? handleFinalConfirm : handleConfirm}
                    style={{
                      opacity: confirm
                        ? canStartInnings
                          ? 1
                          : 0.5
                        : canConfirmOpeners
                        ? 1
                        : 0.5,
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
                      {confirm ? 'Start Innings' : 'Confirm Openers'}
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
  thRight: {
    flexDirection: 'row',
    gap: widthPixel(14),
  },
  th: {
    fontFamily: fontFamilies.semibold ?? fontFamilies.bold,
    fontSize: fontPixel(12),
    opacity: 0.8,
    width: widthPixel(26),
    textAlign: 'right',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  rowRight: {
    flexDirection: 'row',
    gap: widthPixel(14),
    alignItems: 'center',
  },
  cell: {
    width: widthPixel(26),
    textAlign: 'right',
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
  },
  flat: {
    marginTop: heightPixel(10),
    height: heightPixel(360),
    paddingHorizontal: widthPixel(15),
  },
});
