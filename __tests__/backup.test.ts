import { buildBackup, parseBackup, backupFileName, formatExportDate } from '../backup';
import { describe, expect, it } from '@jest/globals';

describe('backup', () => {
  const now = new Date(2026, 9, 19, 17, 54, 20);

  it('genera nome file e data nel formato della 1.4.0', () => {
    expect(backupFileName(now)).toBe('SpesaSmart_Backup_2026-10-19.json');
    expect(formatExportDate(new Date(2026, 0, 5))).toBe('05/01/2026');
  });

  it('crea un backup che si rilegge identico', () => {
    const backup = buildBackup('2.0.0', ['Latte', 'Pane'], ['Pane'], true, now);
    expect(backup.settings).toEqual({ keepAwakeEnabled: true, exportDate: '19/10/2026' });
    expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
  });

  it('legge un backup esportato dalla 1.4.0', () => {
    const text = JSON.stringify({
      version: '1.4.0',
      timestamp: '2026-10-19T15:54:20.846Z',
      products: ['Caffè', "Camoscio d'Oro"],
      shoppingList: ['Caffè'],
      settings: { keepAwakeEnabled: false, exportDate: '19/10/2026' },
    });
    const backup = parseBackup(text);
    expect(backup.products).toEqual(['Caffè', "Camoscio d'Oro"]);
    expect(backup.shoppingList).toEqual(['Caffè']);
    expect(backup.settings.keepAwakeEnabled).toBe(false);
  });

  it('accetta un backup senza impostazioni', () => {
    const backup = parseBackup(JSON.stringify({ products: [], shoppingList: [] }));
    expect(backup.settings).toEqual({ keepAwakeEnabled: false, exportDate: '' });
  });

  it('rifiuta file non validi', () => {
    expect(() => parseBackup('non json')).toThrow('JSON valido');
    expect(() => parseBackup('null')).toThrow('backup di SpesaSmart');
    expect(() => parseBackup('{"products":"x","shoppingList":[]}')).toThrow('prodotti');
    expect(() => parseBackup('{"products":[1],"shoppingList":[]}')).toThrow('prodotti');
  });
});
