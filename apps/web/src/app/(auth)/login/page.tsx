import { loginAction } from './actions'

export default function LoginPage() {
  return (
    <main>
      <h1>Login</h1>
      <form action={loginAction}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <button type="submit">Login</button>
      </form>
      <a href="/register">Create account</a>
    </main>
  )
}
