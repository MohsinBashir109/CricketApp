import Innings1Route, {
  Innings2Route,
  SuperOverSummaryRoute,
} from '../../../components/Scenes';
import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import React, { useMemo, useState } from 'react';
import { SceneMap, TabView } from 'react-native-tab-view';
import { fontPixel, heightPixel, widthPixel } from '../../../utils/constants';

import ThemeText from '../../../components/ThemeText';
import { backarrow } from '../../../assets/images';
import { colors } from '../../../utils/colors';
import { fontFamilies } from '../../../utils/fontfamilies';
import { useThemeContext } from '../../../theme/themeContext';
import { useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';

const MatchSummary = ({ route }: any) => {
  const { isDark } = useThemeContext();
  const theme = colors[isDark ? 'dark' : 'light'];
  const layout = useWindowDimensions();
  const navigation = useNavigation();

  const { match } = route.params;

  const hasSuperOver = !!(
    match?.superOverInnings1 ||
    match?.superOverInnings2 ||
    (match?.superOverHistory && match.superOverHistory.length > 0)
  );

  const tabRoutes = useMemo(() => {
    const r = [
      { key: 'innings1', title: 'Innings 1' },
      { key: 'innings2', title: 'Innings 2' },
    ];
    if (hasSuperOver) r.push({ key: 'superOver', title: 'Super Over' });
    return r;
  }, [hasSuperOver]);

  const [index, setIndex] = useState(0);

  const renderScene = ({ route: r }: any) => {
    switch (r.key) {
      case 'innings1':
        return <Innings1Route match={match?.innings1} fullMatch={match} />;
      case 'innings2':
        return <Innings2Route match={match?.innings2} fullMatch={match} />;
      case 'superOver':
        return <SuperOverSummaryRoute fullMatch={match} />;
      default:
        return null;
    }
  };

  const CustomTabBar = ({ navigationState, jumpTo }: any) => {
    return (
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {navigationState.routes.map((r: any, i: number) => {
          const active = navigationState.index === i;
          return (
            <Pressable
              key={r.key}
              onPress={() => jumpTo(r.key)}
              style={[
                styles.tabItem,
                active && {
                  backgroundColor: theme.primaryMuted,
                  borderColor: theme.primary,
                },
              ]}
            >
              <ThemeText
                style={styles.tabLabel}
                color={active ? 'primary' : 'secondaryText'}
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
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 52,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable hitSlop={16} onPress={() => navigation.goBack()}>
          <Image
            source={backarrow}
            style={styles.backIcon}
            tintColor={theme.text}
          />
        </Pressable>
        <View style={styles.topTitles}>
          <ThemeText style={styles.screenTitle} color="text" numberOfLines={1}>
            Match summary
          </ThemeText>
          <ThemeText
            style={styles.screenSub}
            color="secondaryText"
            numberOfLines={1}
          >
            {match?.teamA?.name} vs {match?.teamB?.name}
          </ThemeText>
        </View>
      </View>

      <TabView
        key={match?.matchId ?? 'match-summary'}
        navigationState={{ index, routes: tabRoutes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={props => <CustomTabBar {...props} />}
        initialLayout={{ width: layout.width }}
      />
    </View>
  );
};

export default MatchSummary;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: widthPixel(16),
    paddingBottom: heightPixel(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: widthPixel(12),
  },
  backIcon: {
    width: widthPixel(22),
    height: heightPixel(22),
  },
  topTitles: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontPixel(18),
  },
  screenSub: {
    fontFamily: fontFamilies.medium,
    fontSize: fontPixel(13),
    marginTop: heightPixel(2),
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: widthPixel(12),
    marginTop: heightPixel(12),
    borderRadius: widthPixel(14),
    borderWidth: StyleSheet.hairlineWidth,
    padding: widthPixel(4),
    gap: widthPixel(6),
  },
  tabItem: {
    flex: 1,
    paddingVertical: heightPixel(10),
    borderRadius: widthPixel(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontPixel(14),
  },
});
