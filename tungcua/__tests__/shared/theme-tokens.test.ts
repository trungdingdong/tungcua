import { describe, expect, it } from '@jest/globals';
import { themeTokens } from '../../src/shared/theme/tokens';

describe('themeTokens', () => {
  it('re-exports the Tailwind colour token names', () => {
    expect(themeTokens.colors.bg.base).toBe('bg-base');
    expect(themeTokens.colors.mint.ink).toBe('mint-ink');
    expect(themeTokens.colors.pink.surface).toBe('pink-surface');
    expect(themeTokens.colors.lowConfidenceUnderline).toBe('pink-ink');
  });

  it('re-exports the font family token names', () => {
    expect(themeTokens.fontFamily.sans).toBe('font-sans');
    expect(themeTokens.fontFamily.rounded).toBe('font-rounded');
  });
});
