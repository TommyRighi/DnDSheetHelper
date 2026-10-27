# Fable

Compagno D&D in italiano per web e desktop. React 19, Vite ed Electron, con salvataggi locali e backup completi JSON/CSV. Campagne condivise opzionali con Supabase, account e aggiornamenti delle schede in diretta.

## Avvio

```sh
npm ci
npm run dev
```

La webapp si apre normalmente su `http://localhost:5173`. Per la versione di produzione:

```sh
npm run build
npm run server
```

Il server statico apre `http://127.0.0.1:8787`. La cartella `dist/` può anche essere pubblicata su un hosting statico. Dopo il primo caricamento, la build di produzione mantiene interfaccia e font nella cache per l'uso offline.

## App desktop

```sh
npm run desktop:dev
npm run desktop:mac
```

I pacchetti macOS Apple Silicon sono in `release/`. La build usa una firma locale ad hoc; non è firmata Developer ID o notarizzata per la distribuzione pubblica. La configurazione di packaging include anche Windows e Linux, da costruire e verificare sui sistemi corrispondenti.

## Salvataggi e configurazione

L'app salva automaticamente i dati nel browser o nel profilo desktop. Le due versioni hanno archivi distinti.

Da **Personaggio → Salvataggi e backup** si può:

- Scaricare un JSON completo con personaggi, campagna, incontri, appunti e preferenze.
- Scaricare lo stesso contenuto in un CSV Fable reimportabile, con i dettagli strutturati nelle celle.
- Importare un file JSON o CSV dopo aver controllato il riepilogo.
- Recuperare la copia locale conservata prima dell'ultimo ripristino.

Il JSON è il formato consigliato. Per spostarsi tra web e desktop, esportare il file da una versione e importarlo nell'altra. Il backup include anche gli appunti riservati del master. Cancellare i dati del sito o il profilo dell'app può rimuovere i salvataggi: conservare una copia su file.

La [guida desktop, web e backup](docs/desktop-web.md) descrive formato, limiti, packaging e verifiche.

## Campagne condivise

La [guida Supabase](docs/campagne-condivise.md) descrive il deploy su un nuovo progetto. Include schema SQL, accessi separati per master e giocatori, inviti e gestione dei conflitti. Senza configurazione Supabase restano disponibili i salvataggi locali.

## Funzioni

- Vista Gioca ottimizzata per desktop 16:9 e adattata al telefono.
- Archivio di personaggi per D&D 3.5, 4ª, 5e 2014 e 2024, con calcoli e riposi distinti.
- Creazione con assegnazione facoltativa delle caratteristiche per classe e checklist di preparazione.
- Tiri, formule miste, PF temporanei, risorse, capacità registrate, inventario e diario.
- Campagna locale configurabile con nome, descrizione, regolamento e personaggi associati.
- Console master con preparazione, note private, PNG, iniziative e incontri archiviati.
- Stampa della scheda e importazione/esportazione del singolo personaggio.
- Aspetto chiaro/scuro e colori personalizzati, con font inclusi per l'uso offline.
- Collegamento a Roll20 o ad altre piattaforme tramite browser o tentativo di vista incorporata.

Le schede, le copie nell'archivio DM e i partecipanti agli incontri sono indipendenti e si aggiornano tramite comandi espliciti. Salvare un link non crea una campagna condivisa e non invia PF, dadi o appunti ad altri dispositivi. La piattaforma esterna può impedire l'apertura in iframe; il browser esterno resta disponibile.

La copertura dei manuali è parziale. Opzioni, prerequisiti, equipaggiamento e molti effetti richiedono registrazione e verifica manuale. I personaggi dimostrativi non rappresentano una copertura completa delle regole. Vedere la [matrice di copertura](docs/edition-coverage.md).

## Verifiche

```sh
npm test
npm run test:server
npm run test:e2e
npm run build
npm run test:offline
npm run test:desktop
```

I test dell'interfaccia avviano un server separato sulla porta 5180 e usano dati isolati. I test desktop usano un profilo temporaneo. Sono coperti backup completi JSON/CSV, ripristino, layout desktop/mobile, stampa e uso offline.

Gli studi del progetto sono in [docs/](docs/), compresa la [prova dei percorsi master e giocatore](docs/campaign-role-walkthrough-2026-10-26.md).
