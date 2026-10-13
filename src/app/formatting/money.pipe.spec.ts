import { MoneyPipe } from './money.pipe';
import { UserPreferences } from '../types/userPreferences';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();
  const brl: UserPreferences = { currency: 'BRL', locale: 'pt-BR' };
  const usd: UserPreferences = { currency: 'USD', locale: 'en-US' };

  it('should format the value with the given preferences', () => {
    expect(pipe.transform(127.43, brl)).toBe('R$ 127,43');
    expect(pipe.transform(127.43, usd)).toBe('$127.43');
  });

  it('should render a dash when there is no value', () => {
    expect(pipe.transform(null, brl)).toBe('R$ —');
    expect(pipe.transform(undefined, usd)).toBe('$—');
  });
});
