import { registerAction } from './actions'

export default function RegisterPage() {
  return (
    <main>
      <h1>Create account</h1>
      <form action={registerAction}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={8} required />
        </div>
        <button type="submit">Register</button>
      </form>
      <a href="/login">Already have an account?</a>
    </main>
  )
}
