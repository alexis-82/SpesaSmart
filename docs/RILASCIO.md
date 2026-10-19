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

## Lock file e npm

I server EAS e le GitHub Actions installano le dipendenze con `npm ci` e **npm 10**. npm 11 a volte non registra nel `package-lock.json` alcune dipendenze opzionali (es. `@emnapi/core`), e la build fallisce con `npm ci can only install packages when your package.json and package-lock.json are in sync`.

Dopo ogni `npx expo install …` o modifica alle dipendenze, prima di committare:

```bash
npx -y npm@10 install --package-lock-only --ignore-scripts
npx -y npm@10 ci --dry-run --ignore-scripts
```

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
2. crea e pubblica il tag (`git tag v2.0.1 && git push origin v2.0.1`): la GitHub Action **Build APK** compila e allega `spesasmart-2.0.1.apk` alla Release `v2.0.1`. In alternativa, da terminale: `eas build -p android --profile preview`;
3. carica l'APK sul sito come **`spesasmart.apk`** (rinominandolo), sostituendo il precedente;
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

## GitHub Actions

Due workflow in `.github/workflows/`, entrambi basati su EAS.

### Configurazione (una volta sola)

1. Su [expo.dev](https://expo.dev) → *Account settings → Access tokens* crea un token (es. `github-actions`).
2. Su GitHub → *Settings → Secrets and variables → Actions* aggiungi il secret **`EXPO_TOKEN`** con quel valore.
3. La prima build `preview` va lanciata **da terminale** (`eas build -p android --profile preview`) per generare il keystore: le Action girano in modalità non interattiva e non possono crearlo.

### Build APK (`build-apk.yml`)

- Parte a ogni tag `v*` (es. `v2.0.1`) oppure a mano da *Actions → Build APK → Run workflow*.
- Con un tag, controlla che corrisponda a `expo.version` in `app.json`.
- Compila con il profilo `preview` sui server EAS e allega **`spesasmart-<versione>.apk`** alla GitHub Release `v<versione>` (creata se non esiste, altrimenti l'APK viene sostituito).

## Aggiornamenti OTA (EAS Update)

L'app contiene `expo-updates`: all'avvio controlla se c'è un aggiornamento sul canale `production`, lo scarica in background e lo applica **al successivo avvio**. Gli APK `preview` e `production` sono sul canale `production`; la development build su `development`.

### Cosa si può aggiornare via OTA

Solo **JavaScript e asset** (codice in `App.tsx`, `UpdateChecker.tsx`, `backup.ts`, testi, stili, immagini). Tutto il resto richiede un nuovo APK:

- aggiunta, rimozione o aggiornamento di moduli nativi (`npx expo install …`);
- aggiornamento della SDK di Expo o di React Native;
- modifiche ad `app.json`: permessi, icona, nome, plugin, `versionCode`.

### Compatibilità (`runtimeVersion` = `appVersion`)

Un aggiornamento OTA arriva solo agli APK con la **stessa `version`** di `app.json`. Regola pratica: **se cambi qualcosa di nativo, alza `version` e `versionCode` e rilascia un nuovo APK**. Gli aggiornamenti successivi arriveranno solo a chi ha installato quell'APK.

### Pubblicazione automatica (`eas-update.yml`)

A ogni push su `main` il workflow:

1. si **blocca** se il push modifica `package.json`, `app.json` o `eas.json` senza cambiare `version` (probabile modifica nativa: serve un nuovo APK). Se sei sicuro che la modifica sia solo JavaScript, lancia il workflow a mano da *Actions → Aggiornamento OTA → Run workflow*: il controllo viene saltato;
2. esegue `tsc` e i test;
3. pubblica con `eas update --channel production`, usando come messaggio la prima riga del commit.

Da terminale, lo stesso aggiornamento si pubblica con:

```bash
eas update --channel production --platform android --environment production --message "descrizione"
```

### Annullare un aggiornamento sbagliato

```bash
eas update:list --branch production
eas update:republish --group <id del gruppo precedente buono>
```

Gli utenti ricevono la versione ripubblicata al prossimo avvio e la vedono applicata a quello successivo.
