import { apkUrl, compareVersions, parseVersionCheck } from '../UpdateChecker';
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

describe('parseVersionCheck', () => {
  it('legge la versione dal file check, con spazi e a capo', () => {
    expect(parseVersionCheck('2.0.1\n')).toBe('2.0.1');
    expect(parseVersionCheck('  3.3.1  ')).toBe('3.3.1');
  });

  it('rifiuta contenuti che non sono una versione', () => {
    expect(parseVersionCheck('<!doctype html><html>')).toBeNull();
    expect(parseVersionCheck('404: Not Found')).toBeNull();
    expect(parseVersionCheck('')).toBeNull();
    expect(parseVersionCheck('{"version": "2.0.0"}')).toBeNull();
  });
});

describe('apkUrl', () => {
  it('punta all\'APK della GitHub Release', () => {
    expect(apkUrl('2.0.1')).toBe(
      'https://github.com/alexis-82/SpesaSmart/releases/download/v2.0.1/spesasmart-2.0.1.apk',
    );
  });
});
