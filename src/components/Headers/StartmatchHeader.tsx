import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontPixel, heightPixel } from '../../utils/constants';

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
  return (
    <View>
      <View style={styles.container}>
        <Pressable onPress={onBack} hitSlop={20}>
          <Image
            source={backarrow}
            style={{ width: 20, height: 20, marginRight: 10 }}
            resizeMode="contain"
            tintColor={colors[isDark ? 'dark' : 'light'].text}
          />
        </Pressable>
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
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
  },
  text: {
    fontSize: fontPixel(18),
    fontFamily: fontFamilies.bold,
    marginVertical: heightPixel(20),
  },
});
