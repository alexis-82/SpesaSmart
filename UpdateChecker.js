// UpdateChecker.js
import React, { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const UpdateChecker = () => {
  const VERSION_CHECK_URL = __DEV__ 
    ? 'https://www.alexis82.it/version.json?t=' + Date.now() // Aggiunge timestamp per dev
    : 'https://www.alexis82.it/version.json';
  
  const compareVersions = (v1, v2) => {
    console.log(`Confronto versioni: ${v1} con ${v2}`);
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < parts1.length; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  };

  const checkUpdate = async () => {
    try {
      console.log('Inizio controllo aggiornamenti...');
      const currentVersion = DeviceInfo.getVersion();
      console.log('Versione corrente app:', currentVersion);
      
      console.log('Fetching versione dal server...');
      console.log('URL richiesta:', VERSION_CHECK_URL);
      const response = await fetch(VERSION_CHECK_URL, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      console.log('Headers risposta:', response.headers);
      const responseText = await response.text();
      console.log('Risposta grezza:', responseText);
      
      let versionInfo;
      try {
        versionInfo = JSON.parse(responseText);
      } catch (e) {
        console.error('Errore parsing JSON:', e);
        return;
      }
      
      console.log('Version dal server:', versionInfo.version);
      console.log('Version corrente:', currentVersion);
      
      const comparison = compareVersions(versionInfo.version, currentVersion);
      console.log('Risultato confronto:', comparison);
      
      if (comparison > 0) {
        console.log('Nuova versione disponibile, mostro alert');
        Alert.alert(
          'Aggiornamento Disponibile',
          `È disponibile la versione ${versionInfo.version} dell'app.\n\nLa tua versione attuale è ${currentVersion}.\n\nVuoi aggiornare ora?`,
          [
            {
              text: 'Non ora',
              style: 'cancel',
              onPress: () => console.log('Aggiornamento rifiutato')
            },
            {
              text: 'Aggiorna',
              onPress: () => {
                console.log('Utente ha accettato aggiornamento');
                if (Platform.OS === 'android') {
                  Linking.openURL('https://www.alexis82.it/spesasmart.apk');
                }
              }
            }
          ]
        );
      } else {
        console.log('Nessun aggiornamento disponibile');
      }
    } catch (error) {
      console.error('Errore completo:', error);
      console.error('Stack trace:', error.stack);
    }
  };

  useEffect(() => {
    console.log('UpdateChecker montato, avvio primo controllo');
    checkUpdate();
    
    const interval = setInterval(() => {
      console.log('Eseguo controllo periodico');
      checkUpdate();
    }, 60000); // Controllo ogni minuto per debug, poi aumentare a 3600000
    
    return () => {
      console.log('UpdateChecker smontato, pulisco interval');
      clearInterval(interval);
    };
  }, []);

  return null;
};

export default UpdateChecker;