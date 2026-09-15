import Login from '../components/Login'

function LoginPage({ onLoginSuccess, onGoToRegister }) {

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>Login</h1>

        <p className="login-subtitle">
          Accedi al tuo account
        </p>

        <Login onLoginSuccess={onLoginSuccess} />

        <div className="register-link">

          <p>
            Non hai ancora un account?
          </p>

          <button onClick={onGoToRegister}>
            Registrati
          </button>

        </div>

      </div>

    </div>
  )
}

export default LoginPage
