import { useState, useEffect } from 'react'
import RequestCard from '../components/RequestCard'

function RequestsPage({ user }) {
  const [requests, setRequests] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [titleError, setTitleError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')

  const [successMessage, setSuccessMessage] = useState('')

  /* CARICAMENTO DELLE RICHIESTE */
  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')

    fetch('http://localhost:3000/api/requests', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data)
        } else {
          console.error('Risposta inattesa dal backend:', data)
        }
      })
      .catch((err) => console.error('Errore nel caricamento richieste:', err))
  }, [user])

  /* CREAZIONE DI UNA NUOVA RICHIESTA */
  async function handleSubmit(event) {
    event.preventDefault()

    setSuccessMessage('')
    setTitleError('')
    setDescriptionError('')

    let hasError = false

    if (title.trim() === '') {
      setTitleError('Il titolo è obbligatorio')
      hasError = true
    } else if (title.trim().length < 5) {
      setTitleError('Il titolo deve contenere almeno 5 caratteri')
      hasError = true
    } else if (title.trim().length > 100) {
      setTitleError('Il titolo può contenere massimo 100 caratteri')
      hasError = true
    }

    if (description.trim() === '') {
      setDescriptionError('La descrizione è obbligatoria')
      hasError = true
    } else if (description.trim().length < 10) {
      setDescriptionError('La descrizione deve contenere almeno 10 caratteri')
      hasError = true
    } else if (description.trim().length > 500) {
      setDescriptionError('La descrizione può contenere massimo 500 caratteri')
      hasError = true
    }

    if (hasError) return

    const token = localStorage.getItem('token')

    const response = await fetch('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title,
        description: description
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Errore creazione richiesta:', data.error)
      return
    }

    setSuccessMessage('Richiesta inviata con successo!')
    setRequests((currentRequests) => [...currentRequests, data])

    setTitle('')
    setDescription('')
  }

  /* ELIMINAZIONE RICHIESTA */
  async function handleDelete(id) {
    const token = localStorage.getItem('token')

    const response = await fetch(`http://localhost:3000/api/requests/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (response.ok) {
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== id)
      )
    } else {
      console.error('Errore eliminazione:', data.error)
    }
  }

  /* MODIFICA STATO RICHIESTA */
  async function handleStatusChange(id, newStatus) {
    const token = localStorage.getItem('token')

    const response = await fetch(`http://localhost:3000/api/requests/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus
      })
    })

    const updatedRequest = await response.json()

    if (response.ok) {
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === id ? updatedRequest : request
        )
      )
    } else {
      console.error('Errore cambio stato:', updatedRequest.error)
    }
  }

  /* MODIFICA CATEGORIA RICHIESTA */
  async function handleCategoryChange(id, newCategory) {
    const token = localStorage.getItem('token')

    const response = await fetch(
      `http://localhost:3000/api/requests/${id}/category`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newCategory
        })
      }
    )

    const updatedRequest = await response.json()

    if (response.ok) {
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === id ? updatedRequest : request
        )
      )
    } else {
      console.error('Errore cambio categoria:', updatedRequest.error)
    }
  }

  return (
    <div className="requests-page">
      {/* INTESTAZIONE */}
      <div className="requests-header">
        <h1>Richieste</h1>
        <p>
          Benvenuto {user?.name}! Ruolo: {user?.role}
        </p>
      </div>

      {/* ELENCO DELLE RICHIESTE */}
      <div className="requests-list">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            id={request.id}
            title={request.title}
            description={request.description}
            status={request.status}
            category={request.category}
            role={user?.role}
            userId={user?.id}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onCategoryChange={handleCategoryChange}
          />
        ))}
      </div>

      {/* FORM NUOVA RICHIESTA */}
      {user && user.role === 'user' && (
        <div className="new-request">
          <h2>Nuova richiesta</h2>

          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Titolo"
              value={title}
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
            />

            <p>{title.length}/100</p>

            {titleError && <p className="error-message">{titleError}</p>}

            <textarea
              placeholder="Descrizione"
              value={description}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
            />

            <p>{description.length}/500</p>

            {descriptionError && (
              <p className="error-message">{descriptionError}</p>
            )}

            <button type="submit">Invia richiesta</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default RequestsPage
