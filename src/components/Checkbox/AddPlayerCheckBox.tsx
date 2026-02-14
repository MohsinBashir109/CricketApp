import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ThemeText from '../ThemeText';
import { heightPixel, widthPixel } from '../../utils/constants';
import { useThemeContext } from '../../theme/themeContext';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';

type Props = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

const AddPlayerCheckBox = ({ label, checked, onChange }: Props) => {
  const { isDark } = useThemeContext();

  return (
    <Pressable hitSlop={20} onPress={onChange} style={styles.row}>
      <View
        style={[
          styles.box,
          {
            borderColor: colors[isDark ? 'dark' : 'light'].primary,
            backgroundColor: checked
              ? colors[isDark ? 'dark' : 'light'].primary
              : 'transparent',
          },
        ]}
      />

      <ThemeText color="text" style={styles.label}>
        {label.toUpperCase()}
      </ThemeText>
    </Pressable>
  );
};
export default AddPlayerCheckBox;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: widthPixel(10),
  },
  box: {
    width: widthPixel(18),
    height: widthPixel(18),
    borderWidth: 2,
    borderRadius: widthPixel(4),
    marginRight: widthPixel(5),
    marginVertical: heightPixel(10),
  },
  label: {
    fontSize: widthPixel(10),
    fontFamily: fontFamilies.semibold,
  },
});
