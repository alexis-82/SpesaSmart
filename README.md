# 🛒 SpesaSmart

**SpesaSmart** è un'app per Android che ti aiuta a gestire la lista della spesa in modo semplice: crei il tuo catalogo di prodotti abituali e con un tocco li aggiungi alla lista.

Versione attuale: **2.0.0**

---

## Cosa puoi fare

- **Lista della Spesa:** vedi cosa devi comprare e togli un prodotto con la **X** rossa quando lo hai preso.
- **Prodotti:** crea il tuo elenco di prodotti abituali, in ordine alfabetico. Tocca un prodotto per metterlo nella lista; quelli già in lista appaiono in grigio con la scritta *"(Già in lista)"*. Il campo in alto cerca mentre scrivi (bastano poche lettere, anche senza accenti): se il prodotto non c'è, premi **Aggiungi** per crearlo.
- **Salvataggio automatico:** lista e prodotti restano salvati anche quando chiudi l'app o spegni il telefono.
- **Backup & Ripristino:** da *Impostazioni* esporti tutti i tuoi dati in un file e lo condividi dove vuoi (email, Drive, WhatsApp…). Con **Importa Backup** li ripristini, anche su un altro telefono.
- **Mantieni schermo acceso:** da *Impostazioni* puoi impedire che lo schermo si spenga mentre usi l'app, comodo tra gli scaffali del supermercato.
- **Avviso di aggiornamento:** quando esce una nuova versione, l'app te lo segnala e ti propone di scaricarla. Le piccole correzioni arrivano invece da sole: l'app le scarica in background e ti chiede se riavviarla subito per applicarle (oppure lo fa alla prossima apertura).

Per spostarti tra le schermate tocca l'icona **☰** in alto a sinistra, oppure scorri il dito dal bordo sinistro dello schermo.

## Requisiti

- Un telefono **Android 7.0** o successivo.
- La connessione a Internet serve solo per controllare se ci sono aggiornamenti: l'app funziona anche offline.

## Installazione

L'app non è sul Play Store: si scarica direttamente dal sito.

1. Dal telefono, apri **[www.alexis82.it](https://www.alexis82.it)** e scarica il file **spesasmart.apk**.
2. Apri il file scaricato (dalla notifica del download o dalla cartella *Download*).
3. Se Android lo chiede, consenti l'installazione di app da **origini sconosciute** per il browser che stai usando (di solito: *Impostazioni → Installa app sconosciute*).
4. Tocca **Installa** e poi **Apri**.

## ⚠️ Aggiornare dalla versione 1.3.1 alla 2.0.0

La versione 2.0.0 è stata rinnovata dietro le quinte e **non si installa sopra la 1.3.1**: se ci provi, il telefono risponde *"App non installata"*.

Per passare alla nuova versione:

1. **Annota la tua lista e i tuoi prodotti** (anche con uno screenshot): con la disinstallazione andranno persi.
2. Disinstalla SpesaSmart 1.3.1 (tieni premuta l'icona → *Disinstalla*).
3. Installa la 2.0.0 come descritto in [Installazione](#installazione).
4. Inserisci di nuovo i tuoi prodotti.

Questa procedura serve **solo una volta**: dalla 2.0.0 in poi gli aggiornamenti si installano normalmente e i tuoi dati restano al loro posto.

**Hai una versione con il pulsante "Esporta Backup" (1.4.0)?** Allora non devi riscrivere niente:

1. Nella vecchia app vai in *Impostazioni → Esporta Backup* e salva il file (per esempio nella cartella *Download* o su Drive).
2. Installa la 2.0.0, apri *Impostazioni → Importa Backup* e scegli quel file.
3. Controlla che prodotti e lista ci siano tutti, poi puoi disinstallare la vecchia versione.

## Novità della versione 2.0.0

- App rinnovata internamente per essere più stabile e più facile da aggiornare in futuro.
- Nuova schermata **Impostazioni** con **Esporta / Importa Backup** e l'opzione **Mantieni schermo acceso**.
- Controllo degli aggiornamenti più leggero: avviene solo quando apri l'app o ci torni, non più ogni minuto.
- La schermata *Informazioni* mostra sempre la versione installata.
- Meno permessi richiesti: l'app usa solo l'accesso a Internet (per il controllo aggiornamenti), non più l'accesso alla memoria del telefono.

## Privacy

Lista e prodotti sono salvati **solo sul tuo telefono**: non vengono inviati a nessun server. Gli unici collegamenti a Internet servono per gli aggiornamenti: la verifica della versione disponibile su www.alexis82.it e il download delle piccole correzioni dell'app dai server di Expo. Il file di backup finisce solo dove decidi tu di condividerlo.

## Domande frequenti

**Ho perso la lista dopo l'aggiornamento.**
È normale solo nel passaggio dalla 1.3.1 alla 2.0.0 (vedi sopra). Per gli aggiornamenti successivi i dati vengono conservati. Per sicurezza, ogni tanto fai un **Esporta Backup**.

**L'import sostituisce i dati che ho già?**
Sì: prima di importare l'app ti mostra cosa contiene il backup e chiede conferma. Se vuoi tenere i dati attuali, esportali prima.

**Non vedo l'avviso di aggiornamento.**
L'app controlla quando la apri. Assicurati di essere connesso a Internet, chiudila e riaprila.

**Come esco dall'app?**
Come per tutte le app Android: tasto **indietro** dalla *Lista della Spesa*, oppure chiudila dalle app recenti. I dati sono già salvati.

## Contatti

- Email: alessioabrugiati@gmail.com
- Sito web: [www.alexis82.it](https://www.alexis82.it)

---

<sub>Per chi sviluppa: la documentazione tecnica su build e rilascio è in [`docs/RILASCIO.md`](docs/RILASCIO.md), i test manuali in [`docs/TEST-MANUALE.md`](docs/TEST-MANUALE.md).</sub>

## Licenza

Distribuita con licenza MIT: vedi il file [LICENSE](LICENSE).
