import { Pressable, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import React from 'react';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

type Run = 0 | 1 | 2 | 3 | 4 | 6;
type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye';

type Props = {
  onRunPress?: (runs: Run) => void;
  onExtraPress?: (type: ExtraType) => void;
  onWicketPress?: () => void;
  onUndoPress?: () => void;
  onEndOverPress?: () => void;
};

const runButtons: Run[] = [0, 1, 2, 3, 4, 6];

const ScoreControls: React.FC<Props> = ({
  onRunPress,
  onExtraPress,
  onWicketPress,
  onUndoPress,
  onEndOverPress,
}) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      {/* Run buttons */}
      <View style={styles.runRow}>
        {runButtons.map(r => (
          <Pressable
            key={r}
            onPress={() => onRunPress?.(r)}
            style={[
              styles.runBtn,
              {
                borderColor: theme.gray4 ?? theme.white,
                backgroundColor: 'transparent',
              },
              r === 4 && styles.runBtnActive, // similar highlight like screenshot
            ]}
          >
            <ThemeText
              color="text"
              style={[styles.runText, { color: theme.text }]}
            >
              {r}
            </ThemeText>
          </Pressable>
        ))}
      </View>

      {/* Extras */}
      <View style={styles.extrasRow}>
        <Pressable
          onPress={() => onExtraPress?.('wide')}
          style={[styles.extraBtn, { borderColor: theme.gray4 ?? theme.white }]}
        >
          <ThemeText
            color="text"
            style={[styles.extraText, { color: theme.text }]}
          >
            Wide
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={() => onExtraPress?.('noball')}
          style={[styles.extraBtn, { borderColor: theme.gray4 ?? theme.white }]}
        >
          <ThemeText
            color="text"
            style={[styles.extraText, { color: theme.text }]}
          >
            No Ball
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={() => onExtraPress?.('bye')}
          style={[styles.extraBtn, { borderColor: theme.gray4 ?? theme.white }]}
        >
          <ThemeText
            color="text"
            style={[styles.extraText, { color: theme.text }]}
          >
            Bye
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={() => onExtraPress?.('legbye')}
          style={[styles.extraBtn, { borderColor: theme.gray4 ?? theme.white }]}
        >
          <ThemeText
            color="text"
            style={[styles.extraText, { color: theme.text }]}
          >
            Leg Bye
          </ThemeText>
        </Pressable>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomRow}>
        <Pressable
          onPress={onWicketPress}
          style={[
            styles.actionBtn,
            styles.wicketBtn,
            { borderColor: '#ff4d4d' },
          ]}
        >
          <ThemeText
            color="text"
            style={[styles.actionText, { color: '#ff4d4d' }]}
          >
            Wicket
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={onUndoPress}
          style={[
            styles.actionBtn,
            { borderColor: theme.gray4 ?? theme.white },
          ]}
        >
          <ThemeText
            color="text"
            style={[styles.actionText, { color: theme.text }]}
          >
            Undo
          </ThemeText>
        </Pressable>

        <Pressable
          onPress={onEndOverPress}
          style={[
            styles.actionBtn,
            { borderColor: theme.gray4 ?? theme.white },
          ]}
        >
          <ThemeText
            color="text"
            style={[styles.actionText, { color: theme.text }]}
          >
            End Over
          </ThemeText>
        </Pressable>
      </View>
    </View>
  );
};

export default ScoreControls;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(16),
  },

  runRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightPixel(10),
  },
  runBtn: {
    width: widthPixel(46),
    height: widthPixel(46),
    borderRadius: widthPixel(10),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnActive: {
    // subtle emphasis like screenshot; adjust later if you want
    transform: [{ scale: 1.02 }],
  },
  runText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
  },

  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightPixel(12),
  },
  extraBtn: {
    flex: 1,
    marginHorizontal: widthPixel(4),
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(10),
    borderWidth: 1,
    alignItems: 'center',
  },
  extraText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(12),
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: heightPixel(14),
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: widthPixel(4),
    paddingVertical: heightPixel(12),
    borderRadius: widthPixel(10),
    borderWidth: 1,
    alignItems: 'center',
  },
  wicketBtn: {
    borderWidth: 1.5,
  },
  actionText: {
    fontFamily: fontFamilies.semibold ?? fontFamilies.bold,
    fontSize: fontPixel(13),
  },
});
