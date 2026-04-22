import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const DATE_FORMATS = {
  /** Keep existing input style (used in modals previously). */
  uiDateYmd: 'YYYY-MM-DD',
  /** Keep existing input style (used in modals previously). */
  uiTimeHm: 'HH:mm',

  /** Friendly UI examples for other screens. */
  uiDatePretty: 'DD MMM YYYY',
  uiTime12h: 'hh:mm A',

  /** API-friendly date only. */
  apiDateYmd: 'YYYY-MM-DD',
} as const;

export function isValidIso(iso: string | null | undefined): iso is string {
  if (!iso) return false;
  return dayjs(iso).isValid();
}

export function isoToDate(iso: string | null | undefined): Date | null {
  if (!isValidIso(iso)) return null;
  return dayjs(iso).toDate();
}

export function formatDateForUiYmd(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? dayjs(value) : dayjs(value);
  return d.isValid() ? d.format(DATE_FORMATS.uiDateYmd) : '';
}

export function formatTimeForUiHm(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? dayjs(value) : dayjs(value);
  return d.isValid() ? d.format(DATE_FORMATS.uiTimeHm) : '';
}

export function formatDateForApiYmd(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? dayjs(value) : dayjs(value);
  return d.isValid() ? d.format(DATE_FORMATS.apiDateYmd) : '';
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return dayjs(a).isSame(dayjs(b), 'day');
}

export function isToday(value: Date | string): boolean {
  return dayjs(value).isSame(dayjs(), 'day');
}

export function isPastDay(value: Date | string): boolean {
  return dayjs(value).isBefore(dayjs(), 'day');
}

export function isFutureDay(value: Date | string): boolean {
  return dayjs(value).isAfter(dayjs(), 'day');
}

export function startOfDay(value: Date | string): Date {
  return dayjs(value).startOf('day').toDate();
}

export function combineDateAndTimeToIso(params: {
  date: Date;
  time: Date;
}): string {
  const base = dayjs(params.date);
  const t = dayjs(params.time);
  return base
    .hour(t.hour())
    .minute(t.minute())
    .second(0)
    .millisecond(0)
    .toDate()
    .toISOString();
}

export function parseStrict(value: string, format: string): Date | null {
  const d = dayjs(value.trim(), format, true);
  return d.isValid() ? d.toDate() : null;
}

