import { Platform } from 'react-native';

type ShadowStyle = {
  elevation: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
};

const shadowColor = '#000';

const iosOnly = <T extends object>(v: T): T | {} =>
  Platform.OS === 'ios' ? v : {};

export const elevation: Record<'sm' | 'md' | 'lg', ShadowStyle> = {
  sm: {
    elevation: 2,
    shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    ...(iosOnly({}) as any),
  },
  md: {
    elevation: 5,
    shadowColor,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    ...(iosOnly({}) as any),
  },
  lg: {
    elevation: 9,
    shadowColor,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    ...(iosOnly({}) as any),
  },
};

