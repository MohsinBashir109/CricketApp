import { StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import Button from '../themeButton';
import React from 'react';
import ThemeInput from '../ThemeInput';
import ThemeText from '../ThemeText';
import { fontFamilies } from '../../utils/fontfamilies';
import { team } from '../../assets/images';

interface SelectTeamsProps {
  onSelect: (teamsSelected: any) => void;
}

const SelectTeams = ({ onSelect }: SelectTeamsProps) => {
  const [teams, setTeams] = React.useState({ teamA: '', teamB: '' });
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
      <View style={{ marginTop: heightPixel(20) }}>
        <ThemeText color="text" style={styles.textStyle}>
          Set Up the Match
        </ThemeText>
        <ThemeText color="secondaryText" style={styles.desStyle}>
          Enter both team names to continue.
        </ThemeText>
      </View>
      <View style={{ marginVertical: heightPixel(20) }}>
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
    marginTop: heightPixel(10),
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  desStyle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontPixel(14),
    marginTop: heightPixel(5),
  },
});
