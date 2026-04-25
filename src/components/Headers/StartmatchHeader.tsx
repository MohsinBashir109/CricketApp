import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { fontPixel, heightPixel, widthPixel } from '../../utils/constants';

import DashesProgressBar from '../progressBars/DashesProgressBar';
import React from 'react';
import ThemeText from '../ThemeText';
import { backarrow } from '../../assets/images';
import { colors } from '../../utils/colors';
import { fontFamilies } from '../../utils/fontfamilies';
import { useThemeContext } from '../../theme/themeContext';

type Step = { id: string; title: string };
interface StartmatchHeaderProps {
  title?: string;
  onBack?: () => void;
  steps: Step[];
  currentStep: number;
}

const StartmatchHeader = ({
  title,
  onBack,
  steps,
  currentStep,
}: StartmatchHeaderProps) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  return (
    <View style={{ backgroundColor: theme.transparent }}>
      <View style={styles.container}>
        <Pressable onPress={onBack} hitSlop={20}>
          <Image
            source={backarrow}
            style={{ width: 20, height: 20, marginRight: 10 }}
            resizeMode="contain"
            tintColor={theme.text}
          />
        </Pressable>

        <View
          style={{
            flex: 1,

            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ThemeText color="text" style={styles.text}>
            {title}
          </ThemeText>
        </View>
      </View>
      <View>
        <DashesProgressBar steps={steps} currentStep={currentStep} />
      </View>
    </View>
  );
};

export default StartmatchHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: widthPixel(14),
  },
  text: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
    marginVertical: heightPixel(20),
  },
});
