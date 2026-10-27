# Fable: proposta per il flusso del giocatore

26 ottobre 2026. Ricontrollo della versione locale e proposta di prodotto. Integra lo studio `ux-audit-2026-10-26.md` senza sostituirne le evidenze storiche.

## Valutazione

Fable ha un'identità visiva riconoscibile, con tipografia editoriale, colori caldi e comandi di tiro espliciti. Il lavoro più utile è cambiare la gerarchia delle informazioni e completare le operazioni del giocatore. Oggi impostazioni e presentazione del personaggio precedono le azioni necessarie al turno.

La direzione consigliata è una schermata «Gioca» che riunisca stato e azioni, con modifiche contestuali e preparazione accessibile dal menu del personaggio. La scheda cartacea rimane una vista per consultazione e stampa degli stessi dati.

## Metodo e limiti

- Browser collaborativo sulla versione locale: panoramica a 1280 × 800, 390 × 844 e 320 × 740; apertura della creazione e passaggio al secondo step; scheda della demo, editor, dialoghi dadi e riposo breve. La creazione è stata chiusa senza salvare un nuovo personaggio.
- Lettura dei componenti della creazione e delle nuove schede, dell'editor, del salvataggio e della libreria dei personaggi.
- Riproduzione del problema del nome vuoto con un personaggio sintetico e storage in memoria, senza modificare i salvataggi dell'utente.
- Ricerca su documentazione D&D Beyond, principi di usabilità Nielsen Norman Group e indicazioni W3C. Le raccomandazioni sono una sintesi progettuale, non risultati di test con giocatori.
- Il browser conteneva già un personaggio con valori e regole personalizzati. Le misure descrivono quello stato, non una nuova installazione. PF e risorse oltre il massimo non sono classificati automaticamente come errori.
- I viewport stretti verificano il layout desktop ridimensionato, non tastiera virtuale, gesti o comportamento su un telefono reale. Nessuna verifica completa di accessibilità, stampa, edizioni o console DM in questo ricontrollo.
- Nessuna modifica al codice applicativo. Non sono stati eseguiti suite e build per questa proposta documentale.

## Evidenze e interventi

| Priorità | Evidenza attuale | Effetto sul giocatore | Intervento proposto |
| --- | --- | --- | --- |
| P0 | `saveCharacter` accetta un nome vuoto; `readCharacters` lo scarta. Riproduzione in memoria: 1 personaggio leggibile prima, 0 dopo. L'editor aggiorna il nome a ogni battuta. | Una modifica interrotta può rendere il personaggio non recuperabile dall'archivio ordinario. | Bozza distinta, validazione prima del salvataggio e ultima versione valida recuperabile. Stato di salvataggio collegato all'esito reale. |
| P1 | A 1280 × 800 il pulsante PF è a y≈877 e il primo tiro per colpire a y≈1448. Prima ci sono titolo, stampa, creazione, archivio, riposi e regole del tavolo. | Il turno comincia con una ricerca e uno scorrimento. | Intestazione compatta; PF, CA, iniziativa, condizioni e azioni preferite nella prima schermata. Menu per stampa, creazione e cambio edizione. |
| P1 | A 390 px la barra laterale occupa 58 px. PF a y≈1032; attacco con arco a y≈1884. La barra inferiore mostra dadi e due riposi. | Poco spazio per il contenuto e scorciatoie poco rappresentative della frequenza delle azioni. | Navigazione inferiore con etichette: Gioca, Scheda, Zaino, Diario. Riposi in una voce «Recupero»; tiri contestuali nel contenuto. |
| P1 | La creazione propone livello 1, punteggi finali manuali e conclude senza equipaggiamento. | «Crea personaggio» non significa ancora poter partecipare alla sessione. | Scelta iniziale tra nuovo personaggio e trascrizione; checklist finale per armi, armatura, competenze e capacità. Salvare anche una bozza incompleta, indicandola chiaramente. |
| P1 | La scheda demo mostra campi come nome del giocatore e tratti, ma il suo editor contiene solo nome, soprannome e caratteristiche. Anche l'editor delle nuove schede non ricopre tutti i campi di identità. | Si vede un dato senza trovare dove correggerlo. | Editor contestuali per sezione. Ogni campo deve essere modificabile, calcolato con spiegazione o esplicitamente fuori ambito. |
| P1 | Nei personaggi nuovi «Usa» una capacità e «Consuma slot» sono operazioni separate, come dichiara `RulesCharacter.jsx`. | Dimenticare lo slot o consumarlo due volte è facile. | Un flusso di lancio con scelta della risorsa e consumo atomico, risultato e annullamento. Non dedurre automaticamente le regole dal testo libero. |
| P1 | Demo e nuove schede usano componenti e comandi diversi; la demo ha armi e incantesimi precompilati. | Il percorso imparato nella demo non si trasferisce interamente al proprio personaggio. | Un unico modello di interazione. La demo diventa un personaggio precompilato nello stesso sistema. |
| P2 | La finestra dei dadi offre dadi generici e formule, mentre gli attacchi hanno tiri contestuali separati. | Le regole ricorrenti devono essere ricostruite manualmente quando non sono esposte sul tiro. | Selettore Normale / Vantaggio / Svantaggio sui tiri compatibili, formula e composizione del risultato visibili, supporto a risultati di dadi fisici. Adattare i controlli all'edizione. |
| P2 | Titoli promozionali e ampie carte ricorrono nell'interfaccia di lavoro. | Lo spazio disponibile non segue l'importanza durante la sessione. | Conservare palette e carattere editoriale; ridurre titoli, margini verticali e testi decorativi nelle viste operative. Numeri e pulsanti devono dominare la gerarchia. |

