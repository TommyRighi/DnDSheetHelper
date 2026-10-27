# Catalogo e scelte durante la crescita del personaggio

Studio del 26 ottobre 2026. Proposta di prodotto e implementazione, da approvare prima di modificare i flussi. Le funzionalità descritte come proposta non sono ancora disponibili.

## Obiettivo

Durante la creazione e ogni avanzamento, capire cosa si ottiene, cosa si può scegliere e perché, leggendo la descrizione prima di decidere. Consultare e aggiungere anche opzioni di altre classi, origini o livelli. Le regole orientano la scelta; il tavolo può modificarle.

Per "abilità" distinguiamo competenze nelle prove, privilegi di classe, tratti di razza o specie, talenti, incantesimi e poteri. Hanno progressioni diverse e non vanno rappresentati come un'unica lista di cose da imparare.

## Situazione rilevata nel codice

La schermata principale in `src/main.jsx` contiene tre incantesimi fissi, con brevi descrizioni. Non sono le scelte persistenti del personaggio. Anche competenze e tratti sono in gran parte predefiniti. La procedura di creazione offre un ranger e quattro origini, senza selezione dei privilegi. Il level up aggiorna PF, dadi vita e slot di primo livello e rimanda al manuale per le altre scelte.

`src/rules/catalog.js` e `src/rules/engine.js` contengono una base per più edizioni, classi e calcoli, ma senza cataloghi di capacità, origini e incantesimi o una progressione completa delle scelte. Nel codice esaminato la schermata principale non importa quel motore. È presente anche un componente `CharacterCreator.jsx` separato: va integrato senza mantenere due procedure concorrenti.

`src/storage.js` valida e ricostruisce il salvataggio: aggiungere campi soltanto nell'interfaccia non basta, perché devono sopravvivere anche a importazione e ricaricamento. La scheda stampabile in `src/CharacterSheet.jsx` ha ancora privilegi dimostrativi e deve leggere le stesse selezioni della dashboard.

Questa analisi fotografa i file letti, alcuni dei quali sono già modificati o non tracciati. In implementazione occorre ricontrollare il lavoro presente prima di intervenire.

## Alternative

| Soluzione | Vantaggi | Limiti |
| --- | --- | --- |
| Liste separate in creazione, level up e biblioteca | Primo risultato semplice | Descrizioni duplicate, filtri e requisiti divergenti, manutenzione per ogni edizione |
| Catalogo condiviso con suggerimenti contestuali | Descrizioni coerenti, consultazione libera, progressioni riutilizzabili | Richiede dati strutturati e un modello delle selezioni |
| Costruttore che obbliga a rispettare tutte le regole | Impedisce molte combinazioni involontarie | Contrasta con la libertà richiesta; costoso per quattro edizioni |

Raccomandazione: catalogo condiviso con suggerimenti contestuali. La consultazione completa e l'aggiunta libera fanno parte dello stesso flusso.

## Esperienza proposta

### Biblioteca sempre disponibile

Una voce "Biblioteca" nella navigazione apre tutto il catalogo installato, anche senza iniziare una creazione o un avanzamento. Categorie: classi e sottoclassi, razze/specie, background, privilegi e tratti, talenti, incantesimi, poteri, competenze. La terminologia cambia in base all'edizione.

Ricerca per nome italiano e nome originale. Filtri combinabili per edizione, categoria, classe, sottoclasse, origine, livello e fonte. Nell'elenco degli incantesimi aggiungere scuola, tempo di lancio, concentrazione e rituale dove previsti. Un incantesimo comune a più classi conserva una sola voce per versione e più collegamenti.

La navigazione iniziale raggruppa per classe o razza/specie. La vista "Tutte le opzioni" mostra l'intero catalogo senza richiedere una classe. Il livello dell'incantesimo e il livello del personaggio hanno filtri ed etichette distinti.

Ogni voce apre la descrizione completa disponibile nella fonte, un riepilogo leggibile, provenienza, edizione e requisiti. Per un incantesimo mostra anche componenti, gittata, durata, bersagli ed eventuale crescita. Per un tratto mostra acquisizione, uso, recupero e miglioramenti. Gli effetti con risoluzione manuale devono essere riconoscibili.

Le azioni "Leggi", "Aggiungi alla scheda" e "Rimuovi dalla scheda" hanno effetti espliciti. Sfogliare un livello futuro non modifica il personaggio.

