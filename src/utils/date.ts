import {
  addMonths,
  endOfMonth,
  format,
  getDate,
  isAfter,
  isBefore,
  isSameDay,
  parse,
  startOfDay,
  startOfMonth,
} from "date-fns";

const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";
const STORAGE_DATE_FORMAT = "yyyy-MM-dd";

export function parseDisplayDate(value: string) {
  return parse(value, DISPLAY_DATE_FORMAT, new Date());
}

export function parseStorageDate(value: string) {
  return parse(value, STORAGE_DATE_FORMAT, new Date());
}

export function toStorageDate(value: Date) {
  return format(value, STORAGE_DATE_FORMAT);
}

export function toDisplayDate(value: string | Date) {
  const date = typeof value === "string" ? parseStorageDate(value) : value;
  return format(date, DISPLAY_DATE_FORMAT);
}

export function todayStorageDate() {
  return toStorageDate(new Date());
}

export function isPastDate(date: string, compareDate = todayStorageDate()) {
  return isBefore(startOfDay(parseStorageDate(date)), startOfDay(parseStorageDate(compareDate)));
}

export function isFutureOrToday(date: string, compareDate = todayStorageDate()) {
  return !isPastDate(date, compareDate);
}

export function isSameStorageDay(left: string, right: string) {
  return isSameDay(parseStorageDate(left), parseStorageDate(right));
}

export function monthStart(date: string | Date) {
  const value = typeof date === "string" ? parseStorageDate(date) : date;
  return startOfMonth(value);
}

export function monthEnd(date: string | Date) {
  const value = typeof date === "string" ? parseStorageDate(date) : date;
  return endOfMonth(value);
}

export function shiftMonth(date: string | Date, offset: number) {
  const value = typeof date === "string" ? parseStorageDate(date) : date;
  return addMonths(value, offset);
}

export function buildMonthlyOccurrenceDate(monthDate: Date, day: number) {
  const maxDay = getDate(endOfMonth(monthDate));
  const safeDay = Math.min(day, maxDay);
  return toStorageDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), safeDay));
}

export function isMonthOnOrAfter(startDate: string, targetDate: string) {
  const start = monthStart(startDate);
  const target = monthStart(targetDate);
  return !isAfter(start, target);
}