P0 indica rischio per i dati; P1 un ostacolo a un'attività principale; P2 un miglioramento di efficienza o comprensione. Le misure y sono coordinate nel documento e dipendono dal contenuto.

## Flussi proposti

### Entrare nella sessione

Alla riapertura mostrare l'ultimo personaggio valido e la sua vista Gioca. Nel menu del nome si trovano cambio personaggio, preparazione, esportazione e stampa. Separare l'accesso allo schermo DM dal percorso primario del giocatore, mantenendo facile il cambio di ruolo.

Al primo utilizzo proporre «Crea personaggio», «Trascrivi una scheda» e un collegamento secondario «Prova un esempio». Specificare che l'importazione JSON accetta il formato Fable, se non vengono implementati altri formati. Non promettere importazione automatica da PDF o D&D Beyond.

### Preparare un personaggio

Edizione e livello → classe e origine → caratteristiche e competenze → equipaggiamento e capacità → riepilogo delle scelte mancanti → Gioca.

Offrire aiuto vicino alla scelta, una bozza riprendibile e un percorso rapido per chi trascrive dati già definiti. «Completo» deve significare completo rispetto ai controlli disponibili, non certificato conforme a ogni manuale. Evitare un lungo percorso obbligatorio per un giocatore esperto.

L'editor attuale chiede, per esempio, di convertire un'armatura con CA 16 in bonus 6. La nuova UI dovrebbe accettare la formula o il valore che il giocatore legge nel manuale e spiegare quali modificatori aggiunge. Le formule devono restare specifiche dell'edizione.

### Fare un turno

```text
Thalion · Ranger 4 · 2014               Menu
PF 28/36   Temporanei 5   CA 16   Iniz. +4
[Danni / Cura]       [Condizioni] [Recupero]

Azioni       Incantesimi       Prove
Arco lungo          [Colpisci +6] [Danni]
Spada corta         [Colpisci +6] [Danni]

Concentrazione: Marchio del cacciatore
Ultimo tiro: 17 = d20 11 + 6    [Dettagli]

Gioca          Scheda          Zaino          Diario
```

Schema illustrativo con valori di esempio. Su desktop il riepilogo delle risorse può stare accanto alle azioni; su mobile le informazioni seguono un'unica colonna. Favoriti modificabili per attacchi, incantesimi e prove usate spesso. Evitare che una barra fissa sottragga spazio quando si apre la tastiera.

