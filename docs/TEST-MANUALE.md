# SpesaSmart 2.0.0 — Test manuale

Checklist da eseguire dopo la migrazione a Expo, su **telefono fisico** e su **emulatore**.

## Quale build usare

| Build | Come si ottiene | Adatta per |
|---|---|---|
| Expo Go | `npx expo start` → QR code | tutte le voci tranne versione e UpdateChecker (vedi nota) |
| Development build | `npx expo run:android` | tutte le voci |
| Release locale | `npx expo prebuild -p android` + `cd android && ./gradlew assembleRelease` | test di migrazione dati (firma = `debug.keystore`, uguale alla 1.3.1) |
| Preview EAS | `eas build -p android --profile preview` | verifica finale dell'APK da pubblicare (firma **nuova**) |

> **Nota Expo Go:** `expo-application` restituisce la versione di *Expo Go*, non quella di SpesaSmart.
> In Expo Go la schermata Info e l'UpdateChecker mostrano quindi un numero che non è "2.0.0": è normale.

## Collegare il telefono con il debug USB

### Sul PC (una volta sola)
1. Installa **Android Studio**. Al primo avvio lascia installare l'SDK nel percorso predefinito (`C:\Users\Alessio\AppData\Local\Android\Sdk`, già impostato in `ANDROID_HOME`).
2. In *SDK Manager → SDK Tools* verifica che siano installati **Android SDK Platform-Tools** e **Android SDK Build-Tools**.
3. In un terminale nuovo, controlla che `adb version` risponda. La cartella `platform-tools` è già nel PATH.

### Sul telefono
1. *Impostazioni → Info sul telefono* → tocca **Numero build** 7 volte per attivare le *Opzioni sviluppatore*.
2. *Opzioni sviluppatore* → attiva **Debug USB**.
3. Collega il cavo USB e, se richiesto, scegli la modalità *Trasferimento file*.
4. Sul telefono compare *"Consentire il debug USB?"* → spunta *Consenti sempre da questo computer* → **OK**.
5. Sul PC, `adb devices` deve mostrare il dispositivo come `device`. Se compare `unauthorized`, sblocca il telefono e accetta il popup. Se non compare affatto, installa il driver USB del produttore (Samsung, Xiaomi…).

### Avviare l'app sul telefono
- **Development build locale** (consigliata): `npx expo run:android`. Compila, installa sul telefono collegato e avvia Metro; il collegamento via USB (`adb reverse`) è configurato in automatico.
- **Expo Go**: `npx expo start` e scansiona il QR (telefono e PC sulla stessa rete Wi-Fi). Oppure via USB: `adb reverse tcp:8081 tcp:8081`, poi `npx expo start --localhost` e premi `a`.

> La 1.3.1 è installata sul telefono? `npx expo run:android` installa una build di debug firmata con la stessa chiave della 1.3.1, quindi la installerebbe *sopra*, conservando i dati. Se vuoi tenere intatta la 1.3.1 per il test di migrazione, esegui quel test prima, oppure usa un emulatore.

## Checklist funzionale

Per ogni voce, confronta con il comportamento della 1.3.1.

### Prodotti — Ricerca
Il campo in alto serve sia a cercare sia ad aggiungere.
- [ ] Scrivendo, l'elenco si filtra a ogni lettera; sotto il campo compare "N prodotti trovati".
- [ ] La ricerca trova anche parti di parola ("moz" → Mozzarella) e ignora maiuscole e accenti ("caffe" → Caffè).
- [ ] Nessun risultato → "Nessun prodotto trovato: premi Aggiungi per crearlo".
- [ ] Se il nome scritto esiste già (anche con maiuscole o accenti diversi), **Aggiungi** è disattivato (azzurro chiaro).
- [ ] La **X** grigia nel campo svuota la ricerca e torna l'elenco completo.
- [ ] Con la tastiera aperta, un tocco su un risultato lo mette subito in lista.
- [ ] La **X** rossa su un risultato filtrato elimina **quel** prodotto, non un altro.
- [ ] Il tasto ✓ della tastiera equivale ad **Aggiungi**.

### Prodotti
- [ ] Aggiungere un prodotto: scrivere un nome e premere **Aggiungi** → compare in elenco, in ordine alfabetico.
- [ ] Un prodotto appena aggiunto finisce anche nella Lista della Spesa (comportamento attuale della 1.3.1).
- [ ] Un nome vuoto o di soli spazi non viene aggiunto.
- [ ] Rimuovere un prodotto con il pulsante rosso **X**.
- [ ] Toccare un prodotto non in lista → viene aggiunto alla Lista della Spesa e diventa grigio con "(Già in lista)".
- [ ] Un prodotto "(Già in lista)" non è toccabile.

