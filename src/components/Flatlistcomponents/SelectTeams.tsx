import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';
import ThemeText from '../ThemeText';
import ThemeInput from '../ThemeInput';
import { team } from '../../assets/images';
import Button from '../themeButton';
interface SelectTeamsProps {
  onSelect: (teamsSelected: any) => void;
}

const SelectTeams = ({ onSelect }: SelectTeamsProps) => {
  const [teams, setTeams] = React.useState({ teamA: '', teamB: '' });
  const { isDark } = useThemeContext();
  const updateTeamA = (text: string) => {
    setTeams(prev => ({ ...prev, teamA: text }));
  };

  const updateTeamB = (text: string) => {
    setTeams(prev => ({ ...prev, teamB: text }));
  };
  const isValid =
    teams.teamA.trim().length > 0 && teams.teamB.trim().length > 0;
  return (
    <View style={styles.container}>
      <View>
        <ThemeText color="text" style={styles.textStyle}>
          Select Teams
        </ThemeText>
        <ThemeText color="text" style={styles.desStyle}>
          Create Teams
        </ThemeText>
      </View>
      <View>
        <ThemeInput
          placeholder="Enter Team A Name"
          title="Team A"
          leftIcon={team}
          value={teams.teamA}
          onChangeText={text => updateTeamA(text)}
        />
        <ThemeInput
          placeholder="Enter Team B Name"
          title="Team B"
          leftIcon={team}
          value={teams.teamB}
          onChangeText={text => updateTeamB(text)}
        />
      </View>
      <View style={{ marginVertical: heightPixel(30) }}>
        <Button
          title="Continue"
          onPress={() => onSelect(teams)}
          disabled={!isValid}
        />
      </View>
    </View>
  );
};

export default SelectTeams;

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  textStyle: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
    marginTop: heightPixel(20),
  },
  desStyle: {
    fontSize: fontPixel(12),
    fontFamily: fontFamilies.medium,
    marginTop: heightPixel(5),
  },
});
