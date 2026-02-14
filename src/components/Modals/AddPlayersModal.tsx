import Modal from 'react-native-modal';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors } from '../../utils/colors';
import { useThemeContext } from '../../theme/themeContext';
import ThemeText from '../ThemeText';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';
import { cross, players } from '../../assets/images';
import { MatchSetup, Player, PlayerRole, Team } from '../../types/Playertype';
import ThemeInput from '../ThemeInput';
import Button from '../themeButton';
import AddPlayerCheckBox from '../Checkbox/AddPlayerCheckBox';
import { fontFamilies } from '../../utils/fontfamilies';
import PlayersHeader from '../Headers/PlayersHeader';
import PlayerAddedRow from '../Flatlistcomponents/PlayerAddedRow';

interface AddPlayersModalProps {
  isVisible: boolean;
  onClose: () => void;

  activeTeam: Team | null;
  initialPlayers: Player[];
  onSubmit: (players: Player[]) => void;
}
const AddPlayersModal = ({
  isVisible,
  onClose,
  activeTeam,
  initialPlayers,
  onSubmit,
}: AddPlayersModalProps) => {
  const { isDark } = useThemeContext();
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [role, setRole] = useState<PlayerRole | undefined>(undefined);

  const roles: PlayerRole[] = [
    'batsman',
    'bowler',
    'allrounder',
    'wicketkeeper',
  ];
  useEffect(() => {
    if (isVisible) setSelectedPlayers(initialPlayers ?? []);
  }, [isVisible, initialPlayers]);
  const [playerName, setPlayerName] = useState('');
  console.log(playerName, role);
  console.log(selectedPlayers);

  const isTeamFull = selectedPlayers.length >= 11;
  const handleAddPlayer = () => {
    if (selectedPlayers.length >= 11) return;
    if (!playerName) return;
    if (!role) return;
    const nextId = selectedPlayers.length + 1;
    if (!nextId) return;
    const newPlayer: Player = {
      id: nextId,
      name: playerName,
      role: role,
      // Batting
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      outType: '',
      outByBowlerId: null,
      outByFielderId: null,

      // Bowling (optional for later)
      overs: null, // you can store ballsBowled instead (recommended)
      maidens: null,
      conceded: null,
      wickets: null,

      // Extras (if you ever attribute)
      wides: null,
      noBalls: null,
    };
    setSelectedPlayers(prev => [...prev, newPlayer]);
    setPlayerName('');
    setRole(undefined);
  };
  return (
    <Modal isVisible={isVisible}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors[isDark ? 'dark' : 'light'].background },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors[isDark ? 'dark' : 'light'].primary },
          ]}
        >
          {activeTeam?.id === 1 && (
            <ThemeText
              color="text"
              style={{ fontSize: 18, fontWeight: 'bold' }}
            >
              Add Players to your team {activeTeam?.name}
            </ThemeText>
          )}
          {activeTeam?.id === 2 && (
            <ThemeText
              color="text"
              style={{ fontSize: 18, fontWeight: 'bold' }}
            >
              Add Players to your team{activeTeam?.name}
            </ThemeText>
          )}

          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose} hitSlop={20}>
            <Image
              source={cross}
              style={{ width: widthPixel(20), height: widthPixel(20) }}
              tintColor={colors[isDark ? 'dark' : 'light'].white}
            />
          </Pressable>
        </View>
        <View style={styles.innerViewModal}>
          <ThemeInput
            placeholder="Enter the player name "
            leftIcon={players}
            value={playerName}
            onChangeText={setPlayerName}
          />
          <View>
            <ThemeText color="text" style={styles.label}>
              Player Role
            </ThemeText>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
            }}
          >
            {roles.map(r => (
              <AddPlayerCheckBox
                key={r}
                label={r}
                checked={role === r}
                onChange={() => setRole(prev => (prev === r ? undefined : r))}
              />
            ))}
          </View>

          <Button
            title="Add Player"
            onPress={handleAddPlayer}
            disabled={isTeamFull}
          />
          <Button
            title="Done"
            onPress={() => {
              onSubmit(selectedPlayers);
            }}
            // disabled={isTeamFull}
          />
          <View style={styles.scroll}>
            <PlayersHeader />
            {/* <View> */}
            <FlatList
              data={selectedPlayers}
              keyExtractor={item => item?.id.toString()}
              renderItem={({ item }: any) => <PlayerAddedRow item={item} />}
            />
            {/* </View> */}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddPlayersModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: widthPixel(10),
    borderTopRightRadius: widthPixel(10),
    overflow: 'hidden',
  },
  header: {
    padding: widthPixel(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  innerViewModal: {
    flex: 1,
    paddingTop: heightPixel(10),
    paddingHorizontal: widthPixel(10),
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(15),
  },
  scroll: {
    flex: 1,
    marginBottom: heightPixel(20),
  },
});