> L'app non ha una funzione di *modifica* del nome di un prodotto: si rimuove e si riaggiunge.

### Lista della Spesa
- [ ] Gli elementi aggiunti da Prodotti compaiono nella lista.
- [ ] Rimuovere un elemento con **X** → sparisce; tornando in Prodotti, quel prodotto non è più grigio.
- [ ] Lista vuota → testo "Nessun prodotto nella lista".
- [ ] Non c'è più il pulsante **Esci** in basso (rimosso nella 2.0.0).

### Aspetto
- [ ] Con il telefono in **tema scuro** di sistema, l'app resta chiara e i pulsanti della barra di navigazione (◀ ● ■) sono **scuri e ben visibili**.
- [ ] Anche i popup (Importa backup, aggiornamento) e lo switch restano in tema chiaro.

> L'app non ha una "spunta" degli elementi: si rimuovono con **X**.

### Persistenza
- [ ] Inserire prodotti ed elementi in lista, chiudere l'app **completamente** (dalle app recenti, scorrendo via), riaprirla → i dati ci sono ancora.
- [ ] Stessa prova dopo un riavvio del telefono.

### Navigazione (drawer)
- [ ] Apertura del menu con il pulsante ☰ in alto a sinistra.
- [ ] Apertura del menu con uno swipe dal bordo sinistro.
- [ ] Le 4 voci (Lista della Spesa, Prodotti, Impostazioni, Informazioni) hanno le icone e portano alla schermata giusta.
- [ ] Il titolo in alto corrisponde alla schermata.

### Tasto indietro di Android
L'app non gestisce il tasto indietro in modo personalizzato: valgono i comportamenti standard di React Navigation.
- [ ] Con il menu aperto → il menu si chiude.
- [ ] Da Prodotti, Impostazioni o Info → si torna a Lista della Spesa.
- [ ] Da Lista della Spesa → l'app va in background.

### Impostazioni — Backup & Ripristino
Il file di backup ha lo stesso formato della 1.4.0 (`version`, `timestamp`, `products`, `shoppingList`, `settings`). Per avere un file sul telefono: `adb push SpesaSmart_Backup_AAAA-MM-GG.json /sdcard/Download/` (da PowerShell, non da Git Bash).
- [ ] **Esporta Backup** apre il menu Condividi con il file `SpesaSmart_Backup_AAAA-MM-GG.json`; salvandolo (Drive, email, *Salva in File*) il contenuto corrisponde ai dati dell'app.
- [ ] **Importa Backup** → scegliere il file → compare la conferma con data, numero di prodotti ed elementi in lista.
  - [ ] **Annulla** non cambia nulla.
  - [ ] **Importa** sostituisce prodotti, lista e impostazione dello standby; compare "Backup importato".
  - [ ] Tornando su Prodotti e Lista della Spesa si vedono subito i dati importati, senza riavviare l'app.
- [ ] Import di un backup esportato dalla **1.4.0** → tutti i prodotti e la lista arrivano correttamente (anche nomi con accenti e apostrofi).
- [ ] Import di un file che non è un backup (es. una foto o un `.txt`) → messaggio di errore, dati invariati.
- [ ] Chiudere il selettore file senza scegliere nulla → nessun messaggio, dati invariati.
- [ ] Esporta → Importa lo stesso file → i dati restano identici.

### Impostazioni — Standby
- [ ] Lo switch **Mantieni schermo acceso** è ben visibile sia spento (binario grigio) sia acceso (binario azzurro).
- [ ] Acceso → lo schermo non si spegne oltre il timeout di sistema mentre l'app è aperta.
- [ ] Spento → lo schermo si spegne normalmente.
- [ ] L'impostazione resta dopo la chiusura completa e la riapertura dell'app.

### Info e versione
- [ ] La schermata Info mostra **"Versione 2.0.0"** (development build o APK, non Expo Go).
- [ ] Contatti e descrizione come nella 1.3.1.

