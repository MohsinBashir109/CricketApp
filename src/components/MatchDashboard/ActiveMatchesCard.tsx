import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';

type ActiveMatchesCardProps = {
  title: string;
  subtitle: string;
  headerIcon: any;
  headerIconTint: string;
  headerIconBg: string;
  countLabel: string;
  countBg: string;
  countFg: string;
  isDark?: boolean;
  onPressCount?: () => void;
  dropdownOpen?: boolean;
  dropdownItems?: { id: string; label: string; onPress: () => void }[];
  children: React.ReactNode;
};

const ActiveMatchesCard = ({
  title,
  subtitle,
  headerIcon,
  headerIconTint,
  headerIconBg,
  countLabel,
  countBg,
  countFg,
  isDark = false,
  onPressCount,
  dropdownOpen,
  dropdownItems,
  children,
}: ActiveMatchesCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: headerIconBg }]}>
          <Image
            source={headerIcon}
            style={[styles.headerIconImg, { tintColor: headerIconTint }]}
          />
        </View>

        <View style={styles.headerTextCol}>
          <ThemeText color="text" style={styles.headerTitle}>
            {title}
          </ThemeText>
          <ThemeText color="secondaryText" style={styles.headerSub}>
            {subtitle}
          </ThemeText>
        </View>

        <Pressable
          onPress={onPressCount}
          disabled={!onPressCount}
          hitSlop={10}
          style={({ pressed }) => [
            styles.countPill,
            { backgroundColor: countBg, opacity: pressed && onPressCount ? 0.92 : 1 },
          ]}
        >
          <ThemeText color="text" style={[styles.countText, { color: countFg }]}>
            {countLabel}
          </ThemeText>
          {dropdownItems?.length ? (
            <ThemeText color="text" style={[styles.countChevron, { color: countFg }]}>
              ▾
            </ThemeText>
          ) : null}
        </Pressable>
      </View>

      {dropdownOpen && dropdownItems?.length ? (
        <View
          style={[
            styles.dropdown,
            isDark ? styles.dropdownShadowDark : styles.dropdownShadowLight,
          ]}
        >
          {dropdownItems.map(item => (
            <Pressable
              key={item.id}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.dropdownItem,
                pressed ? styles.dropdownItemPressed : null,
              ]}
            >
              <ThemeText color="text" style={styles.dropdownItemText}>
                {item.label}
              </ThemeText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: widthPixel(18),
    padding: widthPixel(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(10),
  },
  headerIconWrap: {
    width: widthPixel(34),
    height: widthPixel(34),
    borderRadius: widthPixel(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconImg: {
    width: widthPixel(18),
    height: widthPixel(18),
    resizeMode: 'contain',
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  headerSub: {
    marginTop: heightPixel(1),
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(11),
    lineHeight: fontPixel(14),
  },
  countPill: {
    paddingHorizontal: widthPixel(10),
    paddingVertical: heightPixel(6),
    borderRadius: widthPixel(999),
    flexDirection: 'row',
    alignItems: 'center',
    gap: widthPixel(6),
  },
  countText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(10),
    letterSpacing: 0.2,
  },
  countChevron: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(11),
    marginTop: -heightPixel(1),
  },
  dropdown: {
    position: 'absolute',
    top: heightPixel(52),
    right: widthPixel(14),
    backgroundColor: '#FFFFFF',
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
    zIndex: 50,
    minWidth: widthPixel(150),
  },
  dropdownShadowLight: cardShadowSm(false),
  dropdownShadowDark: cardShadowSm(true),
  dropdownItem: {
    paddingVertical: heightPixel(10),
    paddingHorizontal: widthPixel(12),
  },
  dropdownItemPressed: {
    backgroundColor: 'rgba(21,101,216,0.08)',
  },
  dropdownItemText: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(12),
  },
  body: {
    marginTop: heightPixel(12),
  },
});

export default ActiveMatchesCard;

