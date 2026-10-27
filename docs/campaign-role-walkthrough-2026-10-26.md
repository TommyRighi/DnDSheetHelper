# Prova dei percorsi master e giocatore

26 ottobre 2026. Versione locale corrente, dopo gli interventi sulla vista desktop 16:9.

## Esito

Il percorso richiesto non arriva alla creazione e alla partecipazione a una campagna Fable condivisa. L'app permette di preparare una sessione locale, mantenere un archivio di partecipanti, condurre incontri e salvare un collegamento a un tavolo esterno. Queste funzioni sono utilizzabili, ma il nome «La mia campagna» suggerisce una relazione tra dati che il prodotto non realizza.

La prova ha individuato anche un difetto riprodotto nei danni dal pannello del tavolo incorporato: ignora i PF temporanei dei nuovi personaggi.

## Metodo

Prova nel browser collaborativo con due archivi locali indipendenti: master su `localhost:5175`, giocatore su `127.0.0.1:5175`. Origini diverse simulano due dispositivi e impediscono di condividere per errore lo stesso localStorage. I salvataggi già presenti sul server abituale alla porta 5173 non sono stati modificati.

Viewport principale 1920 × 1080; verifica aggiuntiva della console DM a 1366 × 768. Dati inventati: campagna «La cripta del corvo», incontro «Il custode del sigillo», personaggio giocatore «Mira», chierico 2024, capacità sintetica «Cura di prova». Il link usato è un indirizzo di esempio, senza inviti privati o account. Non è stata svolta una partita reale su Roll20 e non sono stati verificati login, chat, audio o condivisione di un tavolo esterno.

L'esecuzione dei percorsi usa i controlli dell'app. Dove necessario, i select nativi sono stati selezionati tramite evento change nel browser. La lettura di localStorage e dei sorgenti conferma gli effetti dei comandi; non è stata usata per creare la campagna o saltare passaggi mancanti.

È una valutazione esperta con scenari simulati, non uno studio con utenti indipendenti. In questo turno non sono stati modificati componenti applicativi né eseguite suite automatiche: il risultato è il presente audit.

## Percorso del master eseguito

1. Apro «La mia campagna» cercando di creare «La cripta del corvo». Trovo Phandelver precompilata, il diario e un modulo per salvare un link. Non trovo «Crea campagna».
2. Entro in «Schermo del DM». La console contiene già titolo, scene, segreti, tre persone e un incontro dimostrativo. Sostituisco titolo, obiettivo, scaletta e segreti con quelli del mio scenario.
3. Apro «Gruppo e PNG» e copio il personaggio attivo. Nell'archivio esiste già un Thalion, quindi ottengo un secondo Thalion senza una distinzione evidente nel selettore dell'incontro.
4. Premo «Nuovo PNG». Il modulo compare sotto l'archivio, a circa 1759 px dalla parte superiore del viewport nella posizione corrente. Il click non lo porta in vista. Lo raggiungo e aggiungo «Goblin della cripta».
5. Apro «Incontro» e uso «Archivia e crea un incontro» per sostituire la demo. Il nuovo incontro nasce in edizione 2024, mentre il personaggio copiato è 2014.
6. Provo ad aggiungere il Thalion copiato. Ricevo il messaggio di incompatibilità. Imposto manualmente il regolamento 2014 e aggiungo Thalion e il goblin. Il controllo di incompatibilità funziona, ma la scelta iniziale dell'edizione provoca il percorso a vuoto.
7. Rinomino l'incontro, tiro le iniziative e lo avvio. Applico 5 danni a Thalion: la copia nell'incontro passa da 28 a 23 PF, la scheda resta a 28. L'indipendenza è dichiarata nell'interfaccia.
8. Salvo il nome «La cripta del corvo» e un link di esempio nel pannello del tavolo. Tornando a «La mia campagna», la grande carta continua a mostrare Phandelver; il nuovo nome compare soltanto nel pannello del collegamento.
9. Avanzo un turno, termino l'incontro e scrivo il riepilogo. Ricarico: titolo, riepilogo e incontro si conservano; la navigazione riparte da Gioca. Uscire dalla console e rientrare riporta al tab Sessione.

