import { colors } from './colors';

/** Gold/cream tab chrome shared by tournament `TournamentDetailsScreen` and `TournamentFixturesTab` tab bars. */
export type TournamentTabBarTokens = {
  tabBarSurface: string;
  tabBarFrameBorder: string;
  tabBarActivePill: string;
  tabBarActiveGold: string;
  tabBarInactive: string;
};

export function getTournamentTabBarTokens(
  isDark: boolean,
): TournamentTabBarTokens {
  const c = colors[isDark ? 'dark' : 'light'];
  return {
    tabBarSurface: isDark
      ? 'rgba(32, 26, 20, 0.52)'
      : 'rgba(255, 244, 228, 0.9)',
    tabBarFrameBorder: isDark
      ? 'rgba(200, 165, 100, 0.22)'
      : 'rgba(200, 160, 95, 0.3)',
    tabBarActivePill: isDark
      ? 'rgba(200, 150, 70, 0.22)'
      : 'rgba(255, 215, 170, 0.55)',
    tabBarActiveGold: isDark ? c.accent : '#5C3D1A',
    tabBarInactive: isDark
      ? 'rgba(175, 165, 150, 0.65)'
      : 'rgba(95, 78, 60, 0.48)',
  };
}
