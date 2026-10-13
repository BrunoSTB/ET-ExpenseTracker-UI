import { LocalDatePipe } from './local-date.pipe';
import { UserPreferences } from '../types/userPreferences';

describe('LocalDatePipe', () => {
  const pipe = new LocalDatePipe();
  const usd: UserPreferences = { currency: 'USD', locale: 'en-US' };

  it('should format with the preferences locale', () => {
    expect(pipe.transform('2026-10-05', usd)).toBe('Oct 5');
    expect(pipe.transform('2026-10-05', { currency: 'USD', locale: 'pt-BR' })).toBe(
      '5 de out.'
    );
  });

  it('should accept a format', () => {
    expect(pipe.transform('2026-10-05', usd, 'monthYear')).toBe('October 2026');
  });

  it('should render an empty string without a date', () => {
    expect(pipe.transform(null, usd)).toBe('');
    expect(pipe.transform(undefined, usd)).toBe('');
  });
});
