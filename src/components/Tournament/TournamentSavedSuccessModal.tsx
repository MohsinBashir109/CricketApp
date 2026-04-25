import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ThemeText from '../ThemeText';
import Button from '../themeButton';
import { throphy } from '../../assets/images';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

type Theme = typeof colors.light;

type Props = {
  visible: boolean;
  tournamentName: string;
  theme: Theme;
  isDark: boolean;
  onMoveToFixture: () => void;
  onGoToTournament: () => void;
};

/** Small decorative chips behind the trophy (static layout). */
const CONFETTI = [
  { top: 8, left: 10, w: 7, h: 9, color: '#1565D8', rotate: '-14deg' },
  { top: 14, right: 8, w: 8, h: 6, color: '#5B9BD5', rotate: '22deg' },
  { top: 4, left: 44, w: 5, h: 7, color: '#1F7A4F', rotate: '8deg' },
  { top: 22, right: 22, w: 6, h: 6, color: '#D7A63D', rotate: '-20deg' },
  { top: 36, left: 6, w: 8, h: 5, color: '#2D6CDF', rotate: '12deg' },
  { top: 40, right: 12, w: 5, h: 8, color: '#94C5F0', rotate: '-8deg' },
  { top: 52, left: 28, w: 7, h: 7, color: '#1F7A4F', rotate: '18deg' },
  { top: 48, right: 28, w: 6, h: 5, color: '#D7A63D', rotate: '-5deg' },
] as const;

const TournamentSavedSuccessModal: React.FC<Props> = ({
  visible,
  tournamentName,
  theme,
  isDark,
  onMoveToFixture,
  onGoToTournament,
}) => {
  const displayName = tournamentName.trim() || 'Your tournament';
  const checkBg = isDark ? '#22C55E' : '#1F7A4F';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onGoToTournament}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onGoToTournament} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.hero}>
            {CONFETTI.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.confetti,
                  {
                    top: heightPixel(c.top),
                    width: widthPixel(c.w),
                    height: heightPixel(c.h),
                    backgroundColor: c.color,
                    transform: [{ rotate: c.rotate }],
                    ...(c.left != null ? { left: widthPixel(c.left) } : {}),
                    ...(c.right != null ? { right: widthPixel(c.right) } : {}),
                  },
                ]}
              />
            ))}
            <View
              style={[
                styles.trophyWash,
                { backgroundColor: isDark ? 'rgba(37,211,102,0.12)' : theme.primaryMuted },
              ]}
            />
            <Image
              source={throphy}
              style={[styles.trophyImg, { tintColor: theme.primary }]}
              resizeMode="contain"
            />
            <View style={[styles.checkBadge, { backgroundColor: checkBg }]}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: theme.primary }]}>Tournament saved!</Text>
          <ThemeText color="secondaryText" style={styles.subtitle}>
            {displayName} has been created successfully.
          </ThemeText>

          <View style={styles.actions}>
            <Button title="Move to fixture" onPress={onMoveToFixture} />
            <Pressable onPress={onGoToTournament} style={styles.cancelBtn} hitSlop={8}>
              <ThemeText color="primary" style={styles.cancelLabel}>
                Cancel
              </ThemeText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const HERO = widthPixel(132);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 17, 31, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: widthPixel(22),
  },
  sheet: {
    zIndex: 1,
    borderRadius: widthPixel(22),
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: heightPixel(28),
    paddingBottom: heightPixel(22),
    paddingHorizontal: widthPixel(20),
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    width: HERO,
    height: HERO,
    alignSelf: 'center',
    marginBottom: heightPixel(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    borderRadius: widthPixel(2),
    opacity: 0.9,
  },
  trophyWash: {
    position: 'absolute',
    width: widthPixel(100),
    height: widthPixel(100),
    borderRadius: widthPixel(50),
  },
  trophyImg: {
    width: widthPixel(58),
    height: widthPixel(58),
    zIndex: 1,
  },
  checkBadge: {
    position: 'absolute',
    bottom: heightPixel(10),
    right: widthPixel(18),
    width: widthPixel(30),
    height: widthPixel(30),
    borderRadius: widthPixel(15),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: fontPixel(16),
    fontFamily: fontFamilies.bold,
    marginTop: -1,
  },
  title: {
    fontSize: fontPixel(22),
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
    marginBottom: heightPixel(8),
  },
  subtitle: {
    fontSize: fontPixel(14),
    lineHeight: fontPixel(21),
    textAlign: 'center',
    marginBottom: heightPixel(22),
    paddingHorizontal: widthPixel(4),
  },
  actions: {
    gap: heightPixel(4),
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: heightPixel(12),
  },
  cancelLabel: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
});

export default TournamentSavedSuccessModal;
