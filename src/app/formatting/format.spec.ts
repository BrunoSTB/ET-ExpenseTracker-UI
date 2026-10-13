import {
  formatCurrency,
  formatDate,
  formatMissingCurrency,
  formatMonth,
  parseIsoDate,
  toIsoDate,
} from './format';
import { UserPreferences } from '../types/userPreferences';

// Intl separates the currency symbol with a non-breaking space.
const NBSP = ' ';

describe('format helpers', () => {
  const brl: UserPreferences = { currency: 'BRL', locale: 'pt-BR' };
  const usd: UserPreferences = { currency: 'USD', locale: 'en-US' };

  describe('parseIsoDate', () => {
    it('should parse yyyy-MM-dd as a local date', () => {
      const date = parseIsoDate('2026-10-05');

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(9);
      expect(date.getDate()).toBe(5);
      expect(date.getHours()).toBe(0);
    });
  });

  describe('toIsoDate', () => {
    it('should format the local date as yyyy-MM-dd', () => {
      expect(toIsoDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
      expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('should round-trip with parseIsoDate', () => {
      expect(toIsoDate(parseIsoDate('2026-10-05'))).toBe('2026-10-05');
    });
  });

  describe('formatCurrency', () => {
    it('should format with the user currency and locale', () => {
      expect(formatCurrency(1234.5, brl)).toBe(`R$${NBSP}1.234,50`);
      expect(formatCurrency(1234.5, usd)).toBe('$1,234.50');
    });

    it('should follow the locale, not the currency, for separators', () => {
      expect(formatCurrency(1234.5, { currency: 'BRL', locale: 'en-US' })).toBe(
        'R$1,234.50'
      );
    });

    it('should format zero', () => {
      expect(formatCurrency(0, brl)).toBe(`R$${NBSP}0,00`);
    });
  });

  describe('formatMissingCurrency', () => {
    it('should replace the number with a single dash', () => {
      expect(formatMissingCurrency(brl)).toBe(`R$${NBSP}—`);
      expect(formatMissingCurrency(usd)).toBe('$—');
    });
  });

  describe('formatDate', () => {
    it('should format day and month by default', () => {
      expect(formatDate('2026-10-05', 'pt-BR')).toBe('5 de out.');
      expect(formatDate('2026-10-05', 'en-US')).toBe('Oct 5');
    });

    it('should not shift ISO dates to the previous day', () => {
      expect(formatDate('2026-10-01', 'en-US')).toBe('Oct 1');
    });

    it('should accept Date objects', () => {
      expect(formatDate(new Date(2026, 9, 5), 'en-US')).toBe('Oct 5');
    });

    it('should support month and year formats', () => {
      expect(formatDate('2026-10-05', 'pt-BR', 'monthYear')).toBe(
        'outubro de 2026'
      );
      expect(formatDate('2026-10-05', 'en-US', 'monthLong')).toBe('October');
    });
  });

  describe('formatMonth', () => {
    it('should name a 1-based month', () => {
      expect(formatMonth(1, 'en-US')).toBe('Jan');
      expect(formatMonth(12, 'en-US', 'monthLong')).toBe('December');
      expect(formatMonth(10, 'pt-BR')).toBe('out.');
    });
  });
});
