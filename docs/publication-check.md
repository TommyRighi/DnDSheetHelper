# Controlli prima della pubblicazione

Verifica del 27 ottobre 2026 sulla copia locale preparata per GitHub.

- Gitleaks eseguito sulla cronologia locale e su una copia dei soli file destinati al commit, senza segreti rilevati.
- Rimossi percorsi personali della macchina dalla documentazione. Gli screenshot delle prove restano locali.
- Esclusi `.env`, chiavi, dump, log, cache Supabase, profili desktop, `node_modules`, build, installer, risultati e trace dei test. `.env.example` contiene soltanto esempi senza credenziali.
- Controllati server statico, bridge Electron, importazioni dei backup e configurazione delle chiavi pubbliche. Il frontend rifiuta chiavi Supabase amministrative.
- Audit npm delle dipendenze di produzione senza vulnerabilità note al momento della verifica.
- 60 test unitari, 1 test del server statico e 25 test dell'interfaccia superati. I 2 test delle campagne online sono esclusi dalla suite generale quando manca Supabase; eseguiti separatamente, passano sia in sviluppo sia sulla build di produzione.
- Il database personale condiviso supera 46 test SQL e 17 controlli HTTP. Le migrazioni sono state rigiocate da zero sul solo stack locale personale.
- Corretta la sincronizzazione tra validazione di un invito e sostituzione del token. Aggiornati test dell'interfaccia che usavano vecchie etichette dei pulsanti.

La pubblicazione riguarda sorgenti e documentazione. Non include credenziali, database, dati del browser, installer o attivazione di servizi cloud. Non sono stati creati workflow di deploy automatico. Le regole D&D restano parziali e richiedono la verifica manuale descritta nella matrice di copertura. La build segnala ancora un bundle JavaScript superiore a 500 kB; la suddivisione del bundle resta un intervento futuro.

I controlli riducono il rischio di pubblicare dati riservati e verificano i percorsi coperti; non costituiscono una revisione completa di ogni comportamento dell'applicazione.
