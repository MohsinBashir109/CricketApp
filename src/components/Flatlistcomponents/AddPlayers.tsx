import {
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useMemo, useState } from 'react';
import { MatchSetup, Player, Team } from '../../types/Playertype';
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
  const [players, setPlayers] = useState<Player[]>([]);
  type TeamKey = 'teamA' | 'teamB';
  const [activeTeamKey, setActiveTeamKey] = useState<TeamKey | null>(null);

  const activeTeam: Team | null = useMemo(() => {
    if (!activeTeamKey) return null;
    return teamsSelected?.[activeTeamKey] ?? null;
  }, [activeTeamKey, teamsSelected]);
  const openForTeam = (key: TeamKey) => {
    setActiveTeamKey(key);
    setShowAddedPlayersModal(true);
  };
  console.log('_______________________>', activeTeam, teamsSelected);
  const handleSubmitPlayers = (players: Player[]) => {
    // If you want to update the object, that should happen in the parent (because teamsSelected is a prop).
    // Here we just call onSelect with updated arrays.

    const teamAPlayers =
      activeTeamKey === 'teamA' ? players : teamsSelected?.teamA?.players ?? [];

    const teamBPlayers =
      activeTeamKey === 'teamB' ? players : teamsSelected?.teamB?.players ?? [];

    onSelect(teamAPlayers, teamBPlayers);
  };
  const teamAHasPlayers = (teamsSelected?.teamA?.players?.length ?? 0) > 0;
  const teamBHasPlayers = (teamsSelected?.teamB?.players?.length ?? 0) > 0;
  console.log('a', teamsSelected?.teamA?.players);
  console.log('b', teamBHasPlayers);

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors[isDark ? 'dark' : 'light'].primary },
        ]}
        onPress={() => openForTeam('teamA')}
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
        onPress={() => openForTeam('teamB')}
      >
        <ThemeText color="text" style={styles.teamButton}>
          {teamsSelected?.teamB?.name}
        </ThemeText>
      </TouchableOpacity>
      <AddPlayersModal
        activeTeam={activeTeam}
        initialPlayers={activeTeam?.players ?? []}
        onSubmit={handleSubmitPlayers}
        isVisible={showAddedPlayersmodal}
        onClose={() => {
          setShowAddedPlayersModal(false);
          setActiveTeamKey(null);
        }}
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
