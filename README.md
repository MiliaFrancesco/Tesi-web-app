# Piattaforma Web per la Gestione delle Richieste di servizi digitali con Classificazione Automatica tramite LLM

**Tesi di Laurea in Ingegneria Informatica**  
**Università degli Studi di Catania (UNICT)**  
**Candidato:** Francesco Milia  
**Relatore:** Prof. Concetto Spampinato  

---

## Descrizione del Progetto

La piattaforma è un'applicazione web Full-Stack progettata per la gestione delle richieste da parte degli utenti sui servizi digitali. Il sistema integra un modello di linguaggio di grandi dimensioni (**LLM**) eseguito in locale tramite **Ollama** (**Llama 3.2 3B**) per analizzare in tempo reale titolo e descrizione delle richieste, assegnando automaticamente la categoria più pertinente tra le 11 previste.

### Caratteristiche Principali
- **Classificazione AI Deterministica:** Utilizzo di Llama 3.2 3B con `temperature: 0.0` e modalità **Structured JSON Output** per garantire risposte strutturate e stabili.
- **Sicurezza Avanzata:** Autenticazione basata su **JSON Web Token (JWT)** e cifratura delle password nel database tramite algoritmo **Bcrypt**.
- **Gestione Ruoli (RBAC):** Interfaccia adattiva per Utente Standard (creazione e visualizzazione delle proprie richiestet) e Amministratore (gestione avanzata, cambio stato, riclassificazione ed eliminazione).
- **Valutazione Scientifica:** Suite di test automatizzata per la misurazione di **Accuracy**, **Precision**, **Recall**, **Macro-F1 Score** e generazione della **Matrice di Confusione**.


---

## Risultati Sperimentali e Valutazione Modello

La valutazione quantitativa del classificatore automatizzato (**Llama 3.2 3B**) è stata condotta su un dataset di benchmark di **110 richieste IT reali**, confrontando le predizioni del modello con la *Ground Truth*.

### Configurazione di Produzione (`temperature: 0.0` + Structured JSON)
- **Accuracy Complessiva:** `65.45%` (72/110 richieste corrette)
- **Macro-F1 Score:** `0.6367`
- **Errori di Sintassi/Formato (`NON_VALIDA`):** `0` (100% di conformità allo schema JSON)

### Dettaglio Metriche per Categoria

| Categoria | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: |
| **Account** | 0.90 | 0.90 | **0.90** |
| **Attività di formazione** | 1.00 | 0.80 | **0.89** |
| **Infrastrutture** | 0.67 | 0.80 | **0.73** |
| **Licenze** | 0.56 | 1.00 | **0.71** |
| **Hardware** | 0.53 | 1.00 | **0.69** |
| **Consulenze** | 0.64 | 0.70 | **0.67** |
| **Rete** | 1.00 | 0.50 | **0.67** |
| **Da classificare** | 0.71 | 0.50 | **0.59** |
| **Accesso ai servizi** | 0.42 | 0.50 | **0.45** |
| **Altro** | 0.60 | 0.30 | **0.40** |
| **Software** | 0.67 | 0.20 | **0.31** |


---

## Architettura e Stack Tecnologico

- **Frontend:** React, Vite, Material UI (MUI)
- **Backend:** Node.js, Express.js
- **Database:** SQLite3 (tramite `better-sqlite3`)
- **Autenticazione & Sicurezza:** `jsonwebtoken`, `bcryptjs`
- **Integrazione LLM:** Ollama API (`llama3.2:3b` in JSON Mode)

---

## Struttura del Repository

```text
.
├── backend/
│   ├── esperimenti-llm/
│   │   ├── dataset_richieste_IT.csv   # Dataset di 110 richieste con Ground Truth
│   │   └── run_experiments.js         # Script per il calcolo delle metriche e della Matrice di Confusione
│   ├── server.js                      # Server Express.js e integrazione API Ollama
│   ├── database.db                    # Database SQLite (generato automaticamente)
│   └── package.json
├── react-prova/                       # Codice sorgente del Frontend React
│   ├── src/
│   │   ├── components/
|   |   |   ├── Navbar.jsx         # Barra di navigazione in alto
|   │   |   |── RequestCard.jsx    # Card della singola richiesta
|   |   |   |── Login.jsx
|   |   |   |── Register.jsx
│   │   ├── pages/                 # Schermate/Viste intere della piattaforma
|   |   |   ├── LoginPage.jsx      # Pagina del form di accesso
|   │   |   ├── RegisterPage.jsx   # Pagina del form di registrazione
|   │   |   └── RequestsPage.jsx   # Pagina principale con lista ed inserimento richieste
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
