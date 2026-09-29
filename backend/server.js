const express = require('express')
const Database = require('better-sqlite3')  
const cors = require('cors')


const app = express()


const db = new Database('database.db')  
/*CREAZIONE TABELLA*/
db.prepare(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    category TEXT NOT NULL
  )
`).run() 

/* CREAZIONE TABELLA USERS */
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )
`).run()


const validCategories = [
  'Da classificare',
  'Licenze',
  'Infrastrutture',
  'Consulenze',
  'Attività di formazione',
  'Software',
  'Hardware',
  'Rete',
  'Account',
  'Accesso ai servizi',
  'Altro'
]


// AGGIUNTA USER_ID ALLA TABELLA REQUESTS
try {
  db.prepare(`
    ALTER TABLE requests
    ADD COLUMN user_id INTEGER
  `).run()

  console.log('Colonna user_id aggiunta')
} catch (error) {
}

/* CREAZIONE AMMINISTRATORE */
const adminExists = db.prepare(`
  SELECT * FROM users
  WHERE role = 'admin'
`).get()

if (!adminExists) {
  db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `).run(
    'Admin',
    'admin@tesi.it',
    'admin123',
    'admin'
  )

  console.log('Amministratore creato')
}

/*INSERIMENTO*/
const insertRequest = db.prepare(`
  INSERT INTO requests (title, description, status, category, user_id)
  VALUES (?, ?, ?, ?, ?)
`)


app.use(cors())
app.use(express.json())  //permette a Express di leggere i dati JSON che arriveranno nelle richieste.


app.get('/', (req, res) => {
  res.send('Il backend funziona.')
})



/* REGISTRAZIONE UTENTE */
app.post('/api/register', async (req, res) => {

  const { name, email, password } = req.body

  /* CONTROLLO CAMPI OBBLIGATORI */
  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'Il nome è obbligatorio'
    })
  }

  if (!email || email.trim() === '') {
    return res.status(400).json({
      error: 'L\'email è obbligatoria'
    })
  }

  if (!password || password.trim() === '') {
    return res.status(400).json({
      error: 'La password è obbligatoria'
    })
  }

  /* CONTROLLO EMAIL GIÀ ESISTENTE */
  const existingUser = db.prepare(`
    SELECT * FROM users
    WHERE email = ?
  `).get(email.trim())

  if (existingUser) {
    return res.status(400).json({
      error: 'Email già registrata'
    })
  }


/* CREAZIONE UTENTE */
const result = db.prepare(`
  INSERT INTO users (name, email, password, role)
  VALUES (?, ?, ?, ?)
`).run(
  name.trim(),
  email.trim(),
  password,
  'user'
)

  const newUser = {
    id: result.lastInsertRowid,
    name: name.trim(),
    email: email.trim(),
    role: 'user'
  }

  console.log('Nuovo utente registrato:', newUser)

  res.json(newUser)
})

/* LOGIN*/
app.post('/api/login', (req, res) => {

  const { email, password } = req.body

  // Controlliamo che email e password siano presenti
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email e password sono obbligatorie'
    })
  }

  // Cerchiamo l'utente nel database
  const user = db.prepare(`
  SELECT * FROM users
  WHERE email = ? AND password = ?
  `).get(email, password)

  console.log("Utente trovato:", user)

  if (!user) {
    return res.status(401).json({
      error: 'Email o password non corrette'
  })
}

  // Login effettuato
  res.json({
    message: 'Login effettuato con successo',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})


/*1) REACT INVIA IL FORM (POST) E SI INSERISCONO I DATI NEL DATABASE*/
app.post('/api/requests',async (req, res) => {
  console.log('Dati ricevuti dal frontend:', req.body)

  const { title, description, user_id } = req.body

  /* VALIDAZIONE DEL TITOLO */
  if (!title || title.trim() === '') {
    return res.status(400).json({
      error: 'Il titolo è obbligatorio'
    })
  }

  if (title.trim().length < 5) {
    return res.status(400).json({
      error: 'Il titolo deve contenere almeno 5 caratteri'
    })
  }

  if (title.trim().length > 100) {
    return res.status(400).json({
      error: 'Il titolo può contenere massimo 100 caratteri'
    })
  }

  /* VALIDAZIONE DELLA DESCRIZIONE */
  if (!description || description.trim() === '') {
    return res.status(400).json({
      error: 'La descrizione è obbligatoria'
    })
  }

  if (description.trim().length < 10) {
    return res.status(400).json({
      error: 'La descrizione deve contenere almeno 10 caratteri'
    })
  }

  if (description.trim().length > 500) {
    return res.status(400).json({
      error: 'La descrizione può contenere massimo 500 caratteri'
    })
  }

  if (!user_id) {
  return res.status(401).json({
    error: 'Utente non autenticato'
  })
}

/* VALORI AUTOMATICI */
const status = 'Nuova'

/* CLASSIFICAZIONE CON LLM */
const prompt = `
Devi classificare una richiesta di servizio digitale.

Titolo:
${title}

Descrizione:
${description}

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

Rispondi solamente con il nome della categoria.
Non aggiungere spiegazioni.
`

let category

try {

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.2:3b',
      prompt: prompt,
      stream: false
    })
  })

  if (!response.ok) {
    return res.status(500).json({
      error: 'Errore nella comunicazione con il modello LLM'
    })
  }

  const data = await response.json()

  category = data.response.trim()

  category = category.replace('.', '')

  if (!validCategories.includes(category)) {
    category = 'Altro'
  }

  console.log('Categoria suggerita dall\'LLM:', category)

} catch (error) {

  console.error('Errore Ollama:', error)

  return res.status(500).json({
    error: 'Impossibile utilizzare il modello LLM'
  })
}

/* SALVIAMO LA RICHIESTA NEL DATABASE */

const result = insertRequest.run(
  title,
  description,
  status,
  category,
  user_id
)

const newRequest = {
  id: result.lastInsertRowid,
  title,
  description,
  status,
  category,
  user_id
}

console.log('Nuova richiesta salvata:', newRequest)

res.json(newRequest)
})



/*2) GET RITORNA TUTTE LE RICHIESTE PRESENTI IN TABELLA REQUESTS */
app.get('/api/requests', (req, res) => {

  console.log('ID UTENTE RICEVUTO:', req.headers['x-user-id'])

  // Recuperiamo l'ID dell'utente dall'header
  const userId = req.headers['x-user-id']

  // Controlliamo che l'ID sia presente
  if (!userId) {
    return res.status(401).json({
      error: 'Utente non autenticato'
    })
  }

  // Cerchiamo l'utente nel database
  const user = db.prepare(`
    SELECT * FROM users
    WHERE id = ?
  `).get(userId)

  // Controlliamo che l'utente esista
  if (!user) {
    return res.status(401).json({
      error: 'Utente non trovato'
    })
  }

  // Se è admin vede tutte le richieste
  if (user.role === 'admin') {

    const requests = db.prepare(`
      SELECT * FROM requests
    `).all()

    return res.json(requests)
  }

  // Se è un normale utente vede solo le proprie richieste
  const requests = db.prepare(`
    SELECT * FROM requests
    WHERE user_id = ?
  `).all(userId)

  res.json(requests)
})


/*DELETE*/
app.delete('/api/requests/:id', (req, res) => {

  const id = req.params.id

  // Recuperiamo l'ID dell'utente dall'header
  const userId = req.headers['x-user-id']

  // Controlliamo che sia presente
  if (!userId) {
    return res.status(401).json({
      error: 'Utente non autenticato'
    })
  }

  // Cerchiamo l'utente nel database
  const user = db.prepare(`
    SELECT * FROM users
    WHERE id = ?
  `).get(userId)

  // Se l'utente non esiste
  if (!user) {
    return res.status(401).json({
      error: 'Utente non trovato'
    })
  }

  // Controlliamo il ruolo
  if (user.role !== 'admin') {
    return res.status(403).json({
      error: 'Non hai i permessi per eliminare questa richiesta'
    })
  }

  // Se è admin, eliminiamo la richiesta
  const result = db.prepare(`
    DELETE FROM requests
    WHERE id = ?
  `).run(id)

  if (result.changes === 0) {
    return res.status(404).json({
      error: 'Richiesta non trovata'
    })
  }

  res.json({
    message: 'Richiesta eliminata',
    id: id
  })
})

/*UPDATE STATO*/
app.patch('/api/requests/:id', (req, res) => {  //Quando arriva una richiesta HTTP di tipo PATCH a /api/requests/qualcosa, esegui questa funzione
  const id = req.params.id  //abbiamo recuperato l'ID della richiesta che vogliamo modificare.
  const { status } = req.body  //recuperiamo il dato che React ci manda nel corpo della richiesta.

  const validStatuses = [
    'Nuova',
    'In lavorazione',
    'Risolta'
  ]

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Stato non valido'
    })
  }

   // Recuperiamo l'ID dell'utente dall'header
    const userId = req.headers['x-user-id']
  
    // Controlliamo che l'ID sia presente
    if (!userId) {
      return res.status(401).json({
        error: 'Utente non autenticato'
      })
    }

   // Cerchiamo l'utente nel database
  const user = db.prepare(`
    SELECT * FROM users
    WHERE id = ?
  `).get(userId)

  // Controlliamo che l'utente esista
  if (!user) {
    return res.status(401).json({
      error: 'Utente non trovato'
    })
  }

  // Controlliamo il ruolo
  if (user.role !== 'admin') {
    return res.status(403).json({
      error: 'Non hai i permessi per modificare lo stato'
    })
  }

  //Aggiorniamo lo stato
  const result = db.prepare(`   
    UPDATE requests
    SET status = ?
    WHERE id = ?
  `).run(status, id)   //Modifica la tabella requests e cambia lo status della richiesta con questo ID.

  if (result.changes === 0) {   //se le righe che sono state modificate sono 0
    return res.status(404).json({
      error: 'Richiesta non trovata'
    })
  }

  //Recuperiamo la richiesta aggiornata
  const updatedRequest = db.prepare(`
    SELECT * FROM requests
    WHERE id = ?
  `).get(id)    //Ora che ho modificato la richiesta, recuperamela dal database.

  res.json(updatedRequest)   //manda al frontend la richiesta aggiornata.
})


/* UPDATE CATEGORIA */
app.patch('/api/requests/:id/category', (req, res) => {

  const id = req.params.id
  const { category } = req.body

  if (!validCategories.includes(category)) {
    return res.status(400).json({
      error: 'Categoria non valida'
    })
  }

  // Recuperiamo l'ID dell'utente dall'header
  const userId = req.headers['x-user-id']

  // Controlliamo che l'ID sia presente
  if (!userId) {
    return res.status(401).json({
      error: 'Utente non autenticato'
    })
  }

  // Cerchiamo l'utente nel database
  const user = db.prepare(`
    SELECT * FROM users
    WHERE id = ?
  `).get(userId)

  // Controlliamo che l'utente esista
  if (!user) {
    return res.status(401).json({
      error: 'Utente non trovato'
    })
  }

  // Controlliamo il ruolo
  if (user.role !== 'admin') {
    return res.status(403).json({
      error: 'Non hai i permessi per modificare la categoria'
    })
  }

  // Aggiorniamo la categoria
  const result = db.prepare(`
    UPDATE requests
    SET category = ?
    WHERE id = ?
  `).run(category, id)

  if (result.changes === 0) {
    return res.status(404).json({
      error: 'Richiesta non trovata'
    })
  }

  // Recuperiamo la richiesta aggiornata
  const updatedRequest = db.prepare(`
    SELECT * FROM requests
    WHERE id = ?
  `).get(id)

  res.json(updatedRequest)
})


app.listen(3000, () => {
  console.log('Server avviato sulla porta 3000')
})