## Percorso del giocatore eseguito

1. Apro una seconda origine del browser, con dati indipendenti. Anche qui trovo la campagna dimostrativa e Thalion, non la campagna preparata dal master.
2. Salvo lo stesso nome e link usati dal master. Non appare un gruppo, un invito accettato o il personaggio collegato: viene memorizzata la destinazione esterna.
3. Creo «Mira», chierico 2024, lasciando la serie proposta. La sequenza 15, 14, 13, 12, 10, 8 resta assegnata nello stesso ordine delle caratteristiche: Mira ha Saggezza 10 e CD incantesimi 10. Il creatore chiede punteggi finali, ma non guida l'assegnazione rispetto alla classe scelta.
4. La creazione termina con 9 PF e due slot, senza capacità registrate o equipaggiamento iniziale. Entro in Incantesimi per prepararmi al gioco.
5. Registro «Cura di prova» con formula 2d8. Il recupero predefinito è giornaliero con un uso. Premo «Usa»: gli usi scendono da 1 a 0, i due slot restano intatti, non compare un tiro e lo storico resta vuoto. Per consumare lo slot devo premere un altro pulsante. Non c'è un editor della capacità registrata nella carta, soltanto ripristino ed eliminazione.
6. Torno alla campagna e apro il diario. È il diario del personaggio, vuoto per Mira; non contiene il riepilogo scritto dal master. La campagna resta Phandelver nella carta principale.
7. Verifico un caso di danno con PF temporanei da due accessi dell'app, riportando il personaggio allo stesso stato iniziale tra le prove. Il risultato dipende dal controllo usato, come descritto sotto.
8. Apro lo Schermo del DM dall'installazione del giocatore. Trovo una nuova console dimostrativa locale; non i dati del master. Questo conferma che la voce è una modalità locale, non un ruolo assegnato nella campagna.

## Problemi prioritari e correzioni proposte

P1 indica un ostacolo al compito principale o un comportamento funzionale incoerente. P2 indica attrito, reperibilità o chiarezza. Il mancato multiplayer è un limite di prodotto dichiarato, non un errore di trasmissione.

