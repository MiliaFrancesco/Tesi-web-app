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
  if (!user) {
    return
  }

  fetch('http://localhost:3000/api/requests',{  
    headers:{
      'X-User-Id':user.id
    }
  })
    .then((response) => response.json())
    .then((data) => {
      setRequests(data)   
    })
}, [user])

/*3) FUNZIONE DI REACT PER FARMI VISUALIZZARE NELLA PAGINA LA NUOVA RICHIESTA*/
async function handleSubmit(event) { 
  event.preventDefault()

  setSuccessMessage('')

  console.log('UTENTE CHE CREA LA RICHIESTA:', user)

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

  if (hasError) {
    return
  }


  console.log('INVIO RICHIESTA:', {
  title: title,
  description: description,
  user_id: user.id
})

  const response = await fetch('http://localhost:3000/api/requests', {  
    method: 'POST',  
    headers: {  
      'Content-Type': 'application/json'  
    },
    body: JSON.stringify({  
      title: title,
      description: description,
      user_id: user.id
    })
  })

  const data = await response.json()

  console.log('Risposta del server:', data)

  if (!response.ok) {
    console.log('Errore:', data.error)
  return
  }

  setSuccessMessage('Richiesta inviata con successo!')

  setRequests((currentRequests) => [    
    ...currentRequests,
    data
  ])

  setTitle('')    
  setDescription('')
}



/*FUNZIONE DELETE FINALE RICHIESTA*/
async function handleDelete(id) {    
  const response = await fetch(    
    `http://localhost:3000/api/requests/${id}`,
    {
      method: 'DELETE',
      headers: {
        'X-User-Id': user.id
      }
    }
  )

  const data = await response.json() 

  console.log('Risposta del server:', data)

  if(response.ok){  
    setRequests((currentRequests) =>  
      currentRequests.filter((request) => request.id !== id)  
    )
  }
}

/* MODIFICA STATO DELLA RICHIESTA */ /*COMUNICAZIONE CON IL BACKEND per il PATCH del pulsante sullo stato*/
async function handleStatusChange(id, newStatus) {
  const response = await fetch(
    `http://localhost:3000/api/requests/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id
      },
      body: JSON.stringify({  
        status: newStatus
      })
    }
  )

  const updatedRequest = await response.json()

  console.log('Richiesta aggiornata:', updatedRequest)

  if(response.ok){
    setRequests((currentRequests) =>   
      currentRequests.map((request) =>
        request.id === id ? updatedRequest : request
      )
    )
  }
}

/* COMUNICAZIONE CON IL BACKEND per il PATCH della categoria */
async function handleCategoryChange(id, newCategory) {
  const response = await fetch(
    `http://localhost:3000/api/requests/${id}/category`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id
      },
      body: JSON.stringify({
        category: newCategory
      })
    }
  )

  const updatedRequest = await response.json()

  console.log('Categoria aggiornata:', updatedRequest)

  if(response.ok){
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === id ? updatedRequest : request
      )
    )
  }
}

  return (
    <div className="requests-page">

    {/* INTESTAZIONE */}

      <div className="requests-header">

        <h1>Richieste</h1>

        <p>
          Benvenuto {user.name}! Ruolo: {user.role}
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
          <p className="success-message">
            {successMessage}
          </p>
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

          {titleError && (
            <p>{titleError}</p>
          )}

          <textarea
            placeholder="Descrizione"
            value={description}
            maxLength={500}
            onChange={(event) => setDescription(event.target.value)}
          />

          <p>{description.length}/500</p>

          {descriptionError && (
            <p>{descriptionError}</p>
          )}

          <button type="submit">
            Invia richiesta
          </button>

        </form>

      </div>

    )}

  </div>
)
}

export default RequestsPage
