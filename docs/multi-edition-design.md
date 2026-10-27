# Supporto di più edizioni D&D

## Requisiti confermati

Supportare le edizioni da D&D 3.5 in avanti: 3.5, 4ª, 5ª 2014 e revisione 2024, indicata attualmente come 5.5e da D&D Beyond. L'ultima versione è il valore predefinito per nuovi personaggi. Il cambio di regolamento deve produrre comportamenti reali, non soltanto un'etichetta diversa.

Perimetro confermato dall'utente: i manuali base di ciascuna edizione, senza supplementi. Il supporto completo di questo perimetro rimane da ultimare. I motori core e le interfacce per le quattro edizioni sono ora implementati; la copertura effettiva è descritta in [edition-coverage.md](edition-coverage.md).

## Fonti verificate

- [SRD ufficiali di Wizards of the Coast](https://www.dndbeyond.com/srd): 5.1 per le regole 2014 e 5.2.1 per la revisione 2024, anche in italiano.
- [Etichette di edizione attuali](https://www.dndbeyond.com/changelog/): dal 2 marzo 2026 D&D Beyond distingue 5e 2014 e 5.5e 2024. Il cambio del nome non aggiunge un'ulteriore edizione da implementare.
- [SRD 3.5, statistiche di combattimento](https://www.d20srd.org/indexes/combat.htm): BAB, tre tiri salvezza, attacchi di contatto e colto alla sprovvista.
- [SRD 3.5, azioni](https://www.d20srd.org/srd/combat/actionsInCombat.htm): differenze fra attacco e attacco completo e uso delle azioni.
- [Scheda ufficiale 2014](https://media.wizards.com/2016/dnd/downloads/5E_CharacterSheet_Fillable.pdf).
- [Scheda ufficiale 2024](https://media.dndbeyond.com/compendium-images/phb/downloads/DnD_2024_Character-Sheet.pdf).

Per la 4ª edizione serve completare il reperimento e la verifica delle fonti del perimetro scelto. Il suo documento SRD non va considerato automaticamente equivalente per contenuti agli SRD della 5ª.

## Modello dei dati

Ogni personaggio memorizza `editionId`, `rulesVersion` e `schemaVersion`. I dati di creazione restano distinti dai valori calcolati e dallo stato della sessione. Ogni scelta di classe, livello, origine, talento, potere, incantesimo e oggetto conserva il proprio identificatore e la fonte.

I salvataggi attuali restano esplicitamente schede della demo 5e 2014, senza essere convertiti silenziosamente al nuovo predefinito. La preferenza dell'ultima edizione riguarda le nuove creazioni. Non si possono copiare statistiche numeriche da un'edizione all'altra presentandole come una conversione valida. Un cambio su un personaggio esistente deve aprire una ricostruzione guidata in una copia, mantenendo l'originale.

Ogni incontro del DM ha un'edizione propria. Un partecipante non può ricevere automaticamente regole di un altro sistema. La stampa e l'esportazione indicano edizione e versione delle regole.

## Motori separati

| Sistema   | Creazione e avanzamento                                                    | Combattimento e risorse                                                                                                      |
| --------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 3.5       | Classi/livelli, gradi abilità, talenti e prerequisiti, multiclasse         | BAB/attacchi iterativi, Tempra/Riflessi/Volontà, CA normale/contatto/colto alla sprovvista, azioni e incantesimi giornalieri |
| 4ª        | Ruolo/classe, addestramento, talenti, poteri e progressione specifica      | CA e difese, economia delle azioni, poteri a volontà/incontro/giornalieri, impulsi curativi e riposi                         |
| 5ª 2014   | Origine, classe/sottoclasse, background, competenze, talenti e multiclasse | Bonus competenza, sei salvezze, azione/bonus/reazione, slot e risorse, riposi, condizioni, ispirazione                       |
| 5.5e 2024 | Specie, background e talenti d'origine, nuove progressioni e scelte        | Regole aggiornate di classe, incantesimi, maestrie, riposi, condizioni e ispirazione eroica                                  |

Una singola funzione di calcolo non deve applicare le regole 5e ai quattro sistemi. L'interfaccia comune richiama un adattatore di edizione con operazioni di creazione, derivazione statistiche, verifica scelte, avanzamento, uso risorse, tiri e riposi. Le operazioni non disponibili restituiscono una mancanza esplicita, non un risultato inventato.

## Copertura e validazione

Per ciascuna edizione mantenere un elenco dei requisiti ricavati dalle fonti: regole generali, classi, sottoclassi o equivalenti, origini, abilità, talenti, incantesimi/poteri, equipaggiamento, condizioni e mostri se compresi nel perimetro. Ogni elemento distingue consultazione, inserimento manuale e automazione verificata. Nessun badge “completo” prima che tutte le voci del perimetro concordato siano state implementate e verificate.

Verifiche necessarie: personaggi campione di ciascuna classe ai livelli di scelta, confini di bonus e risorse, prerequisiti e multiclasse, transizioni di livello, riposi parziali e completi, condizioni, salvataggi e migrazioni. Le formule vanno testate con esempi calcolati dalle fonti, oltre ai test dell'interfaccia.

## Correzione mobile già implementata

La scheda corrente è una vista adattata, non un PDF ufficiale. Su telefoni e tablet, fino a 960 px, le colonne sono impilate e i valori hanno una dimensione leggibile. Le sezioni sono raggiungibili da un indice, l'inventario diventa una lista e non è necessario lo scorrimento orizzontale. Le regole di adattamento sono limitate a `screen`; la stampa A4 conserva il layout cartaceo. I modelli ufficiali vuoti 2014 e 2024 sono collegati separatamente, senza spacciarli per esportazioni dei dati del personaggio.