Tiro per colpire → risultato con formula → danni o critico su scelta esplicita. Non segnare automaticamente un bersaglio come colpito senza conoscere il contesto. Dare anche la possibilità di registrare un risultato ottenuto con dadi fisici.

### Subire danni e lanciare magie

PF → importo → Danni o Cura → riepilogo e Annulla. Un'unica operazione aggiorna PF temporanei, PF e stati pertinenti, con le regole dell'edizione scelta.

Per la 5e, mostrare un promemoria di concentrazione quando pertinente. In 2024 le regole ufficiali prevedono un tiro salvezza quando si subiscono danni durante la concentrazione; il nuovo effetto di concentrazione sostituisce quello precedente. Questa logica va implementata per edizione, non estesa indistintamente a 3.5 e 4ª.

Incantesimo → livello di lancio o risorsa associata → conferma → consumo, eventuale tiro e aggiornamento della concentrazione. Mostrare prima gli incantesimi preparati o preferiti; descrizione completa espandibile. L'annullamento ripristina l'intera operazione.

### Recuperare e chiudere la sessione

Il riposo attuale mostra già un riepilogo prima/dopo ed effetti in scadenza: conservarlo. Spostare le eccezioni meno frequenti in una sezione espandibile. Per i dadi vita consentire anche il recupero un dado alla volta, con scelta di proseguire dopo il risultato.

Alla fine della sessione rendere visibili stato del salvataggio e azione di backup. Prima di proporre un backup unico definire quali dati include: personaggi, campagne, appunti e impostazioni. Un'esportazione non è una soluzione completa finché non è verificato il ripristino.

## UI e accessibilità

- Conservare il serif per identità e titoli brevi. Usare testo operativo leggibile e cifre tabulari per PF, bonus e contatori.
- Riservare il colore di accento all'azione primaria; distinguere semanticamente danni, cura e stati anche con testo e icone.
- Obiettivo progettuale di 44–48 CSS px per i controlli frequenti su telefono. Il minimo WCAG 2.2 AA è 24 × 24 con eccezioni: non confondere i due valori.
- Etichette visibili per la navigazione mobile; evitare di affidare tutto a icone da memorizzare.
- Conservare focus visibile, ritorno del focus e chiusura con Escape. Il codice attuale include già gestione del Tab nei modali: verificarne la copertura invece di considerarla assente.
- Animazioni brevi e non bloccanti. Il risultato del tiro deve essere leggibile immediatamente anche con movimento ridotto.
- A 320 e 390 px la panoramica esaminata non deborda orizzontalmente. Resta da provare il resto dell'app, testo ingrandito e tastiera virtuale.

## Ricerca e interpretazione

