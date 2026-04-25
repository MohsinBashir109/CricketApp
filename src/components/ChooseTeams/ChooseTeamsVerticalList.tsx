import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cardShadowSm } from '../../utils/cardShadow';
import type { colors } from '../../utils/colors';

type Theme = typeof colors.light;

export type ListTeam = { id: string; name: string };

type Props = {
  teams: ListTeam[];
  theme: Theme;
  isDark: boolean;
  /** When set, rows are pressable and show “Tap to remove”. */
  onRemove?: (id: string) => void;
};

const ChooseTeamsVerticalList: React.FC<Props> = ({ teams, theme, isDark, onRemove }) => {
  if (teams.length === 0) return null;

  return (
    <View>
      {teams.map((t, index) => {
        const content = (
          <>
            <ThemeText color="text" style={styles.teamName} numberOfLines={2}>
              {t.name}
            </ThemeText>
            {onRemove ? (
              <ThemeText color="secondaryText" style={styles.removeHint}>
                Tap to remove
              </ThemeText>
            ) : null}
          </>
        );

        const rowMargin = index < teams.length - 1 ? heightPixel(10) : 0;

        if (onRemove) {
          return (
            <Pressable
              key={t.id}
              onPress={() => onRemove(t.id)}
              style={({ pressed }) => [
                styles.row,
                isDark ? styles.rowShadowDark : styles.rowShadowLight,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.88 : 1,
                  marginBottom: rowMargin,
                },
              ]}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View
            key={t.id}
            style={[
              styles.row,
              isDark ? styles.rowShadowDark : styles.rowShadowLight,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                marginBottom: rowMargin,
              },
            ]}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  rowShadowLight: cardShadowSm(false),
  rowShadowDark: cardShadowSm(true),
  row: {
    borderWidth: 1,
    borderRadius: widthPixel(14),
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
  },
  teamName: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.bold,
    lineHeight: fontPixel(20),
  },
  removeHint: {
    marginTop: heightPixel(4),
    fontSize: fontPixel(12),
    lineHeight: fontPixel(17),
  },
});

export default ChooseTeamsVerticalList;
