import {
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import { allrounder, bat, bowlericon, wicket } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

type BatsmanRow = {
  name: string;
  isStriker?: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

type BowlerRow = {
  name: string;
  overs: string; // "3.2"
  maidens: number;
  runs: number;
  wickets: number;
  econ: number;
};

type Props = {
  batsmen: BatsmanRow[];
  bowler: BowlerRow;
};

const BatsmenBowlerCard: React.FC<Props> = ({ batsmen, bowler }) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  console.log('--------------------->', batsmen);
  console.log('--------------------->', bowler);
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
        return { label: 'Unknown' }; // ✅ icon is undefined, not null
    }
  };
  const renderItem = (item: any) => {
    const { icon } = getRoleMeta(item?.role);
    return (
      <TouchableOpacity
        style={[
          styles.row,
          {
            borderWidth: 1,
            borderColor: colors[isDark ? 'dark' : 'light'].gray4,
            paddingHorizontal: widthPixel(20),
            paddingVertical: heightPixel(20),
            marginBottom: heightPixel(10),
            borderRadius: widthPixel(10),
          },
        ]}
      >
        <ThemeText color="text" style={[styles.name, { color: theme.text }]}>
          {item.name}
        </ThemeText>
        {/* <View style={styles.rowRight}>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {item.runs}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {item.balls}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {item.fours}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {item.sixes}
          </ThemeText>
        </View> */}
        <View style={{ flex: 1 }} />
        {icon && (
          <Image
            source={icon}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Table header */}

      {/* Bowler header */}
      {/* <View
        style={[
          styles.tableHeader,
          {
            borderColor: theme.gray4 ?? 'rgba(0,0,0,0.08)',
            marginTop: heightPixel(10),
          },
        ]}
      >
        <ThemeText color="text" style={[styles.thName, { color: theme.text }]}>
          Bowling
        </ThemeText>
        <View style={styles.thRight}>
          <ThemeText color="text" style={[styles.th, { color: theme.text }]}>
            O
          </ThemeText>
          <ThemeText color="text" style={[styles.th, { color: theme.text }]}>
            M
          </ThemeText>
          <ThemeText color="text" style={[styles.th, { color: theme.text }]}>
            R
          </ThemeText>
          <ThemeText color="text" style={[styles.th, { color: theme.text }]}>
            W
          </ThemeText>
          <ThemeText color="text" style={[styles.th, { color: theme.text }]}>
            Eco
          </ThemeText>
        </View>
      </View> */}

      {/* Bowler row */}
      {/* <View style={styles.row}>
        <ThemeText color="text" style={[styles.name, { color: theme.text }]}>
          {bowler.name}
        </ThemeText>
        <View style={styles.rowRight}>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {bowler.overs}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {bowler.maidens}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {bowler.runs}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {bowler.wickets}
          </ThemeText>
          <ThemeText color="text" style={[styles.cell, { color: theme.text }]}>
            {bowler.econ}
          </ThemeText>
        </View>
      </View> */}
      <Modal visible={true} transparent presentationStyle="overFullScreen">
        <View style={styles.containermodal}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors[isDark ? 'dark' : 'light'].background,
                borderColor: colors[isDark ? 'dark' : 'light'].gray4,
                borderWidth: 1,
                borderRadius: widthPixel(12),
              },
            ]}
          >
            <View
              style={[
                styles.header,
                {
                  backgroundColor: colors[isDark ? 'dark' : 'light'].primary,
                  borderColor: colors[isDark ? 'dark' : 'light'].gray4,
                },
              ]}
            >
              <ThemeText color="text" style={styles.text}>
                Pick Batsmen to Open
              </ThemeText>
            </View>

            <View style={styles.flat}>
              <View style={[styles.tableHeader]}>
                <ThemeText
                  color="text"
                  style={[styles.thName, { color: theme.text }]}
                >
                  Batsmen Name
                </ThemeText>
                {/* <View style={styles.thRight}>
                  <ThemeText
                    color="text"
                    style={[styles.th, { color: theme.text }]}
                  >
                    R
                  </ThemeText>
                  <ThemeText
                    color="text"
                    style={[styles.th, { color: theme.text }]}
                  >
                    B
                  </ThemeText>
                  <ThemeText
                    color="text"
                    style={[styles.th, { color: theme.text }]}
                  >
                    4s
                  </ThemeText>
                  <ThemeText
                    color="text"
                    style={[styles.th, { color: theme.text }]}
                  >
                    6s
                  </ThemeText>
                </View> */}
              </View>
              <View
                style={{
                  flex: 1,
                  marginTop: heightPixel(10),
                  marginBottom: heightPixel(10),
                }}
              >
                <FlatList
                  data={batsmen}
                  renderItem={({ item }) => renderItem(item)}
                  showsVerticalScrollIndicator={false}
                />
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
    backgroundColor: 'pink',
  },
  containermodal: {
    flex: 1,
    borderTopLeftRadius: widthPixel(10),
    borderTopRightRadius: widthPixel(10),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(10),
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: heightPixel(10),
  },
  teamName: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
    opacity: 0.8,
  },
  score: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(28),
    marginTop: heightPixel(4),
  },
  overs: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },
  small: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
  },

  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // paddingVertical: heightPixel(8),
    borderTopWidth: 1,
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
    paddingVertical: heightPixel(8),
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
    height: heightPixel(320),
    // padding: widthPixel(10),
    // paddingVertical :he
    paddingHorizontal: widthPixel(15),
  },
});
