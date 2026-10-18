const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE_PATH = path.join(__dirname, 'dataset_richieste_IT.csv');

// Definiamo i 4 prompt
const PROMPTS = {
  simple: (title, description) => `
Devi classificare una richiesta di servizio digitale.

Titolo: ${title}
Descrizione: ${description}

Scegli una sola categoria tra queste:
- Licenze
- Infrastrutture
- Consulenze
- Attività di formazione
- Software
- Hardware
- Rete
- Account
- Accesso ai servizi
- Altro
- Da classificare

Rispondi solamente con il nome della categoria.
Non aggiungere spiegazioni.
`,

  with_definitions: (title, description) => `
Devi classificare una richiesta di servizio digitale in base alle seguenti categorie:
- Licenze: Richiesta di licenze software, chiavi di attivazione.
- Infrastrutture: Server fisici/virtuali, UPS, rack, condizionamento.
- Consulenze: Richieste di pareri tecnici, architettura, sicurezza.
- Attività di formazione: Corsi, workshop, training, lezioni.
- Software: Malfunzionamenti o errori di programmi installati.
- Hardware: Problemi fisici o richieste di periferiche (mouse, PC).
- Rete: Connettività Wi-Fi/LAN, firewall, IP, lentezza internet.
- Account: Reset password, creazione utenti, credenziali.
- Accesso ai servizi: Permessi a cartelle condivise, portali.
- Altro: Richieste non IT.
- Da classificare: Richieste generiche o incomprensibili.

Titolo: ${title}
Descrizione: ${description}

Rispondi solamente con il nome esatto di una delle categorie elencate.
Non aggiungere spiegazioni.
`,

  few_shot: (title, description) => `
Devi classificare una richiesta di servizio digitale.
Categorie: Licenze, Infrastrutture, Consulenze, Attività di formazione, Software, Hardware, Rete, Account, Accesso ai servizi, Altro, Da classificare.

Esempi:
Titolo: Rinnovo licenza AutoCAD -> Categoria: Licenze
Titolo: Mouse rotto -> Categoria: Hardware
Titolo: Reset password -> Categoria: Account
Titolo: Non funziona nulla -> Categoria: Da classificare

Titolo: ${title}
Descrizione: ${description}

Rispondi solamente con il nome esatto della categoria.
`,

  // IL PROMPT EFFETTIVO USATO IN PRODUZIONE
  backend_prod: (title, description) => `
Sei un classificatore automatico di ticket IT.

Scegli la categoria esatta tra queste:
- Licenze
- Infrastrutture
- Consulenze
- Attività di formazione
- Software
- Hardware
- Rete
- Account
- Accesso ai servizi
- Altro
- Da classificare

REGOLE TASSATIVE:
1. Se il testo parla di mouse, tastiere, monitor o componenti fisici, usa "Hardware".
2. Se il testo è vago (es. "Aiuto", "Non funziona niente", "Urgente"), usa ESCLUSIVAMENTE "Da classificare".
3. Devi rispondere SOLO ed ESCLUSIVAMENTE con un oggetto JSON che contiene la chiave "category". Nessun altro campo è ammesso.

ESEMPIO DI RISPOSTA ATTESA:
{
  "category": "Hardware"
}

Richiesta da analizzare:
Titolo: ${title}
Descrizione: ${description}
`
};

const VALID_CATEGORIES = [
  'Licenze', 'Infrastrutture', 'Consulenze', 'Attività di formazione',
  'Software', 'Hardware', 'Rete', 'Account', 'Accesso ai servizi',
  'Altro', 'Da classificare'
];

