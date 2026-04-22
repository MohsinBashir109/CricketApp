export type CardShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

const LIGHT_BLUE = '#1565D8';

export const cardShadowLg = (isDark: boolean): CardShadowStyle => {
  if (isDark) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 8,
    };
  }

  return {
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  };
};

export const cardShadowSm = (isDark: boolean): CardShadowStyle => {
  if (isDark) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 14,
      elevation: 6,
    };
  }

  return {
    shadowColor: LIGHT_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  };
};

