import Innings1Route, { Innings2Route } from '../../../components/Scenes';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { SceneMap, TabView } from 'react-native-tab-view';
import { fontPixel, widthPixel } from '../../../utils/constants';

import HomeWrapper from '../../../wrappers/HomeWrapper';
import ThemeText from '../../../components/ThemeText';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { useThemeContext } from '../../../theme/themeContext';
import { useWindowDimensions } from 'react-native';

const MatchSummary = ({ route, navigation }: any) => {
  const { isDark } = useThemeContext();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'innings1', title: 'Innings 1' },
    { key: 'innings2', title: 'Innings 2' },
  ]);
  const renderScene = ({ route }: any) => {
    switch (route.key) {
      case 'innings1':
        return <Innings1Route match={match?.innings1} fullMatch={match} />;
      case 'innings2':
        return <Innings2Route match={match?.innings2} fullMatch={match} />;
      default:
        return null;
    }
  };

  const { match } = route.params;
  console.log('--------------------ccccccc', match);

  const CustomTabBar = ({ navigationState, jumpTo }: any) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {navigationState.routes.map((r: any, i: number) => {
          const active = navigationState.index === i;
          return (
            <Pressable
              key={r.key}
              onPress={() => jumpTo(r.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: active
                  ? colors[isDark ? 'dark' : 'light'].background
                  : colors[isDark ? 'dark' : 'light'].background,
                borderBottomColor: active
                  ? colors[isDark ? 'dark' : 'light'].primary
                  : colors[isDark ? 'dark' : 'light'].background,
                borderBottomWidth: 1,
              }}
            >
              <ThemeText
                style={styles.text}
                color={active ? 'primary' : 'white'}
              >
                {r.title}
              </ThemeText>
            </Pressable>
          );
        })}
      </View>
    );
  };
  return (
    // <HomeWrapper>
    <View
      style={{
        flex: 1,
        width: '100%',
        backgroundColor: colors[isDark ? 'dark' : 'light'].background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 34,
        paddingHorizontal: widthPixel(10),
      }}
    >
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={props => <CustomTabBar {...props} />}
        initialLayout={{ width: layout.width }}
      />
    </View>
    // </HomeWrapper>
  );
};

export default MatchSummary;

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(15),
  },
});