1. [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/). Mostrare prima le funzioni principali e rinviare quelle avanzate riduce complessità iniziale. Applicazione proposta: spostare ricreazione, stampa e configurazione fuori dal percorso del turno, mantenendole raggiungibili.
2. [Nielsen Norman Group: Recognition and Recall](https://www.nngroup.com/articles/recognition-and-recall/). Riconoscere una scelta richiede meno memoria che ricostruirla. Applicazione proposta: azioni con nome dell'arma, costo e tiro, etichette sulla navigazione e suggerimenti nel contesto.
3. [D&D Beyond: personalizzazione della scheda e dadi digitali](https://www.dndbeyond.com/posts/1003-how-to-customize-your-character-sheet-on-d-d). Documenta il tiro direttamente dal valore della scheda con modificatori e registrazione. È un riferimento di interazione; non dimostra da solo che ogni scelta di Beyond sia ottimale per Fable.
4. [D&D Beyond: creazione del personaggio 2024](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character). La preparazione comprende anche CA, attacchi e dadi vita. Da qui la proposta di verificare la prontezza della scheda oltre a nome e caratteristiche.
5. [D&D Beyond: glossario 2024](https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary/). Riferimento per concentrazione e riposo breve, compresa la scelta di spendere altri dadi vita dopo ciascun tiro. Non usato come fonte universale per tutte le edizioni.
6. [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). Riferimento per dimensioni e spaziatura dei bersagli interattivi.

Le fonti sostengono i principi e le regole citate. La nuova navigazione, il raggruppamento delle azioni e le priorità sono proposte da verificare con giocatori.

## Alternative e scelta consigliata

| Direzione | Beneficio | Limite |
| --- | --- | --- |
| Compattare l'interfaccia esistente | Riduce subito lo scorrimento con poco lavoro | Conserva separazione tra scheda, azioni e configurazione |
| Gioca come vista principale, preparazione contestuale | Organizza l'app attorno alle attività della sessione | Richiede uniformare controlli e dati della demo e delle nuove schede |
| Scheda cartacea interamente interattiva come unica vista | Familiare per chi viene dalla carta | Densa su telefono, con frequenza d'uso poco rappresentata dall'ordine dei campi |

Consiglio la seconda. La compattazione è un primo rilascio utile, purché la direzione rimanga una sola e non nasca un terzo editor parallelo.

## Sequenza e verifica

1. Proteggere il salvataggio e aggiungere recupero dell'ultima versione valida. Ricaricare con nome temporaneamente vuoto non deve eliminare il personaggio.
2. Riorganizzare Gioca e navigazione mobile. A 1280 × 800 e 390 × 844 mostrare PF, CA e almeno un'azione preferita senza scorrere, con contenuto rappresentativo.
3. Unificare azioni, danni, risorse e annullamento. Un lancio consuma una sola risorsa; annullarlo ripristina tutto. Lo stesso danno applicato da accessi diversi deve dare lo stesso stato.
4. Completare modifica, trascrizione e checklist iniziale. Chiudere e riaprire la preparazione conserva la bozza e rende esplicite le scelte mancanti.
5. Verificare continuità tra sessioni e ripristino del backup; poi rifinire transizioni, densità e dettagli grafici.

Test proposto con 5–6 giocatori, includendo principianti ed esperti e almeno un utilizzatore abituale di telefono. Compiti: riprendere il personaggio, tirare Percezione con vantaggio, subire danni con PF temporanei, lanciare una magia, correggere un'arma e fare un riposo. Misurare completamento senza aiuto, tempo, tocchi, errori di consumo e capacità di annullare. Ripetere gli stessi compiti sulla versione attuale e sul prototipo; nessuna percentuale di miglioramento è già dimostrata.

## Prima fase implementata

Salvataggio attivo validato, copia precedente, recupero esplicito dei dati non leggibili con conservazione dell'originale. Entrambi gli editor del personaggio lavorano su una bozza in memoria e richiedono «Salva modifiche»; Annulla, Escape e chiusura non applicano la bozza. Una bozza non confermata non viene ripresa dopo la ricarica: rimane disponibile il personaggio salvato.

Intestazione compatta con menu Personaggio, archivio e regole espandibili, navigazione inferiore mobile, azioni demo prima delle caratteristiche e attacchi generici delle nuove schede anticipati. Stampa, creazione, avanzamento, campagna, DM e impostazioni restano raggiungibili dal menu. Le regole e i contenuti delle edizioni non cambiano.

Verifica: 41 test unitari, 7 test E2E e build di produzione superati. I test coprono nome vuoto, conferma della bozza, recupero esplicito, cambi edizione, PF negativi 3.5, riposi e avanzamento 4ª, layout a 320 px, PF e almeno un tiro visibili a 390 × 844 per demo e personaggio 2024, oltre a generazione PDF 3.5. Screenshot desktop/mobile generati nella cartella ignorata `test-results`. Il PDF è stato generato e controllato dal test, non sottoposto a revisione visiva pagina per pagina.

Restano da implementare i flussi di creazione completa, trascrizione, lancio con consumo coordinato, annullamento delle azioni di gioco, condizioni e concentrazione. Questa fase non li presenta come funzionalità già disponibili.
