function Navbar({ user, onLogout }) {

  return (
    <nav className="navbar">

      <h2 className="navbar-title">
        Gestione richieste
      </h2>

      {user && (
        <div className="navbar-user">

          <span>
            {user.name} ({user.role})
          </span>

          <button onClick={onLogout}>
            Logout
          </button>

        </div>
      )}

    </nav>
  )
}

export default Navbar