| ID | Priorità | Passo controintuitivo | Correzione proposta |
| --- | --- | --- | --- |
| M01 | P1 | «La mia campagna» non offre creazione; la sua identità rimane Phandelver anche dopo aver preparato un'altra sessione e salvato un altro nome. | Introdurre un'identità di campagna locale condivisa tra le viste, oppure chiamare la pagina «Tavolo online» e presentare la demo come esempio separato. |
| M02 | P1 | Il master deve distinguere autonomamente campagna, sessione DM, incontro e collegamento, senza un percorso che li colleghi. | Un ingresso «Prepara campagna» con nome, edizione, gruppo e tavolo facoltativo. All'interno, sessioni e incontri chiaramente separati. |
| M03 | P1 | Un nuovo incontro passa al 2024 indipendentemente dal contesto 2014 e blocca il personaggio appena copiato. | Ereditare l'edizione dal contesto scelto o richiederla prima di creare l'incontro. Mostrare l'edizione nelle opzioni dell'archivio e filtrare i partecipanti incompatibili. |
| M04 | P2 | «Copia personaggio attivo» può creare duplicati omonimi; il selettore mostra solo nome e tipo. | Collegamento all'origine, avviso su copia esistente, scelta «Aggiorna copia» o «Duplica», etichetta con edizione e ultimo aggiornamento. |
| M05 | P2 | «Nuovo PNG» aggiunge un modulo molto sotto il punto del click. | Dialogo vicino al compito o pannello laterale con focus sul nome. Completata l'aggiunta, mostrare subito la nuova carta. |
| M06 | P1 | Scheda, archivio e incontro hanno PF indipendenti. Un master può aggiornare la copia sbagliata pur leggendo lo stesso nome. | Dichiarare la destinazione nel controllo e offrire un aggiornamento esplicito tra copie compatibili. Un futuro collegamento stabile richiede un modello diverso dalla duplicazione. |
| M07 | P2 | Lo Schermo DM contiene ancora intestazione e comandi del personaggio attivo. A 1366 × 768 la preparazione inizia a y≈491, il tavolo a y≈1303. | Layout specifico per il master: campagna, sessione e comandi DM in alto; dettagli del personaggio nel suo spazio. Accesso al tavolo sempre riconoscibile. |
| M08 | P2 | Tornando alla console si perde il tab corrente; ricaricando si torna a Gioca. Le note, invece, sono conservate. | Ricordare vista e tab del ruolo corrente, con ritorno alla sessione o incontro in corso. |
| G01 | P1 | Salvare un link sembra il passo per partecipare, ma non associa personaggio, gruppo o dati del master. | Se il prodotto rimane locale, usare «Salva collegamento al tavolo» e descrivere il trasferimento manuale. Un vero «Partecipa» richiede inviti, autorizzazioni e condivisione implementati. |
| G02 | P1 | Cambiare classe non riassegna né suggerisce le caratteristiche. Il chierico di prova termina con Saggezza 10. | Assegnazione guidata o suggerimenti visibili per la classe, con riepilogo degli effetti e libertà di confermare scelte insolite. Non correggere silenziosamente i punteggi. |
| G03 | P1 | La creazione si conclude prima di equipaggiamento, competenze e capacità necessari alla partita. | Checklist «Da completare» con collegamenti diretti alle sezioni e bozza del personaggio chiaramente distinguibile da una scheda pronta. |
| G04 | P1 | «Usa» consuma gli usi della capacità, ma non lancia la formula e non consuma slot. Il valore predefinito giornaliero può imporre un secondo limite improprio se si registra un incantesimo come capacità. | Distinguere incantesimo e capacità; scegliere la risorsa associata; mostrare prima di confermare quali operazioni avvengono. Per ora rinominare il pulsante «Segna uso». |
| G05 | P1 | I danni dal tavolo incorporato ignorano i PF temporanei del nuovo personaggio. | Usare la stessa operazione di dominio per tutti gli accessi ai PF. Aggiungere una regressione che confronti lo stato risultante dai diversi percorsi. |
| G06 | P2 | «Continua il diario» dalla campagna apre note per personaggio senza identificare il rapporto con la campagna; il riepilogo del master non è disponibile. | Esplicitare «Appunti personali di Mira» e distinguere un eventuale riepilogo condiviso. Non suggerire che note private e contenuti condivisi coincidano. |

## Difetto riprodotto: danni e PF temporanei

Stato iniziale identico nelle due prove: Mira, chierico 2024, 9 PF su 9, 5 PF temporanei, 7 danni.

| Accesso | Azioni eseguite | PF finali | Temporanei finali |
| --- | --- | --- | --- |
| Gioca | Quantità danni 7 → Subisci danni | 7 | 0 |
| Campagna | Apri nell'app → pulsante 9 / 9 PF → Quantità 7 → Subisci danni | 2 | 5 |

Il controllo di Gioca usa `adjustHP` nel motore dell'edizione. Il dialogo generale `modal === "hp"` in `main.jsx`, richiamato da `SessionPanel`, sottrae direttamente dai PF e non aggiorna `rules.tempHp`. La divergenza è stata verificata nel browser e nei salvataggi sintetici. La correttezza degli altri casi di danno e guarigione non è stata dedotta da questa sola prova.

## Cosa funziona nel percorso provato

- I dati di preparazione, il riepilogo e l'incontro si conservano dopo il ricaricamento.
- Il controllo di incompatibilità tra il personaggio copiato e il regolamento dell'incontro segnala il problema senza aggiungere il partecipante.
- Preparare, tirare iniziative, avviare, avanzare e terminare un incontro è possibile.
- L'indipendenza delle copie e l'assenza di sincronizzazione sono dichiarate. Va anticipata questa informazione al momento in cui si decide cosa fare.
- Il normale controllo dei danni delle nuove schede consuma i temporanei nello scenario verificato.
- A 1366 px la console esaminata non presenta scorrimento orizzontale; rimane un problema di spazio verticale prima dei contenuti operativi.

## Ordine consigliato

