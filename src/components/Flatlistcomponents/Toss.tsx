import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import Button from '../themeButton';
import { MatchSetup } from '../../types/Playertype';
import ThemeText from '../ThemeText';
import { colors } from '../../utils/colors';
import { cross } from '../../assets/images';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

interface TossProps {
  onSelect?: (tossWinner: 'teamA' | 'teamB', electedTo: 'bat' | 'bowl') => void;
  match?: MatchSetup;
}

const Toss = ({ onSelect, match }: TossProps) => {
  const [tosswinner, setTossWinner] = React.useState<'teamA' | 'teamB' | null>(
    null,
  );
  const { isDark } = useThemeContext();
  const [electedTo, setElectedTo] = React.useState<'bat' | 'bowl' | null>(null);
  const [showElectionModal, setShowElectionModal] = React.useState(false);

  const handleTossSelection = (team: 'teamA' | 'teamB') => {
    setTossWinner(team);
    setShowElectionModal(true);
  };
  useEffect(() => {
    console.log('Toss selection changed:', tosswinner, electedTo);
  }, [electedTo]);
  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 20 }}>
        <ThemeText color="text" style={{ fontSize: 18, fontWeight: 'bold' }}>
          Who won the toss?
        </ThemeText>
      </View>

      <Button
        title={match?.teamA?.name || 'Team A'}
        onPress={() => handleTossSelection('teamA')}
      />
      <Button
        title={match?.teamB?.name || 'Team B'}
        onPress={() => handleTossSelection('teamB')}
      />

      <Modal
        visible={showElectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowElectionModal(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowElectionModal(false)}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors[isDark ? 'dark' : 'light'].background,
                borderColor: colors[isDark ? 'dark' : 'light'].gray4,
                borderWidth: 1,
                borderRadius: widthPixel(12),
              },
            ]}
          >
            <View
              style={[
                styles.headerModal,
                { backgroundColor: colors[isDark ? 'dark' : 'light'].primary },
              ]}
            >
              <ThemeText color="text" style={styles.title}>
                Elected to (bat/bowl)
              </ThemeText>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setShowElectionModal(false)}>
                <Image
                  source={cross}
                  tintColor={colors[isDark ? 'dark' : 'light'].white}
                  style={{ width: widthPixel(20), height: widthPixel(20) }}
                />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: 'row',
                // justifyContent: 'space-around',
                gap: widthPixel(20),
                padding: widthPixel(12),
              }}
            >
              <View style={{ flex: 1 }}>
                <Button
                  title="Bat"
                  onPress={() => {
                    setElectedTo('bat');
                    setShowElectionModal(false);
                    onSelect?.(tosswinner!, 'bat');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Bowl"
                  onPress={() => {
                    setElectedTo('bowl');
                    setShowElectionModal(false);
                    onSelect?.(tosswinner!, 'bowl');
                  }}
                />
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Toss;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // ✅ centers content
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '90%',
    overflow: 'hidden',
    justifyContent: 'center',
  },

  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(16),
    marginBottom: heightPixel(12),
  },
  headerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: widthPixel(12),
  },
});
