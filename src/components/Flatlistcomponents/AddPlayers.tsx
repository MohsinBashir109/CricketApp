import {
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { Player } from '../../types/Playertype';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import ThemeText from '../ThemeText';
import ThemeInput from '../ThemeInput';
import Button from '../themeButton';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import AddPlayersModal from '../Modals/AddPlayersModal';

interface AddPlayersProps {
  teamsSelected: any;
  onSelect: (teamAPlayers: Player[], teamBplayers: Player[]) => void;
}

const AddPlayers = ({ onSelect, teamsSelected }: AddPlayersProps) => {
  console.log('Selected Teams in AddPlayers:', teamsSelected);
  const { isDark } = useThemeContext();
  const [showAddedPlayersmodal, setShowAddedPlayersModal] = useState(false);
  const show = teamsSelected?.teamA?.players?.lenght > 0;
  const addPlayers = () => {
    setShowAddedPlayersModal(true);
  };
  return (
    <View style={{ flex: 1, width: '100%' }}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors[isDark ? 'dark' : 'light'].primary },
        ]}
        onPress={addPlayers}
      >
        <ThemeText color="text" style={styles.teamButton}>
          {teamsSelected?.teamA?.name}
        </ThemeText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors[isDark ? 'dark' : 'light'].primary },
        ]}
      >
        <ThemeText color="text" style={styles.teamButton}>
          {teamsSelected?.teamB?.name}
        </ThemeText>
      </TouchableOpacity>
      <AddPlayersModal
        isVisible={showAddedPlayersmodal}
        onClose={() => setShowAddedPlayersModal(false)}
      />
    </View>
  );
};

export default AddPlayers;

const styles = StyleSheet.create({
  teamButton: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: heightPixel(10),
    borderRadius: widthPixel(10),
    paddingVertical: heightPixel(20),
  },
});
