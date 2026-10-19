import { compareVersions } from '../UpdateChecker';
import { describe, expect, it } from '@jest/globals';

describe('compareVersions', () => {
  it('riconosce versioni uguali', () => {
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
  });

  it('riconosce una versione maggiore o minore', () => {
    expect(compareVersions('2.0.1', '2.0.0')).toBe(1);
    expect(compareVersions('1.3.1', '2.0.0')).toBe(-1);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
  });

  it('gestisce un numero diverso di segmenti', () => {
    expect(compareVersions('2.0', '2.0.0')).toBe(0);
    expect(compareVersions('2.0', '2.0.1')).toBe(-1);
    expect(compareVersions('2.0.1', '2.0')).toBe(1);
    expect(compareVersions('2', '1.9.9')).toBe(1);
  });
});
