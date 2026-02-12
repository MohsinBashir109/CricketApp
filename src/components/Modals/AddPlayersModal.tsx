import Modal from 'react-native-modal';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { colors } from '../../utils/colors';
import { useThemeContext } from '../../theme/themeContext';
import ThemeText from '../ThemeText';
import { widthPixel } from '../../utils/constants';
import { cross } from '../../assets/images';
import { MatchSetup } from '../../types/Playertype';

interface AddPlayersModalProps {
  isVisible: boolean;
  onClose: () => void;
  avtiveTeam?: MatchSetup | null;
}
const AddPlayersModal = ({ isVisible, onClose }: AddPlayersModalProps) => {
  const [activeTeam, setActiveTeam] = React.useState<MatchSetup | null>(null);
  const { isDark } = useThemeContext();
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
          <ThemeText color="text" style={{ fontSize: 18, fontWeight: 'bold' }}>
            Add Players
          </ThemeText>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose} hitSlop={20}>
            <Image
              source={cross}
              style={{ width: widthPixel(20), height: widthPixel(20) }}
              tintColor={colors[isDark ? 'dark' : 'light'].white}
            />
          </Pressable>
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
});
