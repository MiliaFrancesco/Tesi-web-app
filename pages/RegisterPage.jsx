import Register from '../components/Register'

function RegisterPage({ onGoToLogin }) {

  return (
    <div className="register-page">

      <div className="register-card">
        <h1>Registrazione</h1>

        <p className="register-subtitle">
          Crea il tuo account
        </p>

        <Register />

        <div className="login-link">

          <p>
            Hai già un account?
          </p>

          <button onClick={onGoToLogin}>
            Accedi
          </button>

        </div>

      </div>

    </div>
  )
}

export default RegisterPage
