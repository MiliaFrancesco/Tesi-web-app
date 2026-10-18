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
│   ├── database.db                    # Database SQLite 
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
