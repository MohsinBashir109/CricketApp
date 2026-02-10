export const lightTheme = {
  mode: 'light',
  background: '#FFFFFF',
  text: '#000000',
  primary: '#1E90FF',
  card: '#F5F5F5',
};

export const darkTheme = {
  mode: 'dark',
  background: '#121212',
  text: '#FFFFFF',
  primary: '#BB86FC',
  card: '#1E1E1E',
};

export type ThemeType = typeof lightTheme; //So anywhere in your app, if you declare something as ThemeType, TypeScript will expect it to have those same keys (background, text) with string values.
