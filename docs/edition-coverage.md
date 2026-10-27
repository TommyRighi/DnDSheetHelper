# Copertura effettiva delle edizioni

Perimetro richiesto: manuali base di D&D 3.5, 4ª edizione, 5e 2014 e 5.5e 2024. Questo perimetro **non è ancora interamente implementato**. La versione attuale fornisce motori core, gestione manuale di molte scelte e una struttura per completare i cataloghi. Non equivale a possedere o automatizzare tutti i manuali.

## Infrastruttura comune disponibile

- Edizione e versione delle regole salvate per personaggio; schede precedenti assegnate esplicitamente a 5e 2014.
- Nuove creazioni con 5.5e 2024 predefinita e preferenza personale modificabile.
- Archivio di personaggi di edizioni diverse, con cambio della scheda attiva.
- Ricreazione guidata in un'altra edizione, senza conversione automatica e senza cancellare l'originale.
- Classi del Manuale del Giocatore base: undici in 3.5, otto in 4ª, dodici in 5e e 5.5e.
- Import/export validati, ripresa dopo ricaricamento, scheda adattata, lettura mobile e stampa con indicazione dell'edizione.
- Modificatori manuali e regole del tavolo conservati. Nessuna conversione automatica di un effetto da un sistema all'altro.
- Incontro DM con edizione propria, archivio di incontri e blocco della copia di personaggi con edizione incompatibile. PF negativi per 3.5 e 4ª.

## Calcoli e recuperi

| Area                  | 3.5                                            | 4ª                                               | 5e 2014                             | 5.5e 2024                                         |
| --------------------- | ---------------------------------------------- | ------------------------------------------------ | ----------------------------------- | ------------------------------------------------- |
| PF iniziali           | Dado classe + modificatore COS                 | Base classe + punteggio COS                      | Dado classe + modificatore COS      | Dado classe + modificatore COS                    |
| Progressione PF       | Risultato dado + COS                           | Incremento fisso di classe                       | Risultato dado + COS                | Risultato dado + COS                              |
| Bonus di livello      | BAB monoclasse e attacchi iterativi            | Metà livello                                     | Competenza                          | Competenza                                        |
| Salvezze / difese     | Tempra, Riflessi, Volontà                      | CA e tre difese                                  | Sei salvezze e competenze di classe | Sei salvezze e competenze di classe               |
| CA                    | Normale, contatto, colto alla sprovvista       | Armatura, metà livello, DES/INT                  | Bonus inseriti e DES                | Bonus inseriti e DES                              |
| Abilità               | Gradi e modificatori, elenco base              | Metà livello e addestramento +5                  | Competenza e maestria               | Competenza e maestria                             |
| Slot                  | Gestione manuale per capacità giornaliera      | Non applicabile                                  | Tabella piena/dimezzata e patto     | Tabelle aggiornate, ranger/paladino dal livello 1 |
| Riposo breve          | Nessun recupero automatico                     | Impulsi scelti e poteri a incontro               | Dadi vita, patto e risorse previste | Dadi vita, patto e risorse previste               |
| Riposo lungo          | Guarigione naturale pari al livello            | PF, impulsi, poteri giornalieri e 1 punto azione | PF, slot, risorse e metà dadi vita  | PF, slot, risorse e tutti i dadi vita             |
| A terra               | PF negativi e stabilizzazione percentuale      | PF negativi, fallimenti e impulsi                | Tiri contro morte                   | Tiri contro morte                                 |
| Economia delle azioni | Promemoria standard/movimento/veloce/immediata | Promemoria standard/movimento/minore/immediata   | Azione/bonus/reazione               | Azione/bonus/reazione                             |

Queste formule non comprendono automaticamente tutti i bonus situazionali, razziali, di talento o sottoclasse. Le schermate mostrano gli input e consentono di registrarli. La distinzione degli incantatori è monoclasse: il multiclasse non è validato.

## Risorse di classe già modellate in 5e / 5.5e

Contatori per ira, ispirazione bardica, recuperare energie, azione impetuosa, ki/focus, punti stregoneria, imposizione delle mani, recupero arcano e usi gratuiti di marchio del cacciatore 2024. Usi e recuperi variano per livello ed edizione dove implementati. Il contatore non risolve automaticamente tutti gli effetti della capacità. Gli ulteriori contatori si possono registrare manualmente.

## Gestione manuale disponibile

- Punteggi finali, specie/razza, background, tratti e note. Nessun bonus razziale o di background applicato di nascosto.
- Talenti, capacità, poteri e incantesimi con descrizione, formula di riferimento, usi e frequenza di recupero.
- Armatura, scudo, limite DES e modificatori a CA, attacchi, iniziativa, salvezze e abilità.
- Equipaggiamento, quantità, peso e oro. Non si applicano bonus dal solo nome di un oggetto.
- Scelte di avanzamento e registrazione di prerequisiti. Il livello non viene presentato come completamente risolto senza queste scelte.
- Effetti, contatori e correzioni del master tramite le regole del tavolo.

## Parti ancora mancanti rispetto ai manuali base richiesti

1. Creazione guidata completa con budget, bonus di origine, talenti, competenze consentite e prerequisiti validati.
2. Cataloghi completi delle sottoclassi 5e/5.5e, dei poteri 4ª, dei talenti e delle opzioni di ciascun Manuale del Giocatore.
3. Tutte le tabelle 3.5 di incantesimi giornalieri, bonus da caratteristica, incantesimi conosciuti e preparazione; gradi suddivisi per specializzazioni e verifica dei punti spesi.
4. Multiclasse, classi di prestigio 3.5, cammini leggendari e destini epici 4ª, scelte avanzate e tutti i privilegi fino ai livelli massimi.
5. Effetti automatici di incantesimi, poteri, condizioni, talenti, equipaggiamento magico, maestrie e interazioni tra capacità.
6. Risoluzione completa di attacchi specifici, critici, resistenze, movimento, copertura, prove contrapposte, concentrazione e morte in ogni caso speciale.
7. Bestiari completi e tutte le procedure del Manuale del Dungeon Master: creazione e valutazione incontri, tesori, pericoli, oggetti e avanzamento del gruppo.

Queste voci richiedono acquisizione e verifica dei dati del relativo manuale e test di esempi concreti. Le fonti pubbliche consultate, in particolare gli SRD, non contengono tutte le opzioni dei manuali base. Non si deve marcare una voce come completa solo perché esiste un campo per inserirla manualmente.

## Verifiche

I test di dominio coprono le differenze di creazione, progressione, salvezze/difese, slot, riposi, tiri contro morte, archivio, persistenza e personalizzazioni. I test Playwright coprono creazione dell'ultima edizione, passaggio tra schede senza conversione, PF negativi dopo ricaricamento, impulsi di 4ª, avanzamento, larghezza mobile e stampa PDF. Questi test verificano il perimetro implementato; non attestano l'intero contenuto dei manuali.
