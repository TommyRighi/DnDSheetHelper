> Questa guida descrive la modalità locale e il packaging desktop. Per account e campagne condivise opzionali, vedi [Campagne condivise con Supabase](campagne-condivise.md).

# Fable per desktop e web

## Avvio e pacchetti

Servono Node.js 22.16 o successivo e npm.

```sh
npm ci
npm run dev
```

La webapp di produzione si genera in `dist/`:

```sh
npm run build
npm run server
```

Il server statico ascolta normalmente su `http://127.0.0.1:8787`. Serve soltanto HTML, JavaScript, CSS, font e icone. Non riceve salvataggi e non ha API dati, account o database. Si può pubblicare la cartella `dist/` su un normale hosting statico, anche sotto un percorso, mantenendo tutti i file generati.

Per il desktop:

```sh
npm run desktop:dev
npm run desktop:pack
npm run desktop:mac
```

`desktop:dev` compila l'interfaccia e apre Electron; `desktop:pack` produce l'app non compressa per il sistema corrente; `desktop:mac` produce DMG e ZIP macOS Apple Silicon in `release/`. La configurazione include anche NSIS Windows e AppImage/deb Linux tramite `desktop:dist` sulla rispettiva piattaforma. Questi pacchetti non sono stati costruiti o verificati su Windows/Linux in questa sessione.

La build macOS usa una firma locale ad hoc per garantire l’integrità del pacchetto all’avvio; non ha firma Developer ID né notarizzazione Apple. Per la distribuzione pubblica serviranno credenziali di firma; non sono necessarie per sviluppare e verificare il pacchetto locale.

## Salvataggi locali

Personaggi, campagna, incontri e appunti restano nel `localStorage` del browser o del profilo Electron. Il browser e il desktop hanno archivi distinti. L'apertura della stessa webapp su un'altra origine, browser o dispositivo non trasferisce i dati.

La cache del service worker conserva l'interfaccia e i font per la riapertura offline dopo il primo caricamento di produzione. I salvataggi di gioco rimangono separati dalla cache. La richiesta «Conservazione persistente» dipende dalla decisione del browser e non sostituisce un backup su file. Svuotare i dati del sito o il profilo dell'app può rimuovere anche i salvataggi.

Il service worker si registra soltanto nella webapp di produzione su HTTPS o localhost. Il desktop carica già tutti i file localmente tramite il protocollo `fable://app`. Non si registra un service worker nel server Vite di sviluppo.

## Un file di configurazione completo

Aprire **Personaggio → Salvataggi e backup**, oppure **Impostazioni → Salvataggi e backup**.

- **Esporta backup JSON** è il formato principale. Contiene strutture leggibili, con nome del formato e versione.
- **Esporta CSV completo** è un formato alternativo reimportabile. Ogni riga contiene una sezione, una versione e il relativo JSON, per mantenere liste, regole e note senza appiattirle.
- **Importa backup JSON o CSV** legge il file e mostra un riepilogo prima del ripristino.
- **Recupera copia precedente** consente di tornare alla copia locale conservata prima dell'ultimo ripristino.

Il file contiene personaggio attivo, archivio dei personaggi, campagna e associazioni locali, console DM con incontri attuali e archiviati, note private, collegamento al tavolo, aspetto, lingua ed edizione preferita. Include solo dati presenti sul dispositivo. Non è un formato di importazione universale per CSV di altre app.

La struttura JSON pubblica è:

```json
{
  "format": "fable-backup",
  "version": 1,
  "sections": {
    "fable-character": { "id": "…", "name": "…" },
    "fable-character-library": [],
    "fable-campaign": { "id": "…", "name": "…" },
    "fable-dm": { "title": "…" },
    "fable-appearance": { "mode": "dark", "accent": "#d99a68" },
    "fable-language": "it"
  }
}
```

L'esempio illustra la forma, non un personaggio completo importabile. La validazione richiede tutti i dati previsti da ciascuna sezione. Le vecchie esportazioni JSON del singolo personaggio si importano ancora dal comando dedicato nelle Impostazioni; non vengono confuse con backup completi.

Il CSV ha intestazione `fable_backup_version,section,data_json`, separatore virgola, BOM UTF-8, righe CRLF e virgolette raddoppiate. Le strutture rimangono in celle JSON: un foglio di calcolo non deve troncare o alterare queste celle. Per archiviazione e trasferimento è preferibile il JSON.

Il ripristino sostituisce i dati di gioco e le preferenze del dispositivo. Prima di scrivere, l'app valida l'intero file e conserva `fable-workspace-before-restore`. Se una scrittura fallisce tenta di ripristinare i valori precedenti. File non validi non vengono applicati. Limite del file: 10 MB; dati interni del backup: 5 MB.

I backup contengono anche segreti del master ed eventuali inviti al tavolo. Trasferire il file completo significa trasferire quei dati: non è un handout per i giocatori.

## Isolamento desktop

Electron usa sandbox, context isolation e Node integration disabilitata nella pagina. Il preload espone soltanto informazioni dell'app e il salvataggio del backup. Il percorso di destinazione è scelto con il dialogo nativo; la pagina non dispone di accesso generico al filesystem o a IPC arbitrario. I link esterni vengono aperti nel browser e non trasformati in pagine privilegiate.

Riferimenti: [sicurezza Electron](https://www.electronjs.org/docs/latest/tutorial/security/), [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

## Verifiche

```sh
npm test
npm run test:server
npm run test:e2e
npm run build
npm run test:offline
npm run test:desktop
```

Il test desktop usa un profilo temporaneo, verifica l'isolamento, esporta JSON e CSV tramite dialoghi nativi controllati dal test e verifica il salvataggio dopo riapertura. Per provare il pacchetto finale:

```sh
FABLE_DESKTOP_EXECUTABLE="$PWD/release/mac-arm64/Fable.app/Contents/MacOS/Fable" npm run test:desktop
```

Il test offline usa una build di produzione, attende la cache, disattiva la rete e verifica caricamento, modifica e riapertura. I test non richiedono account, servizi esterni o database.

Il pacchetto di produzione ignora `ELECTRON_RUN_AS_NODE`, ripristina la firma ad hoc dopo la configurazione dei fuse e porta in primo piano la finestra quando viene aperta una seconda istanza.