### Creazione

1. Scegli edizione, classe, eventuali scelte iniziali di sottoclasse, origine e background.
2. Leggi una presentazione delle alternative e una tabella della progressione completa. Si può cambiare livello di anteprima senza acquisirlo.
3. Il riepilogo del livello iniziale separa privilegi acquisiti, scelte disponibili, competenze e incantesimi.
4. Ogni gruppo spiega quante opzioni sono previste e da dove deriva la scelta. L'apertura della descrizione mantiene le selezioni già fatte.
5. "Sfoglia tutte le opzioni" apre lo stesso catalogo e consente aggiunte fuori dai requisiti.
6. Prima di creare, mostra tratti acquisiti, selezioni, deroghe e scelte lasciate in sospeso. Il tavolo può completarle successivamente.

### Avanzamento

Prima di confermare mostra un confronto tra livello attuale e successivo: valori numerici, nuovi privilegi, miglioramenti di capacità esistenti, nuove scelte e sostituzioni consentite. Le acquisizioni precedenti restano visibili ma distinte dalle novità.

Raggruppare per classe/sottoclasse, origine, background/talenti, incantesimi/poteri e altre aggiunte del tavolo. Non ogni origine concede qualcosa a ogni livello: una sezione senza novità deve dirlo, mostrando comunque i tratti già acquisiti. I miglioramenti di un privilegio aggiornano la stessa acquisizione invece di creare duplicati.

Le scelte rimangono in una bozza fino alla conferma. Annullare non cambia PF, risorse o capacità. La conferma salva l'intero avanzamento insieme; il riepilogo permette di riconoscere cosa è cambiato. Le scelte rinviate rimangono in un elenco "Da completare", riapribile dalla scheda.

### Regole come suggerimento

La vista contestuale mostra prima le opzioni previste dal regolamento selezionato. "Tutte le opzioni" resta sempre raggiungibile. Un requisito non soddisfatto produce una spiegazione, ad esempio "previsto per un'altra classe" o "richiede un livello superiore", senza disabilitare l'aggiunta.

La scelta può registrare una nota facoltativa del tavolo. Non serve un'approvazione del DM dentro l'app. Il completamento fuori dalle regole non richiede una seconda procedura di creazione.

Un'opzione di un'altra edizione può essere consultata e aggiunta come contenuto descrittivo, conservandone l'etichetta. Non applicare automaticamente formule, azioni o risorse appartenenti a quel sistema. Per usarla meccanicamente servono valori espliciti adattati al tavolo.

## Progressione e dati

Servono quattro elementi distinti:

- **Contenuti:** identificatore stabile, edizione, tipo, nomi, descrizione, fonte, versione e collegamenti a classi e origini.
- **Progressioni:** per classe, sottoclasse e origine indicano acquisizioni, scelte, quantità e miglioramenti a ciascun livello pertinente. Livello totale e livello nella classe restano distinti.
- **Selezioni del personaggio:** collegamento al contenuto, livello e origine dell'acquisizione, stato, eventuale deroga e personalizzazioni. Per gli incantesimi distinguere accesso, libro, conosciuti e preparati secondo l'edizione. Essere nella lista della classe non significa essere già appresi.
- **Effetti:** applicazione numerica separata dalla descrizione. Un tratto aggiunto non concede bonus impliciti finché il relativo effetto non è implementato e verificato.

Le condizioni dei requisiti devono avere struttura verificabile, non essere codice eseguibile o testo interpretato a intuito. L'esito distingue "previsto", "fuori requisiti" e "verifica manuale": un requisito non implementato non può diventare automaticamente soddisfatto.

Il modello deve prevedere più classi con livelli separati, pur potendo rilasciare prima la creazione monoclasse. In 4ª i poteri richiedono classificazione e sostituzioni proprie; in 3.5 competenze e talenti richiedono verifiche diverse dalla quinta edizione. Non riutilizzare una tabella universale dei livelli per tutti i sistemi.

Le selezioni e i contenuti personalizzati entrano in salvataggio, esportazione, importazione e stampa. Conservare versione e dati necessari alla lettura anche se un pacchetto viene rimosso; un aggiornamento del catalogo non riscrive silenziosamente una scelta personalizzata. Migrare i salvataggi della demo senza inventare selezioni che l'utente non ha effettuato.