### UpdateChecker
Il file `spesasmart/check` in [alexis-82/software-updates](https://github.com/alexis-82/software-updates) è letto all'avvio e a ogni ritorno dell'app in primo piano.
- [ ] Con `check` **uguale** alla versione installata (`2.0.0`) → nessun avviso.
- [ ] Con `check` **più alto** (es. `2.0.1`) → compare "Aggiornamento Disponibile".
  - [ ] **Non ora** chiude l'avviso.
  - [ ] **Aggiorna** apre nel browser il download di `spesasmart-<versione>.apk` dalla GitHub Release.
  - [ ] Mettendo l'app in background e riaprendola, l'avviso ricompare una sola volta (non due sovrapposti).
- [ ] Senza connessione → nessun errore visibile, l'app funziona normalmente.

Per provare la versione più alta **senza toccare software-updates** (lo leggono gli utenti reali):
1. crea in una cartella qualsiasi un file `check` che contiene solo `2.0.1` e servilo con `npx http-server -p 8080`;
2. `adb reverse tcp:8080 tcp:8080`;
3. in `UpdateChecker.tsx` cambia **solo in locale** `VERSION_CHECK_URL` in `http://localhost:8080/check`. Non committare la modifica. In una release, Android blocca l'HTTP in chiaro: usa una development build;
4. ripristina il file con `git checkout UpdateChecker.tsx`.

Con `2.0.1` il pulsante **Aggiorna** punta a una Release che non esiste ancora: è normale che il download fallisca. Per provare anche il download usa una versione già rilasciata più alta di quella installata.

### Aggiornamento OTA
Solo con un APK `preview` (nella development build gli OTA sono disattivati). Pubblica una piccola modifica visibile, es. un testo, con `npx eas-cli update --channel production --platform android --environment production --message "test"`.
- [ ] Riaprendo l'app (o tornandoci dopo averla messa in background) compare **"Aggiornamento pronto"**.
- [ ] **Riavvia ora** → l'app si riavvia e mostra la modifica.
- [ ] **Più tardi** → nessun cambiamento; alla prossima apertura completa la modifica è applicata e il popup non ricompare.
- [ ] Senza connessione → nessun errore visibile.

## Test di migrazione dei dati

Le chiavi AsyncStorage (`shoppingList`, `products`) e il loro formato (array di stringhe in JSON) non sono cambiati. Anche la libreria è la stessa (`@react-native-async-storage/async-storage`, passata dalla 2.0 alla 2.2), con lo stesso database interno.

È stata scelta l'**opzione B** (keystore nuovo per la 2.0.0). Bisogna quindi verificare due cose separate.

### 1. I dati sopravvivono all'aggiornamento (stessa firma)

La build release locale generata da `expo prebuild` è firmata con il `debug.keystore` standard di React Native. È lo stesso della 1.3.1 (SHA-256 `FA:C6:17:45:…:3B:9C`). Questo permette di simulare un aggiornamento "vero".

1. Disinstalla SpesaSmart dal dispositivo di prova: `adb uninstall com.spesasmart`.
2. Installa la 1.3.1: `adb install spesasmart-1.3.1.apk` (l'APK attuale del sito).
3. Aggiungi 3–4 prodotti e mettine 2 in lista. Chiudi l'app.
4. Genera la release locale della 2.0.0:
   ```bash
   npx expo prebuild -p android --clean
   cd android && ./gradlew assembleRelease
   ```
5. Installa **sopra**, senza disinstallare:
   `adb install -r android/app/build/outputs/apk/release/app-release.apk`
6. Apri l'app → prodotti e lista devono essere **ancora presenti**, e Info deve mostrare "Versione 2.0.0".

Se il punto 6 passa, il formato dei dati è compatibile. Anche i futuri aggiornamenti firmati con la chiave nuova (2.0.0 → 2.0.x) conserveranno i dati.

### 2. Comportamento reale per gli utenti (firma nuova)

1. Con la 1.3.1 installata e dei dati inseriti, prova a installare sopra l'APK **EAS preview** (firmato con la chiave nuova):
   `adb install -r spesasmart-2.0.0.apk`
2. Risultato atteso: errore `INSTALL_FAILED_UPDATE_INCOMPATIBLE` (da telefono: "App non installata" / "in conflitto con un pacchetto esistente").
3. Disinstalla la 1.3.1 e installa la 2.0.0 → l'app parte **vuota**: è la perdita di dati prevista con l'opzione B.
4. Aggiungi dei dati, poi installa sopra una seconda build EAS (es. 2.0.1, `versionCode` 9) → i dati restano.

Da comunicare agli utenti attuali: per passare alla 2.0.0 bisogna **disinstallare la 1.3.1** e annotarsi prima la lista.

### 3. Dati dalla 1.4.0 (backup)

La 1.4.0 usa un package diverso (`com.alexis82.spesasmart`): per Android è un'altra app, convive con la 2.0.0 e non può essere aggiornata. I dati passano solo tramite backup.

1. Nella 1.4.0: *Impostazioni → Esporta Backup* e salva il file (es. in *Download* o su Drive).
2. Nella 2.0.0: *Impostazioni → Importa Backup* e scegli quel file.
3. Prodotti, lista e impostazione dello standby devono corrispondere a quelli della 1.4.0.
4. Solo dopo aver verificato, la 1.4.0 si può disinstallare.
