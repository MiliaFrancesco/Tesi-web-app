const express = require('express')
const Database = require('better-sqlite3')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const db = new Database('database.db')

const JWT_SECRET = 'chiave_segreta_tesi_unict_2026_super_sicura'

/* CREAZIONE TABELLA REQUESTS */
db.prepare(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    category TEXT NOT NULL,
    user_id INTEGER
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
  'Da classificare', 'Licenze', 'Infrastrutture', 'Consulenze',
  'Attività di formazione', 'Software', 'Hardware', 'Rete',
  'Account', 'Accesso ai servizi', 'Altro'
]

/* CREAZIONE AMMINISTRATORE (Password Hashed) */
const adminExists = db.prepare(`SELECT * FROM users WHERE role = 'admin'`).get()
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10)
  db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `).run('Admin', 'admin@tesi.it', hashedPassword, 'admin')
  console.log('Amministratore creato con password cifrata')
}

/* PREPARED STATEMENTS */
const insertRequest = db.prepare(`
  INSERT INTO requests (title, description, status, category, user_id)
  VALUES (?, ?, ?, ?, ?)
`)

app.use(cors())
app.use(express.json())

/* MIDDLEWARE AUTENTICAZIONE JWT */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Accesso negato: Token mancante' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido o scaduto' })
    }
    req.user = user // Salva i dati utente decodificati (id, email, role)
    next()
  })
}

app.get('/', (req, res) => {
  res.send('Il backend della Tesi funziona con JWT e Bcrypt.')
})

/* REGISTRAZIONE UTENTE */
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || name.trim() === '') return res.status(400).json({ error: 'Il nome è obbligatorio' })
  if (!email || email.trim() === '') return res.status(400).json({ error: "L'email è obbligatoria" })
  if (!password || password.trim() === '') return res.status(400).json({ error: 'La password è obbligatoria' })

  const existingUser = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.trim())
  if (existingUser) return res.status(400).json({ error: 'Email già registrata' })

  // Hashing della password con bcrypt (10 rounds)
  const hashedPassword = bcrypt.hashSync(password, 10)

  const result = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), email.trim(), hashedPassword, 'user')

  const newUser = {
    id: result.lastInsertRowid,
    name: name.trim(),
    email: email.trim(),
    role: 'user'
  }

  // Generazione Token JWT
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({ user: newUser, token })
})

/* LOGIN UTENTE */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e password obbligatorie' })
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.trim())
  if (!user) {
    return res.status(401).json({ error: 'Credenziali non valide' })
  }

  // Verifica della password con bcrypt
  const validPassword = bcrypt.compareSync(password, user.password)
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenziali non valide' })
  }

  // Generazione Token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({
    message: 'Login effettuato con successo',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
})

/* AGGIUNTA NUOVA RICHIESTA */
app.post('/api/requests', authenticateToken, async (req, res) => {
  const { title, description } = req.body
  const userId = req.user.id // Recuperato in modo sicuro dal token JWT

  if (!title || title.trim().length < 5 || title.trim().length > 100) {
    return res.status(400).json({ error: 'Titolo non valido (5-100 caratteri)' })
  }
  if (!description || description.trim().length < 10 || description.trim().length > 500) {
    return res.status(400).json({ error: 'Descrizione non valida (10-500 caratteri)' })
  }

  const prompt = `
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

  let category = 'Da classificare'

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt: prompt,
        format: 'json',
        options: { temperature: 0.0 },
        stream: false
      })
    })

    if (response.ok) {
      const data = await response.json()
      const parsedResponse = JSON.parse(data.response)
      const suggestedCategory = parsedResponse.category || parsedResponse.categoria
      if (suggestedCategory && validCategories.includes(suggestedCategory)) {
        category = suggestedCategory
      }
    }
  } catch (error) {
    console.error('Errore classificazione LLM:', error)
  }

  const result = insertRequest.run(title, description, 'Nuova', category, userId)

  res.json({
    id: result.lastInsertRowid,
    title,
    description,
    status: 'Nuova',
    category,
    user_id: userId
  })
})

/* GET RICHIESTE */
app.get('/api/requests', authenticateToken, (req, res) => {
  const user = req.user

  if (user.role === 'admin') {
    const requests = db.prepare(`SELECT * FROM requests`).all()
    return res.json(requests)
  }

  const requests = db.prepare(`SELECT * FROM requests WHERE user_id = ?`).all(user.id)
  res.json(requests)
})

/* DELETE RICHIESTA */
app.delete('/api/requests/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permessi insufficienti' })
  }

  const result = db.prepare(`DELETE FROM requests WHERE id = ?`).run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Richiesta non trovata' })

  res.json({ message: 'Richiesta eliminata', id: req.params.id })
})

/* UPDATE STATO */
app.patch('/api/requests/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permessi insufficienti' })
  }

  const { status } = req.body
  const validStatuses = ['Nuova', 'In lavorazione', 'Risolta']
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Stato non valido' })

  const result = db.prepare(`UPDATE requests SET status = ? WHERE id = ?`).run(status, req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Richiesta non trovata' })

  const updated = db.prepare(`SELECT * FROM requests WHERE id = ?`).get(req.params.id)
  res.json(updated)
})

/* UPDATE CATEGORIA */
app.patch('/api/requests/:id/category', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permessi insufficienti' })
  }

  const { category } = req.body
  if (!validCategories.includes(category)) return res.status(400).json({ error: 'Categoria non valida' })

  const result = db.prepare(`UPDATE requests SET category = ? WHERE id = ?`).run(category, req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: 'Richiesta non trovata' })

  const updated = db.prepare(`SELECT * FROM requests WHERE id = ?`).get(req.params.id)
  res.json(updated)
})

app.listen(3000, () => {
  console.log('Server in ascolto sulla porta 3000 con JWT e Bcrypt attivi')
})