## Fonti e copertura

Il catalogo iniziale consigliato usa gli SRD ufficiali 5.1 e 5.2.1, mantenendo separate le versioni 2014 e 2024. La pagina ufficiale offre anche SRD 5.2.1 in italiano. Gli SRD non contengono tutto ciò che appare nei manuali e supplementi; "tutto" nell'interfaccia deve indicare tutti i contenuti effettivamente inclusi. Fonte: [Wizards, SRD e FAQ](https://www.dndbeyond.com/srd).

Le regole di creazione descrivono nuove capacità in base ai livelli della classe; la preparazione e l'accesso agli incantesimi dipendono dai privilegi. Queste differenze motivano il modello proposto. Fonti: [creazione e avanzamento](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character), [incantesimi](https://www.dndbeyond.com/sources/dnd/br-2024/spells), [origini](https://www.dndbeyond.com/sources/dnd/br-2024/character-origins).

Per 3.5 l'indice delle classi di [d20 SRD](https://www.d20srd.org/indexes/classes.htm) è un riferimento da verificare insieme alle condizioni di distribuzione del pacchetto. Per 4ª manca ancora un corpus completo verificato nel progetto: non dichiararne la copertura solo perché sono presenti formule numeriche.

Il contenuto personalizzato deve permettere nome, descrizione, categoria, provenienza, requisiti indicativi e usi/recuperi. Una futura importazione di pacchetti può ampliare il catalogo. Ogni pacchetto deve esplicitare fonte, versione, attribuzione e copertura; la disponibilità online di un testo non basta a includerlo nell'app.

## Ordine di implementazione

1. Definire e validare il catalogo e le progressioni; collegare il motore per edizione alla UI. Preparare una matrice di copertura per classe, origine e livello.
2. Realizzare la biblioteca con descrizioni, ricerca, raggruppamenti e contenuti personalizzati. Completare il corpus del perimetro scelto, indicando esplicitamente eventuali lacune.
3. Riutilizzare selettore e descrizioni nella creazione e nel level up, con bozze, scelte in sospeso e aggiunte libere.
4. Collegare selezioni a scheda, stampa e salvataggi; verificare migrazioni e import/export.
5. Estendere l'automazione e gli altri corpus per edizione mantenendo separati consultazione, selezione e calcolo verificato.

La proposta conserva il supporto multi-edizione previsto in `multi-edition-design.md`; suggerisce solo di completare prima i cataloghi 2014/2024 per i quali esistono fonti ufficiali aperte verificate. Non riduce il requisito di supportare 3.5 e 4ª.

## Criteri di accettazione

- Ogni classe e origine del corpus dichiarato ha descrizioni e progressione fino al massimo previsto dall'edizione, inclusi livelli senza novità.
- La matrice confronta elementi attesi e presenti: un elenco numeroso non dimostra completezza.
- A ogni livello di scelta si vede cosa arriva automaticamente, cosa scegliere, quante scelte sono previste e cosa può essere rimandato.
- Un personaggio può leggere e acquisire un'opzione di un'altra classe senza blocchi; il motivo della deroga resta comprensibile.
- Un filtro non confonde livello della magia, livello totale e livello di classe. Una stessa magia condivisa non compare duplicata nella stessa versione.
- Conosciuti, preparati e disponibili rimangono distinti; slot e quantità di incantesimi selezionabili non sono intercambiabili.
- Cambiare classe nella bozza rivaluta le scelte incompatibili e chiede come conservarle; non le elimina silenziosamente.
- Annullare la creazione o l'avanzamento lascia invariato il personaggio. Confermare due volte non duplica le acquisizioni.
- Salvataggio, import/export e stampa conservano descrizioni personalizzate, fonti, deroghe, scelte in sospeso e acquisizioni precedenti.
- Su telefono ricerca, descrizione e selezione funzionano senza scorrimento orizzontale e senza perdere la bozza.

## Direzione proposta per l'approvazione

Biblioteca unica sempre accessibile, selezione ordinata per classe e origine, descrizioni complete, progressione consultabile a ogni livello e aggiunte libere con requisiti informativi. Primo corpus verificato SRD 2014/2024 con contenuti personalizzati; estensione 3.5 e 4ª per pacchetti verificati. L'implementazione dei flussi segue l'approvazione di questa direzione.
