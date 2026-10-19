# SpesaSmart — Build, firma e rilascio

## Versioni

`eas.json` usa `appVersionSource: "local"`: **le versioni si cambiano a mano in `app.json`**, e EAS le usa così come sono.

| Campo | Dove | Regola |
|---|---|---|
| `expo.version` | `app.json` | versione visibile (`versionName`), es. `2.0.0` |
| `expo.android.versionCode` | `app.json` | intero, **sempre maggiore** del rilascio precedente (1.3.1 = 7, 2.0.0 = 8) |

A ogni rilascio aumenta entrambi i campi.

## Profili EAS (`eas.json`)

| Profilo | Output | Uso |
|---|---|---|
| `development` | APK con development client (`expo-dev-client`) | sviluppo su telefono senza Expo Go: `eas build -p android --profile development`, poi `npx expo start` |
| `preview` | APK | **la build da pubblicare su alexis82.it** |
| `production` | AAB | solo per un eventuale Play Store (fuori scope per ora) |

## Firma (opzione B: keystore nuovo)

Dalla 2.0.0 l'app è firmata con un **keystore release nuovo, gestito da EAS**. Il vecchio `debug.keystore` non si usa più per i rilasci. Ne esiste una copia di backup in `C:\Users\Alessio\SpesaSmart-backup\`.

### Prima build: generazione del keystore

```bash
eas build -p android --profile preview
```

Alla domanda *"Generate a new Android Keystore?"* rispondi **sì**. EAS crea il keystore e lo conserva sui suoi server, associato a `@serse82/spesasmart`. Tutte le build successive (`preview` e `production`) useranno automaticamente la stessa chiave.

### Backup del keystore (da fare subito dopo la prima build)

Se perdi il keystore, non potrai più pubblicare aggiornamenti installabili sopra quelli esistenti.

```bash
eas credentials -p android
```

Scegli il profilo, poi **Keystore → Download existing keystore**. Ottieni un file `.jks` e le relative password (store password, key alias, key password). Conservali **fuori dal repo**, ad esempio in un password manager. `.gitignore` esclude già `*.jks`, `*.keystore`, `*.p12`, `credentials.json` e `.env`.

## Build locale senza EAS

Requisiti: Android SDK (Android Studio) e JDK 17.

```bash
npx expo prebuild -p android --clean
cd android
./gradlew assembleRelease
```

L'APK generato è in `android/app/build/outputs/apk/release/app-release.apk`.

**Attenzione:** il template generato da `prebuild` firma la release con il `debug.keystore` standard, cioè la stessa chiave della 1.3.1. Va benissimo per i test, ad esempio per il test di migrazione dei dati in `docs/TEST-MANUALE.md`. **Non pubblicare questo APK**: va ri-firmato con il keystore release scaricato da EAS.

Le password si passano con variabili d'ambiente, mai scritte in file del repo. In PowerShell:

```powershell
$env:SPESASMART_KS_PASS  = "<store password>"
$env:SPESASMART_KEY_PASS = "<key password>"
& "$env:ANDROID_HOME\build-tools\<versione>\apksigner.bat" sign `
  --ks C:\percorso\fuori\dal\repo\spesasmart-release.jks `
  --ks-key-alias <key alias> `
  --ks-pass env:SPESASMART_KS_PASS `
  --key-pass env:SPESASMART_KEY_PASS `
  --out spesasmart.apk `
  android\app\build\outputs\apk\release\app-release.apk
& "$env:ANDROID_HOME\build-tools\<versione>\apksigner.bat" verify --print-certs spesasmart.apk
```

Lo SHA-256 stampato da `verify` deve coincidere con quello mostrato da `eas credentials`.

## Pubblicazione su alexis82.it

L'UpdateChecker dell'app legge `https://www.alexis82.it/version.json` e, se trova una versione più alta di quella installata, propone di scaricare `https://www.alexis82.it/spesasmart.apk`.

Ad ogni rilascio:

1. aggiorna `version` e `versionCode` in `app.json` e committa;
2. `eas build -p android --profile preview`, poi scarica l'APK dal link mostrato da EAS;
3. carica l'APK sul sito come **`spesasmart.apk`**, sostituendo il precedente;
4. **solo dopo**, carica `version.json` con la nuova versione. Usa come modello `release/version.json`:
   ```json
   { "version": "2.0.0" }
   ```
   L'app legge solo il campo `version`. L'ordine conta: se pubblichi prima `version.json`, gli utenti scaricano ancora l'APK vecchio.

### ⚠️ Rilascio 2.0.0: utenti della 1.3.1

Pubblicando `version.json` con `2.0.0`, chi ha la 1.3.1 vedrà l'avviso "Aggiornamento Disponibile" e scaricherà la 2.0.0. **L'installazione sopra la 1.3.1 fallirà** ("App non installata"), perché la firma è cambiata (opzione B).

Prima di pubblicare `version.json`, avvisa gli utenti, per esempio con una nota sulla pagina di download:

> Per installare la versione 2.0.0 devi prima **disinstallare** SpesaSmart 1.3.1. La lista e i prodotti salvati andranno persi: annotali prima di disinstallare.

Dalla 2.0.0 in poi gli aggiornamenti si installano normalmente, conservando i dati.
