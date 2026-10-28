# Campagne condivise con Supabase

Fable può restare completamente locale oppure usare Supabase per account, campagne e schede condivise. L'integrazione non richiede un backend Node: la build Vite dialoga con Supabase Auth, Postgres e Realtime. Il server Node incluso continua a servire soltanto file statici.

## Schema del database

Le migrazioni incluse creano gli oggetti nello schema `public`, adatto a un progetto Supabase dedicato a Fable. Se il progetto ospita già altre applicazioni, le stesse tabelle possono stare in uno schema separato: imposta `VITE_SUPABASE_DB_SCHEMA` con il suo nome ed esponilo nelle impostazioni API di Supabase. Le migrazioni di questo repository non vanno applicate a uno schema gestito da un altro progetto.

## Variante autonoma per un nuovo progetto

1. Crea il progetto Supabase dedicato a Fable.
2. Esegui nel SQL Editor il file [20261027000100_shared_campaigns.sql](../supabase/migrations/20261027000100_shared_campaigns.sql). In alternativa, dalla cartella del repository usa `supabase link --project-ref IL_PROJECT_REF` e `supabase db push`. Applica tutte le migrazioni presenti, inclusa `20261027000200_lock_invites.sql`. La prima migrazione crea solo oggetti con prefisso `fable_` e abilita Realtime sulle tabelle condivise.
3. In Authentication abilita Email e Password. In URL Configuration imposta Site URL all'indirizzo HTTPS della webapp. Per confermare gli account usa le email di Supabase, configurando un provider SMTP per le email di conferma a utenti reali. Dopo la conferma dell'email il giocatore può accedere con email e password. Il file `supabase/config.toml` disattiva la conferma **solo per i test locali**; non cambia le impostazioni del progetto ospitato.
4. Copia `.env.example` in `.env.local` e compila:

   ```dotenv
   VITE_SUPABASE_URL=https://IL_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_LA_CHIAVE_PUBBLICA
   VITE_APP_URL=https://fable.example.com
   ```

   È supportata anche la vecchia chiave pubblica `anon` tramite `VITE_SUPABASE_ANON_KEY`. Una chiave `service_role` o `sb_secret_…` viene rifiutata: non serve al frontend. `VITE_APP_URL` deve essere l'indirizzo pubblico della webapp, includendo eventuali sottocartelle.
5. Esegui `npm ci` e `npm run build`, poi pubblica `dist/` su hosting statico. Le variabili sono incorporate nella build: impostarle soltanto dopo averla compilata non basta. Le policy CSP della build ammettono esclusivamente l'endpoint Supabase configurato e il suo WebSocket. Se usi il server Node incluso, il suo header CSP segue la stessa configurazione della build. Eventuali header CSP aggiunti dall'hosting devono consentire gli stessi indirizzi.
6. Apri Campagna, registra un account e crea una campagna come master. Copia l'invito. Da un altro browser registra un giocatore, apri il link, inserisci il nome al tavolo e partecipa. Pubblica una scheda con lo stesso regolamento della campagna. Una modifica ai tratti o ai PF deve comparire nella vista del master.

## Come funziona

- Il master legge tutte le schede della propria campagna. I giocatori leggono e modificano soltanto le proprie. Un giocatore non può promuoversi a master. La protezione è nel database, attraverso grant, RLS e funzioni con verifiche sull'utente autenticato.
- Pubblicare una scheda è un'azione esplicita. Si condividono anche inventario, diario, tratti e capacità; la pagina lo dichiara prima della pubblicazione. Preparazione, segreti e incontri del DM continuano a restare locali sul dispositivo e non vengono condivisi. Le copie negli incontri mantengono il comportamento locale esistente.
- Una scheda già collegata viene aggiornata dopo una breve pausa nella scrittura. Realtime notifica il master; un controllo periodico e il ritorno alla finestra recuperano aggiornamenti eventualmente persi durante una disconnessione.
- Su un nuovo dispositivo, dopo l'accesso usa **Usa su questo dispositivo** sulla tua scheda condivisa. L'app conserva anche la copia locale. Il master può aprire le schede dei giocatori in sola lettura.
- In assenza di rete le modifiche restano locali. Alla riconnessione una versione modificata soltanto online viene scaricata; modifiche soltanto locali vengono inviate. Se entrambe sono cambiate, la condivisione di quella scheda si ferma e richiede di scegliere la versione. Le scritture controllano sempre la versione nel database.
- Sostituire un invito impedisce nuovi ingressi con il vecchio link, senza espellere chi è già entrato. Rimuovere un partecipante elimina le sue copie condivise dalla campagna; le sue copie locali rimangono disponibili. Un giocatore può interrompere la pubblicazione o abbandonare la campagna.
- I backup locali non includono credenziali, sessioni di accesso, inviti Fable o schede di altri utenti. Conservano i personaggi locali e gli appunti locali del DM come prima. Per il database online usa anche gli strumenti di backup del progetto Supabase.

## Verifica locale con OrbStack

I servizi Fable usano le porte 55321 e 55322 per non interferire con altri progetti locali. Usa il socket Docker compatibile di OrbStack.

```sh
supabase start -x storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
supabase test db
npm run test:cloud
npm run test:cloud -- --production
```

Il comando con `--production` ricostruisce anche la build con l’endpoint locale e verifica la CSP effettiva. Dopo la prova ricompila con le variabili del progetto destinato al deploy.

`test:cloud` legge la configurazione del progetto **locale**, avvia un server Vite di test e prova account distinti, inviti, scritture, isolamento delle schede, revoca e conflitti fra dispositivi. Rifiuta endpoint Supabase remoti. `npm test` verifica anche normalizzazione, confronto delle versioni, configurazione e link d'invito.

Per chiudere soltanto l'ambiente Fable usa `supabase stop --project-id fable`. Il repository non contiene credenziali di progetti ospitati.
