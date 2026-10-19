// Formato del file di backup, compatibile con quello esportato dalla 1.4.0
export type BackupData = {
  version: string;
  timestamp: string;
  products: string[];
  shoppingList: string[];
  settings: {
    keepAwakeEnabled: boolean;
    exportDate: string;
  };
};

const pad = (n: number): string => n.toString().padStart(2, '0');

// Data in formato GG/MM/AAAA, come nei backup della 1.4.0
export const formatExportDate = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

export const backupFileName = (date: Date): string =>
  `SpesaSmart_Backup_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;

export const buildBackup = (
  version: string,
  products: string[],
  shoppingList: string[],
  keepAwakeEnabled: boolean,
  now: Date = new Date(),
): BackupData => ({
  version,
  timestamp: now.toISOString(),
  products,
  shoppingList,
  settings: {
    keepAwakeEnabled,
    exportDate: formatExportDate(now),
  },
});

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

// Legge e valida il contenuto di un file di backup. Lancia un Error con un messaggio
// mostrabile all'utente se il file non è un backup valido.
export const parseBackup = (text: string): BackupData => {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Il file non è un JSON valido.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Il file non è un backup di SpesaSmart.');
  }
  if (!isStringArray(data.products) || !isStringArray(data.shoppingList)) {
    throw new Error('Il file non contiene prodotti e lista della spesa validi.');
  }

  return {
    version: typeof data.version === 'string' ? data.version : '',
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : '',
    products: data.products,
    shoppingList: data.shoppingList,
    settings: {
      keepAwakeEnabled: data.settings?.keepAwakeEnabled === true,
      exportDate: typeof data.settings?.exportDate === 'string' ? data.settings.exportDate : '',
    },
  };
};
