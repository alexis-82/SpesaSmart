// UpdateChecker.tsx
import { useEffect, useRef } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';

const VERSION_CHECK_URL = 'https://www.alexis82.it/version.json';
const APK_URL = 'https://www.alexis82.it/spesasmart.apk';
const FETCH_TIMEOUT_MS = 10000;

const log = (...args: unknown[]) => {
  if (__DEV__) {
    console.log('[UpdateChecker]', ...args);
  }
};

// Confronta due versioni "x.y.z": 1 se v1 > v2, -1 se v1 < v2, 0 se uguali.
// I segmenti mancanti valgono 0 (es. "2.0" == "2.0.0").
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = v2.split('.').map(n => parseInt(n, 10) || 0);
  const length = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < length; i++) {
    const a = parts1[i] ?? 0;
    const b = parts2[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
};

const UpdateChecker = () => {
  // Evita di mostrare l'alert più volte se è già aperto
  const alertVisible = useRef(false);

  const checkUpdate = async () => {
    if (alertVisible.current) return;

    const currentVersion = Application.nativeApplicationVersion;
    if (!currentVersion) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const url = __DEV__ ? `${VERSION_CHECK_URL}?t=${Date.now()}` : VERSION_CHECK_URL;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      const versionInfo: { version?: unknown } = JSON.parse(await response.text());
      if (typeof versionInfo.version !== 'string') {
        log('version.json senza campo "version" valido');
        return;
      }

      log(`server ${versionInfo.version}, app ${currentVersion}`);

      if (compareVersions(versionInfo.version, currentVersion) > 0) {
        alertVisible.current = true;
        Alert.alert(
          'Aggiornamento Disponibile',
          `È disponibile la versione ${versionInfo.version} dell'app.\n\nLa tua versione attuale è ${currentVersion}.\n\nVuoi aggiornare ora?`,
          [
            {
              text: 'Non ora',
              style: 'cancel',
              onPress: () => {
                alertVisible.current = false;
              },
            },
            {
              text: 'Aggiorna',
              onPress: () => {
                alertVisible.current = false;
                if (Platform.OS === 'android') {
                  Linking.openURL(APK_URL);
                }
              },
            },
          ],
          {
            onDismiss: () => {
              alertVisible.current = false;
            },
          }
        );
      }
    } catch (error) {
      log('controllo aggiornamenti fallito:', error);
    } finally {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    // Un controllo all'avvio e uno a ogni ritorno in foreground
    checkUpdate();

    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', nextState => {
      if (previousState?.match(/inactive|background/) && nextState === 'active') {
        checkUpdate();
      }
      previousState = nextState;
    });

    return () => subscription.remove();
  }, []);

  return null;
};

export default UpdateChecker;
