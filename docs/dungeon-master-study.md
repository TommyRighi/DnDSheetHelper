# Studio della console Dungeon Master

26 ottobre 2026. Direzione approvata: console completa locale accanto a Roll20.

## Obiettivo

Ridurre le interruzioni del DM tra preparazione, gestione dell'incontro e annotazione delle conseguenze. Roll20 rimane il tavolo virtuale. Fable raccoglie ciò che il DM deve consultare e aggiornare rapidamente, anche quando una mappa non è necessaria.

## Ricerca e fonti primarie

- [Guida ufficiale Roll20 alla preparazione come DM](https://pages.roll20.net/set-up-roll20-virtual-tabletop-as-dm): preparare personaggi, PNG, handout, mappe, audio e incontri prima della sessione.
- [Roll20 Crash Course](https://help.roll20.net/hc/en-us/articles/360039223834-Roll20-Crash-Course): separazione tra preparazione e gioco, dadi, chat, comunicazione e tracker dei turni.
- [Ruoli e permessi Roll20](https://help.roll20.net/hc/en-us/articles/29620515876375-Invite-Promote-and-Manage-Players): il DM controlla personaggi, token e materiali condivisi; gli script Mod dipendono dal piano del creatore.
- [Turn tracker, Roll20](https://bloghub.roll20.net/posts/tome-of-tips-turn-tracker/): ordine di iniziativa, partecipanti e contatori di round.
- [Sintassi dei dadi, Roll20](https://wiki.roll20.net/Dice_Syntax): formule con quantità, facce e modificatori, comandi per il tracker.

La priorità seguente è una proposta progettuale ricavata da questi flussi, non una ricerca con interviste ai DM.

## Attività e necessità

| Momento | Domanda del DM                      | Strumento nella demo                                                           |
| ------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Prima   | Cosa voglio far succedere?          | Titolo sessione, obiettivo, scaletta e checklist modificabili                  |
| Prima   | Chi compare e cosa vuole?           | Archivio gruppo e PNG con CA, PF, iniziativa, Percezione passiva e note        |
| Durante | A chi tocca e chi è ferito?         | Tracker ordinato, round, PF, condizioni e stato a terra                        |
| Durante | Come risolvo il tiro?               | Dadi multipli e formule miste; comando copiabile per Roll20                    |
| Durante | Cosa non devono sapere i giocatori? | Appunti del DM separati dal diario del personaggio                             |
| Dopo    | Cosa è cambiato e cosa preparo?     | Riepilogo e promemoria persistenti                                             |
| Sempre  | Dove stiamo giocando?               | Collegamento Roll20 salvato, apertura esterna e tentativo di vista incorporata |

## Alternative considerate

1. Solo tracker: consegna rapida ma lascia preparazione e conseguenze in altri strumenti.
2. Console completa locale, scelta approvata: prepara e conduce la sessione accanto a Roll20, senza richiedere account o connessioni API.
3. Nuovo tavolo virtuale: mappa, token, chat e sincronizzazione; molto più costoso e sovrapposto a Roll20. Escluso dalla demo.

## Interfaccia e comportamento

Accesso esplicito a “Schermo del DM” dalla barra laterale. Mantiene la scheda del giocatore separata. Tre sezioni: Sessione, Incontro, Gruppo e PNG. I dati restano disponibili passando da una vista all'altra e dopo il ricaricamento.

La sessione comprende checklist, scaletta, segreti e riepilogo. L'archivio contiene elementi modificabili e può copiare il personaggio attivo. Copiare non crea una sincronizzazione.

Il combattimento consente di aggiungere partecipanti, ordinare per iniziativa, iniziare e terminare l'incontro, avanzare i turni e contare i round. I pari iniziativa mantengono l'ordine di inserimento, regolabile con i valori di iniziativa. Il partecipante attivo è identificato per ID per evitare che un riordino lo cambi. I PF restano tra zero e il massimo. Le condizioni sono promemoria, senza applicazione automatica di effetti. È disponibile annullamento dell'ultima modifica all'incontro. I tiri e i valori non vengono inviati a Roll20.

## Roll20: supporto e limiti verificati

Riconoscimento del dominio esatto `roll20.net` e dei suoi sottodomini. Il percorso e gli eventuali token d'invito vengono conservati senza trasformazioni. La via principale è l'apertura della sessione Roll20 nel browser. La vista iframe è un tentativo opzionale, senza promessa di compatibilità.

Una richiesta pubblica a `https://app.roll20.net/` il 26 ottobre 2026 ha restituito HTTP 403 con una challenge Cloudflare e `X-Frame-Options: SAMEORIGIN`. Questo non verifica tutte le pagine autenticate, ma è sufficiente a escludere una promessa di funzionamento affidabile nell'iframe. Non si aggirano header o autenticazione. Una futura versione Electron richiederà una vista web dedicata e una verifica reale con un account.

I comandi `/roll` e `/gmroll` copiabili generano un nuovo tiro quando vengono incollati nella chat di Roll20. Non trasferiscono il risultato locale. Non è una connessione API e non sincronizza PF, iniziativa o personaggi.

## Dadi

Conservare i controlli esistenti per quantità e modificatore. Aggiungere formule miste, per esempio `2d6+1d8+3`, con parser limitato e senza esecuzione di codice. Mostrare formula, singoli risultati e totale; conservare il riferimento nello storico. Limiti espliciti prevengono blocchi da formule troppo grandi.

## Dati e verifiche

Salvataggio della console in `fable-dm`, distinto da personaggio e sessione esterna. Nessun backend o permesso multiutente: “DM” è una modalità locale, non un ruolo autenticato. Il contenuto non viene condiviso automaticamente e non finisce nella stampa della scheda del giocatore. Esportazione dedicata della console per conservarne una copia.

Verifiche richieste: parser dadi, domini Roll20, lettura sicura dei dati, ordinamento e round, rimozione del partecipante attivo, limiti dei PF e ripristino dopo ricaricamento. Nel browser: creazione PNG, preparazione, conduzione incontro, dadi multipli, apertura del link e comportamento su schermo piccolo.
