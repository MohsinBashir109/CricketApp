import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import ThemeText from './ThemeText';
import { fontPixel, heightPixel, widthPixel } from '../utils/constants';
import { fontFamilies } from '../utils/fontfamilies';

export type TeamSearchComboTeam = {
  id: string;
  name: string;
  playerCount: number;
  shortName?: string;
};

type ComboTheme = {
  text: string;
  secondaryText: string;
  border: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryMuted: string;
};

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  teams: TeamSearchComboTeam[];
  onSelectTeam: (teamId: string) => void;
  isTeamSelected: (teamId: string) => boolean;
  isTeamDisabled: (teamId: string) => boolean;
  theme: ComboTheme;
  label?: string;
  fieldHelperText?: string;
  placeholder?: string;
};

const TeamSearchCombo: React.FC<Props> = ({
  value,
  onChangeText,
  teams,
  onSelectTeam,
  isTeamSelected,
  isTeamDisabled,
  theme,
  label = 'Find a team',
  fieldHelperText,
  placeholder = 'Search by team name…',
}) => {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearBlurTimer = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  };

  const handleFocus = () => {
    clearBlurTimer();
    setOpen(true);
  };

  const handleBlur = () => {
    clearBlurTimer();
    blurTimer.current = setTimeout(() => setOpen(false), 200);
  };

  const query = value.trim();
  /** Only show the dropdown when the user has typed — list is match-only. */
  const showPanel = open && query.length > 0;

  return (
    <View style={styles.wrap}>
      {label ? (
        <ThemeText color="text" style={styles.label}>
          {label}
        </ThemeText>
      ) : null}
      <View
        style={[
          styles.fieldRow,
          {
            borderColor: theme.border,
            backgroundColor: theme.surfaceElevated,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={t => {
            onChangeText(t);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.secondaryText}
          style={[styles.input, { color: theme.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={placeholder}
        />
        <ThemeText color="secondaryText" style={styles.chevron}>
          {showPanel ? '▲' : '▼'}
        </ThemeText>
      </View>
      {fieldHelperText ? (
        <ThemeText color="secondaryText" style={styles.helper}>
          {fieldHelperText}
        </ThemeText>
      ) : null}

      {showPanel ? (
        <View
          style={[
            styles.dropdown,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
            },
          ]}
        >
          {teams.length === 0 ? (
            <View style={styles.emptyPad}>
              <ThemeText color="secondaryText" style={styles.emptyText}>
                No teams match “{query}”. Try a different spelling or add a new
                team with Add Team.
              </ThemeText>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.dropdownScroll}
              contentContainerStyle={styles.dropdownContent}
            >
              {teams.map((team, index) => {
                const selected = isTeamSelected(team.id);
                const disabled = isTeamDisabled(team.id);
                return (
                  <Pressable
                    key={team.id}
                    onPressIn={clearBlurTimer}
                    onPress={() => {
                      if (!disabled) onSelectTeam(team.id);
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        borderBottomWidth:
                          index === teams.length - 1
                            ? 0
                            : StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                        backgroundColor: pressed
                          ? theme.primaryMuted
                          : selected
                            ? theme.primaryMuted
                            : theme.surface,
                        opacity: disabled && !selected ? 0.45 : 1,
                      },
                    ]}
                  >
                    <View style={styles.rowText}>
                      <ThemeText
                        color="text"
                        style={styles.teamName}
                        numberOfLines={1}
                      >
                        {team.name}
                      </ThemeText>
                      <ThemeText
                        color="secondaryText"
                        style={styles.meta}
                        numberOfLines={1}
                      >
                        {team.playerCount} players
                        {team.shortName ? ` · ${team.shortName}` : ''}
                      </ThemeText>
                    </View>
                    <ThemeText
                      color={selected ? 'primary' : 'secondaryText'}
                      style={styles.badge}
                    >
                      {selected ? 'Selected' : disabled ? 'Full' : 'Tap to add'}
                    </ThemeText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: heightPixel(12),
  },
  label: {
    marginBottom: heightPixel(8),
    fontSize: fontPixel(13),
    fontFamily: fontFamilies.semibold,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: widthPixel(12),
    paddingHorizontal: widthPixel(14),
    minHeight: heightPixel(48),
  },
  input: {
    flex: 1,
    fontSize: fontPixel(16),
    paddingVertical: heightPixel(12),
    fontFamily: fontFamilies.regular,
  },
  chevron: {
    fontSize: fontPixel(10),
    marginLeft: widthPixel(8),
  },
  helper: {
    marginTop: heightPixel(8),
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  dropdown: {
    marginTop: heightPixel(6),
    borderWidth: 1,
    borderRadius: widthPixel(12),
    maxHeight: heightPixel(220),
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: heightPixel(220),
  },
  dropdownContent: {
    paddingVertical: heightPixel(4),
  },
  emptyPad: {
    paddingVertical: heightPixel(14),
    paddingHorizontal: widthPixel(14),
  },
  emptyText: {
    fontSize: fontPixel(13),
    lineHeight: fontPixel(19),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: heightPixel(12),
    paddingHorizontal: widthPixel(14),
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  teamName: {
    fontSize: fontPixel(15),
    fontFamily: fontFamilies.semibold,
  },
  meta: {
    marginTop: heightPixel(2),
    fontSize: fontPixel(12),
  },
  badge: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.semibold,
    marginLeft: widthPixel(8),
  },
});

export default TeamSearchCombo;
