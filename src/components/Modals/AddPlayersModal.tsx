import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Player, PlayerRole, Team } from '../../types/Playertype';
import React, { useEffect, useState } from 'react';
import { cross, teamSlect } from '../../assets/images';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import AddPlayerCheckBox from '../Checkbox/AddPlayerCheckBox';
import Button from '../themeButton';
import PlayerAddedRow from '../Flatlistcomponents/PlayerAddedRow';
import PlayersHeader from '../Headers/PlayersHeader';
import ThemeInput from '../ThemeInput';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

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
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
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
            <View style={{ flexDirection: 'row', gap: widthPixel(5) }}>
              <ThemeText color="white" style={{ fontSize: 18, fontWeight: 'bold' }}>
                Adding players for
              </ThemeText>
              <View
                style={{
                  backgroundColor: colors[isDark ? 'dark' : 'light'].white,
                  borderRadius: widthPixel(10),
                  paddingHorizontal: widthPixel(10),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ThemeText
                  color="primary"
                  style={{ fontSize: 18, fontWeight: 'bold' }}
                >
                  {activeTeam?.name}
                </ThemeText>
              </View>
            </View>
          )}

          {activeTeam?.id === 2 && (
            <View style={{ flexDirection: 'row' }}>
              <ThemeText
                color="white"
                style={{ fontSize: 18, fontWeight: 'bold' }}
              >
                Adding players for
              </ThemeText>
              <View
                style={{
                  backgroundColor: colors[isDark ? 'dark' : 'light'].white,
                  borderRadius: widthPixel(10),
                  paddingHorizontal: widthPixel(10),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ThemeText
                  color="primary"
                  style={{ fontSize: 18, fontWeight: 'bold' }}
                >
                  {activeTeam?.name}
                </ThemeText>
              </View>
            </View>
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
        <View
          style={{
            marginTop: heightPixel(20),
            paddingHorizontal: widthPixel(10),
          }}
        >
          <ThemeText color="text" style={styles.label}>
            Enter player names and assign a role to build your team lineup.
          </ThemeText>
        </View>
        <View style={styles.innerViewModal}>
          <ThemeInput
            placeholder="Enter the player name "
            leftIcon={teamSlect}
            value={playerName}
            onChangeText={setPlayerName}
          />
          <View style={{ marginTop: heightPixel(10) }}>
            <ThemeText color="text" style={styles.label}>
              Select player role
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

          <View>
            <Button
              title="Add Player"
              onPress={handleAddPlayer}
              // disabled={isTeamFull}
            />

            <Button
              title="Done"
              onPress={() => {
                onSubmit(selectedPlayers);
                onClose();
              }}
              // disabled={isTeamFull}
            />
          </View>

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
