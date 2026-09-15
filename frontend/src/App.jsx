import { useState } from 'react'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RequestsPage from './pages/RequestsPage'
import Navbar from './components/Navbar'

import './App.css'

function App() {

  const [page, setPage] = useState('login')
  const [user, setUser] = useState(null)


  /* LOGIN RIUSCITO */

  function handleLoginSuccess(userData) {
    setUser(userData)
    setPage('requests')
  }


  return (
    <div>

      {/*LOGOUT*/}
      {page === 'requests' && (
        <Navbar
          user={user}
          onLogout={() => {
          setUser(null)
          setPage('login')
          }}
        />
      )}

      {/* PAGINA LOGIN */}

      {page === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onGoToRegister={() => setPage('register')}
        />
      )}


      {/* PAGINA REGISTRAZIONE */}

      {page === 'register' && (
        <RegisterPage 
        onGoToLogin={() => setPage('login')}
        />
      )}


      {/* PAGINA RICHIESTE */}

      {page === 'requests' && (
        <RequestsPage
          user={user}
        />
      )}

    </div>
  )
}

export default App
