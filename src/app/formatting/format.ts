import { UserPreferences } from "../types/userPreferences";

// Formatting helpers driven by the user's preferences (currency and locale),
// not by the UI language. Pure functions, so they are easy to test and reuse
// from pipes and components.

export type DateFormat = "dayMonth" | "monthShort" | "monthLong" | "monthYear";

const DATE_FORMATS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  dayMonth: { day: "numeric", month: "short" },
  monthShort: { month: "short" },
  monthLong: { month: "long" },
  monthYear: { month: "long", year: "numeric" },
};

const currencyFormats = new Map<string, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function currencyFormat({ locale, currency }: UserPreferences) {
  const key = `${locale}|${currency}`;
  let format = currencyFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, { style: "currency", currency });
    currencyFormats.set(key, format);
  }
  return format;
}

function dateFormat(locale: string, format: DateFormat) {
  const key = `${locale}|${format}`;
  let result = dateFormats.get(key);
  if (!result) {
    result = new Intl.DateTimeFormat(locale, DATE_FORMATS[format]);
    dateFormats.set(key, result);
  }
  return result;
}

// Parses an ISO `yyyy-MM-dd` date (server `DateOnly`) as a local date.
// `new Date("2026-10-05")` would be UTC midnight and can show the previous day.
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// The local calendar date as ISO `yyyy-MM-dd`, the inverse of parseIsoDate.
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatCurrency(value: number, preferences: UserPreferences) {
  return currencyFormat(preferences).format(value);
}

// The currency symbol with a dash in place of the number, e.g. "R$ —",
// for bills that have neither a value nor an estimate.
export function formatMissingCurrency(preferences: UserPreferences) {
  let dashAdded = false;
  return currencyFormat(preferences)
    .formatToParts(0)
    .map((part) => {
      if (
        part.type === "integer" ||
        part.type === "group" ||
        part.type === "decimal" ||
        part.type === "fraction"
      ) {
        if (dashAdded) {
          return "";
        }
        dashAdded = true;
        return "—";
      }
      return part.value;
    })
    .join("");
}

export function formatDate(
  date: string | Date,
  locale: string,
  format: DateFormat = "dayMonth"
) {
  const parsed = typeof date === "string" ? parseIsoDate(date) : date;
  return dateFormat(locale, format).format(parsed);
}

// Name of a 1-based month, e.g. formatMonth(10, "pt-BR") === "out.".
export function formatMonth(
  month: number,
  locale: string,
  format: "monthShort" | "monthLong" = "monthShort"
) {
  return formatDate(new Date(2000, month - 1, 1), locale, format);
}
