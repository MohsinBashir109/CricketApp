import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Toast, { BaseToastProps, ToastConfigParams } from 'react-native-toast-message';
import { useThemeContext } from '../theme/themeContext';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const uiColors = {
  navy: '#082A5A',
  royalBlue: '#063B96',
  gold: '#D7A63D',
  goldSoft: '#FFE6A3',
  cream: '#FFF6DC',
  success: '#21A67A',
  error: '#D64545',
  warning: '#D7A63D',
  info: '#2D6CDF',
  textDark: '#0C1726',
  textMuted: '#5F6F7A',
  white: '#FFFFFF',
} as const;

const lastToastByKey = new Map<string, number>();

function shouldShow(key: string, ttlMs = 1200) {
  const now = Date.now();
  const last = lastToastByKey.get(key) ?? 0;
  if (now - last < ttlMs) return false;
  lastToastByKey.set(key, now);
  return true;
}

function normalizeKey(variant: ToastVariant, title: string, message?: string) {
  return `${variant}::${title.trim()}::${(message ?? '').trim()}`;
}

function ToastCard({
  variant,
  text1,
  text2,
}: ToastConfigParams<{
  variant: ToastVariant;
}> &
  BaseToastProps) {
  const { isDark } = useThemeContext();

  const accent = (() => {
    switch (variant) {
      case 'success':
        return uiColors.success;
      case 'error':
        return uiColors.error;
      case 'warning':
        return uiColors.warning;
      case 'info':
      default:
        return uiColors.info;
    }
  })();

  const icon = (() => {
    switch (variant) {
      case 'success':
        return '✓';
      case 'error':
        return '×';
      case 'warning':
        return '!';
      case 'info':
      default:
        return 'i';
    }
  })();

  const bg = isDark ? 'rgba(12, 23, 38, 0.92)' : uiColors.white;
  const titleColor = isDark ? uiColors.cream : uiColors.textDark;
  const bodyColor = isDark ? 'rgba(255,246,220,0.82)' : uiColors.textMuted;

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
          <Text style={[styles.icon, { color: accent }]}>{icon}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {text1}
          </Text>
          {text2 ? (
            <Text style={[styles.message, { color: bodyColor }]} numberOfLines={2}>
              {text2}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const toastConfig = {
  success: (p: any) => <ToastCard {...p} variant="success" />,
  error: (p: any) => <ToastCard {...p} variant="error" />,
  warning: (p: any) => <ToastCard {...p} variant="warning" />,
  info: (p: any) => <ToastCard {...p} variant="info" />,
} as const;

type ShowArgs = {
  title: string;
  message?: string;
  dedupeTtlMs?: number;
};

function show(variant: ToastVariant, { title, message, dedupeTtlMs }: ShowArgs) {
  if (!title?.trim()) return;
  const key = normalizeKey(variant, title, message);
  if (!shouldShow(key, dedupeTtlMs)) return;

  Toast.show({
    type: variant,
    text1: title,
    text2: message,
    position: 'top',
    topOffset: Platform.OS === 'android' ? 48 : 58,
    visibilityTime: variant === 'error' ? 3500 : 2500,
  });
}

export function showSuccessToast(title: string, message?: string) {
  show('success', { title, message });
}

export function showErrorToast(title: string, message?: string) {
  show('error', { title, message, dedupeTtlMs: 1800 });
}

export function showWarningToast(title: string, message?: string) {
  show('warning', { title, message });
}

export function showInfoToast(title: string, message?: string) {
  show('info', { title, message, dedupeTtlMs: 1500 });
}

const styles = StyleSheet.create({
  card: {
    width: '92%',
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: -1,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  message: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});

