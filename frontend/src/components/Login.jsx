import { useState } from "react";

function Login({ onLoginSuccess }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleLogin = async (event) => {
  event.preventDefault();

  setError("")

  const response = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  const data = await response.json();

  console.log("Status:", response.status);
  console.log("Risposta backend:", data);

    if (response.ok) {
        onLoginSuccess(data.user)
    } else{
      setError(data.error)
    }
};

  return (
    <div className="login-form">
      <h2>Login</h2>

      {error && (
        <p className="login-error">{error}</p>
      )}

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">
          Accedi
        </button>

      </form>
    </div>
  );
}

export default Login;
