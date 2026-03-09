export default function LoginScreen({
  email,
  password,
  authError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoHelp
}) {
  return (
    <main className="container">
      <div className="row-between">
        <h1 data-cy="login-title">Mini Store Login</h1>
        <button data-cy="login-help" onClick={onGoHelp} type="button">
          Help
        </button>
      </div>
      <form className="card" data-cy="login-form" onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          data-cy="login-email"
          type="email"
          value={email}
          onChange={onEmailChange}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          data-cy="login-password"
          type="password"
          value={password}
          onChange={onPasswordChange}
        />
        <button data-cy="login-submit" type="submit">
          Sign in
        </button>
        {authError ? <p data-cy="login-error">{authError}</p> : null}
      </form>
    </main>
  );
}