function loadDataset() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function classifyWithOllama(promptText, isProd) {
  try {
    const bodyReq = {
      model: 'llama3.2:3b',
      prompt: promptText,
      stream: false,
      // PARAMETRI FONDAMENTALI PER LA TESI (Riproducibilità)
      options: {
        temperature: 0.0,
        top_p: 0.9
      }
    };

    // Forziamo il JSON mode
    if (isProd) {
      bodyReq.format = 'json';
    }

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyReq)
    });

    if (!response.ok) return 'ERRORE_API';
    const data = await response.json();
    let category = '';

    if (isProd) {
      try {
        const parsed = JSON.parse(data.response);
        category = parsed.category || parsed.categoria || 'Da classificare';
      } catch (e) {
        category = 'Da classificare'; // Fallback per JSON rotto
      }
    } else {
      category = data.response.trim().replace('.', '').replace(/^["']|["']$/g, '');
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return 'NON_VALIDA';
    }
    return category;
  } catch (error) {
    return 'ERRORE_CONNESSIONE';
  }
}

async function runExperiment(experimentName, dataset) {
  const isProd = experimentName === 'backend_prod';
  const promptGenerator = PROMPTS[experimentName];
  
  console.log(`\n========================================`);
  console.log(`ESPERIMENTO: ${experimentName.toUpperCase()} (Temp: 0.0)`);
  console.log(`========================================\n`);

  let correct = 0;
  const total = dataset.length;
  
  // Inizializzazione metriche per F1-Score e Matrice
  const metrics = {};
  const confusionMatrix = {};
  
  VALID_CATEGORIES.forEach(cat => {
    metrics[cat] = { TP: 0, FP: 0, FN: 0 };
    confusionMatrix[cat] = {};
    VALID_CATEGORIES.forEach(predCat => confusionMatrix[cat][predCat] = 0);
    confusionMatrix[cat]['NON_VALIDA'] = 0;
  });

  for (let i = 0; i < total; i++) {
    const item = dataset[i];
    const promptText = promptGenerator(item.titolo, item.descrizione);
    const predicted = await classifyWithOllama(promptText, isProd);
    const real = item.categoria_reale;

    // Popola la matrice di confusione (Riga: Reale, Colonna: Predetta)
    if(confusionMatrix[real] !== undefined) {
      if(confusionMatrix[real][predicted] !== undefined) {
         confusionMatrix[real][predicted]++;
      } else {
         confusionMatrix[real]['NON_VALIDA']++;
      }
    }

    // Calcolo TP, FP, FN per F1 Score
    if (predicted === real) {
      correct++;
      metrics[real].TP++;
    } else {
      metrics[real].FN++; // La categoria reale ha perso un "punto"
      if (metrics[predicted]) {
        metrics[predicted].FP++; // La categoria predetta ha guadagnato un "falso punto"
      }
    }
    
    process.stdout.write(`Progresso: ${i + 1}/${total} | Corrette: ${correct}\r`);
  }

  // Calcolo finale delle metriche F1
  let sumF1 = 0;
  let validCats = 0;
  const f1Results = [];

  for (const cat of VALID_CATEGORIES) {
    const { TP, FP, FN } = metrics[cat];
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1 = precision + recall > 0 ? 2 * ((precision * recall) / (precision + recall)) : 0;
    
    f1Results.push({ Categoria: cat, Precision: precision.toFixed(2), Recall: recall.toFixed(2), F1: f1.toFixed(2) });
    sumF1 += f1;
    validCats++;
  }

  const macroF1 = (sumF1 / validCats).toFixed(4);
  const accuracy = ((correct / total) * 100).toFixed(2);

  console.log(`\n\n--- RISULTATI GLOBALI ---`);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`Macro-F1 Score: ${macroF1}`);
  
  console.log(`\n--- F1-SCORE PER CATEGORIA ---`);
  console.table(f1Results);

  console.log(`\n--- MATRICE DI CONFUSIONE (Righe: Reali, Colonne: Predette) ---`);
  console.table(confusionMatrix);
}

async function main() {
  const dataset = await loadDataset();
  const promptKey = process.argv[2];

  if (!promptKey || !PROMPTS[promptKey]) {
    console.log(`Esegui con: node run_experiments.js [simple | with_definitions | few_shot | backend_prod]`);
    process.exit(1);
  }

  await runExperiment(promptKey, dataset);
}

main();
