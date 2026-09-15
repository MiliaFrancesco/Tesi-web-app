import { useState } from 'react'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleRegister(event) {
    event.preventDefault()

    setError('')
    setSuccessMessage('')

    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password
      })
    })

    const data = await response.json()

    console.log('Risposta del server:', data)

    if (response.ok) {
    console.log('Registrazione completata')
    setSuccessMessage('Registrazione completata con successo!')

    setName('')
    setEmail('')
    setPassword('')

    } else {
      setError(data.error)
    }
  }

  return (
    <div className="register-form">

      {error && (
        <p className="register-error">{error}</p>
      )}

      {successMessage && ( 
        <p className="register-message">
          {successMessage}
        </p> 
      )}

      <form onSubmit={handleRegister}>

        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <br />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <br />

        <button type="submit">
          Registrati
        </button>

      </form>
    </div>
  )
}

export default Register
