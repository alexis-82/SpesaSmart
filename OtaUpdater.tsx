// OtaUpdater.tsx
// Aggiornamenti OTA (EAS Update): li scarica all'avvio e al ritorno in primo piano,
// poi chiede se riavviare subito per applicarli.
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Updates from 'expo-updates';

const log = (...args: unknown[]) => {
  if (__DEV__) {
    console.log('[OtaUpdater]', ...args);
  }
};

const OtaUpdater = () => {
  const { isUpdatePending, downloadedUpdate } = Updates.useUpdates();
  // Id dell'aggiornamento per cui è già stato mostrato l'avviso
  const notifiedUpdateId = useRef<string | null>(null);

  useEffect(() => {
    // Nella development build e in Expo Go gli aggiornamenti OTA sono disattivati
    if (!Updates.isEnabled) return;

    const checkUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
        }
      } catch (error) {
        log('controllo aggiornamenti OTA fallito:', error);
      }
    };

    checkUpdate();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkUpdate();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const updateId = downloadedUpdate?.updateId ?? null;
    if (!isUpdatePending || !updateId || notifiedUpdateId.current === updateId) return;
    notifiedUpdateId.current = updateId;

    Alert.alert(
      'Aggiornamento pronto',
      'È stata scaricata una nuova versione dell\'app. Vuoi riavviarla ora per applicarla?\n\n' +
        'Se scegli "Più tardi", verrà applicata alla prossima apertura.',
      [
        { text: 'Più tardi', style: 'cancel' },
        {
          text: 'Riavvia ora',
          onPress: () => {
            Updates.reloadAsync().catch(error => log('riavvio fallito:', error));
          },
        },
      ],
    );
  }, [isUpdatePending, downloadedUpdate]);

  return null;
};

export default OtaUpdater;
