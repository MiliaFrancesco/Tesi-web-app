const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE_PATH = path.join(__dirname, 'dataset_richieste_IT.csv');

//Definizioni Prompt
const PROMPTS = {
  // PROMPT 1: Simple (Solo elenco categorie)
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

  // PROMPT 2: Elenco categorie + breve spiegazione
  with_definitions: (title, description) => `
Devi classificare una richiesta di servizio digitale in base alle seguenti categorie:

- Licenze: Richiesta di licenze software, chiavi di attivazione, rinnovi abbonamenti.
- Infrastrutture: Server fisici/virtuali, UPS, rack, condizionamento, backup hardware.
- Consulenze: Richieste di pareri tecnici, architettura, sicurezza, conformità WCAG/GDPR.
- Attività di formazione: Corsi, workshop, training, lezioni su tecnologie o software.
- Software: Malfunzionamenti o errori di programmi installati, browser, OS, app aziendali.
- Hardware: Problemi fisici o richieste di periferiche (mouse, monitor, tastiere, stampanti, PC).
- Rete: Connettività Wi-Fi/LAN, problemi VPN, firewall, IP, DNS, lentezza internet.
- Account: Reset password, creazione/sblocco utenti, credenziali, alias email.
- Accesso ai servizi: Permessi di accesso a cartelle condivise, GitHub, portali, AWS, Jira.
- Altro: Richieste non IT (badge, sedie, cancelleria, pulizie, manutenzione impianti).
- Da classificare: Richieste generiche, incomplete, incomprensibili o prive di contesto chiaro.

Titolo: ${title}
Descrizione: ${description}

Rispondi solamente con il nome esatto di una delle categorie elencate.
Non aggiungere spiegazioni.
`,

  // PROMPT 3: Few-Shot (Elenco categorie + esempi pratici)
  few_shot: (title, description) => `
Devi classificare una richiesta di servizio digitale.

Categorie disponibili:
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

Esempi:
Titolo: Rinnovo licenza AutoCAD -> Categoria: Licenze
Titolo: Mouse rotto -> Categoria: Hardware
Titolo: Reset password dominio -> Categoria: Account
Titolo: Non funziona nulla -> Categoria: Da classificare

Ora classifica la seguente richiesta:
Titolo: ${title}
Descrizione: ${description}

Rispondi solamente con il nome esatto della categoria.
Non aggiungere spiegazioni.
`
};

const VALID_CATEGORIES = [
  'Licenze', 'Infrastrutture', 'Consulenze', 'Attività di formazione',
  'Software', 'Hardware', 'Rete', 'Account', 'Accesso ai servizi',
  'Altro', 'Da classificare'
];

// Funzione per caricare il dataset CSV
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

// Funzione per interpellare Ollama
async function classifyWithOllama(prompt) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) return 'ERRORE_API';

    const data = await response.json();
    let category = data.response.trim().replace('.', '');

    // Pulizia da eventuali virgolette o formattazioni residue del modello
    category = category.replace(/^["']|["']$/g, '');

    if (!VALID_CATEGORIES.includes(category)) {
      return 'NON_VALIDA (' + category + ')';
    }

    return category;
  } catch (error) {
    return 'ERRORE_CONNESSIONE';
  }
}

// Esecuzione del test per una specifica variante di prompt
async function runExperiment(experimentName, dataset, promptGenerator) {
  console.log(`\n========================================`);
  console.log(`AVVIO ESPERIMENTO: ${experimentName.toUpperCase()}`);
  console.log(`========================================\n`);

  let correct = 0;
  const errors = [];
  const total = dataset.length;

  for (let i = 0; i < total; i++) {
    const item = dataset[i];
    const prompt = promptGenerator(item.titolo, item.descrizione);
    const predictedCategory = await classifyWithOllama(prompt);
    const isCorrect = predictedCategory === item.categoria_reale;

    if (isCorrect) {
      correct++;
    } else {
      errors.push({
        id: i + 1,
        titolo: item.titolo,
        reale: item.categoria_reale,
        predetta: predictedCategory
      });
    }

    // Avanzamento a schermo
    process.stdout.write(`Progresso: ${i + 1}/${total} | Corrette: ${correct} | Errate: ${errors.length}\r`);
  }

  const accuracy = ((correct / total) * 100).toFixed(2);

  console.log(`\n\nRISULTATI FINALI [${experimentName}]:`);
  console.log(`----------------------------------------`);
  console.log(`Totale richieste: ${total}`);
  console.log(`Correttamente classificate: ${correct}`);
  console.log(`Errate/Fuori contesto: ${errors.length}`);
  console.log(`ACCURACY: ${accuracy}%\n`);

  if (errors.length > 0) {
    console.log(`ANALISI ERRORI (${errors.length}):`);
    errors.forEach(err => {
      console.log(` - [#${err.id}] "${err.titolo}" -> Reale: [${err.reale}] | Predetta: [${err.predetta}]`);
    });
  }

  return { experimentName, accuracy, correct, total, errors };
}

async function main() {
  console.log('Caricamento dataset...');
  const dataset = await loadDataset();
  console.log(`Dataset caricato con successo (${dataset.length} esempi).\n`);

  // Assicurati che Ollama sia attivo in locale prima di avviare
  console.log('Verifica Ollama in corso...');

  // Seleziona quale esperimento eseguire. Eseguiamone uno alla volta per chiarezza!
  // Opzioni: 'simple', 'with_definitions', 'few_shot'
  const promptKey = process.argv[2] || 'simple';

  if (!PROMPTS[promptKey]) {
    console.log(`Variante non trovata. Usa una tra: simple, with_definitions, few_shot`);
    process.exit(1);
  }

  await runExperiment(promptKey, dataset, PROMPTS[promptKey]);
}

main();