1. Correggere subito i PF del tavolo incorporato e rendere esplicito cosa fa «Usa».
2. Dare un'identità unica alla campagna locale e chiarire il rapporto tra campagna, sessioni, incontri e tavolo esterno.
3. Correggere il contesto dell'edizione e il percorso di aggiunta di PNG/partecipanti; distinguere e aggiornare le copie.
4. Completare il passaggio da creazione a personaggio pronto e l'assegnazione delle caratteristiche.
5. Solo dopo definire un eventuale flusso di partecipazione condivisa. Non basta aggiungere un pulsante «Invita» all'attuale modello locale.

## Evidenze visive

Screenshot della pagina Campagna dopo aver configurato «La cripta del corvo»: `browser-screenshot-localhost-mvpr2wnh-80da0f63.png`.

Screenshot della console master a 1366 × 768: `browser-screenshot-localhost-mvpr4s9n-368c2030.png`.

Screenshot del dialogo PF dal tavolo del giocatore: `browser-screenshot-127-0-0-1-mvpr4idb-10777998.png`.

Le schermate contengono solo dati sintetici di questa prova. Non rappresentano una sessione reale con altri utenti.

## Correzioni implementate dopo la prova

- Una campagna locale configurabile con nome, descrizione e regolamento sostituisce la carta fissa di Phandelver. Il nome del tavolo e l'intestazione DM usano la stessa identità. Un collegamento già salvato fornisce il nome iniziale per conservare il contesto precedente.
- Il giocatore può associare una scheda compatibile o crearne una con il regolamento della campagna già selezionato. Le associazioni sono locali. Cambiare il regolamento della campagna rimuove le associazioni, conservando schede e incontri con le rispettive regole.
- Le nuove console di campagne configurate partono vuote, senza gruppo o segreti dimostrativi. Una console locale già esistente rimane conservata.
- I nuovi incontri ereditano il regolamento della campagna, oppure quello dell'incontro precedente. Il selettore dell'archivio espone solo partecipanti compatibili e riporta l'edizione.
- Il modulo PNG è un dialogo con focus sul nome, ritorno al comando iniziale, Escape e gestione del Tab. Il tipo iniziale è PNG, oppure avversario quando si aggiunge dal combattimento.
- Le nuove copie conservano il riferimento alla scheda o alla voce d'archivio. Si può aggiornare esplicitamente la copia senza duplicarla. Gli omonimi nei dati precedenti richiedono una scelta tra aggiornamento e copia distinta. Aggiornare un partecipante dall'archivio preserva iniziativa, condizioni e note dell'incontro.
- Navigazione e tab del master vengono ripresi dopo il ricaricamento. La console e la pagina Campagna hanno un'intestazione specifica senza i comandi globali del personaggio. Il layout della console è stato compattato per il desktop 16:9.
- Il controllo dei danni del tavolo incorporato chiama lo stesso motore della scheda, consumando i PF temporanei e rispettando il regolamento.
- La creazione offre un riordino facoltativo dei punteggi per classe e segnala una caratteristica prioritaria bassa. Non modifica i punteggi senza il comando del giocatore. Una checklist collega origine, competenze, equipaggiamento e capacità; si trova anche nel menu Personaggio, sotto «Completa preparazione».
- Le capacità espongono «Segna uso» e «Tira formula» come operazioni distinte e spiegate, più modifica con conservazione degli usi consumati. Gli slot e gli effetti sui bersagli restano manuali.
- I diari delle nuove schede dichiarano il proprietario e il carattere personale degli appunti.

Verifica: 47 test unitari, 15 test di interazione e build di produzione superati. Le regressioni includono i PF temporanei da entrambi i percorsi, la campagna locale e le associazioni, l'edizione ereditata, il ripristino della navigazione DM, il focus del dialogo, l'aggiornamento delle copie, gli omonimi precedenti, la modifica delle capacità e il tiro di formula. Restano coperti i layout desktop 1366 × 768 e 1920 × 1080, le schede mobile e la generazione della stampa.

Il prodotto gestisce una campagna locale configurata sul dispositivo. Non sono stati introdotti account, inviti Fable, sincronizzazione tra dispositivi, un archivio di campagne multiple o automazione completa dei manuali. Questi aspetti richiedono un intervento di prodotto successivo e non sono presentati nell'interfaccia come già disponibili.
